import uuid
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.deps import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, session: Annotated[AsyncSession, Depends(get_session)]):
    existing = await session.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=body.email, password_hash=hash_password(body.password), role="user")
    session.add(user)
    await session.commit()
    await session.refresh(user)

    _set_auth_cookies(response, user)
    return TokenResponse(user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, session: Annotated[AsyncSession, Depends(get_session)]):
    user = await session.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    _set_auth_cookies(response, user)
    return TokenResponse(user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    payload = decode_token(refresh_token, "refresh")
    user = await session.get(User, uuid.UUID(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
    _set_auth_cookies(response, user)
    return TokenResponse(user=UserOut.model_validate(user))


@router.post("/logout")
async def logout(response: Response):
    cookie_domain = (
        settings.cookie_domain
        if settings.cookie_domain not in ("localhost", "127.0.0.1", "")
        else None
    )
    response.delete_cookie("access_token", domain=cookie_domain, path="/")
    response.delete_cookie("refresh_token", domain=cookie_domain, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
async def me(user: Annotated[User, Depends(get_current_user)]):
    return UserOut.model_validate(user)


def _set_auth_cookies(response: Response, user: User) -> None:
    # Omit domain on localhost — explicit Domain=localhost breaks cross-port cookies in browsers.
    cookie_domain = (
        settings.cookie_domain
        if settings.cookie_domain not in ("localhost", "127.0.0.1", "")
        else None
    )
    response.set_cookie(
        "access_token",
        create_access_token(user.id, user.role),
        httponly=True,
        secure=settings.cookie_secure,
        max_age=settings.jwt_access_ttl_minutes * 60,
        samesite="lax",
        domain=cookie_domain,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        create_refresh_token(user.id),
        httponly=True,
        secure=settings.cookie_secure,
        max_age=settings.jwt_refresh_ttl_days * 86400,
        samesite="lax",
        domain=cookie_domain,
        path="/",
    )
