# Trend2Zero Build Configuration
# Optimized for parallel builds and caching

.PHONY: all build-backend build-frontend test run-dev clean docker-build docker-up docker-down

# Default target
all: build-backend build-frontend

# Backend build with Stack optimization
build-backend:
	@echo "Building backend with optimizations..."
	cd backend && stack build --fast --ghc-options="-O2 -threaded -rtsopts -with-rtsopts=-N" --jobs=4

# Frontend build with caching and parallelization
build-frontend:
	@echo "Building frontend with optimizations..."
	cd frontend && npm install --prefer-offline --no-audit
	cd frontend && npx spago build --purs-args "--jobs 4"
	cd frontend && npm run build

# Run tests in parallel
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && stack test --fast --ta "--jobs=4 --quickcheck-tests=100"

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npx spago test

# Development mode with hot reloading
run-dev:
	@echo "Starting development servers..."
	@make -j2 run-backend-dev run-frontend-dev

run-backend-dev:
	cd backend && stack build --fast --file-watch --exec "trend2zero-fp-backend-exe"

run-frontend-dev:
	cd frontend && npm run dev

# Docker commands
docker-build:
	docker-compose build --parallel

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Clean build artifacts
clean:
	cd backend && stack clean
	cd frontend && rm -rf node_modules .spago output dist .cache
	docker-compose down --rmi local --volumes

# Install dependencies
install:
	@make -j2 install-backend install-frontend

install-backend:
	cd backend && stack setup
	cd backend && stack build --dependencies-only

install-frontend:
	cd frontend && npm ci
	cd frontend && npx spago install