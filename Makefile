.PHONY: dev build db-push db-studio db-reset stop docker-build logs

## Start postgres + Next.js dev server
dev:
	docker compose up -d
	npm run dev

## Build for production
build:
	npm run build

## Build Docker image for production
docker-build:
	docker build -t liquidark .

## Push Prisma schema to database (non-destructive)
db-push:
	npx prisma db push

## Open Prisma Studio (database GUI)
db-studio:
	npx prisma studio

## Drop and recreate the database schema (destructive!)
db-reset:
	npx prisma db push --force-reset

## Stop Docker services
stop:
	docker compose down

## View Docker logs
logs:
	docker compose logs -f postgres
