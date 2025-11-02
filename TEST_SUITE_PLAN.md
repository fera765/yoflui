# ?? Comprehensive Test Suite Plan

**Version:** 1.0  
**Date:** 2025-11-02  
**Target Coverage:** 85%+

---

## ?? Testing Strategy

### Test Pyramid

```
       /\
      /  \     E2E Tests (10%)
     /----\    Integration Tests (30%)
    /------\   Unit Tests (60%)
   /________\
```

---

## ?? Unit Tests (Target: 60% of total tests)

### 1. Error Handling Framework Tests

#### 1.1 Error Types (`source/errors/error-types.test.ts`)
```typescript
describe('FluiError Hierarchy', () => {
    test('NetworkError is retryable', () => {
        const error = new NetworkError('Connection failed');
        expect(error.isRetryable).toBe(true);
        expect(error.code).toBe('NETWORK_ERROR');
    });

    test('ValidationError is not retryable', () => {
        const error = new ValidationError('Invalid input', 'email');
        expect(error.isRetryable).toBe(false);
        expect(error.field).toBe('email');
    });

    test('classifyError detects timeout', () => {
        const error = new Error('ETIMEDOUT');
        const classification = classifyError(error);
        expect(classification.category).toBe('TIMEOUT_ERROR');
        expect(classification.isRetryable).toBe(true);
    });

    test('getUserFriendlyErrorMessage formats correctly', () => {
        const error = new TimeoutError('fetchData', 5000);
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toContain('??');
        expect(message).toContain('timed out');
    });
});
```

**Coverage Target:** 95%+

#### 1.2 Retry Manager (`source/errors/retry-manager.test.ts`)
```typescript
describe('Retry Manager', () => {
    test('retries transient errors up to maxAttempts', async () => {
        let attempts = 0;
        const operation = jest.fn(async () => {
            attempts++;
            if (attempts < 3) throw new Error('ECONNREFUSED');
            return 'success';
        });

        const result = await retryWithBackoff(operation, 'testOp', {
            maxAttempts: 3,
            baseDelayMs: 10,
        });

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
    });

    test('does not retry non-retryable errors', async () => {
        const operation = jest.fn(async () => {
            throw new ValidationError('Bad input');
        });

        await expect(
            retryWithBackoff(operation, 'testOp')
        ).rejects.toThrow('Bad input');

        expect(operation).toHaveBeenCalledTimes(1);
    });

    test('exponential backoff calculation', async () => {
        const delays: number[] = [];
        const operation = async () => {
            throw new Error('ETIMEDOUT');
        };

        try {
            await retryWithBackoff(operation, 'testOp', {
                maxAttempts: 4,
                baseDelayMs: 100,
                jitterPercent: 0,
                onRetry: (attempt, error, delay) => delays.push(delay),
            });
        } catch {}

        expect(delays[0]).toBe(100);   // 100 * 2^0
        expect(delays[1]).toBe(200);   // 100 * 2^1
        expect(delays[2]).toBe(400);   // 100 * 2^2
    });

    test('withTimeout rejects after timeout', async () => {
        const slowOperation = () => new Promise(resolve => setTimeout(resolve, 1000));

        await expect(
            withTimeout(slowOperation(), { timeoutMs: 50, operationName: 'slow' })
        ).rejects.toThrow('Timeout');
    });
});
```

**Coverage Target:** 90%+

#### 1.3 Circuit Breaker (`source/errors/circuit-breaker.test.ts`)
```typescript
describe('Circuit Breaker', () => {
    test('opens circuit after failure threshold', async () => {
        const breaker = new CircuitBreaker({ failureThreshold: 3 });
        const failingOp = async () => { throw new Error('fail'); };

        // First 3 failures
        for (let i = 0; i < 3; i++) {
            await expect(breaker.execute(failingOp)).rejects.toThrow('fail');
        }

        expect(breaker.getState()).toBe(CircuitState.OPEN);

        // 4th attempt should fail immediately
        await expect(breaker.execute(failingOp)).rejects.toThrow('Circuit breaker OPEN');
    });

    test('transitions to HALF_OPEN after timeout', async () => {
        const breaker = new CircuitBreaker({
            failureThreshold: 2,
            resetTimeoutMs: 100,
        });

        const failingOp = async () => { throw new Error('fail'); };
        
        // Open circuit
        await expect(breaker.execute(failingOp)).rejects.toThrow();
        await expect(breaker.execute(failingOp)).rejects.toThrow();

        expect(breaker.getState()).toBe(CircuitState.OPEN);

        // Wait for reset timeout
        await new Promise(resolve => setTimeout(resolve, 150));

        // State should now be HALF_OPEN on next call
        const successOp = async () => 'success';
        await breaker.execute(successOp);
        
        // Should transition to CLOSED after success
        await breaker.execute(successOp);
        expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
});
```

**Coverage Target:** 90%+

#### 1.4 Fallback Chain (`source/errors/fallback-chain.test.ts`)
```typescript
describe('Fallback Chain', () => {
    test('returns first successful strategy', async () => {
        const result = await new FallbackChainBuilder<string>()
            .primary('Primary', async () => 'primary-result')
            .fallback('Fallback', async () => 'fallback-result')
            .execute();

        expect(result).toBe('primary-result');
    });

    test('falls back on primary failure', async () => {
        const result = await new FallbackChainBuilder<string>()
            .primary('Primary', async () => { throw new Error('fail'); })
            .fallback('Fallback', async () => 'fallback-result')
            .execute();

        expect(result).toBe('fallback-result');
    });

    test('uses default when all strategies fail', async () => {
        const result = await new FallbackChainBuilder<string>()
            .primary('Primary', async () => { throw new Error('fail'); })
            .fallback('Fallback', async () => { throw new Error('also fail'); })
            .orDefault('default-value')
            .execute();

        expect(result).toBe('default-value');
    });

    test('skips strategies based on shouldAttempt', async () => {
        let fallbackAttempted = false;

        const result = await new FallbackChainBuilder<string>()
            .primary('Primary', async () => { throw new Error('fail'); })
            .fallback('Skip', async () => 'skipped', () => false)
            .fallback('Attempt', async () => {
                fallbackAttempted = true;
                return 'final';
            })
            .execute();

        expect(result).toBe('final');
        expect(fallbackAttempted).toBe(true);
    });
});
```

**Coverage Target:** 85%+

---

### 2. Execution Context & Deduplication Tests

#### 2.1 Execution Context (`source/utils/execution-context.test.ts`)
```typescript
describe('ExecutionContext', () => {
    test('generates unique execution IDs', () => {
        const ctx1 = new ExecutionContext('automation-1');
        const ctx2 = new ExecutionContext('automation-1');

        expect(ctx1.getExecutionId()).not.toBe(ctx2.getExecutionId());
    });

    test('prevents duplicate messages', () => {
        const ctx = new ExecutionContext('test');

        expect(ctx.shouldEmitMessage('step-1')).toBe(true);
        expect(ctx.shouldEmitMessage('step-1')).toBe(false);
        expect(ctx.shouldEmitMessage('step-2')).toBe(true);
    });
});
```

**Coverage Target:** 100%

---

### 3. Validation Tests

#### 3.1 Webhook Payload Validation (`source/validation/webhook-validator.test.ts`)
```typescript
describe('Webhook Validator', () => {
    test('accepts valid payload', () => {
        const expectedPayload = { name: 'string', age: 'number' };
        const payload = { name: 'Alice', age: 30 };

        const result = validateWebhookPayload(payload, expectedPayload);

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
    });

    test('rejects placeholder values', () => {
        const expectedPayload = { name: 'string' };
        const payload = { name: 'string' };  // Placeholder!

        const result = validateWebhookPayload(payload, expectedPayload);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('placeholder value');
    });

    test('rejects missing required fields', () => {
        const expectedPayload = { name: 'string', age: 'number' };
        const payload = { name: 'Alice' };  // Missing age

        const result = validateWebhookPayload(payload, expectedPayload);

        expect(result.valid).toBe(false);
        expect(result.errors?.some(e => e.includes('age'))).toBe(true);
    });
});
```

**Coverage Target:** 90%+

---

## ?? Integration Tests (Target: 30% of total tests)

### 4. Tool Execution with Retry

#### 4.1 Tool Execution Resilience (`test/integration/tool-execution.test.ts`)
```typescript
describe('Tool Execution with Retry', () => {
    test('retries MCP tool on transient failure', async () => {
        // Mock MCP to fail twice, then succeed
        let callCount = 0;
        jest.spyOn(mcpClient, 'callMCPTool').mockImplementation(async () => {
            callCount++;
            if (callCount < 3) throw new Error('ETIMEDOUT');
            return { result: 'success' };
        });

        const result = await executeToolCall('mcp.test_tool', {}, '/tmp/work');

        expect(result).toContain('success');
        expect(callCount).toBe(3);
    });

    test('circuit breaker prevents repeated MCP failures', async () => {
        const breaker = circuitBreakerRegistry.getOrCreate('test-mcp');
        const failingCall = async () => {
            throw new Error('Service down');
        };

        // Fail 5 times to open circuit
        for (let i = 0; i < 5; i++) {
            await expect(breaker.execute(failingCall)).rejects.toThrow();
        }

        // 6th attempt should fail fast
        const start = Date.now();
        await expect(breaker.execute(failingCall)).rejects.toThrow('Circuit breaker OPEN');
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(100);  // Failed fast, not waiting
    });
});
```

---

### 5. Message Deduplication

#### 5.1 Automation Message Flow (`test/integration/message-deduplication.test.ts`)
```typescript
describe('Message Deduplication', () => {
    test('no duplicate messages during automation', async () => {
        const messages: string[] = [];
        const mockAddMessage = jest.fn((msg) => {
            messages.push(msg.content);
        });

        const automation = loadAutomation('hello-world');
        
        await executeLLMCoordinatedAutomation(
            automation,
            '/tmp/work',
            mockAddMessage
        );

        // Check for duplicates
        const uniqueMessages = new Set(messages);
        expect(messages.length).toBe(uniqueMessages.size);
    });
});
```

---

### 6. Webhook Flow

#### 6.1 Complete Webhook Lifecycle (`test/integration/webhook-flow.test.ts`)
```typescript
describe('Webhook Flow', () => {
    test('webhook setup, trigger, and execution', async () => {
        // 1. Setup webhook
        const automation = loadAutomation('youtube-webhook-trigger');
        const webhookInfo = await webhookTriggerHandler.setupWebhook(
            automation,
            async (data) => {
                expect(data.body.searchTopic).toBe('TypeScript');
            }
        );

        expect(webhookInfo.url).toContain('http://127.0.0.1:8080/webhook');

        // 2. Trigger webhook
        const response = await fetch(webhookInfo.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${webhookInfo.apiKey}`,
            },
            body: JSON.stringify({ searchTopic: 'TypeScript' }),
        });

        expect(response.status).toBe(200);

        // 3. Verify automation was triggered
        await new Promise(resolve => setTimeout(resolve, 1000));
        // (Automation execution verified via callback above)
    });

    test('webhook rejects invalid API key', async () => {
        const automation = loadAutomation('youtube-webhook-trigger');
        const webhookInfo = await webhookTriggerHandler.setupWebhook(
            automation,
            async () => {}
        );

        const response = await fetch(webhookInfo.url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer invalid-key',
            },
        });

        expect(response.status).toBe(401);
    });
});
```

---

## ?? End-to-End Tests (Target: 10% of total tests)

### 7. Complete User Flows

#### 7.1 Automation Selection and Execution (`test/e2e/automation-selection.test.ts`)
```typescript
describe('E2E: Automation Selection', () => {
    test('user types @, selects automation, sees execution', async () => {
        const { stdin, stdout } = await startApp();

        // Type "@"
        stdin.write('@');
        await waitForOutput(stdout, 'Available Automations');

        // Select first automation (arrow down + enter)
        stdin.write('\x1B[B');  // Down arrow
        stdin.write('\r');       // Enter

        // Wait for automation to complete
        await waitForOutput(stdout, 'Automation completed');

        // Verify no duplicate messages
        const outputLines = stdout.toString().split('\n');
        const executingLines = outputLines.filter(line => line.includes('Executing'));
        expect(executingLines.length).toBe(1);
    });
});
```

#### 7.2 Error Recovery (`test/e2e/error-recovery.test.ts`)
```typescript
describe('E2E: Error Recovery', () => {
    test('recovers from transient MCP failure', async () => {
        // Mock MCP to fail once, then succeed
        mockMCPFailureOnce();

        const { stdin, stdout } = await startApp();

        stdin.write('search for TypeScript tutorials on YouTube\n');

        // Should see retry message
        await waitForOutput(stdout, 'Retrying');
        
        // Should eventually succeed
        await waitForOutput(stdout, 'Found', 10000);
    });
});
```

---

## ?? Test Coverage Goals

### By Phase

| Phase | Unit Tests | Integration Tests | E2E Tests | Total Coverage |
|-------|------------|-------------------|-----------|----------------|
| Phase 1 | 70% | 50% | N/A | 65% |
| Phase 2 | 80% | 70% | 50% | 75% |
| Phase 3 | 85% | 80% | 80% | 85%+ |

### By Component

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Error Handling Framework | 95%+ | CRITICAL |
| Retry Manager | 90%+ | CRITICAL |
| Circuit Breaker | 90%+ | HIGH |
| Webhook API | 80%+ | HIGH |
| LLM Coordinator | 70%+ | MEDIUM |
| UI Components | 60%+ | LOW |

---

## ??? Test Infrastructure

### Testing Libraries Required

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "c8": "^8.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.0.0",
    "supertest": "^6.3.0"
  }
}
```

### Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- error-types.test.ts

# Watch mode
npm test -- --watch

# UI mode
npm test -- --ui
```

---

## ?? Success Criteria

### Phase 1 (Week 1)
- [ ] All error handling framework tests pass
- [ ] Retry manager tests achieve 90%+ coverage
- [ ] Circuit breaker tests achieve 90%+ coverage
- [ ] Message deduplication integration test passes

### Phase 2 (Weeks 2-3)
- [ ] Webhook validation tests pass
- [ ] Rate limiting tests pass
- [ ] Complete webhook flow integration test passes
- [ ] Overall test coverage reaches 75%+

### Phase 3 (Month 2+)
- [ ] E2E tests for all major user flows pass
- [ ] Error recovery E2E tests pass
- [ ] Overall test coverage reaches 85%+
- [ ] CI/CD pipeline runs all tests on every commit

---

**Test Plan Created:** 2025-11-02  
**Status:** Ready for Implementation  
**Estimated Effort:** 20-30 hours (parallel with development)
