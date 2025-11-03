#!/bin/bash

# Script para substituir ?? por emojis corretos

cd /workspace/youtube-cli/source

# Substitui??es contextuais
echo "?? Corrigindo emojis..."

# App.tsx - Automations
sed -i 's/`?? Executing automation:/`?? Executing automation:/g' app.tsx
sed -i 's/`?? Setting up webhook for:/`?? Setting up webhook for:/g' app.tsx

# Automation loader
sed -i 's/`?? Creating automations directory:/`?? Creating automations directory:/g' automation/automation-loader.ts

# Automation executor
sed -i 's/`?? Step/`?? Step/g' automation/step-handlers/llm-handler.ts

# Web research
sed -i 's/`?? Searching web for:/`?? Searching web for:/g' tools/intelligent-web-research.ts
sed -i 's/`?? Analyzing/`?? Analyzing/g' tools/intelligent-web-research.ts
sed -i 's/`?? Scraping site/`?? Scraping site/g' tools/intelligent-web-research.ts tools/web-scraper-context.ts
sed -i 's/`?? Failed to scrape/`?? Failed to scrape/g' tools/intelligent-web-research.ts tools/web-scraper-context.ts
sed -i 's/`?? Skipping already scraped/`?? Skipping already scraped/g' tools/web-scraper-context.ts
sed -i 's/`?? Performing web search/`?? Performing web search/g' tools/web-scraper-with-context.ts

# Prompt loader
sed -i 's/`?? Executing:/`?? Executing:/g' prompts/prompt-loader.ts
sed -i 's/`?? Auth:/`?? Auth:/g' prompts/prompt-loader.ts

# LLM coordinator
sed -i 's/`??  Executing:/`?? Executing:/g' llm-automation-coordinator.ts
sed -i 's/`?? LLM processing/`?? LLM processing/g' automation/step-handlers/llm-handler.ts

# Webhook handler
sed -i 's/`?? \*\*Webhook Created Successfully\*\*/`?? **Webhook Created Successfully**/g' webhook-trigger-handler.ts

# Components
sed -i 's/?? KANBAN BOARD/?? KANBAN BOARD/g' components/KanbanBox.tsx
sed -i 's/?? Available Automations/?? Available Automations/g' components/AutomationSelector.tsx
sed -i 's/Use setas ????/Use setas ????/g' components/CommandSuggestions.tsx
sed -i 's/???? Navigate/???? Navigate/g' components/AutomationSelector.tsx
sed -i 's/Use ????/Use ????/g' components/MCPScreen.tsx
sed -i 's/?? CUSTOM ENDPOINT/?? CUSTOM ENDPOINT/g' components/NewAuthScreen.tsx
sed -i 's/?? LLM AUTHENTICATION/?? LLM AUTHENTICATION/g' components/NewAuthScreen.tsx
sed -i 's/?? Qwen OAuth/?? Qwen OAuth/g' components/NewAuthScreen.tsx
sed -i 's/?? Custom Endpoint/?? Custom Endpoint/g' components/NewAuthScreen.tsx
sed -i 's/??  AVAILABLE TOOLS/?? AVAILABLE TOOLS/g' components/ToolsScreen.tsx
sed -i 's/??  SCRAPING CONFIGURATION/?? SCRAPING CONFIGURATION/g' components/ConfigScreen.tsx

# Error messages
sed -i 's/?? Operation timed out/?? Operation timed out/g' errors/error-types.ts
sed -i 's/?? Too many requests/?? Too many requests/g' errors/error-types.ts
sed -i 's/?? External service not available/?? External service not available/g' errors/error-types.ts
sed -i 's/?? Authentication failed/?? Authentication failed/g' errors/error-types.ts
sed -i 's/?? Service temporarily unavailable/?? Service temporarily unavailable/g' errors/error-types.ts
sed -i 's/?? Request too large/?? Request too large/g' errors/error-types.ts
sed -i 's/?? Network error/?? Network error/g' errors/error-types.ts

# Variable resolver
sed -i 's/??  Error resolving/?? Error resolving/g' automation/utils/variable-resolver.ts

# Log handler emojis
sed -i "s/info: '?? ',/info: '?? ',/g" automation/step-handlers/log-handler.ts
sed -i "s/warn: '?? ',/warn: '?? ',/g' automation/step-handlers/log-handler.ts
sed -i "s/error: '?',/error: '?',/g" automation/step-handlers/log-handler.ts
sed -i "s/success: '?',/success: '?',/g" automation/step-handlers/log-handler.ts
sed -i "s/debug: '??',/debug: '??',/g" automation/step-handlers/log-handler.ts
sed -i "s/return emojis\[level\] || '?? ';/return emojis[level] || '?? ';/g" automation/step-handlers/log-handler.ts

# Web scraper note
sed -i 's/?? Note:/?? Note:/g' tools/web-scraper.ts

# Web scraper with context
sed -i 's/? Stopped early/? Stopped early/g' tools/web-scraper-with-context.ts
sed -i 's/?? Scraped/?? Scraped/g' tools/web-scraper-with-context.ts

# Automation manager
sed -i 's/?? Reloading automations/?? Reloading automations/g' automation/automation-manager.ts
sed -i 's/?? Executing:/?? Executing:/g' automation/automation-manager.ts
sed -i "s/console.log(\`\\\n\${'\?'.repeat(50)}\`);/console.log(\`\\\n\${'?'.repeat(50)}\`);/g" automation/automation-manager.ts

# Dry run manager
sed -i 's/??  WARNINGS:/?? WARNINGS:/g' automation/dry-run-manager.ts
sed -i 's/?? STEPS:/?? STEPS:/g' automation/dry-run-manager.ts
sed -i 's/?? VARIABLES:/?? VARIABLES:/g' automation/dry-run-manager.ts

# Read folder
sed -i "s/\? '??' : '??'/? '??' : '??'/g" tools/read-folder.ts

# Context manager
sed -i "s/node.type === 'folder' ? '??' : '??'/node.type === 'folder' ? '??' : '??'/g" context-manager.ts

# Qwen OAuth
sed -i 's/?? Starting fresh OAuth login/?? Starting fresh OAuth login/g' components/QwenOAuthScreen.tsx

echo "? Emojis corrigidos!"
