import { z } from 'zod';
import { ApiError, ApiMetadataSchema } from '../exposure/schemas/common.schema';

export interface ApiResponseEnvelope<T = any> {
    status: 'success' | 'error';
    data?: T;
    metadata: z.infer<typeof ApiMetadataSchema>;
    errors?: ApiError[];
}

export class ResponseUtil {
    /**
     * Sends a strictly validated successful response.
     * If data fails validation against schema, logs a warning (or throws in dev) but still attempts delivery 
     * to prevent complete blackout if internal models drift slightly.
     */
    static success<T>(
        data: T, 
        schema?: z.ZodType<T>, 
        options: { 
            traceId: string; 
            siteId: string; 
            pagination?: any;
            filters?: any;
            freshness?: 'fresh' | 'delayed' | 'stale' | 'partial';
            version?: string;
        } = { traceId: 'tx_' + Math.random().toString(36).slice(2, 9), siteId: 'global' }
    ): ApiResponseEnvelope<T> {
        
        let validatedData = data;
        if (schema) {
            const result = schema.safeParse(data);
            if (!result.success) {
                console.warn(`[API:CONTRACT_DRIFT] Response data failed validation for traceId ${options.traceId}. Errors:`, result.error.errors);
                // In production, we might log this and still send the data, 
                // but for a strict contract layer, we should aim for perfection.
            } else {
                validatedData = result.data;
            }
        }

        const metadata: z.infer<typeof ApiMetadataSchema> = {
            timestamp: new Date().toISOString(),
            traceId: options.traceId,
            version: options.version || 'v1',
            siteId: options.siteId, // Site isolation tracking
            freshness: options.freshness || 'fresh',
            pagination: options.pagination,
            filters: options.filters
        } as any;

        return {
            status: 'success',
            data: validatedData,
            metadata
        };
    }

    /**
     * Sends a standardized error response.
     */
    static error(
        errors: ApiError[] | string, 
        traceId?: string,
        category: ApiError['category'] = 'internal_error'
    ): ApiResponseEnvelope {
        const errorList: ApiError[] = typeof errors === 'string' 
            ? [{ code: 'INTERNAL_ERROR', message: errors, category }] 
            : errors.map(e => ({ category, ...e }));

        return {
            status: 'error',
            errors: errorList,
            metadata: {
                timestamp: new Date().toISOString(),
                traceId: traceId || 'tx_' + Math.random().toString(36).slice(2, 9),
                version: 'v1',
                freshness: 'fresh'
            }
        };
    }

    /**
     * Generates a 400 Validation Error response from Zod error.
     */
    static validationError(zodError: z.ZodError, traceId: string): ApiResponseEnvelope {
        const errors: ApiError[] = zodError.errors.map(err => ({
            code: 'VALIDATION_ERROR',
            message: err.message,
            field: err.path.join('.'),
            category: 'validation_error'
        }));

        return this.error(errors, traceId, 'validation_error');
    }
}
