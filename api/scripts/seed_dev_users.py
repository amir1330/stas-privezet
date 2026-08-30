"""Seed dev users for all roles (idempotent)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import sync_engine
from app.deps import hash_password
from app.models import User

DEV_USERS = [
    ("admin@localhost.dev", "admin1234", "admin"),
    ("support@localhost.dev", "support1234", "support"),
    ("user@localhost.dev", "user1234", "user"),
]


def main():
    with Session(sync_engine) as session:
        for email, password, role in DEV_USERS:
            existing = session.scalar(select(User).where(User.email == email))
            if existing:
                if existing.role != role:
                    existing.role = role
                    existing.password_hash = hash_password(password)
                    print(f"updated {email} -> role={role}")
                else:
                    print(f"exists  {email} (role={role})")
                continue
            session.add(
                User(
                    email=email,
                    password_hash=hash_password(password),
                    role=role,
                )
            )
            print(f"created {email} (role={role})")
        session.commit()
    print("\nDev credentials:")
    for email, password, role in DEV_USERS:
        print(f"  [{role:7}] {email} / {password}")


if __name__ == "__main__":
    main()
