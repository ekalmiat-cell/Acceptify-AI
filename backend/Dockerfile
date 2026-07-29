# Build context is the REPOSITORY ROOT, not backend/ — that way Railway needs
# no "Root Directory" setting: the root railway.json points here and every
# path below is repo-relative. Locally:
#
#   docker build -f backend/Dockerfile .
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY backend/pyproject.toml ./
COPY backend/app ./app
COPY backend/alembic.ini ./
COPY backend/alembic ./alembic
# Ships the university seeder with the image so the catalog can be loaded
# into a fresh production database:
#   railway run python -m scripts.seed_universities
COPY backend/scripts ./scripts

RUN pip install --no-cache-dir .

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
