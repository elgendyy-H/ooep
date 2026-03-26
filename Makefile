.PHONY: help install start stop restart logs clean test deploy

help:
	@echo "OEPP Platform v5.0"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install dependencies and setup"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View service logs"
	@echo "  make clean      - Clean up containers and volumes"
	@echo "  make test       - Run tests"
	@echo "  make deploy     - Deploy to production (Kubernetes)"
	@echo "  make backup     - Create backup"
	@echo "  make restore    - Restore from backup"
	@echo "  make update     - Update platform"

install:
	chmod +x install.sh
	./install.sh

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

deploy:
	./scripts/deploy-kubernetes.sh

backup:
	./scripts/backup.sh

restore:
	./scripts/restore.sh $(BACKUP_FILE)

update:
	./scripts/update.sh

health:
	./scripts/health-check.sh

migrate:
	docker-compose exec backend alembic upgrade head