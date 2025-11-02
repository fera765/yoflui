# ?? Webhook-Triggered LLM-Coordinated Automations Guide

## ?? Overview

This system implements a powerful automation framework where:

1. **@ Trigger**: Type `@` to see a list of available automations
2. **LLM Coordination**: All automations are dynamically coordinated by the LLM (not static execution)
3. **Webhook Support**: Automations can be triggered by external webhooks
4. **Context Preservation**: After automation, conversation context is maintained for follow-up questions
5. **Real-time API Status**: Visual indicator shows webhook API connectivity

---

## ?? Key Features

### 1. **Interactive Automation Selector** (`@`)

When you type `@`, a beautiful selector appears showing:
- ? All available automations
- ?? Name and description
- ??? Category grouping
- ??/?? Webhook API status indicator

### 2. **LLM-Coordinated Execution**

Unlike traditional static automations, our system:
- Lets the LLM read the automation definition
- The LLM decides how to execute each step
- The LLM can adapt and handle errors intelligently
- All tool calls are visible in the timeline

### 3. **Webhook Trigger System**

Automations with `webhookConfig` can:
- Generate unique webhook URLs
- Support GET/POST methods
- Optional Bearer token authentication
- Parse payload data into automation variables
- Execute when external systems trigger the webhook

### 4. **Context Preservation**

After an automation completes:
- The LLM maintains full conversation history
- You can ask follow-up questions about the automation
- You can continue normal conversation on any topic
- The automation context is available for reference

---

## ?? Quick Start

### Step 1: Start the Flui CLI

```bash
cd /workspace/youtube-cli
npm run dev
```

The webhook API automatically starts on port 8080 ??

### Step 2: Discover Automations

Type `@` to see all available automations:

```
?? Available Automations                    ?? API

WEBHOOK-TRIGGERS
  ? YouTube Webhook Analysis - Analyzes YouTube videos when webhook is triggered

GENERAL
  Hello World - A simple greeting automation
  Analyze Project - Analyzes project structure
  ...
```

### Step 3: Select an Automation

Click or select any automation to execute it!

---

## ?? Example: YouTube Webhook Automation

### Automation File: `youtube-webhook-trigger.json`

```json
{
  "id": "youtube-webhook-trigger",
  "metadata": {
    "name": "YouTube Webhook Analysis",
    "description": "Analyzes YouTube videos when webhook is triggered",
    "category": "webhook-triggers"
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "@youtube-trigger"
    }
  ],
  "webhookConfig": {
    "enabled": true,
    "requireAuth": true,
    "method": "POST",
    "expectedPayload": {
      "searchTopic": "string"
    }
  },
  "variables": {
    "searchTopic": {
      "type": "string",
      "defaultValue": "technology"
    }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "?? YouTube Webhook Trigger Activated"
    },
    {
      "id": "step_3",
      "type": "tool",
      "toolName": "search_youtube_comments",
      "toolArgs": {
        "query": "${variables.searchTopic}"
      },
      "saveResultAs": "videoResults"
    },
    {
      "id": "step_5",
      "type": "llm_process",
      "prompt": "Analyze these YouTube results and provide insights...",
      "saveResultAs": "analysis"
    }
  ]
}
```

### Usage Flow

1. **User selects automation** (`@youtube-trigger` or via `@` menu)

2. **System sets up webhook**:
```
?? Webhook Created Successfully

URL: http://127.0.0.1:8080/webhook/youtube-webhook-trigger/a1b2c3d4e5f6
Method: POST
Authorization: Bearer sk-abc123def456ghi789

Example cURL:
curl -X POST http://127.0.0.1:8080/webhook/youtube-webhook-trigger/a1b2c3d4e5f6 \
  -H "Authorization: Bearer sk-abc123def456ghi789" \
  -H "Content-Type: application/json" \
  -d '{"searchTopic": "artificial intelligence"}'

?? The webhook is now active. You can continue chatting normally.
```

3. **User can chat normally** while webhook waits for triggers

4. **External system triggers webhook**:
```bash
curl -X POST http://127.0.0.1:8080/webhook/youtube-webhook-trigger/a1b2c3d4e5f6 \
  -H "Authorization: Bearer sk-abc123def456ghi789" \
  -H "Content-Type: application/json" \
  -d '{"searchTopic": "quantum computing"}'
```

5. **LLM coordinates automation**:
   - Reads the automation definition
   - Sees the webhook data (`searchTopic: "quantum computing"`)
   - Executes YouTube search tool
   - Analyzes results
   - Saves report

6. **User can ask follow-up questions**:
```
User: "What were the main insights from the quantum computing videos?"
Assistant: [Answers based on automation context]
```

---

## ??? Architecture

```
???????????????????????????????????????????????????????????
?                     Flui CLI App                        ?
?                                                         ?
?  ????????????????????????????????????????????????????  ?
?  ?  User Types "@"                                   ?  ?
?  ?  ?                                                ?  ?
?  ?  AutomationSelector Component                     ?  ?
?  ?  - Lists automations                              ?  ?
?  ?  - Shows API status (??/??)                       ?  ?
?  ?  - Groups by category                             ?  ?
?  ????????????????????????????????????????????????????  ?
?                                                         ?
?  ????????????????????????????????????????????????????  ?
?  ?  User Selects Automation                          ?  ?
?  ?  ?                                                ?  ?
?  ?  selectAutomation()                               ?  ?
?  ?  - Checks if webhook automation                   ?  ?
?  ?  - If yes: Setup webhook                          ?  ?
?  ?  - If no: Execute immediately                     ?  ?
?  ????????????????????????????????????????????????????  ?
?                                                         ?
?  ????????????????????????????????????????????????????  ?
?  ?  executeLLMCoordinatedAutomation()                ?  ?
?  ?  ?                                                ?  ?
?  ?  LLMAutomationCoordinator                         ?  ?
?  ?  - Creates LLM conversation                       ?  ?
?  ?  - Provides automation context                    ?  ?
?  ?  - LLM decides execution flow                     ?  ?
?  ?  - Executes tools via executeToolCall()           ?  ?
?  ?  - Maintains conversation history                 ?  ?
?  ????????????????????????????????????????????????????  ?
?                                                         ?
?  ????????????????????????????????????????????????????  ?
?  ?  After Automation                                 ?  ?
?  ?  ?                                                ?  ?
?  ?  llmCoordinator.continueConversation()            ?  ?
?  ?  - User can chat normally                         ?  ?
?  ?  - LLM has full automation context                ?  ?
?  ????????????????????????????????????????????????????  ?
???????????????????????????????????????????????????????????

???????????????????????????????????????????????????????????
?              Webhook API (Port 8080)                    ?
?                                                         ?
?  GET /health           ? Health check                   ?
?  POST|GET /webhook/:id/:uid ? Trigger automation        ?
?                                                         ?
?  - Started silently with Flui                           ?
?  - Generates unique URLs per automation                 ?
?  - Validates Bearer tokens                              ?
?  - Calls registered callbacks on trigger                ?
???????????????????????????????????????????????????????????
```

---

## ?? Creating Your Own Webhook Automation

### 1. Create JSON file in `automations/` folder

```json
{
  "id": "my-webhook-automation",
  "version": "1.0.0",
  "metadata": {
    "name": "My Webhook Automation",
    "description": "What it does",
    "category": "webhook-triggers"
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "@my-trigger"
    }
  ],
  "webhookConfig": {
    "enabled": true,
    "requireAuth": true,
    "method": "POST",
    "expectedPayload": {
      "myVar": "string"
    }
  },
  "variables": {
    "myVar": {
      "type": "string",
      "defaultValue": "default"
    }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "log",
      "message": "Received: ${variables.myVar}"
    },
    {
      "id": "step_2",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "webhook-log.txt",
        "content": "Data: ${variables.myVar}"
      }
    }
  ],
  "errorHandling": {
    "onStepError": "skip",
    "maxRetries": 1
  }
}
```

### 2. Restart Flui

The automation will be automatically loaded!

### 3. Trigger via `@` menu or webhook

```bash
curl -X POST http://127.0.0.1:8080/webhook/my-webhook-automation/[unique-id] \
  -H "Authorization: Bearer [your-token]" \
  -H "Content-Type: application/json" \
  -d '{"myVar": "Hello from webhook!"}'
```

---

## ?? Available Step Types

All step types are **coordinated by the LLM**:

| Type | Description | LLM Behavior |
|------|-------------|--------------|
| `log` | Display message | LLM reads and can reference |
| `tool` | Execute tool | LLM decides parameters and handles result |
| `llm_process` | AI processing | LLM processes with full context |
| `set_variable` | Set variable | LLM evaluates and stores |
| `conditional` | If/else logic | LLM evaluates condition |
| `wait_user_input` | Pause for input | LLM prompts user naturally |
| `end` | Stop automation | LLM concludes gracefully |

---

## ?? Timeline Display

During execution, the timeline shows:

```
You: @youtube-trigger