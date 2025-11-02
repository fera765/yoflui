#!/bin/bash

# Test script for Webhook Automation System
echo "=================================================="
echo "?? Testing Webhook Automation System"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if build is successful
echo "Test 1: Building project..."
cd /workspace/youtube-cli
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}? Build successful${NC}"
else
    echo -e "${RED}? Build failed${NC}"
    exit 1
fi
echo ""

# Test 2: Check if all required files exist
echo "Test 2: Checking required files..."
FILES=(
    "source/webhook-api.ts"
    "source/webhook-trigger-handler.ts"
    "source/llm-automation-coordinator.ts"
    "source/components/AutomationSelector.tsx"
    "automations/youtube-webhook-trigger.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}? $file exists${NC}"
    else
        echo -e "${RED}? $file missing${NC}"
        exit 1
    fi
done
echo ""

# Test 3: Validate JSON automation
echo "Test 3: Validating automation JSON..."
if node -e "const fs = require('fs'); const data = fs.readFileSync('automations/youtube-webhook-trigger.json', 'utf8'); JSON.parse(data); console.log('Valid JSON');" > /dev/null 2>&1; then
    echo -e "${GREEN}? JSON is valid${NC}"
else
    echo -e "${RED}? JSON is invalid${NC}"
    exit 1
fi
echo ""

# Test 4: Check if express is installed
echo "Test 4: Checking dependencies..."
if [ -d "node_modules/express" ]; then
    echo -e "${GREEN}? Express installed${NC}"
else
    echo -e "${RED}? Express not installed${NC}"
    exit 1
fi
echo ""

# Test 5: Count automations
echo "Test 5: Counting automations..."
AUTOMATION_COUNT=$(ls -1 automations/*.json 2>/dev/null | wc -l)
echo -e "${GREEN}? Found $AUTOMATION_COUNT automation(s)${NC}"
echo ""

# Test 6: Check documentation
echo "Test 6: Checking documentation..."
if [ -f "/workspace/WEBHOOK_SYSTEM_COMPLETE.md" ]; then
    echo -e "${GREEN}? Main documentation exists${NC}"
else
    echo -e "${YELLOW}? Main documentation missing${NC}"
fi

if [ -f "WEBHOOK_AUTOMATION_GUIDE.md" ]; then
    echo -e "${GREEN}? User guide exists${NC}"
else
    echo -e "${YELLOW}? User guide missing${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}? ALL TESTS PASSED!${NC}"
echo "=================================================="
echo ""
echo "?? To start the system:"
echo "   cd /workspace/youtube-cli"
echo "   npm run dev"
echo ""
echo "?? Then type '@' to see automations!"
echo ""
echo "?? Documentation:"
echo "   /workspace/WEBHOOK_SYSTEM_COMPLETE.md"
echo "   /workspace/youtube-cli/WEBHOOK_AUTOMATION_GUIDE.md"
echo ""
