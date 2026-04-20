import { db } from '../../../../packages/db/src/adapters/postgres-relational.adapter';
import { 
    customerProfiles, 
    customerEvents, 
    customerSessions, 
    identityLinks 
} from '../../../../packages/db/src/drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { 
    CustomerProfile, 
    CustomerEvent, 
    CustomerSession,
    CustomerLifecycleState
} from '../../../../packages/shared-types/src';
import crypto from 'crypto';

export class CustomerIntelligenceService {
    
    /**
     * Resolves and stitches customer identity across systems.
     * Requirement 1 & 2
     */
    static async resolveIdentity(options: {
        siteId: string;
        email?: string;
        externalId?: { system: string; id: string };
        visitorId?: string;
    }): Promise<string> {
        let emailHash: string | undefined;
        if (options.email) {
            // Privacy-safe hashing (Requirement 18)
            emailHash = crypto.createHash('sha256').update(options.email.toLowerCase()).digest('hex');
        }

        // 1. ATTEMPT MATCH BY EMAIL HASH (Strong Link)
        if (emailHash) {
            const existing = await db.select().from(customerProfiles).where(and(
                eq(customerProfiles.siteId, options.siteId),
                eq(customerProfiles.emailHash, emailHash)
            )).limit(1);

            if (existing[0]) return existing[0].id;
        }

        // 2. ATTEMPT MATCH BY EXTERNAL SYSTEM ID (Requirement 1)
        if (options.externalId) {
            // Logic to scan jsonb externalIds for match
        }

        // 3. CREATE NEW PROFILE IF NO MATCH
        const newId = crypto.randomUUID();
        await db.insert(customerProfiles).values({
            id: newId,
            siteId: options.siteId,
            emailHash,
            externalIds: options.externalId ? { [options.externalId.system]: options.externalId.id } : {},
            lifecycleState: 'NEW_VISITOR',
            identityConfidence: emailHash ? '1.0' : '0.5'
        });

        return newId;
    }

    /**
     * Ingests a customer event and handles sessionization.
     * Requirement 4, 7
     */
    static async ingestEvent(event: Omit<CustomerEvent, 'id' | 'sessionId'> & { email?: string }) {
        const customerId = await this.resolveIdentity({
            siteId: event.siteId,
            email: event.email
        });

        // 1. RESOLVE OR CREATE SESSION (Requirement 7)
        const sessionId = await this.getOrCreateSession(customerId, event.siteId);

        // 2. STORE EVENT (Requirement 4)
        const eventId = crypto.randomUUID();
        await db.insert(customerEvents).values({
            id: eventId,
            customerId,
            sessionId,
            siteId: event.siteId,
            eventName: event.eventName,
            eventCategory: event.eventCategory,
            timestamp: new Date(event.timestamp),
            utmSource: event.utm?.source,
            utmMedium: event.utm?.medium,
            utmCampaign: event.utm?.campaign,
            metadata: event.metadata
        });

        // 3. COMPUTE LIFECYCLE PROGRESSION (Requirement 14)
        await this.updateLifecycle(customerId, event.eventCategory);

        return { eventId, customerId, sessionId };
    }

    private static async getOrCreateSession(customerId: string, siteId: string): Promise<string> {
        // Simple 30-minute timeout logic (Requirement 7)
        const lastSession = await db.select().from(customerSessions)
            .where(and(
                eq(customerSessions.customerId, customerId),
                eq(customerSessions.siteId, siteId)
            ))
            .orderBy(desc(customerSessions.startTime))
            .limit(1);

        const timeoutMs = 30 * 60 * 1000;
        if (lastSession[0] && lastSession[0].endTime && (Date.now() - new Date(lastSession[0].endTime).getTime() < timeoutMs)) {
            return lastSession[0].id;
        }

        const newSessionId = crypto.randomUUID();
        await db.insert(customerSessions).values({
            id: newSessionId,
            customerId,
            siteId,
            startTime: new Date(),
            device: 'Unknown',
            browser: 'Unknown'
        });
        return newSessionId;
    }

    private static async updateLifecycle(id: string, category: string) {
        // Requirement 14: Lifecycle computation
        let nextState: CustomerLifecycleState = 'ENGAGED_USER';
        if (category === 'CART') nextState = 'CART_STARTER';
        if (category === 'PURCHASE') nextState = 'PURCHASER';

        await db.update(customerProfiles)
            .set({ lifecycleState: nextState, lastSeenAt: new Date() })
            .where(eq(customerProfiles.id, id));
    }
}
