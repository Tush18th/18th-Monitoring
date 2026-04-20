import { pgTable, varchar, timestamp, jsonb, serial, integer, index } from 'drizzle-orm/pg-core';

export const siteConfigs = pgTable('site_configs', {
    siteId: varchar('site_id', { length: 255 }).primaryKey(),
    activeVersionId: varchar('active_version_id', { length: 36 }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const configVersions = pgTable('config_versions', {
    versionId: varchar('version_id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull().references(() => siteConfigs.siteId),
    versionNumber: integer('version_number').notNull(),
    status: varchar('status', { length: 50 }).notNull(), // DRAFT, PUBLISHED, ARCHIVED
    kpiDefinitionBlob: jsonb('kpi_definition_blob').notNull().default('{}'),
    widgetDefinitionBlob: jsonb('widget_definition_blob').notNull().default('{}'),
    connectorDefinitionBlob: jsonb('connector_definition_blob').notNull().default('{}'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
    logId: serial('log_id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    action: varchar('action', { length: 255 }).notNull(),
    entityType: varchar('entity_type', { length: 255 }).notNull(),
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    changes: jsonb('changes').notNull().default('{}'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
    siteIdTimestampIdx: index('audit_logs_site_id_timestamp_idx').on(table.siteId, table.timestamp),
}));

// -- PHASE 3: Ingestion & Reconciliation --

export const rawPayloads = pgTable('raw_payloads', {
    payloadId: varchar('payload_id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    connectorId: varchar('connector_id', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // PENDING, PROCESSED, FAILED
    rawData: jsonb('raw_data').notNull().default('{}'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Orders Intelligence Truth Layer (Requirement 1 & 3) ---

export const canonicalOrders = pgTable('canonical_orders', {
    id: varchar('id', { length: 36 }).primaryKey(), // Internal UUID
    orderId: varchar('order_id', { length: 255 }).notNull(), // Source Order Number
    externalReferenceId: varchar('external_ref_id', { length: 255 }),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    sourceSystem: varchar('source_system', { length: 255 }).notNull(),
    channel: varchar('channel', { length: 50 }).notNull(),
    lifecycleState: varchar('lifecycle_state', { length: 50 }).notNull(), // Normalization-driven
    intelligenceState: varchar('intelligence_state', { length: 50 }).default('HEALTHY'), 
    
    // Financials (Requirement 7)
    currency: varchar('currency', { length: 10 }).notNull(),
    grandTotal: numeric('grand_total').notNull(),
    paidAmount: numeric('paid_amount').default('0'),
    refundedAmount: numeric('refunded_amount').default('0'),
    balanceDue: numeric('balance_due').default('0'),
    
    // Milestones (Requirement 11)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    paidAt: timestamp('paid_at'),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    
    // Integrity (Requirement 1)
    mappingVersion: varchar('mapping_version', { length: 20 }).notNull(),
    validationStatus: varchar('validation_status', { length: 50 }),
    qualityState: varchar('quality_state', { length: 50 }),
    confidenceScore: numeric('confidence_score'),
    
    rawPayloadRefs: jsonb('raw_payload_refs'), // Traceability to ingestion_events
    metadata: jsonb('metadata'),
}, (table) => ({
    orderIdIdx: index('idx_canonical_order_id').on(table.orderId),
    siteIdIdx: index('idx_canonical_site_id').on(table.siteId),
    lifecycleIdx: index('idx_canonical_lifecycle').on(table.lifecycleState),
}));

export const orderSnapshots = pgTable('order_snapshots', {
    snapshotId: varchar('snapshot_id', { length: 36 }).primaryKey(),
    orderInternalId: varchar('order_internal_id', { length: 36 }).references(() => canonicalOrders.id),
    snapshotTimestamp: timestamp('snapshot_timestamp').defaultNow(),
    lifecycleState: varchar('lifecycle_state', { length: 50 }),
    financials: jsonb('financials'),
    metadata: jsonb('metadata'),
    version: integer('version').default(1),
}, (table) => ({
    orderIdx: index('idx_snapshot_order').on(table.orderInternalId),
}));

export const orderEvents = pgTable('order_events', {
    eventId: varchar('event_id', { length: 36 }).primaryKey(),
    orderInternalId: varchar('order_internal_id', { length: 36 }).references(() => canonicalOrders.id),
    eventType: varchar('event_type', { length: 100 }).notNull(), // e.g. PAYMENT_RECEIVED, SHIPMENT_SENT
    sourceSystem: varchar('source_system', { length: 255 }),
    timestamp: timestamp('timestamp').notNull(),
    payload: jsonb('payload'),
    correlationId: varchar('correlation_id', { length: 255 }),
}, (table) => ({
    orderIdx: index('idx_event_order').on(table.orderInternalId),
}));


export const syncLogs = pgTable('sync_logs', {
    syncId: varchar('sync_id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    connectorId: varchar('connector_id', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // SUCCESS, PARTIAL, FAILED
    recordsProcessed: integer('records_processed').notNull().default(0),
    recordsFailed: integer('records_failed').notNull().default(0),
    recordsDeduped: integer('records_deduped').notNull().default(0),
    errorSummary: jsonb('error_summary').notNull().default('[]'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
    connectorSiteIdx: index('sync_logs_connector_site_idx').on(table.connectorId, table.siteId),
}));

// -- HARDIENING LAYER: 3-Layer Data Flow & Observability --

export const ingestionEvents = pgTable('ingestion_events', {
    id: serial('id').primaryKey(),
    eventId: varchar('event_id', { length: 36 }).notNull(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    connectorId: varchar('connector_id', { length: 255 }).notNull(),
    sourceSystem: varchar('source_system', { length: 255 }).notNull(),
    sourceEventId: varchar('source_event_id', { length: 255 }),
    sourceTimestamp: timestamp('source_timestamp'),
    ingestionTimestamp: timestamp('ingestion_timestamp').defaultNow().notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    schemaVersion: varchar('schema_version', { length: 20 }).default('1.0.0'),
    correlationId: varchar('correlation_id', { length: 255 }),
    traceId: varchar('trace_id', { length: 255 }),
    
    // Data Layers
    rawPayload: jsonb('raw_payload').notNull(),
    normalizedPayload: jsonb('normalized_payload'),
    
    // State Tracking
    processingStatus: varchar('processing_status', { length: 50 }).notNull().default('PENDING'),
    validationStatus: varchar('validation_status', { length: 50 }).notNull().default('PENDING'),
    
    // Metadata for Audit & Recovery
    retryCount: integer('retry_count').notNull().default(0),
    lastError: jsonb('last_error'),
    errorCategory: varchar('error_category', { length: 100 }),
    
    provenance: jsonb('provenance'),
}, (table) => ({
    siteIdIdx: index('idx_ingestion_site').on(table.siteId),
    sourceDedupeIdx: index('idx_ingestion_dedupe').on(table.connectorId, table.sourceEventId),
    statusIdx: index('idx_ingestion_status').on(table.processingStatus),
    correlationIdx: index('idx_ingestion_correlation').on(table.correlationId),
}));

export const qualityGateResults = pgTable('quality_gate_results', {
    id: serial('id').primaryKey(),
    eventId: varchar('event_id', { length: 36 }).notNull(),
    ruleName: varchar('rule_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // PASS, FAIL, WARN
    message: varchar('message', { length: 1024 }),
    fieldPath: varchar('field_path', { length: 255 }),
    severity: varchar('severity', { length: 20 }).notNull(), // CRITICAL, HIGH, LOW
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
    eventIdx: index('idx_qg_event').on(table.eventId),
}));

export const systemHealthMetrics = pgTable('system_health_metrics', {
    id: serial('id').primaryKey(),
    metricName: varchar('metric_name', { length: 255 }).notNull(),
    metricValue: integer('metric_value').notNull(),
    labels: jsonb('labels').notNull().default('{}'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
    metricNameTimestampIdx: index('idx_health_name_ts').on(table.metricName, table.timestamp),
}));

export const processingCheckpoints = pgTable('processing_checkpoints', {
    id: serial('id').primaryKey(),
    partitionKey: varchar('partition_key', { length: 255 }).notNull(),
    checkpointValue: varchar('checkpoint_value', { length: 255 }).notNull(),
    metadata: jsonb('metadata').notNull().default('{}'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    partitionIdx: index('idx_checkpoint_partition').on(table.partitionKey),
}));

// -- INTEGRATIONS LAYER: Connector Lifecycle & Health --

export const connectorInstances = pgTable('connector_instances', {
    id: serial('id').primaryKey(),
    connectorId: varchar('connector_id', { length: 36 }).notNull(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    providerName: varchar('provider_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    environment: varchar('environment', { length: 50 }).notNull().default('production'),
    version: varchar('version', { length: 50 }).default('1.0.0'),
    enabled: varchar('enabled', { length: 10 }).default('true'),
    
    // Auth & Config
    authConfig: jsonb('auth_config').notNull().default('{}'),
    syncConfig: jsonb('sync_config').notNull().default('{}'),
    mappingRules: jsonb('mapping_rules').notNull().default('{}'),
    
    // State Tracking
    lifecycleState: varchar('lifecycle_state', { length: 50 }).notNull().default('DRAFT'),
    healthStatus: varchar('health_status', { length: 50 }).notNull().default('HEALTHY'),
    
    // Timestamps
    lastSyncAt: timestamp('last_sync_at'),
    lastAttemptAt: timestamp('last_attempt_at'),
    lastWebhookAt: timestamp('last_webhook_at'),
    lastError: jsonb('last_error'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    siteIdIdx: index('idx_connector_site').on(table.siteId),
    connectorIdIdx: index('idx_connector_id').on(table.connectorId),
}));

export const connectorSyncRuns = pgTable('connector_sync_runs', {
    id: serial('id').primaryKey(),
    connectorId: varchar('connector_id', { length: 36 }).notNull(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    syncType: varchar('sync_type', { length: 50 }).notNull(), // POLL, WEBHOOK, BACKFILL
    status: varchar('status', { length: 50 }).notNull(), // SUCCESS, FAILED, PARTIAL
    
    startedAt: timestamp('started_at').notNull(),
    finishedAt: timestamp('finished_at'),
    
    recordsFetched: integer('records_fetched').default(0),
    recordsProcessed: integer('records_processed').default(0),
    recordsRejected: integer('records_rejected').default(0),
    
    checkpointValue: varchar('checkpoint_value', { length: 255 }),
    errorSummary: jsonb('error_summary'),
}, (table) => ({
    connectorSyncIdx: index('idx_sync_run_connector').on(table.connectorId),
}));

export const connectorHealthSnapshots = pgTable('connector_health_snapshots', {
    id: serial('id').primaryKey(),
    connectorId: varchar('connector_id', { length: 36 }).notNull(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    
    overallStatus: varchar('overall_status', { length: 50 }).notNull(),
    dimensions: jsonb('dimensions').notNull(), // ConnectorHealthDimensions
    
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
    connectorHealthIdx: index('idx_health_snap_connector').on(table.connectorId),
}));

// -- PERFORMANCE ANALYTICS: High-Fidelity Intelligence (Part 1 & 2) --

export const performanceMetrics = pgTable('performance_metrics', {
    id: serial('id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    environment: varchar('environment', { length: 50 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(), // RUM, SYSTEM, API
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    metricValue: numeric('metric_value').notNull(),
    unit: varchar('unit', { length: 20 }).notNull(),
    
    // Dimensions (Requirement 7)
    region: varchar('region', { length: 100 }),
    device: varchar('device', { length: 100 }),
    browser: varchar('browser', { length: 100 }),
    route: varchar('route', { length: 255 }),
    releaseVersion: varchar('release_version', { length: 100 }),
    
    timestamp: timestamp('timestamp').notNull(),
    ingestionTimestamp: timestamp('ingestion_timestamp').defaultNow().notNull(),
    traceId: varchar('trace_id', { length: 255 }),
    correlationId: varchar('correlation_id', { length: 255 }),
}, (table) => ({
    siteMetricIdx: index('idx_perf_site_metric').on(table.siteId, table.metricName),
    timestampIdx: index('idx_perf_timestamp').on(table.timestamp),
}));

export const performanceRollups = pgTable('performance_rollups', {
    id: serial('id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    metricName: varchar('metric_name', { length: 100 }).notNull(),
    bucketSize: varchar('bucket_size', { length: 20 }).notNull(), // 1m, 5m, 1h, 1d
    timestamp: timestamp('timestamp').notNull(),
    
    // Aggregates (Requirement 4 & 5)
    count: integer('count').notNull(),
    min: numeric('min'),
    max: numeric('max'),
    p50: numeric('p50'),
    p75: numeric('p75'),
    p90: numeric('p90'),
    p95: numeric('p95'),
    p99: numeric('p99'),
    
    dimensions: jsonb('dimensions').notNull().default('{}'),
}, (table) => ({
    rollupIdx: index('idx_perf_rollup').on(table.siteId, table.metricName, table.bucketSize, table.timestamp),
}));

// -- CUSTOMER INTELLIGENCE: Identity & Behavior Layer (Part 1, 2, 3) --

export const customerProfiles = pgTable('customer_profiles', {
    id: varchar('id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 255 }),
    
    // Identity (Requirement 1)
    externalIds: jsonb('external_ids').notNull().default('{}'),
    emailHash: varchar('email_hash', { length: 255 }),
    phoneHash: varchar('phone_hash', { length: 255 }),
    
    // Lifecycle & Scoring (Requirement 14 & 15)
    lifecycleState: varchar('lifecycle_state', { length: 50 }).notNull().default('NEW_VISITOR'),
    identityConfidence: numeric('identity_confidence').default('1.0'),
    
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
    
    metadata: jsonb('metadata'),
}, (table) => ({
    siteIdIdx: index('idx_cust_profile_site').on(table.siteId),
    emailHashIdx: index('idx_cust_profile_email').on(table.emailHash),
}));

export const identityLinks = pgTable('identity_links', {
    id: serial('id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    primaryCustomerId: varchar('primary_customer_id', { length: 36 }).notNull(),
    secondaryCustomerId: varchar('secondary_customer_id', { length: 36 }).notNull(),
    linkType: varchar('link_type', { length: 50 }).notNull(), // SOFT, STRONG
    confidence: numeric('confidence').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customerSessions = pgTable('customer_sessions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    customerId: varchar('customer_id', { length: 36 }).notNull(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    durationSeconds: integer('duration_seconds'),
    
    // Context (Requirement 7)
    device: varchar('device', { length: 100 }),
    browser: varchar('browser', { length: 100 }),
    trafficSource: varchar('traffic_source', { length: 255 }),
    
    isConverted: integer('is_converted').default(0),
    eventCount: integer('event_count').default(0),
}, (table) => ({
    customerIdx: index('idx_session_customer').on(table.customerId),
    siteIdx: index('idx_session_site').on(table.siteId),
}));

export const customerEvents = pgTable('customer_events', {
    id: varchar('id', { length: 36 }).primaryKey(),
    customerId: varchar('customer_id', { length: 36 }).notNull(),
    sessionId: varchar('session_id', { length: 36 }),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    
    // Taxonomy (Requirement 4)
    eventName: varchar('event_name', { length: 255 }).notNull(),
    eventCategory: varchar('event_category', { length: 50 }).notNull(),
    
    timestamp: timestamp('timestamp').notNull(),
    
    // Attribution (Requirement 12)
    utmSource: varchar('utm_source', { length: 100 }),
    utmMedium: varchar('utm_medium', { length: 100 }),
    utmCampaign: varchar('utm_campaign', { length: 100 }),
    
    metadata: jsonb('metadata'),
}, (table) => ({
    sessionIdx: index('idx_event_session').on(table.sessionId),
    customerTimestampIdx: index('idx_event_cust_ts').on(table.customerId, table.timestamp),
}));

// -- OBSERVABILITY & ALERTING LAYER (Part 2, 3, 4) --

export const alerts = pgTable('alerts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(), // INFO, WARNING, CRITICAL
    status: varchar('status', { length: 50 }).notNull().default('TRIGGERED'),
    
    module: varchar('module', { length: 50 }).notNull(),
    alertType: varchar('alert_type', { length: 100 }).notNull(),
    message: varchar('message', { length: 1024 }).notNull(),
    
    context: jsonb('context').notNull().default('{}'),
    correlationId: varchar('correlation_id', { length: 255 }),
    
    triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
    acknowledgedAt: timestamp('acknowledged_at'),
    acknowledgedBy: varchar('acknowledged_by', { length: 255 }),
}, (table) => ({
    siteIdIdx: index('idx_alert_site').on(table.siteId),
    statusIdx: index('idx_alert_status').on(table.status),
}));

export const alertRules = pgTable('alert_rules', {
    id: varchar('id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 1024 }),
    severity: varchar('severity', { length: 20 }).notNull(),
    enabled: varchar('enabled', { length: 10 }).default('true'),
    
    criteria: jsonb('criteria').notNull(),
    cooldownMinutes: integer('cooldown_minutes').default(60),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    siteRuleIdx: index('idx_alert_rule_site').on(table.siteId),
}));

export const systemLogs = pgTable('system_logs', {
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    level: varchar('level', { length: 20 }).notNull(),
    module: varchar('module', { length: 100 }).notNull(),
    message: varchar('message', { length: 2048 }).notNull(),
    siteId: varchar('site_id', { length: 255 }),
    correlationId: varchar('correlation_id', { length: 255 }),
    metadata: jsonb('metadata').notNull().default('{}'),
}, (table) => ({
    siteIdTimestampIdx: index('idx_log_site_ts').on(table.siteId, table.timestamp),
    correlationIdx: index('idx_log_correlation').on(table.correlationId),
}));

// -- RECOVERY & REPLAY LAYER (Part 1, 2, 3) --

export const recoveryJobs = pgTable('recovery_jobs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    jobType: varchar('job_type', { length: 50 }).notNull(), // REPLAY_RAW, BACKFILL, etc.
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    
    // Scoping (Requirement 3)
    scope: jsonb('scope').notNull(),
    
    // Stats (Requirement 5)
    totalRecords: integer('total_records').default(0),
    processedRecords: integer('processed_records').default(0),
    failedRecords: integer('failed_records').default(0),
    
    // Control (Requirement 20)
    config: jsonb('config').notNull().default('{}'),
    
    triggeredBy: varchar('triggered_by', { length: 255 }).notNull(),
    reason: varchar('reason', { length: 1024 }),
    
    startedAt: timestamp('started_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    finishedAt: timestamp('finished_at'),
    
    lastError: jsonb('last_error'),
}, (table) => ({
    siteJobIdx: index('idx_recovery_site').on(table.siteId),
    statusIdx: index('idx_recovery_status').on(table.status),
}));







