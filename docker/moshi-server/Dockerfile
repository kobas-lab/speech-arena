FROM python:3.14-slim

WORKDIR /app

# システム依存関係
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# uv のインストール
RUN pip install --no-cache-dir uv

# moshi のインストール
RUN uv pip install --system --no-cache-dir moshi

# Moshi Web UI の静的ファイルをコピー
COPY client/dist /app/static

# 環境変数
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
ENV PYTHONUNBUFFERED=1
ENV TORCHDYNAMO_DISABLE=1
ENV TORCHINDUCTOR_DISABLE=1

EXPOSE 8998

CMD ["uv", "run", "-m", "moshi.server", \
     "--host", "0.0.0.0", \
     "--port", "8998", \
     "--static", "/app/static"]
