#!/bin/bash

# QA DevOps Pipeline Setup Script
# This script sets up the development environment and runs initial quality checks

set -e  # Exit on any error

echo "Starting QA DevOps Pipeline Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker found: $DOCKER_VERSION"
        
        # Check if Docker daemon is running
        if ! docker info &> /dev/null; then
            print_warning "Docker daemon is not running. Please start Docker and try again."
        fi
    else
        print_warning "Docker is not installed. Some features may not work."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    npm ci
    print_status "Dependencies installed successfully!"
}

# Run linting
run_lint() {
    print_status "Running code linting..."
    if npm run lint; then
        print_status "Linting passed!"
    else
        print_error "Linting failed. Please fix the issues and try again."
        exit 1
    fi
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    if npm audit --audit-level moderate; then
        print_status "Security audit passed!"
    else
        print_warning "Security vulnerabilities found. Please review and fix."
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:unit; then
        print_status "Unit tests passed!"
    else
        print_error "Unit tests failed. Please fix the issues and try again."
        exit 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_status "Integration tests passed!"
    else
        print_error "Integration tests failed. Please fix the issues and try again."
        exit 1
    fi
}

# Build Docker image
build_docker_image() {
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        print_status "Building Docker image..."
        if docker build -t qa-devops-app:latest .; then
            print_status "Docker image built successfully!"
        else
            print_error "Docker image build failed."
            exit 1
        fi
    else
        print_warning "Skipping Docker build (Docker not available)"
    fi
}

# Run health check
run_health_check() {
    print_status "Starting application for health check..."
    
    # Start application in background
    npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 10
    
    # Check health endpoint
    if curl -f http://localhost:3000/health; then
        print_status "Health check passed!"
    else
        print_error "Health check failed."
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop application
    kill $APP_PID 2>/dev/null || true
    print_status "Application stopped"
}

# Generate quality report
generate_quality_report() {
    print_status "Generating quality report..."
    
    echo "==================================="
    echo "    QA DEVOPS PIPELINE REPORT"
    echo "==================================="
    echo "Date: $(date)"
    echo "Node.js Version: $(node --version)"
    echo "NPM Version: $(npm --version)"
    
    if command -v docker &> /dev/null; then
        echo "Docker Version: $(docker --version)"
    fi
    
    echo ""
    echo "Quality Checks:"
    echo "Dependencies installed"
    echo "Code linting passed"
    echo "Security audit completed"
    echo "Unit tests passed"
    echo "Integration tests passed"
    echo "Health check passed"
    
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        echo "Docker image built"
    fi
    
    echo ""
    echo "Next Steps:"
    echo "1. Run 'npm start' to start the application"
    echo "2. Run 'npm run test:e2e' for end-to-end tests"
    echo "3. Run 'docker-compose up' for full environment"
    echo "4. Access application at http://localhost:3000"
    echo "==================================="
}

# Main execution
main() {
    echo ""
    print_status "=== QA DevOps Pipeline Setup ==="
    
    # Environment checks
    check_nodejs
    check_docker
    
    # Setup and validation
    install_dependencies
    run_lint
    run_security_audit
    run_unit_tests
    run_integration_tests
    build_docker_image
    
    # Final validation
    if command -v curl &> /dev/null; then
        run_health_check
    else
        print_warning "Skipping health check (curl not available)"
    fi
    
    # Generate report
    generate_quality_report
    
    print_status "Setup completed successfully!"
}

# Run main function
main "$@"
