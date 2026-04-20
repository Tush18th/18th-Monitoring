'use client';

import React from 'react';
import { PageLayout, Typography, Card, Badge, OperationalTable } from '@kpi-platform/ui';
import { ShieldCheck, Calendar, User, Info } from 'lucide-react';

// Mock data for the audit log
const auditData = [
  { id: 1, event: 'Sync Triggered', actor: 'System (Auto)', module: 'Integrations', timestamp: '2024-04-20 10:00:23', status: 'success' },
  { id: 2, event: 'API Key Rotated', actor: 'admin@18thdigitech.com', module: 'Security', timestamp: '2024-04-20 09:15:00', status: 'info' },
  { id: 3, event: 'Threshold Changed', actor: 'j.doe@operator.com', module: 'Alerting', timestamp: '2024-04-20 08:45:12', status: 'warning' },
  { id: 4, event: 'Order Re-sync', actor: 'System (Retry)', module: 'Orders', timestamp: '2024-04-20 08:30:00', status: 'success' },
];

export default function AuditPage() {
  const columns = [
    { key: 'timestamp', header: 'Timestamp', width: '200px' },
    { 
      key: 'event', 
      header: 'Event', 
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <Info size={14} className="text-text-muted" />
          <span className="font-medium">{val}</span>
        </div>
      )
    },
    { key: 'actor', header: 'Actor' },
    { key: 'module', header: 'Module' },
    { 
      key: 'status', 
      header: 'Level', 
      render: (val: string) => (
        <Badge variant={val as any} size="sm" dot>
          {val.toUpperCase()}
        </Badge>
      )
    }
  ];

  return (
    <PageLayout
      title="Audit & Activity"
      subtitle="Immutable record of all operational and system changes."
      icon={<ShieldCheck size={24} />}
    >
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-bottom border-subtle bg-muted flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Typography variant="h4" className="text-sm m-0">Recent Activity</Typography>
            <Badge variant="info" size="sm">24H Live</Badge>
          </div>
          <div className="flex gap-2">
            <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <Calendar size={12} />
              Export CSV
            </button>
          </div>
        </div>
        <OperationalTable 
          columns={columns} 
          data={auditData} 
          isDense
        />
      </Card>
    </PageLayout>
  );
}
