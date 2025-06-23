# Trend2Zero-FP

A functional programming implementation of a financial portfolio management application with real-time asset price tracking, built with Haskell (backend) and PureScript (frontend).

## Prerequisites

Before running this project, ensure you have the following installed:

### Required Dependencies
- **Haskell Stack**: For building the backend
- **Node.js & npm**: For frontend dependencies
- **PostgreSQL**: Database server
- **Redis**: Caching server (currently missing)

### Installation Commands
```bash
# Install Redis (macOS)
brew install redis

# Install PostgreSQL (if not already installed)
brew install postgresql

# Start services
brew services start redis
brew services start postgresql
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
stack build
```

**Note:** Backend requires PostgreSQL and Redis to be running. First-time compilation may take 10+ minutes.

### 2. Frontend Setup
```bash
cd frontend
npm install
```


## Running the Project

### Development Mode
```bash
# Start both backend and frontend
make run-dev
```

**Current Status:** ✅ **Working**

### Individual Components
```bash
# Backend only
cd backend && stack build --fast --file-watch --exec "trend2zero-fp-backend-exe"

# Frontend only
cd frontend && npm run dev
```

## Architecture

### Backend (Haskell)
- **Framework:** Servant (type-safe REST API)
- **Database:** PostgreSQL with Persistent ORM
- **Caching:** Redis with STM
- **WebSocket:** Real-time price updates
- **External APIs:** CoinGecko, AlphaVantage, MetalPrice

### Frontend (PureScript)
- **Framework:** Halogen (functional reactive UI)
- **Build:** Webpack + Spago
- **WebSocket:** Client integration for live updates
- **Charts:** LightweightCharts via FFI

## Development Commands

```bash
# Build everything
make all

# Run tests
make test

# Clean artifacts
make clean

# Docker build
make docker-build
```

## Testing

### Backend Tests
```bash
cd backend
stack test --fast --ta "--jobs=4 --quickcheck-tests=100"
```

### Frontend Tests
```bash
cd frontend
spago test
```

## Deployment

The project includes Kubernetes manifests and Terraform scripts for AWS deployment. See `deploy/` directory for details.

## Support

This is a functional programming migration from a TypeScript/Next.js stack. See `PROJECT_SUMMARY.md` for migration details.

## Programming Concepts & Approaches

This repository demonstrates several advanced programming concepts and architectural patterns:

### **Functional Programming Paradigms**
- **Pure Functions & Immutability**: Leveraging Haskell and PureScript for side-effect free programming
- **Type Safety**: Compile-time guarantees through strong static typing and Servant's type-safe APIs
- **Algebraic Data Types**: Robust error handling and domain modeling
- **Higher-Order Functions**: Composition and abstraction through function combinators

### **Concurrency & Performance**
- **Software Transactional Memory (STM)**: Safe concurrent programming without locks
- **Parallel Processing**: Multi-core utilization for builds and testing
- **Asynchronous Programming**: Non-blocking I/O with Aff (PureScript) and async patterns
- **Caching Strategies**: Redis integration for performance optimization

### **Reactive & Real-time Systems**
- **Functional Reactive Programming**: Halogen's component model for declarative UIs
- **WebSocket Communication**: Bidirectional real-time data streaming
- **Event-Driven Architecture**: Reactive updates and state management

### **Modern Development Practices**
- **Property-Based Testing**: QuickCheck for comprehensive test coverage
- **Foreign Function Interface (FFI)**: Safe JavaScript interop from PureScript
- **Infrastructure as Code**: Terraform for reproducible deployments
- **Containerization**: Docker and Kubernetes for consistent environments
- **Type-Safe Database Access**: Persistent ORM with compile-time query validation

### **Architectural Patterns**
- **Clean Architecture**: Separation of concerns across layers
- **API-First Design**: Contract-driven development with Servant
- **Microservices**: Decoupled backend and frontend services
- **External API Integration**: Robust third-party service consumption

## AI-Assisted Development

This project leverages modern AI tools to enhance development productivity and code quality:

### **Code Generation**
- **[Claude Code](https://claude.ai/code)**: Advanced code generation, refactoring, and architectural guidance
- **[Cursor](https://cursor.sh/)**: Intelligent code completion, debugging assistance, and rapid prototyping

### **Research & Planning** 
- **[Perplexity](https://perplexity.ai/)**: Technical research, dependency analysis, and architectural decision support

The combination of functional programming principles with AI-assisted development demonstrates a modern approach to building robust, maintainable software systems while accelerating development velocity through intelligent tooling.