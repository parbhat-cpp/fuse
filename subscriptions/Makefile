-include .env

FORCE ?= 1
N ?= 0

migrate-up:
	@migrate -database "$(DB_URL)" -path migrations up $(N)

migrate-down:
	@migrate -database "$(DB_URL)" -path migrations down $(N)

migrate-force:
	@migrate -database "$(DB_URL)" -path migrations force $(FORCE)

migrate-reset:
	@migrate -database "$(DB_URL)" -path migrations reset

sqlc-generate:
	sqlc generate
