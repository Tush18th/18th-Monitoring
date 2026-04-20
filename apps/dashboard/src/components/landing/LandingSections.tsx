'use client';

import React from 'react';
import { useTheme, Button, Card, Badge } from '@kpi-platform/ui';
import { Activity, ArrowRight, BellRing, Database, LayoutDashboard, ShieldCheck, ShoppingCart } from 'lucide-react';

const FEATURES = [
  {
    icon: <LayoutDashboard size={18} />,
    title: 'Unified command surface',
    description: 'Bring project health, alerts, integrations, performance, and orders into one operational workspace.',
  },
  {
    icon: <Activity size={18} />,
    title: 'Live telemetry',
    description: 'Track latency, browser performance, synthetic coverage, and user traffic without context switching.',
  },
  {
    icon: <Database size={18} />,
    title: 'Integration observability',
    description: 'Understand sync health, failed jobs, and recovery actions across your connected systems.',
  },
  {
    icon: <ShoppingCart size={18} />,
    title: 'Commerce visibility',
    description: 'See order flow, delays, and transaction issues as part of the same monitoring workflow.',
  },
  {
    icon: <BellRing size={18} />,
    title: 'Actionable incident response',
    description: 'Move from alerting into diagnostics and remediation with a consistent dashboard language.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Enterprise-ready access',
    description: 'Role-aware navigation and settings flows keep governance clean without slowing operators down.',
  },
];

export default function MonitoringLandingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <main className="landing-page">
        <section className="landing-hero">
          <div className="landing-shell">
            <div className="landing-hero__copy">
              <Badge className="landing-badge">Enterprise Monitoring Platform</Badge>
              <h1>Monitoring that feels operationally mature from the first screen.</h1>
              <p>
                Track performance, integrations, project governance, and commerce KPIs in a single platform designed for real teams, not prototypes.
              </p>
              <div className="landing-actions">
                <Button size="lg" onClick={() => (window.location.href = '/login')}>
                  Open workspace
                </Button>
                <Button size="lg" variant="outline" onClick={() => (window.location.href = '/projects')}>
                  View portfolio
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>

            <Card className="landing-preview" padding="lg">
              <img src="/hero-preview.png" alt="Platform preview" className="landing-preview__image" />
            </Card>
          </div>
        </section>

        <section className="landing-feature-band">
          <div className="landing-shell landing-feature-band__inner">
            <div>
              <span>99.9% operational visibility</span>
              <strong>Live dashboards, alerts, and telemetry</strong>
            </div>
            <div>
              <span>Multi-project coverage</span>
              <strong>Role-based access across every assigned workspace</strong>
            </div>
            <div>
              <span>One consistent system</span>
              <strong>Aligned cards, tables, forms, and detail pages</strong>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <Badge>Why teams use it</Badge>
              <h2>A cohesive SaaS monitoring experience across every route.</h2>
              <p>The platform now behaves like one product system, from login to deep project workflows.</p>
            </div>

            <div className="landing-grid">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="landing-feature-card" isHoverable>
                  <div className="landing-feature-card__icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-shell">
            <Card className="landing-cta__card" padding="lg">
              <Badge className="landing-badge">Ready to explore</Badge>
              <h2>Start with the same project shell your operators will actually use.</h2>
              <p>Jump into the portfolio dashboard, project overview, or settings and experience the stabilized UI system end to end.</p>
              <div className="landing-actions">
                <Button size="lg" onClick={() => (window.location.href = '/login')}>
                  Sign in
                </Button>
                <Button size="lg" variant="ghost" onClick={() => (window.location.href = '/projects')}>
                  Open projects
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .landing-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, ${isDark ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)'}, transparent 32%),
            radial-gradient(circle at bottom left, ${isDark ? 'rgba(14, 165, 233, 0.18)' : 'rgba(14, 165, 233, 0.09)'}, transparent 28%),
            linear-gradient(180deg, var(--bg-base), color-mix(in srgb, var(--bg-muted) 70%, var(--bg-base)));
        }

        .landing-shell {
          width: min(1280px, 100%);
          margin: 0 auto;
          padding: 0 clamp(1rem, 4vw, 2rem);
        }

        .landing-hero {
          padding: clamp(4rem, 9vw, 7rem) 0 3rem;
        }

        .landing-hero .landing-shell {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }

        .landing-hero__copy {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .landing-hero__copy h1 {
          margin: 0;
          font-size: clamp(2.7rem, 6vw, 4.8rem);
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .landing-hero__copy p {
          margin: 0;
          max-width: 62ch;
          font-size: 1.06rem;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        .landing-badge {
          width: fit-content;
        }

        .landing-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          align-items: center;
        }

        .landing-preview {
          border-radius: 30px !important;
          overflow: hidden;
        }

        .landing-preview__image {
          display: block;
          width: 100%;
          border-radius: 22px;
        }

        .landing-feature-band {
          padding: 1.25rem 0;
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          background: color-mix(in srgb, var(--bg-muted) 72%, var(--bg-surface));
        }

        .landing-feature-band__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .landing-feature-band__inner div {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.75rem 0;
        }

        .landing-feature-band__inner span {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
        }

        .landing-feature-band__inner strong {
          color: var(--text-primary);
          line-height: 1.4;
        }

        .landing-features {
          padding: clamp(3rem, 7vw, 5rem) 0;
        }

        .landing-section-heading {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          max-width: 720px;
          margin-bottom: 2rem;
        }

        .landing-section-heading h2,
        .landing-cta__card h2 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.04;
          letter-spacing: -0.05em;
        }

        .landing-section-heading p,
        .landing-cta__card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .landing-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
        }

        .landing-feature-card {
          min-height: 220px;
          border-radius: 24px !important;
        }

        .landing-feature-card__icon {
          width: 2.8rem;
          height: 2.8rem;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: var(--primary);
          background: color-mix(in srgb, var(--primary) 12%, var(--bg-surface));
        }

        .landing-feature-card h3 {
          margin: 0 0 0.6rem;
          font-size: 1.08rem;
          line-height: 1.3;
        }

        .landing-feature-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .landing-cta {
          padding: 0 0 clamp(3rem, 7vw, 5rem);
        }

        .landing-cta__card {
          border-radius: 30px !important;
          background: ${isDark ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 1))' : 'linear-gradient(180deg, #ffffff, #f8fbff)'} !important;
        }

        @media (max-width: 1024px) {
          .landing-hero .landing-shell,
          .landing-grid,
          .landing-feature-band__inner {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
