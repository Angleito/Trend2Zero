# Multi-stage build for optimal image size and build caching
FROM haskell:9.2.8 AS dependencies

WORKDIR /build

# Cache Stack setup
RUN stack update

# Copy only dependency files first for better layer caching
COPY stack.yaml stack.yaml.lock package.yaml ./
RUN stack setup
RUN stack build --dependencies-only --no-terminal --jobs=4

# Build stage
FROM haskell:9.2.8 AS build

WORKDIR /build

# Copy cached dependencies from previous stage
COPY --from=dependencies /root/.stack /root/.stack
COPY --from=dependencies /build/.stack-work /build/.stack-work

# Copy source code
COPY . .

# Build with optimizations
RUN stack build --no-terminal \
    --ghc-options="-O2 -threaded -rtsopts -with-rtsopts=-N" \
    --jobs=4 \
    --copy-bins \
    --local-bin-path /build/bin

# Runtime stage - minimal image
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libgmp10 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the built executable
COPY --from=build /build/bin/cache-dependencies-exe /app/

# Create non-root user
RUN useradd -m -s /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./cache-dependencies-exe"]