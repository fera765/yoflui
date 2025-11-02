/**
 * Checkpoint Manager for Automation Execution
 * Saves state after each step and allows resume on failure
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Automation } from './types.js';
import { logger } from '../utils/logger.js';

export interface Checkpoint {
    executionId: string;
    automationId: string;
    automationName: string;
    createdAt: number;
    lastUpdated: number;
    currentStepIndex: number;
    totalSteps: number;
    variables: Record<string, any>;
    stepResults: Array<{
        stepId: string;
        status: 'success' | 'error';
        result?: string;
        error?: string;
        timestamp: number;
    }>;
    metadata: Record<string, any>;
}

export class CheckpointManager {
    private checkpointDir: string;
    private maxCheckpoints: number = 100;
    private checkpointRetentionMs: number = 86400000; // 24 hours

    constructor() {
        this.checkpointDir = join(homedir(), '.flui', 'checkpoints');
        this.ensureCheckpointDir();
    }

    /**
     * Ensure checkpoint directory exists
     */
    private ensureCheckpointDir(): void {
        if (!existsSync(this.checkpointDir)) {
            mkdirSync(this.checkpointDir, { recursive: true });
        }
    }

    /**
     * Save checkpoint
     */
    saveCheckpoint(checkpoint: Checkpoint): void {
        try {
            const filename = this.getCheckpointFilename(checkpoint.executionId);
            const filepath = join(this.checkpointDir, filename);

            checkpoint.lastUpdated = Date.now();

            writeFileSync(filepath, JSON.stringify(checkpoint, null, 2), 'utf-8');

            logger.debug(
                'CheckpointManager',
                'Checkpoint saved',
                {
                    executionId: checkpoint.executionId,
                    step: checkpoint.currentStepIndex,
                    total: checkpoint.totalSteps,
                },
                checkpoint.executionId
            );

            // Cleanup old checkpoints
            this.cleanupOldCheckpoints();
        } catch (error) {
            logger.error(
                'CheckpointManager',
                'Failed to save checkpoint',
                { error: error instanceof Error ? error.message : String(error) },
                checkpoint.executionId
            );
        }
    }

    /**
     * Load checkpoint
     */
    loadCheckpoint(executionId: string): Checkpoint | null {
        try {
            const filename = this.getCheckpointFilename(executionId);
            const filepath = join(this.checkpointDir, filename);

            if (!existsSync(filepath)) {
                return null;
            }

            const data = readFileSync(filepath, 'utf-8');
            const checkpoint: Checkpoint = JSON.parse(data);

            logger.info(
                'CheckpointManager',
                'Checkpoint loaded',
                {
                    executionId,
                    step: checkpoint.currentStepIndex,
                    total: checkpoint.totalSteps,
                },
                executionId
            );

            return checkpoint;
        } catch (error) {
            logger.error(
                'CheckpointManager',
                'Failed to load checkpoint',
                { error: error instanceof Error ? error.message : String(error) },
                executionId
            );
            return null;
        }
    }

    /**
     * Delete checkpoint
     */
    deleteCheckpoint(executionId: string): void {
        try {
            const filename = this.getCheckpointFilename(executionId);
            const filepath = join(this.checkpointDir, filename);

            if (existsSync(filepath)) {
                unlinkSync(filepath);

                logger.debug(
                    'CheckpointManager',
                    'Checkpoint deleted',
                    { executionId },
                    executionId
                );
            }
        } catch (error) {
            logger.error(
                'CheckpointManager',
                'Failed to delete checkpoint',
                { error: error instanceof Error ? error.message : String(error) },
                executionId
            );
        }
    }

    /**
     * List all checkpoints
     */
    listCheckpoints(): Checkpoint[] {
        try {
            this.ensureCheckpointDir();

            const files = readdirSync(this.checkpointDir);
            const checkpoints: Checkpoint[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filepath = join(this.checkpointDir, file);
                        const data = readFileSync(filepath, 'utf-8');
                        const checkpoint: Checkpoint = JSON.parse(data);
                        checkpoints.push(checkpoint);
                    } catch (error) {
                        // Skip invalid checkpoint files
                        logger.warn('CheckpointManager', 'Skipping invalid checkpoint file', { file });
                    }
                }
            }

            return checkpoints.sort((a, b) => b.lastUpdated - a.lastUpdated);
        } catch (error) {
            logger.error(
                'CheckpointManager',
                'Failed to list checkpoints',
                { error: error instanceof Error ? error.message : String(error) }
            );
            return [];
        }
    }

    /**
     * Find checkpoint by automation ID
     */
    findCheckpointsByAutomation(automationId: string): Checkpoint[] {
        const allCheckpoints = this.listCheckpoints();
        return allCheckpoints.filter(cp => cp.automationId === automationId);
    }

    /**
     * Check if checkpoint exists
     */
    hasCheckpoint(executionId: string): boolean {
        const filename = this.getCheckpointFilename(executionId);
        const filepath = join(this.checkpointDir, filename);
        return existsSync(filepath);
    }

    /**
     * Create initial checkpoint
     */
    createInitialCheckpoint(
        executionId: string,
        automation: Automation,
        variables: Record<string, any> = {}
    ): Checkpoint {
        const checkpoint: Checkpoint = {
            executionId,
            automationId: automation.id,
            automationName: automation.metadata.name,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            currentStepIndex: 0,
            totalSteps: automation.steps.length,
            variables,
            stepResults: [],
            metadata: {
                description: automation.metadata.description,
                category: automation.metadata.category,
            },
        };

        this.saveCheckpoint(checkpoint);
        return checkpoint;
    }

    /**
     * Update checkpoint after step completion
     */
    updateCheckpointAfterStep(
        executionId: string,
        stepIndex: number,
        stepId: string,
        status: 'success' | 'error',
        result?: string,
        error?: string,
        variables?: Record<string, any>
    ): void {
        const checkpoint = this.loadCheckpoint(executionId);

        if (!checkpoint) {
            logger.warn('CheckpointManager', 'Cannot update non-existent checkpoint', { executionId });
            return;
        }

        checkpoint.currentStepIndex = stepIndex + 1;
        checkpoint.stepResults.push({
            stepId,
            status,
            result,
            error,
            timestamp: Date.now(),
        });

        if (variables) {
            checkpoint.variables = { ...checkpoint.variables, ...variables };
        }

        this.saveCheckpoint(checkpoint);
    }

    /**
     * Mark checkpoint as completed
     */
    markCheckpointCompleted(executionId: string): void {
        const checkpoint = this.loadCheckpoint(executionId);

        if (!checkpoint) {
            return;
        }

        checkpoint.currentStepIndex = checkpoint.totalSteps;
        checkpoint.metadata.completedAt = Date.now();
        checkpoint.metadata.status = 'completed';

        this.saveCheckpoint(checkpoint);

        // Optionally delete completed checkpoints after a delay
        setTimeout(() => {
            this.deleteCheckpoint(executionId);
        }, 60000); // Delete after 1 minute
    }

    /**
     * Cleanup old checkpoints
     */
    private cleanupOldCheckpoints(): void {
        try {
            const checkpoints = this.listCheckpoints();
            const now = Date.now();

            // Remove checkpoints older than retention period
            for (const checkpoint of checkpoints) {
                const age = now - checkpoint.lastUpdated;
                if (age > this.checkpointRetentionMs) {
                    this.deleteCheckpoint(checkpoint.executionId);
                }
            }

            // Remove excess checkpoints if over limit
            if (checkpoints.length > this.maxCheckpoints) {
                const toRemove = checkpoints
                    .sort((a, b) => a.lastUpdated - b.lastUpdated)
                    .slice(0, checkpoints.length - this.maxCheckpoints);

                for (const checkpoint of toRemove) {
                    this.deleteCheckpoint(checkpoint.executionId);
                }
            }
        } catch (error) {
            logger.error(
                'CheckpointManager',
                'Failed to cleanup old checkpoints',
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Get checkpoint filename
     */
    private getCheckpointFilename(executionId: string): string {
        return `${executionId}.json`;
    }

    /**
     * Get statistics
     */
    getStats(): {
        total: number;
        byStatus: Record<string, number>;
        oldestAge: number;
        newestAge: number;
    } {
        const checkpoints = this.listCheckpoints();
        const now = Date.now();

        const byStatus: Record<string, number> = {
            completed: 0,
            inProgress: 0,
            failed: 0,
        };

        for (const checkpoint of checkpoints) {
            if (checkpoint.metadata.status === 'completed') {
                byStatus.completed++;
            } else if (checkpoint.currentStepIndex === checkpoint.totalSteps) {
                byStatus.completed++;
            } else if (checkpoint.stepResults.some(r => r.status === 'error')) {
                byStatus.failed++;
            } else {
                byStatus.inProgress++;
            }
        }

        const ages = checkpoints.map(cp => now - cp.lastUpdated);
        const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;
        const newestAge = ages.length > 0 ? Math.min(...ages) : 0;

        return {
            total: checkpoints.length,
            byStatus,
            oldestAge,
            newestAge,
        };
    }
}

// Singleton instance
export const checkpointManager = new CheckpointManager();
