from fastapi import Header, Query

from app.services.i18n import parse_locale


def get_locale(
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
    lang: str | None = Query(default=None),
) -> str:
    return parse_locale(accept_language, lang)
