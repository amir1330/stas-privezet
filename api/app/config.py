"""Application configuration from environment."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "development"
    log_level: str = "INFO"
    data_dir: str = "/home/amir1330/projects/stas-poison/data"

    database_url: str = "postgresql+asyncpg://marketplace:marketplace@localhost:5432/marketplace"
    database_url_sync: str = "postgresql+psycopg://marketplace:marketplace@localhost:5432/marketplace"
    redis_url: str = "redis://localhost:6379/0"

    meili_url: str = "http://localhost:7700"
    meili_master_key: str = "dev-master-key-change-me"

    jwt_secret: str = "change-me"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 7
    cookie_secure: bool = False
    cookie_domain: str = "localhost"

    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "marketplace-images"
    cdn_base_url: str = "http://localhost:8000/static"

    web_origin: str = "http://localhost:3000"
    sentry_dsn: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
