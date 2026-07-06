ARG PYTHON_VERSION=3.12

FROM python:${PYTHON_VERSION}-slim AS runner

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libjpeg62-turbo zlib1g \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
COPY src ./src
COPY prompts ./prompts

RUN pip install --no-cache-dir -e ".[api]" \
  && mkdir -p output

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["python", "-m", "uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]