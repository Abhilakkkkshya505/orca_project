FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies including GDAL, GEOS, PROJ and PostgreSQL client libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
      gdal-bin \
      libgdal-dev \
      libgeos-dev \
      libproj-dev \
      libpq5 \
      curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user early
RUN useradd -r -u 10001 orca

# Copy dependencies definitions
COPY pyproject.toml requirements.txt* ./

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir .

# Copy application source code
COPY . .

# Static collection with dummy env for production builds if settings exist
RUN if [ -f "manage.py" ]; then \
      python manage.py collectstatic --noinput --settings=config.settings.dev || true; \
    fi

# Set proper ownership
RUN chown -R orca:orca /app

USER orca

EXPOSE 8000

CMD ["uvicorn", "config.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "3", "--proxy-headers", "--forwarded-allow-ips", "*"]
