import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import crypto from 'crypto';
import { AuditService } from './audit.service';

export interface ApiUsageRecord {
    count: number;
    lastActive: string;
    errors: number;
    dataVolumeBytes: number;
}

export class GovernanceService {
    /**
     * Usage Metrics Store (in-memory mock)
     * keyId -> Usage Stats
     */
    private static keyUsage = new Map<string, ApiUsageRecord>();

    /**
     * Increments usage metrics for an API key.
     */
    static trackUsage(keyId: string, bytes: number = 0, isError: boolean = false) {
        const stats = this.keyUsage.get(keyId) || { count: 0, lastActive: '', errors: 0, dataVolumeBytes: 0 };
        stats.count++;
        stats.lastActive = new Date().toISOString();
        stats.dataVolumeBytes += bytes;
        if (isError) stats.errors++;
        this.keyUsage.set(keyId, stats);
    }

    static getUsage(keyId: string): ApiUsageRecord | null {
        return this.keyUsage.get(keyId) || null;
    }

    /**
     * Validates and processes an API key lifecycle action.
     */
    static async rotateKey(siteId: string, keyId: string, actorId: string) {
        const keys = GlobalMemoryStore.projectAccessKeys.get(siteId) || [];
        const keyIndex = keys.findIndex(k => k.id === keyId);
        
        if (keyIndex === -1) throw new Error('Key not found');

        const oldKey = keys[keyIndex];
        const newSecret = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
        
        // Hashing logic consistent with _p
        const salt = process.env.JWT_SECRET || 'hardcoded_demo_salt';
        const hash = crypto.scryptSync(newSecret, salt, 64).toString('hex');

        keys[keyIndex] = {
            ...oldKey,
            secretHash: `${salt}:${hash}`,
            lastRotatedAt: new Date().toISOString()
        };

        await AuditService.log({
            action: 'API_KEY_ROTATED',
            actorId,
            targetId: keyId,
            status: 'SUCCESS',
            metadata: { siteId }
        });

        return { keyId, newSecret }; // Return new secret ONCE
    }

    static async revokeKey(siteId: string, keyId: string, actorId: string) {
        const keys = GlobalMemoryStore.projectAccessKeys.get(siteId) || [];
        const keyIndex = keys.findIndex(k => k.id === keyId);
        
        if (keyIndex === -1) throw new Error('Key not found');

        keys[keyIndex].status = 'revoked';
        keys[keyIndex].revokedAt = new Date().toISOString();

        await AuditService.log({
            action: 'API_KEY_REVOKED',
            actorId,
            targetId: keyId,
            status: 'SUCCESS',
            metadata: { siteId }
        });
    }

    /**
     * Abuse detection: Check for suspicious spikes.
     */
    static isSuspicious(keyId: string): boolean {
        const stats = this.keyUsage.get(keyId);
        if (!stats) return false;
        
        // Simple heuristic: > 500 errors in a short window or > 10% error rate
        if (stats.errors > 500 && (stats.errors / stats.count) > 0.1) {
            return true;
        }
        return false;
    }
}
