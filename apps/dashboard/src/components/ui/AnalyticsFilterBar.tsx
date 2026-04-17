'use client';
import React from 'react';
import { Card, Typography } from '@kpi-platform/ui';

export const AnalyticsFilterBar = () => {
  return (
    <>
      <Card className="analytic-filter-bar" style={{ padding: '12px 20px', marginBottom: '24px' }}>
        <div className="filter-group-wrap">
          <div className="filter-node">
            <Typography variant="caption" color="muted" weight="bold">TIMEFRAME</Typography>
            <select className="std-select">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range</option>
            </select>
          </div>
          
          <div className="filter-divider" />
          
          <div className="filter-node">
            <Typography variant="caption" color="muted" weight="bold">REGION</Typography>
            <select className="std-select">
              <option>Global Edge</option>
              <option>US-East-1</option>
              <option>EU-Central</option>
              <option>AP-South-1</option>
            </select>
          </div>
          
          <div className="filter-divider" />
          
          <div className="filter-node">
            <Typography variant="caption" color="muted" weight="bold">SYSTEM</Typography>
            <select className="std-select">
              <option>All Topologies</option>
              <option>Frontend Core</option>
              <option>Payment Gateway</option>
              <option>Authentication</option>
            </select>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .filter-group-wrap {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .filter-node {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-divider {
          width: 1px;
          height: 24px;
          background: var(--border-light);
        }

        .std-select {
          appearance: none;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 6px 32px 6px 12px;
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
          cursor: pointer;
          outline: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 10px auto;
          transition: all 0.2s ease;
        }

        .std-select:hover {
          border-color: var(--primary);
        }
        
        .std-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }
      `}</style>
    </>
  );
};
