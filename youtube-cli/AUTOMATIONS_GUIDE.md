# ?? Flui Automation System - Complete Guide

**Version:** 1.0.0  
**Date:** 2025-11-02  
**Status:** ? Production Ready

---

## ?? Table of Contents

1. [Overview](#overview)
2. [Available Automations](#available-automations)
3. [How to Use](#how-to-use)
4. [Creating Custom Automations](#creating-custom-automations)
5. [Automation JSON Schema](#automation-json-schema)
6. [Step Types Reference](#step-types-reference)
7. [Examples](#examples)

---

## ?? Overview

The Flui Automation System allows you to create **flexible, reusable workflows** defined in JSON files. Each automation is triggered by specific phrases and executes a sequence of steps automatically.

### Key Features

? **Flexible Triggers** - Exact match, regex, or contains patterns  
? **Multiple Step Types** - Log, Tool, LLM, Conditional, Variables, User Input  
? **Variable System** - Define and use variables throughout automation  
? **Error Handling** - Configurable retry, skip, or abort on errors  
? **LLM Integration** - Use AI at any step  
? **Tool Integration** - All 12 existing tools available  

---

## ?? Available Automations

### ?? Examples & Learning

#### 1. Hello World
**Triggers:** `hello automation`, `teste automa??o`  
**Description:** Simple test automation  
**What it does:**
- Logs greeting
- Creates a test file
- Success message

---

#### 2. List Automations
**Triggers:** `listar automa??es`, `list automations`, `automa??es dispon?veis`  
**Description:** Shows all available automations  
**What it does:**
- Displays complete list of automations
- Shows triggers for each
- Organized by category

---

### ?? Code Analysis & Quality

#### 3. Analyze Project
**Triggers:** `analisar projeto`, `analyze project`, `estrutura do projeto`  
**Description:** Analyzes project structure  
**What it does:**
- Scans project structure
- AI analyzes and provides insights
- Generates analysis report

---

#### 4. Code Review
**Triggers:** `revisar c?digo`, `code review`  
**Description:** AI-powered code review  
**What it does:**
- Finds all source files
- Reviews code quality
- Identifies potential issues
- Creates detailed report

---

#### 5. Explain Code
**Triggers:** `explicar c?digo`, `explain code`, `como funciona`  
**Description:** Explains codebase in detail  
**What it does:**
- Reads project code
- Generates comprehensive explanation
- Documents architecture and patterns

---

### ?? Documentation

#### 6. Create README
**Triggers:** `criar readme`, `create readme`, `gerar readme`  
**Description:** Generates README.md  
**What it does:**
- Analyzes project
- Creates professional README
- Includes all standard sections

---

### ?? Research

#### 7. Search and Summarize
**Triggers:** `pesquisar sobre`, `research about`, `buscar informa??es`  
**Description:** Research and summarize topics  
**What it does:**
- Researches topic
- AI summarizes findings
- Saves research report

---

### ?? Productivity

#### 8. Quick Notes
**Triggers:** `anotar`, `fazer nota`, `quick note`  
**Description:** Quickly save notes  
**What it does:**
- Creates timestamped note
- Saves to notes folder
- Instant capture

---

### ?? Git & Version Control

#### 9. Git Summary
**Triggers:** `resumo de commits`, `git summary`, `commits recentes`  
**Description:** Summarizes recent Git activity  
**What it does:**
- Fetches last 7 days of commits
- AI analyzes changes
- Creates summary report

---

## ?? How to Use

### Starting the System

```bash
cd youtube-cli
npm run dev
```

The automation system loads automatically when Flui starts.

### Triggering Automations

Simply type any trigger phrase:

```
> hello automation
?? Executing automation: Hello World...
?? Hello, User!
? File created successfully!
? Automation completed successfully in 0.5s
```

### Listing Available Automations

```
> listar automa??es
```

Shows all available automations with their triggers.

---

## ??? Creating Custom Automations

### Step 1: Create JSON File

Create a new file in `/workspace/youtube-cli/automations/`:

```bash
touch automations/my-automation.json
```

### Step 2: Define Automation

```json
{
  "id": "my-automation",
  "version": "1.0.0",
  "metadata": {
    "name": "My Custom Automation",
    "description": "What this automation does",
    "tags": ["custom"],
    "category": "productivity"
  },
  "triggers": [
    {
      "type": "exact",
      "pattern": "my trigger phrase"
    }
  ],
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
      "message": "Starting automation...",
      "level": "info"
    }
  ],
  "errorHandling": {
    "onStepError": "abort",
    "maxRetries": 0,
    "logErrors": true
  }
}
```

### Step 3: Test

Restart Flui or type your trigger phrase to test!

---

## ?? Automation JSON Schema

### Root Structure

```typescript
{
  id: string;              // Unique identifier
  version: string;         // Semantic version
  metadata: {
    name: string;          // Display name
    description: string;   // What it does
    author?: string;       // Optional author
    created: string;       // ISO date
    tags: string[];        // Categories/tags
    category?: string;     // Main category
  };
  triggers: Trigger[];     // How to activate
  variables: Record<string, VariableDefinition>;
  steps: Step[];           // What to execute
  errorHandling: ErrorHandlingConfig;
}
```

### Trigger Types

```typescript
{
  type: 'exact' | 'regex' | 'contains';
  pattern: string;
  caseSensitive?: boolean;
  flags?: string;          // For regex: 'i', 'g', etc.
}
```

### Variable Definition

```typescript
{
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  required?: boolean;
  description?: string;
}
```

---

## ?? Step Types Reference

### 1. Log Step

Display messages to the user.

```json
{
  "id": "step_1",
  "type": "log",
  "message": "Message with ${variables.name}",
  "level": "info"
}
```

**Levels:** `info`, `warn`, `error`, `success`, `debug`

---

### 2. Tool Step

Execute any of the 12 built-in tools.

```json
{
  "id": "step_2",
  "type": "tool",
  "toolName": "write_file",
  "toolArgs": {
    "file_path": "output.txt",
    "content": "Hello ${variables.name}"
  },
  "saveResultAs": "fileResult"
}
```

**Available Tools:**
- `write_file`, `read_file`, `edit_file`
- `execute_shell`
- `find_files`, `search_text`, `read_folder`
- `web_fetch`
- `search_youtube_comments`
- `update_kanban`, `save_memory`

---

### 3. LLM Process Step

Use AI to process information.

```json
{
  "id": "step_3",
  "type": "llm_process",
  "prompt": "Analyze this: ${variables.data}",
  "useContext": true,
  "saveResultAs": "analysis"
}
```

---

### 4. Set Variable Step

Define or update variables.

```json
{
  "id": "step_4",
  "type": "set_variable",
  "variableName": "timestamp",
  "value": "${Date.now()}"
}
```

---

### 5. Conditional Step

Branch execution based on conditions.

```json
{
  "id": "step_5",
  "type": "conditional",
  "condition": "variables.count > 0",
  "thenSteps": ["step_6"],
  "elseSteps": ["step_7"]
}
```

---

### 6. Wait User Input Step

Pause and wait for user input.

```json
{
  "id": "step_6",
  "type": "wait_user_input",
  "promptMessage": "What is your name?",
  "inputVariable": "userName",
  "timeout": 300000
}
```

---

### 7. End Step

Explicitly end automation.

```json
{
  "id": "step_7",
  "type": "end"
}
```

---

## ?? Examples

### Example 1: Simple File Creator

```json
{
  "id": "create-file",
  "version": "1.0.0",
  "metadata": {
    "name": "Create File",
    "description": "Creates a file with current date",
    "tags": ["file", "simple"]
  },
  "triggers": [
    { "type": "exact", "pattern": "create file" }
  ],
  "variables": {
    "timestamp": { "type": "string", "defaultValue": "" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "set_variable",
      "variableName": "timestamp",
      "value": "${Date.now()}"
    },
    {
      "id": "step_2",
      "type": "tool",
      "toolName": "write_file",
      "toolArgs": {
        "file_path": "file-${variables.timestamp}.txt",
        "content": "Created at: ${variables.timestamp}"
      }
    },
    {
      "id": "step_3",
      "type": "log",
      "message": "? File created!",
      "level": "success"
    }
  ],
  "errorHandling": {
    "onStepError": "abort",
    "maxRetries": 0,
    "logErrors": true
  }
}
```

### Example 2: Conditional Logic

```json
{
  "id": "check-and-create",
  "version": "1.0.0",
  "metadata": {
    "name": "Check and Create",
    "description": "Checks condition and creates file if true",
    "tags": ["conditional"]
  },
  "triggers": [
    { "type": "exact", "pattern": "check files" }
  ],
  "variables": {
    "fileList": { "type": "string", "defaultValue": "" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "tool",
      "toolName": "read_folder",
      "toolArgs": { "path": "." },
      "saveResultAs": "fileList"
    },
    {
      "id": "step_2",
      "type": "conditional",
      "condition": "variables.fileList.length > 0",
      "thenSteps": ["step_3"],
      "elseSteps": ["step_4"]
    },
    {
      "id": "step_3",
      "type": "log",
      "message": "Files found!",
      "level": "success",
      "nextStep": null
    },
    {
      "id": "step_4",
      "type": "log",
      "message": "No files found!",
      "level": "warn"
    }
  ],
  "errorHandling": {
    "onStepError": "skip",
    "maxRetries": 1,
    "logErrors": true
  }
}
```

---

## ?? Best Practices

### 1. Clear Naming
- Use descriptive IDs and names
- Add helpful descriptions
- Tag appropriately

### 2. Error Handling
- Use `continueOnError` for optional steps
- Set appropriate retry counts
- Log errors for debugging

### 3. Variables
- Define all variables upfront
- Use descriptive names
- Set sensible defaults

### 4. Step Organization
- Keep steps focused and simple
- Use conditionals for branching
- Add descriptive comments

### 5. Testing
- Test with sample data first
- Verify error handling
- Check edge cases

---

## ?? System Architecture

```
User Message ? Automation Manager
                      ?
              Trigger Matcher (finds matching automation)
                      ?
              Automation Executor
                      ?
         ???????????????????????????
         ?                         ?
    Step Handlers            State Manager
    (7 types)               (Variables & Results)
         ?                         ?
         ???????????????????????????
                      ?
                 UI Updates
```

---

## ?? Learning Resources

### Start Here
1. Try `hello automation` - Simple test
2. Try `listar automa??es` - See all automations
3. Try `analisar projeto` - Real-world example

### Experiment
1. Modify existing automations
2. Create simple custom automation
3. Add new triggers
4. Combine multiple steps

### Advanced
1. Use conditionals for logic
2. Chain multiple automations
3. Integrate with LLM steps
4. Handle user input

---

## ?? Troubleshooting

### Automation Not Triggering
- Check trigger pattern spelling
- Verify JSON file is valid
- Restart Flui to reload

### Step Fails
- Check tool arguments
- Verify variable names
- Review error messages

### Variables Not Resolving
- Use `${variables.name}` syntax
- Check variable is defined
- Verify it's set before use

---

## ?? Support

For issues or questions:
1. Check this guide
2. Review example automations
3. Test with simple automations first

---

## ?? Conclusion

The Flui Automation System gives you the power to create **flexible, reusable workflows** that enhance your productivity. Start with the provided examples, then create your own automations tailored to your needs!

**Happy Automating! ??**

---

**Created by:** Flui Team  
**Version:** 1.0.0  
**Last Updated:** 2025-11-02
