.PHONY: up down test lint build logs clean dev test-cov lint-fix format

# ==================== Docker 命令 ====================
up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down

build:
	docker compose -f infra/docker-compose.yml build

logs:
	docker compose -f infra/docker-compose.yml logs -f

clean:
	docker compose -f infra/docker-compose.yml down -v --rmi local

dev:
	docker compose -f infra/docker-compose.yml up -d clickhouse redis
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# ==================== 开发命令 ====================
test:
	pytest tests/ -v --tb=short

test-cov:
	pytest tests/ --cov=src --cov-report=html --cov-report=term-missing

lint:
	ruff check src/ api/ tests/

lint-fix:
	ruff check --fix src/ api/ tests/

format:
	ruff format src/ api/ tests/

# ==================== 数据库命令 ====================
db-init:
	docker compose -f infra/docker-compose.yml exec clickhouse clickhouse-client --query "CREATE DATABASE IF NOT EXISTS game_ads"

db-shell:
	docker compose -f infra/docker-compose.yml exec clickhouse clickhouse-client

redis-shell:
	docker compose -f infra/docker-compose.yml exec redis redis-cli

# ==================== Airflow 命令 ====================
airflow-shell:
	docker compose -f infra/docker-compose.yml exec airflow bash

airflow-dags:
	docker compose -f infra/docker-compose.yml exec airflow airflow dags list
