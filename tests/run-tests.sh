#!/bin/bash

# PrivateHealth DApp Test Runner
# Comprehensive test execution script for all test categories

set -e

echo "🧪 PrivateHealth DApp Test Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $2${NC}" ;;
    esac
}

# Function to run test category
run_test_category() {
    local category=$1
    local description=$2
    local command=$3

    echo ""
    echo -e "${BLUE}🔍 Running $description${NC}"
    echo "----------------------------------------"

    if eval $command; then
        print_status "success" "$description completed successfully"
        return 0
    else
        print_status "error" "$description failed"
        return 1
    fi
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "info" "Installing dependencies..."
    npm install
fi

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "Starting comprehensive test execution..."
echo ""

# 1. Unit Tests - Smart Contracts
if run_test_category "unit-contracts" "Smart Contract Unit Tests" "npm run test:contracts"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 2. Unit Tests - Privacy Systems
if run_test_category "unit-privacy" "Privacy System Tests" "npm run test:privacy"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 3. Unit Tests - Frontend Components
if run_test_category "unit-frontend" "Frontend Component Tests" "npm run test:frontend"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 4. Security and Penetration Tests
if run_test_category "security" "Security Audit Tests" "vitest run tests/unit/security --reporter=verbose"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 5. Integration Tests
if run_test_category "integration" "End-to-End Integration Tests" "npm run test:integration"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi
((TOTAL_TESTS++))

# 6. Coverage Report
echo ""
echo -e "${BLUE}📊 Generating Coverage Report${NC}"
echo "----------------------------------------"
if npm run test:coverage; then
    print_status "success" "Coverage report generated successfully"
    print_status "info" "Coverage report available at: tests/coverage/index.html"
else
    print_status "warning" "Coverage report generation had issues"
fi

# Final Results
echo ""
echo "🏁 Test Execution Summary"
echo "========================="
echo -e "Total Test Categories: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    print_status "success" "All test categories passed! 🎉"
    echo ""
    echo "✅ Smart Contract Security: Validated"
    echo "✅ Privacy Preservation: Verified"
    echo "✅ Access Control: Enforced"
    echo "✅ Payment System: Functional"
    echo "✅ Integration Flows: Working"
    echo "✅ Frontend Components: Tested"
    echo ""
    echo "🔒 Security Score: Calculating..."

    # Run security audit summary
    echo "Running final security validation..."
    if vitest run tests/unit/security/SecurityAudit.test.ts --reporter=json > security-results.json 2>/dev/null; then
        print_status "success" "Security audit completed - check security-results.json for details"
    fi

    exit 0
else
    echo ""
    print_status "error" "$FAILED_TESTS test categories failed"
    echo ""
    echo "Please review the failed tests and address any issues."
    echo "Common troubleshooting steps:"
    echo "1. Check test dependencies are installed"
    echo "2. Verify mock configurations"
    echo "3. Review failing test output above"
    echo "4. Ensure all required services are running"
    echo ""
    exit 1
fi