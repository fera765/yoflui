# ??? Flui System - Comprehensive Refactoring Plan

**Version:** 1.0  
**Date:** 2025-11-02  
**Status:** Ready for Implementation  
**Estimated Total Effort:** 40-60 hours

---

## ?? Objectives

Transform Flui from a fragile prototype to a **production-ready** autonomous agent system with:
- Zero duplicate messages
- 80%+ error recovery rate
- Validated inputs at all boundaries
- Clear, actionable status reporting
- Comprehensive test coverage (>80%)

---

## ?? Implementation Phases

### Phase 1: Critical Fixes (Week 1) - 16-20 hours

**Priority:** CRITICAL  
**Blockers:** None (ready to start)  
**Goal:** Eliminate user-facing bugs and system hangs

#### Task 1.1: Message Deduplication System
**Effort:** 6 hours  
**Files to Modify:**
- `source/app.tsx`
- `source/llm-automation-coordinator.ts`
- NEW: `source/utils/execution-context.ts`

**Implementation Steps:**

1. Create ExecutionContext Manager (2 hours)
```typescript
// source/utils/execution-context.ts
export class ExecutionContext {
    private executionId: string;
    private messageIds: Set<string> = new Set();
    
    constructor(automationId: string) {
        this.executionId = `${automationId}-${Date.now()}-${randomBytes(4).toString('hex')}`;
    }
    
    shouldEmitMessage(messageKey: string): boolean {
        if (this.messageIds.has(messageKey)) {
            return false;  // Already emitted
        }
        this.messageIds.add(messageKey);
        return true;
    }
    
    getExecutionId(): string {
        return this.executionId;
    }
}
```

2. Modify `executeLLMCoordinatedAutomation` (2 hours)
   - Pass `ExecutionContext` to coordinator
   - Remove duplicate `addMessage` calls
   - Keep ONLY `onProgress` for LLM narration
   - Remove `onStepExecute` and `onStepComplete` (redundant)

3. Update `LLMAutomationCoordinator` (2 hours)
   - Accept `ExecutionContext` parameter
   - Check `shouldEmitMessage()` before calling callbacks
   - Add executionId to all log entries

**Testing:** 
- Unit test: ExecutionContext deduplication logic
- Integration test: Run automation, verify 1 message per event

**Acceptance Criteria:**
- [ ] No duplicate messages in UI for any automation
- [ ] All messages tagged with unique executionId
- [ ] Tests pass with 80%+ coverage

---

#### Task 1.2: Timeout Configuration Framework
**Effort:** 4 hours  
**Files to Modify:**
- NEW: `source/config/timeout-config.ts`
- `source/mcp/mcp-client.ts`
- `source/tools/web-fetch.ts`
- `source/llm-automation-coordinator.ts`

**Implementation Steps:**

1. Create Timeout Configuration (1 hour)
```typescript
// source/config/timeout-config.ts
export const TIMEOUT_CONFIG = {
    MCP_TOOL_CALL: 30000,        // 30s for MCP tools
    HTTP_REQUEST: 60000,         // 60s for HTTP
    LLM_CALL: 120000,            // 2min for LLM
    SHELL_COMMAND: 300000,       // 5min for shell
    FILE_OPERATION: 5000,        // 5s for file ops
} as const;

export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}
```

2. Apply Timeouts to MCP Calls (1 hour)
```typescript
// source/mcp/mcp-manager.ts
async callMCPTool(packageName: string, toolName: string, args: any): Promise<any> {
    const mcpId = this.activeMCPs.get(packageName);
    if (!mcpId) {
        throw new Error(`MCP ${packageName} is not active`);
    }
    
    return withTimeout(
        mcpClient.callMCPTool(mcpId, toolName, args),
        TIMEOUT_CONFIG.MCP_TOOL_CALL,
        `MCP ${packageName}.${toolName}`
    );
}
```

3. Apply Timeouts to HTTP/LLM (2 hours)
   - Wrap all `openai.chat.completions.create()` calls
   - Wrap all `fetch()` calls in web-fetch
   - Add timeout to automation coordinator

**Testing:**
- Unit test: Timeout triggers correctly
- Integration test: Long-running operations timeout gracefully

**Acceptance Criteria:**
- [ ] All external calls have timeout protection
- [ ] Timeout errors are caught and handled
- [ ] User sees clear timeout error messages

---

#### Task 1.3: Basic Retry Logic with Exponential Backoff
**Effort:** 6 hours  
**Files to Modify:**
- NEW: `source/utils/retry-manager.ts`
- `source/tools/index.ts`
- `source/mcp/mcp-manager.ts`

**Implementation Steps:**

1. Create Retry Manager (3 hours)
```typescript
// source/utils/retry-manager.ts
export interface RetryOptions {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitterPercent: number;  // ?25% randomization
    retryableErrors: string[];  // Error messages/codes to retry
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterPercent: 0.25,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '429', '503', '504'],
};

export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Check if error is retryable
            const isRetryable = opts.retryableErrors.some(pattern =>
                lastError.message.includes(pattern) || lastError.name.includes(pattern)
            );
            
            if (!isRetryable || attempt === opts.maxAttempts) {
                throw lastError;  // Don't retry or max attempts reached
            }
            
            // Calculate delay with exponential backoff and jitter
            const exponentialDelay = Math.min(
                opts.baseDelayMs * Math.pow(2, attempt - 1),
                opts.maxDelayMs
            );
            const jitter = exponentialDelay * opts.jitterPercent * (Math.random() * 2 - 1);
            const delay = exponentialDelay + jitter;
            
            console.log(`[RETRY] Attempt ${attempt}/${opts.maxAttempts} failed. Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}
```

2. Apply to Tool Execution (2 hours)
```typescript
// source/tools/index.ts
export async function executeToolCall(toolName: string, args: any, workDir: string): Promise<string> {
    return retryWithBackoff(async () => {
        if (isMCPTool(toolName)) {
            return executeMCPTool(toolName, args);
        }
        // ... existing switch statement
    }, {
        maxAttempts: 3,
        retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'timeout'],
    });
}
```

3. Apply to MCP Calls (1 hour)
   - Wrap `callMCPTool` with retry logic
   - Log retry attempts for monitoring

**Testing:**
- Unit test: Retry logic with mock failures
- Integration test: Transient MCP failure recovers

**Acceptance Criteria:**
- [ ] Failed tool calls retry up to 3 times
- [ ] Exponential backoff with jitter implemented
- [ ] Non-retryable errors fail immediately
- [ ] Retry attempts logged for debugging

---

### Phase 2: High-Priority Improvements (Weeks 2-3) - 16-20 hours

#### Task 2.1: Input Validation Framework
**Effort:** 6 hours  
**Files:**
- NEW: `source/validation/webhook-validator.ts`
- `source/webhook-api.ts`
- `source/webhook-trigger-handler.ts`

**Implementation:**

1. Create Validation Schema (2 hours)
```typescript
// source/validation/webhook-validator.ts
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export function createPayloadValidator(expectedPayload: Record<string, any>) {
    const schema = {
        type: 'object',
        properties: Object.entries(expectedPayload).reduce((acc, [key, typeStr]) => {
            acc[key] = { type: typeStr };
            return acc;
        }, {} as Record<string, any>),
        required: Object.keys(expectedPayload),
        additionalProperties: false,
    };
    
    return ajv.compile(schema);
}

export function validateWebhookPayload(
    payload: any,
    expectedPayload: Record<string, any>
): { valid: boolean; errors?: string[] } {
    const validator = createPayloadValidator(expectedPayload);
    const valid = validator(payload);
    
    if (!valid) {
        return {
            valid: false,
            errors: validator.errors?.map(e => `${e.instancePath} ${e.message}`) || ['Unknown validation error'],
        };
    }
    
    // Check for placeholder values
    for (const [key, value] of Object.entries(payload)) {
        if (value === 'string' || value === 'number' || value === 'boolean') {
            return {
                valid: false,
                errors: [`Field "${key}" contains placeholder value "${value}"`],
            };
        }
    }
    
    return { valid: true };
}
```

2. Apply Validation in Webhook API (2 hours)
   - Validate payload before triggering callback
   - Return 400 Bad Request with clear errors
   - Log validation failures

3. Add Type Checking in parseWebhookData (2 hours)
   - Validate types match expected schema
   - Coerce types safely (string to number, etc.)
   - Reject invalid data with clear errors

**Acceptance Criteria:**
- [ ] Rejects payloads with placeholder values
- [ ] Returns 400 with detailed validation errors
- [ ] Type coercion works correctly

---

#### Task 2.2: Logging Optimization
**Effort:** 5 hours  
**Files:**
- NEW: `source/utils/logger.ts`
- `source/app.tsx`
- `source/llm-automation-coordinator.ts`

**Implementation:**

1. Create Structured Logger (2 hours)
```typescript
// source/utils/logger.ts
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    executionId: string;
    component: string;
    message: string;
    metadata?: Record<string, any>;
}

export class Logger {
    private logLevel: LogLevel = LogLevel.INFO;
    private logs: LogEntry[] = [];
    
    setLogLevel(level: LogLevel) {
        this.logLevel = level;
    }
    
    log(level: LogLevel, executionId: string, component: string, message: string, metadata?: any) {
        if (level < this.logLevel) return;  // Filter by level
        
        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            executionId,
            component,
            message,
            metadata,
        };
        
        this.logs.push(entry);
        
        // Emit to UI only if INFO or higher
        if (level >= LogLevel.INFO) {
            this.emitToUI(entry);
        }
    }
    
    private emitToUI(entry: LogEntry) {
        // Hook for UI updates
    }
    
    getLogsForExecution(executionId: string): LogEntry[] {
        return this.logs.filter(log => log.executionId === executionId);
    }
}
```

2. Replace Direct addMessage Calls (2 hours)
   - Use logger with appropriate levels
   - DEBUG: Tool arguments, internal state
   - INFO: Step completion, major milestones
   - WARN: Recoverable errors
   - ERROR: Fatal failures

3. Add User/Developer Mode Toggle (1 hour)
   - User mode: Show only INFO+ 
   - Developer mode: Show DEBUG+

**Acceptance Criteria:**
- [ ] No verbose tool outputs in user mode
- [ ] All logs have executionId for grouping
- [ ] Developer mode shows full details

---

#### Task 2.3: Circuit Breaker Pattern
**Effort:** 5 hours  
**Files:**
- NEW: `source/utils/circuit-breaker.ts`
- `source/mcp/mcp-manager.ts`
- `source/tools/web-fetch.ts`

**Implementation:**

1. Create Circuit Breaker (3 hours)
```typescript
// source/utils/circuit-breaker.ts
export enum CircuitState {
    CLOSED = 'CLOSED',      // Normal operation
    OPEN = 'OPEN',          // Failing, reject fast
    HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private successCount: number = 0;
    
    constructor(
        private failureThreshold: number = 5,
        private resetTimeoutMs: number = 60000,  // 1 minute
        private halfOpenSuccessThreshold: number = 2
    ) {}
    
    async execute<T>(operation: () => Promise<T>, serviceName: string): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            // Check if enough time has passed to try again
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
            } else {
                throw new Error(`Circuit breaker OPEN for ${serviceName}. Service unavailable.`);
            }
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    private onSuccess() {
        this.failureCount = 0;
        
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.halfOpenSuccessThreshold) {
                this.state = CircuitState.CLOSED;
            }
        }
    }
    
    private onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }
    
    getState(): CircuitState {
        return this.state;
    }
}
```

2. Apply to MCP Manager (1 hour)
   - Create circuit breaker per MCP package
   - Fail fast when circuit is OPEN
   - Log state transitions

3. Apply to HTTP Requests (1 hour)
   - Circuit breaker for external APIs
   - Prevent cascading failures

**Testing:**
- Unit test: Circuit state transitions
- Integration test: Fails fast after threshold reached

**Acceptance Criteria:**
- [ ] Circuit opens after 5 consecutive failures
- [ ] Circuit tests recovery after 60s
- [ ] Circuit closes after 2 successful calls
- [ ] Clear error messages when circuit is OPEN

---

#### Task 1.4: Fallback Chain Implementation
**Effort:** 4-6 hours  
**Files:**
- NEW: `source/utils/fallback-chain.ts`
- `source/llm-automation-coordinator.ts`
- `source/mcp/mcp-manager.ts`

**Implementation:**

1. Create Fallback Manager (2 hours)
```typescript
// source/utils/fallback-chain.ts
export class FallbackChain<T> {
    constructor(private strategies: Array<() => Promise<T>>) {}
    
    async execute(): Promise<T> {
        const errors: Error[] = [];
        
        for (const [index, strategy] of this.strategies.entries()) {
            try {
                return await strategy();
            } catch (error) {
                errors.push(error as Error);
                console.log(`[FALLBACK] Strategy ${index + 1}/${this.strategies.length} failed. Trying next...`);
            }
        }
        
        throw new Error(`All fallback strategies failed: ${errors.map(e => e.message).join('; ')}`);
    }
}
```

2. Apply to MCP Tool Calls (2 hours)
   - Primary: MCP service
   - Secondary: Direct LLM call
   - Tertiary: Local mock/cached response

3. Apply to LLM Calls (1-2 hours)
   - Primary: Configured LLM endpoint
   - Secondary: Alternative endpoint
   - Tertiary: Cached/templated response

**Acceptance Criteria:**
- [ ] MCP failures fall back to LLM
- [ ] LLM failures fall back to local processing
- [ ] All fallback attempts logged

---

### Phase 2: High-Priority Enhancements (Weeks 2-3) - 12-16 hours

#### Task 2.1: Webhook Payload Validation
**Effort:** 4 hours  
*(Details in Phase 1, Task 2.1)*

#### Task 2.2: Request Size Limits
**Effort:** 3 hours  
**Files:**
- `source/webhook-api.ts`
- `source/tools/web-fetch.ts`

**Implementation:**
```typescript
// source/webhook-api.ts - setupMiddleware()
this.app.use(express.json({ limit: '1mb' }));
this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Add header size validation
this.app.use((req, res, next) => {
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > 8192) {  // 8KB limit
        res.status(431).json({ error: 'Request headers too large' });
        return;
    }
    next();
});
```

**Acceptance Criteria:**
- [ ] Requests > 1MB rejected with 413
- [ ] Headers > 8KB rejected with 431
- [ ] Clear error messages returned

---

#### Task 2.3: Rate Limiting
**Effort:** 3 hours  
**Dependency:** Install `express-rate-limit`

**Implementation:**
```bash
npm install express-rate-limit
```

```typescript
// source/webhook-api.ts
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
    windowMs: 60000,  // 1 minute
    max: 100,  // 100 requests per minute per IP
    message: { error: 'Too many requests. Please try again later.' },
});

this.app.use('/webhook', webhookLimiter);
```

**Acceptance Criteria:**
- [ ] Rate limit enforced (100 req/min)
- [ ] Returns 429 when exceeded
- [ ] Per-IP tracking

---

#### Task 2.4: Response Consolidation
**Effort:** 4 hours  
**Files:**
- `source/app.tsx`
- `source/llm-automation-coordinator.ts`

**Implementation:**
- Remove redundant callbacks (onStepExecute, onStepComplete)
- Keep ONLY onProgress with filtered, consolidated messages
- Create final summary separate from progress updates

**Acceptance Criteria:**
- [ ] Single message per automation milestone
- [ ] Clear separation of progress vs summary
- [ ] No duplicate information

---

### Phase 3: Medium-Priority Features (Month 2+) - 12-24 hours

#### Task 3.1: Comprehensive Error Handling Framework
**Effort:** 8 hours  
**Files:**
- NEW: `source/errors/error-types.ts`
- NEW: `source/errors/error-handler.ts`
- ALL files: Update error handling

**Features:**
- Custom error class hierarchy
- Centralized error logging
- Error recovery strategies
- User-friendly error messages

---

#### Task 3.2: Health Check System
**Effort:** 4 hours  
**Files:**
- NEW: `source/health/health-checker.ts`
- NEW endpoint: `GET /health/detailed`

**Features:**
- Check MCP services status
- Check external API connectivity
- Check disk space, memory
- Return JSON health report

---

#### Task 3.3: Execution Checkpointing
**Effort:** 8 hours  
**Files:**
- NEW: `source/automation/checkpoint-manager.ts`
- `source/automation/automation-executor.ts`

**Features:**
- Save state after each step
- Resume from last checkpoint on failure
- Clean up old checkpoints

---

#### Task 3.4: Dry-Run Mode
**Effort:** 4 hours  
**Files:**
- `source/automation/automation-executor.ts`
- UI: Add dry-run toggle

**Features:**
- Execute automation without side effects
- Mock tool calls return fake data
- Validate automation flow

---

## ?? Testing Strategy

### Phase 1 Tests (Week 1)
```
test/unit/
  ?? execution-context.test.ts
  ?? timeout-config.test.ts
  ?? retry-manager.test.ts
  ?? circuit-breaker.test.ts

test/integration/
  ?? message-deduplication.test.ts
  ?? timeout-handling.test.ts
  ?? retry-logic.test.ts
  ?? webhook-validation.test.ts
```

### Phase 2 Tests (Weeks 2-3)
```
test/integration/
  ?? webhook-payload-validation.test.ts
  ?? rate-limiting.test.ts
  ?? response-consolidation.test.ts

test/e2e/
  ?? complete-webhook-flow.test.ts
  ?? automation-execution-flow.test.ts
```

### Test Coverage Goals
- Phase 1: 70%+ coverage on new modules
- Phase 2: 80%+ coverage overall
- Phase 3: 85%+ coverage with E2E tests

---

## ?? Effort Estimation

| Phase | Tasks | Hours | Weeks | Priority |
|-------|-------|-------|-------|----------|
| Phase 1 | 4 | 16-20 | 1 | CRITICAL |
| Phase 2 | 4 | 12-16 | 2-3 | HIGH |
| Phase 3 | 4 | 12-24 | 4-8 | MEDIUM |
| **Total** | **12** | **40-60** | **7-12** | - |

---

## ?? Dependencies

### Phase 1 Dependencies
- **None** - Can start immediately

### Phase 2 Dependencies
- Requires Phase 1, Task 1.1 (ExecutionContext)
- Requires Phase 1, Task 1.2 (Timeout Config)

### Phase 3 Dependencies
- Requires all Phase 1 tasks
- Requires Phase 2, Task 2.1 (Validation)

---

## ?? New NPM Dependencies Required

```json
{
  "dependencies": {
    "ajv": "^8.12.0",              // JSON Schema validation
    "express-rate-limit": "^7.1.0"  // Rate limiting
  },
  "devDependencies": {
    "vitest": "^1.0.0",             // Testing framework
    "@types/express-rate-limit": "^6.0.0"
  }
}
```

---

## ?? Success Metrics

### Week 1 (Phase 1)
- [ ] Zero duplicate messages in production logs
- [ ] Zero timeout hangs reported by users
- [ ] 80%+ tool call success rate (with retries)

### Weeks 2-3 (Phase 2)
- [ ] Zero invalid webhook payloads accepted
- [ ] Zero rate limit violations
- [ ] Consolidated, clean status reporting

### Month 2+ (Phase 3)
- [ ] Full error handling coverage
- [ ] Health monitoring dashboard
- [ ] Checkpoint/resume functionality
- [ ] Dry-run testing capability

---

## ?? Risk Assessment

### High Risks
1. **Breaking Changes:** Refactoring message emission may break existing UI
   - **Mitigation:** Feature flag for new message system, gradual rollout
   
2. **Performance Degradation:** Retry logic may slow down operations
   - **Mitigation:** Use async retries, don't block user interaction
   
3. **Test Coverage Gaps:** Complex async flows hard to test
   - **Mitigation:** Use mocking libraries, create comprehensive fixtures

### Medium Risks
4. **Backward Compatibility:** Old automations may not have webhookConfig
   - **Mitigation:** Make webhookConfig truly optional, default to immediate execution

5. **External Service Dependencies:** Circuit breaker may be too aggressive
   - **Mitigation:** Tune threshold based on production metrics

---

## ?? Pre-Implementation Checklist

Before starting implementation:

- [ ] Create feature branch: `feat/error-handling-framework`
- [ ] Set up test infrastructure (vitest, mocks)
- [ ] Install new dependencies
- [ ] Review this plan with team
- [ ] Set up monitoring/logging infrastructure
- [ ] Create rollback procedure
- [ ] Document current behavior as baseline

---

## ?? Rollout Strategy

### Week 1: Phase 1 Implementation
- Day 1-2: ExecutionContext + Deduplication
- Day 3: Timeout Configuration
- Day 4-5: Retry Logic + Circuit Breaker
- Day 5: Testing + Bug fixes

### Weeks 2-3: Phase 2 Implementation
- Week 2: Input validation + Rate limiting
- Week 3: Logging optimization + Response consolidation

### Deployment
- Deploy to staging after Phase 1
- Beta test with internal users (Week 2)
- Production rollout after Phase 2 (Week 3)
- Monitor for regressions

---

## ?? Next Actions

1. **Review this plan** with tech lead
2. **Create GitHub issues** for each task
3. **Set up project board** with Kanban columns
4. **Begin Phase 1, Task 1.1** (Message Deduplication)

---

**Plan Created:** 2025-11-02  
**Ready for Implementation:** ? YES  
**Approvals Required:** Tech Lead, Product Owner
