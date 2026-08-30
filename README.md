# Poizon Reseller Marketplace

Fast, modern marketplace for 30k+ Poizon products — Python/FastAPI backend, Next.js frontend, Postgres (incl. UNLOGGED cache), Meilisearch, Redis (rate limiting only).

Scrape data lives in a **separate read-only repo** (`stas-poison`). This project imports from it; never writes back.

## Structure

```
api/          FastAPI backend + import/image scripts
web/          Next.js App Router storefront
infra/        Docker Compose, Traefik (TLS, Brotli, rate limit)
```

## Quick start

```bash
cp .env.example .env
cd infra && docker compose up -d postgres redis meilisearch

cd ../api && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

cd ../web && npm install && npm run dev
```

## Import pipeline

```bash
# 1. Image variants (dev mode: local files, no S3 required)
IMAGE_PIPELINE_LOCAL_OUT=/tmp/marketplace-images \
  python -m scripts.image_pipeline \
  --images-dir /path/to/stas-poison/data/images \
  --out-map ./cdn_url_map.json

# 2. Postgres import (is_published=false until admin review)
python -m scripts.import_products \
  --data-dir /path/to/stas-poison/data \
  --cdn-map ./cdn_url_map.json

# 3. Meilisearch sync (after publishing products)
python -m scripts.sync_meilisearch

# 4. Create admin
python -m scripts.create_admin --email admin@example.com --password 'secure-pass'
```

## Phases implemented

| Phase | Status |
|-------|--------|
| 0 Foundations | Monorepo, Docker, CI, `.env.example` |
| 1 Import pipeline | `import_products`, `bg_remove`, `image_pipeline`, `hero_banner` |
| 2 Backend API | Auth, RBAC, catalog, inquiries, admin uploads |
| 3 Search & cache | Meilisearch sync, Postgres UNLOGGED cache, load test script |
| 4 Frontend | SSR/ISR pages, design tokens, hero, filters, search, BuyBar |
| 5 Dashboards | Admin (products, bulk publish, audit) + Support queue |
| 6 Performance | Traefik Brotli/compress, image aspect-ratio, Link prefetch |
| 7 Security | Rate limiting, security headers, `security_audit.py` |
| 8 Observability | Structured logging, Sentry hook, health checks, backup script |
| 9 Payments | `orders` schema, `PaymentProvider` abstraction, order endpoints |

## Operations

```bash
# Load test
python -m scripts.load_test --url http://localhost:8000 --concurrency 20 --requests 200

# Security audit
python -m scripts.security_audit --url http://localhost:8000

# Postgres backup (configure S3/R2 env vars for off-VPS upload)
bash infra/scripts/backup_postgres.sh
```

## Production (Traefik)

```bash
DOMAIN=shop.example.com ACME_EMAIL=you@example.com docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d
```

## Roles

| Role | Access |
|------|--------|
| `user` | Browse, search, submit inquiries, create orders |
| `support` | Inquiry queue, confirm manual payments |
| `admin` | Full catalog CRUD, publish, users, audit log |

## Design tokens

- Primary: **cobalt** `#2E4BFF`
- Sale: **lime** `#C6FF3D`
- Surface: `#FFFFFF` → `#F2F3F7`
