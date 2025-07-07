#!/bin/bash

# Formedible E2E Test Runner
# This script helps run the Puppeteer tests for the Formedible library

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dev server is running
check_dev_server() {
    print_status "Checking if development server is running..."
    
    if curl -s http://localhost:3001 > /dev/null; then
        print_success "Development server is running on http://localhost:3001"
        return 0
    else
        print_error "Development server is not running on http://localhost:3001"
        print_status "Please start the development server with: npm run dev:web"
        return 1
    fi
}

# Install dependencies if needed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not found. Installing..."
        npm install
    fi
    
    # Check if Puppeteer is installed
    if [ ! -d "node_modules/puppeteer" ]; then
        print_error "Puppeteer not found. Installing test dependencies..."
        npm install --save-dev puppeteer @types/jest jest ts-jest
    fi
    
    print_success "Dependencies are ready"
}

# Run specific test suite
run_test_suite() {
    local test_file=$1
    local test_name=$2
    
    print_status "Running $test_name tests..."
    
    if npx jest "tests/$test_file" --verbose; then
        print_success "$test_name tests passed!"
    else
        print_error "$test_name tests failed!"
        return 1
    fi
}

# Main function
main() {
    echo "🧪 Formedible E2E Test Runner"
    echo "================================"
    
    # Check dependencies
    check_dependencies
    
    # Check if dev server is running
    if ! check_dev_server; then
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-all}" in
        "contact")
            run_test_suite "contact-form.test.ts" "Contact Form"
            ;;
        "registration")
            run_test_suite "registration-form.test.ts" "Registration Form"
            ;;
        "survey")
            run_test_suite "survey-form.test.ts" "Survey Form"
            ;;
        "checkout")
            run_test_suite "checkout-form.test.ts" "Checkout Form"
            ;;
        "job")
            run_test_suite "job-application-form.test.ts" "Job Application Form"
            ;;
        "all")
            print_status "Running all test suites..."
            
            run_test_suite "contact-form.test.ts" "Contact Form" && \
            run_test_suite "registration-form.test.ts" "Registration Form" && \
            run_test_suite "survey-form.test.ts" "Survey Form" && \
            run_test_suite "checkout-form.test.ts" "Checkout Form" && \
            run_test_suite "job-application-form.test.ts" "Job Application Form"
            
            if [ $? -eq 0 ]; then
                print_success "All tests passed! 🎉"
            else
                print_error "Some tests failed! ❌"
                exit 1
            fi
            ;;
        "watch")
            print_status "Running tests in watch mode..."
            npx jest --watch --config jest.config.js
            ;;
        "coverage")
            print_status "Running tests with coverage..."
            npx jest --coverage --config jest.config.js
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [test-suite]"
            echo ""
            echo "Available test suites:"
            echo "  contact      - Run Contact Form tests"
            echo "  registration - Run Registration Form tests"
            echo "  survey       - Run Survey Form tests"
            echo "  checkout     - Run Checkout Form tests"
            echo "  job          - Run Job Application Form tests"
            echo "  all          - Run all test suites (default)"
            echo "  watch        - Run tests in watch mode"
            echo "  coverage     - Run tests with coverage report"
            echo "  help         - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all tests"
            echo "  $0 contact           # Run only contact form tests"
            echo "  $0 watch             # Run tests in watch mode"
            echo "  $0 coverage          # Generate coverage report"
            ;;
        *)
            print_error "Unknown test suite: $1"
            print_status "Use '$0 help' to see available options"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"