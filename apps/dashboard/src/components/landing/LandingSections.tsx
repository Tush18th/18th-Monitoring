'use client';

import React, { useMemo, useState } from 'react';
import { Button, Card, Badge } from '@kpi-platform/ui';
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Database,
  LayoutDashboard,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type NavItem = {
  label: string;
  href: string;
};

type FeatureItem = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

/* -------------------------------------------------------------------------- */
/*                                  Content                                   */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: NavItem[] = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Demo', href: '#demo' },
];

const TRUST_LOGOS = [
  'https://www.18thdigitech.com/images/clients/logo-36.jpg',
  'https://www.18thdigitech.com/images/clients/logo-33.jpg',
  'https://www.18thdigitech.com/images/clients/logo-34.jpg',
  'https://www.18thdigitech.com/images/clients/logo-5.jpg',
  'https://www.18thdigitech.com/images/clients/logo-6.jpg',
  'https://www.18thdigitech.com/images/clients/logo-1.jpg',
];

const VALUE_POINTS = [
  'Unified Monitoring Platform',
  'Enterprise-Grade Scalability',
  'Real-Time Data Visibility',
  'Seamless System Integrations',
  'Role-Based Access Control',
];

const PRIMARY_FEATURES: FeatureItem[] = [
  {
    icon: Activity,
    title: 'Real-time performance monitoring',
    description: 'Track frontend and backend performance metrics across your entire stack. Identify bottlenecks before they impact users.',
  },
  {
    icon: Database,
    title: 'Integration health tracking',
    description: 'Monitor APIs, ERPs, CRMs, and third-party services. Detect failures, latency spikes, and sync issues instantly.',
  },
  {
    icon: ShoppingCart,
    title: 'Transaction and order monitoring',
    description: 'Track complete order lifecycle from checkout to fulfillment. Identify drop-offs, failures, and inconsistencies.',
  },
];

const SECONDARY_FEATURES: FeatureItem[] = [
  {
    icon: Users,
    title: 'User activity tracking',
    description: 'Understand user behavior across sessions and journeys to identify friction points.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tenant security and RBAC',
    description: 'Manage access across teams and projects with granular role-based permissions.',
  },
  {
    icon: LayoutDashboard,
    title: 'Centralized analytics dashboard',
    description: 'Combine performance, integrations, and business metrics in one unified interface.',
  },
  {
    icon: ShieldAlert,
    title: 'Alerting and incident visibility',
    description: 'Get real-time alerts with actionable insights to resolve issues faster.',
  },
  {
    icon: CheckCircle,
    title: 'Operational confidence at scale',
    description: 'Ensure system stability even during peak traffic and high-load conditions.',
  },
];

const INTEGRATIONS = [
  {
    category: 'E-commerce Platforms',
    items: ['Magento', 'Shopify', 'Custom Storefronts'],
  },
  {
    category: 'ERP & Backend Systems',
    items: ['SAP', 'Oracle', 'Custom ERPs'],
  },
  {
    category: 'Payment Gateways',
    items: ['Razorpay', 'Stripe', 'PayPal'],
  },
  {
    category: 'Shipping & Logistics',
    items: ['Shiprocket', 'Delhivery', 'Custom integrations'],
  },
];

const FAQS: FaqItem[] = [
  {
    question: 'What does 18th Monitoring track?',
    answer: 'It tracks system performance, API integration health, order and transaction flows, and user activity across your digital ecosystem in real time.',
  },
  {
    question: 'How long does integration take?',
    answer: 'Most systems can be connected within minutes using APIs or pre-built integrations.',
  },
  {
    question: 'Can it integrate with Magento or Shopify?',
    answer: 'Yes, the platform supports major e-commerce platforms along with custom integrations.',
  },
  {
    question: 'What happens during system downtime?',
    answer: 'The system logs failures, captures metrics, and alerts teams immediately for faster resolution.',
  },
  {
    question: 'Is it suitable for enterprise-scale systems?',
    answer: 'Yes, it is designed to handle high-traffic environments with multi-tenant architecture and RBAC.',
  },
];

/* -------------------------------------------------------------------------- */
/*                               Helper Components                            */
/* -------------------------------------------------------------------------- */

function Container({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('lp-container', className)}>{children}</div>;
}

function SectionHeading({
  badge,
  title,
  description,
  align = 'center',
}: {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={clsx('section-heading', align === 'left' && 'section-heading--left')}>
      {badge ? <Badge className="section-badge">{badge}</Badge> : null}
      <h2 className="section-title">{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

function PrimaryActions() {
  return (
    <div className="hero-actions">
      <Button size="lg" className="btn-primary" onClick={() => (window.location.href = '/login')}>
        Login
      </Button>
      <Button
        size="lg"
        variant="ghost"
        className="btn-secondary"
        onClick={() => (window.location.href = '/project/Tushars_Creation/overview')}
      >
        View Demo
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const Icon = feature.icon || CheckCircle;

  return (
    <Card className="feature-card">
      <div className="feature-icon-wrap">
        <Icon size={22} className="feature-icon" />
      </div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-description">{feature.description}</p>
    </Card>
  );
}

function FAQItemRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className={clsx('faq-item', isOpen && 'faq-item--open')} onClick={onToggle}>
      <span className="faq-question-row">
        <span className="faq-question">{item.question}</span>
        <ChevronDown size={18} className="faq-chevron" />
      </span>
      <span className="faq-answer-wrap">
        <span className="faq-answer">{item.answer}</span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Sections                                  */
/* -------------------------------------------------------------------------- */

function LandingHeader() {
  return (
    <header className="landing-header">
      <Container className="landing-header__inner">
        <a href="/" className="brand-mark" aria-label="18th Monitoring home">
          <img src="https://www.18thdigitech.com/images/logo.svg" alt="18th Digitech" className="brand-logo" />
          <span className="brand-divider" />
          <span className="brand-text">18th Monitoring</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href={item.href} className="nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a href="/login" className="login-link">
            Login
          </a>
          <Button size="sm" className="btn-primary" onClick={() => (window.location.href = '/project/Tushars_Creation/overview')}>
            Get Started Free
          </Button>
        </div>
      </Container>
    </header>
  );
}

function HeroSection() {
  return (
    <section id="top" className="hero-section">
      <Container>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">
              Monitor performance, integrations, and revenue impact — <span className="gradient-text">in real time</span>
            </h1>
            <p className="hero-subtitle">
              Gain complete visibility into your digital ecosystem. Track API health, order flows, system performance, and user activity from a single unified dashboard.
            </p>
            <p className="hero-description hero-audience" style={{ marginBottom: '32px' }}>
              Built for engineering, DevOps, and e-commerce teams managing high-scale systems.
            </p>
            
            <div className="hero-actions">
              <Button size="lg" className="btn-primary" onClick={() => (window.location.href = '/login')}>
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="btn-secondary"
                onClick={() => (window.location.href = '/project/Tushars_Creation/overview')}
              >
                View Demo
                <ArrowRight size={20} />
              </Button>
            </div>

            <div className="hero-metrics">
              <div className="metric-pill">
                <span className="metric-label">Uptime</span>
                <strong>99.9% visibility</strong>
              </div>
              <div className="metric-pill">
                <span className="metric-label">Coverage</span>
                <strong>Orders, APIs, Infra</strong>
              </div>
              <div className="metric-pill">
                <span className="metric-label">Access</span>
                <strong>Multi-tenant RBAC</strong>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-preview-shell">
              <div className="hero-glow hero-glow--one" />
              <div className="hero-glow hero-glow--two" />
              
              <div className="hero-visual-container" style={{ position: 'relative' }}>
                <img src="/hero-preview.png" alt="18th Monitoring dashboard preview" className="hero-image" />
                
                {/* CSS Overlays / Annotations */}
                <div className="annotation annotation--api" style={{ position: 'absolute', top: '25%', left: '15%', zIndex: 10 }}>
                   <div className="annotation-dot" />
                   <div className="annotation-label">API Latency</div>
                </div>
                <div className="annotation annotation--error" style={{ position: 'absolute', top: '15%', right: '15%', zIndex: 10 }}>
                   <div className="annotation-dot" />
                   <div className="annotation-label">Error Rate</div>
                </div>
                <div className="annotation annotation--throughput" style={{ position: 'absolute', bottom: '25%', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                   <div className="annotation-dot" />
                   <div className="annotation-label">Order Throughput</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="trust" className="trust-section">
      <Container>
        <div className="trust-inner">
          <div className="section-heading section-heading--center">
            <h2 className="trust-title">Trusted by teams managing high-scale digital systems</h2>
            <p className="trust-subtext">From fast-growing e-commerce brands to enterprise platforms, teams rely on 18th Monitoring to maintain performance and reliability.</p>
          </div>
          
          <div className="trust-metrics">
            <div className="trust-metric-card">
              <span className="metric-value">50+</span>
              <span className="metric-desc">Active systems monitored</span>
            </div>
            <div className="trust-metric-card">
              <span className="metric-value">Millions</span>
              <span className="metric-desc">Events processed daily</span>
            </div>
          </div>

          <div className="trust-logos">
            <div className="trust-header">Industry Leaders</div>
            <div className="trust-grid">
              {TRUST_LOGOS.map((logo, index) => (
                <div key={index} className="trust-card">
                  <img src={logo} alt="Client logo" className="trust-image" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ValueStripSection() {
  return (
    <section className="value-strip">
      <Container>
        <div className="value-strip__inner">
          {VALUE_POINTS.map((item) => (
            <div key={item} className="value-pill">
              <CheckCircle size={16} className="value-pill__icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section id="demo" className="demo-section">
      <Container>
        <div className="demo-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', gap: '64px', alignItems: 'center' }}>
          <div className="demo-copy">
            <SectionHeading
              align="left"
              badge="Platform walkthrough"
              title="See 18th Monitoring in action"
              description="Explore how your systems, integrations, and performance metrics come together in a single real-time dashboard."
            />
            
            <div className="demo-features" style={{ marginTop: '32px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>What you can monitor:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#2563eb' }} />
                  <span>Real-time API and system performance</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#2563eb' }} />
                  <span>Integration health across platforms</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#2563eb' }} />
                  <span>Order and transaction flow</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#2563eb' }} />
                  <span>Alerting and incident logs</span>
                </li>
              </ul>
              
              <p style={{ marginTop: '24px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Get complete visibility without switching between tools.
              </p>
            </div>
          </div>

          <div className="demo-visual-wrap">
            <button
              type="button"
              className="demo-preview"
              onClick={() => (window.location.href = '/project/Tushars_Creation/overview')}
              aria-label="Open demo"
              style={{ position: 'relative', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.3)' }}
            >
              <img src="/hero-preview.png" alt="Monitoring product preview" className="demo-image" style={{ width: '100%', display: 'block' }} />
              <span className="demo-overlay" />
              <span className="demo-play">
                <PlayCircle size={64} />
              </span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function IntegrationsSection() {
  return (
    <section id="integrations" className="integrations-section">
      <Container>
        <SectionHeading
          badge="Ecosystem"
          title="Works with your existing ecosystem"
          description="Easily connect your commerce stack, backend systems, and third-party services without complex setup."
        />

        <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '48px' }}>
          {INTEGRATIONS.map((cat) => (
            <Card key={cat.category} className="integration-cat-card" style={{ padding: '24px' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px', color: '#2563eb' }}>{cat.category}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
                {cat.items.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Button variant="outline" size="lg">View All Integrations</Button>
        </div>
      </Container>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <Container>
        <SectionHeading
          badge="Product Features"
          title="Everything you need to monitor and optimize your systems"
          description="Built to help engineering and operations teams stay ahead of issues, reduce downtime, and improve system performance."
        />

        <div className="features-primary">
          <h3 className="features-group-title">Core Capabilities</h3>
          <div className="feature-grid feature-grid--primary">
            {PRIMARY_FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>

        <div className="features-secondary">
          <h3 className="features-group-title">Additional Features</h3>
          <div className="feature-grid feature-grid--secondary">
            {SECONDARY_FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function CTASection() {
  return (
    <section className="cta-section">
      <Container>
        <div className="cta-panel">
          <div>
            <h2 className="cta-title">Start monitoring your systems in minutes</h2>
            <p className="cta-eyebrow" style={{ marginTop: '12px', fontSize: '1.1rem', opacity: 0.9 }}>No complex setup. Seamlessly integrates with your existing tools and infrastructure.</p>
          </div>
          <div className="cta-actions">
            <Button size="lg" className="btn-primary" onClick={() => (window.location.href = '/login')}>
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="btn-secondary"
              onClick={() => (window.location.href = '/project/Tushars_Creation/overview')}
            >
              Book Demo
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" className="faq-section">
      <Container className="faq-container">
        <SectionHeading badge="Support and clarity" title="Frequently asked questions" />
        <div className="faq-list">
          {FAQS.map((item, index) => (
            <FAQItemRow
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand-mark footer-brand-mark">
              <img src="https://www.18thdigitech.com/images/logo.svg" alt="18th Digitech" className="brand-logo" />
              <span className="brand-divider" />
              <span className="brand-text">18th Monitoring</span>
            </div>
            <p className="footer-copy">
              A next-generation monitoring platform built for performance, security, and scale across complex digital ecosystems.
            </p>
          </div>

          <div>
            <h3 className="footer-title">Product</h3>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#integrations">Integrations</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#demo">Demo</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li><a href="https://www.18thdigitech.com/" target="_blank" rel="noreferrer">About</a></li>
              <li><a href="https://www.18thdigitech.com/" target="_blank" rel="noreferrer">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-links">
              <li><a href="#">API Documentation</a></li>
              <li><a href="#">System Status</a></li>
              <li><a href="#">Security</a></li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 18th Digitech. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export default function MonitoringLandingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      <LandingHeader />
      <main className="landing-page transition-colors duration-500">
        <HeroSection />
        <TrustSection />
        <ValueStripSection />
        <DashboardPreviewSection />
        <FeaturesSection />
        <IntegrationsSection />
        <CTASection />
        <FAQSection />
      </main>
      <LandingFooter />

      <style jsx global>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        :global(body) {
          background-color: var(--bg-base);
          color: var(--text-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: background-color 0.5s ease, color 0.5s ease;
        }

        .landing-page {
          overflow-x: hidden;
        }

        .lp-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
        }

        /* --- Header --- */
        .landing-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          transition: all 0.3s ease;
        }

        .landing-header__inner {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-logo {
          height: 28px;
          filter: ${isDark ? 'brightness(0) invert(1)' : 'none'};
          transition: filter 0.3s ease;
        }

        .brand-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
        }

        .brand-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .desktop-nav {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .login-link {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: none;
        }

        /* --- Hero --- */
        .hero-section {
          padding: 120px 0 80px;
          background: radial-gradient(circle at 50% -20%, ${isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.04)'}, transparent 40%);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.25rem);
          line-height: 1.1;
          letter-spacing: -0.04em;
          font-weight: 800;
          margin-bottom: 24px;
          color: var(--text-primary);
        }

        .gradient-text {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .hero-audience {
          font-size: 1rem;
          color: var(--text-muted);
          padding-left: 16px;
          border-left: 2px solid var(--border-subtle);
          margin-bottom: 40px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 56px;
        }

        .metric-pill {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          padding: 16px;
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
        }

        .metric-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 4px;
          font-weight: 700;
        }

        /* --- Annotations --- */
        .hero-preview-shell {
          border-radius: 32px;
          padding: 16px;
          background: ${isDark ? '#0f172a' : '#ffffff'};
          box-shadow: ${isDark ? '0 40px 80px -20px rgba(0, 0, 0, 0.4)' : '0 40px 80px -20px rgba(0, 0, 0, 0.1)'};
          transform: perspective(1000px) rotateX(4deg) rotateY(-4deg);
          transition: transform 0.6s cubic-bezier(0.2, 0, 0.2, 1);
          border: 1px solid var(--border-subtle);
        }

        .hero-preview-shell:hover {
          transform: perspective(1000px) rotateX(0) rotateY(0);
        }

        .annotation {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)'};
          backdrop-filter: blur(8px);
          border-radius: 100px;
          box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.25);
          font-size: 13px;
          font-weight: 700;
          color: ${isDark ? '#0f172a' : '#ffffff'};
          white-space: nowrap;
          animation: float 4s ease-in-out infinite;
        }

        .annotation-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563eb;
          box-shadow: 0 0 12px rgba(37, 99, 235, 0.6);
        }

        .annotation--error .annotation-dot {
          background: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }

        .annotation--throughput {
           animation-delay: -2s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, -12px); }
        }

        .hero-image,
        .demo-image {
          position: relative;
          width: 100%;
          display: block;
          border-radius: 20px;
          z-index: 1;
        }

        /* --- Trust Section --- */
        .trust-section {
          padding: 100px 0;
          border-top: 1px solid var(--border-subtle);
        }

        .trust-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .trust-subtext {
          font-size: 1.125rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 56px;
        }

        .trust-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          max-width: 600px;
          margin: 0 auto 80px;
          gap: 40px;
        }

        .trust-metric-card {
           text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--primary);
          line-height: 1;
        }

        .metric-desc {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 12px;
        }

        .trust-header {
           font-size: 12px;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 0.1em;
           color: var(--text-muted);
           margin-bottom: 32px;
           text-align: center;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 24px;
        }

        .trust-card {
           height: 80px;
           display: flex;
           align-items: center;
           justify-content: center;
           background: var(--bg-muted);
           border-radius: 16px;
           padding: 16px;
           transition: all 0.3s ease;
        }

        .trust-card:hover {
           background: ${isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff'};
           transform: translateY(-2px);
        }

        .trust-image {
          max-width: 100%;
          max-height: 32px;
          filter: grayscale(1);
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .trust-card:hover .trust-image {
          filter: grayscale(0);
          opacity: 1;
        }

        /* --- Value Strip --- */
        .value-strip {
          padding: 24px 0;
          background: var(--bg-muted);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .value-strip__inner {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 32px;
        }

        .value-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .value-pill__icon {
          color: var(--success);
        }

        /* --- Features --- */
        .features-section {
          padding: 120px 0;
          background: var(--bg-muted);
        }

        .features-group-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--primary);
          margin: 64px 0 32px;
        }

        .feature-grid {
          display: grid;
          gap: 32px;
        }

        .feature-grid--primary {
          grid-template-columns: repeat(3, 1fr);
        }

        .feature-grid--secondary {
          grid-template-columns: repeat(2, 1fr);
        }

        :global(.feature-card) {
          background: var(--bg-surface) !important;
          border: 1px solid var(--border-subtle) !important;
          padding: 40px !important;
          border-radius: 24px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        :global(.feature-card:hover) {
          border-color: var(--primary) !important;
          box-shadow: var(--shadow-lg) !important;
          transform: translateY(-6px);
        }

        .feature-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff'};
          margin-bottom: 24px;
          color: var(--primary);
        }

        .feature-title {
           font-size: 20px;
           font-weight: 700;
           margin-bottom: 12px;
           color: var(--text-primary);
        }

        .feature-description {
           font-size: 15px;
           color: var(--text-secondary);
           line-height: 1.6;
        }

        /* --- Integrations --- */
        .integrations-section {
           padding: 120px 0;
           background: var(--bg-base);
        }

        :global(.integration-cat-card) {
           border: 1px solid var(--border-subtle) !important;
           background: var(--bg-surface) !important;
           border-radius: 20px !important;
           transition: all 0.3s ease !important;
        }

        :global(.integration-cat-card:hover) {
           border-color: var(--primary) !important;
           transform: translateY(-4px);
        }

        /* --- Demo --- */
        .demo-section {
          padding: 120px 0;
          background: var(--bg-surface);
        }

        .demo-visual-wrap {
          position: relative;
        }

        .demo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.1);
          transition: background 0.3s ease;
        }

        .demo-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4));
        }

        /* --- CTA --- */
        .cta-section {
          padding: 120px 0;
          background: var(--bg-base);
        }

        .cta-panel {
          padding: 100px 64px;
          border-radius: 40px;
          background: ${isDark ? 'var(--bg-surface)' : '#0f172a'};
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }

        .cta-panel::before {
           content: '';
           position: absolute;
           top: -50%;
           left: -50%;
           width: 200%;
           height: 200%;
           background: radial-gradient(circle, rgba(37, 99, 235, 0.08), transparent 70%);
           pointer-events: none;
        }

        .cta-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
          position: relative;
        }

        .cta-eyebrow {
          position: relative;
          color: #94a3b8;
        }

        .cta-actions {
          margin-top: 48px;
          display: flex;
          gap: 16px;
          justify-content: center;
          position: relative;
        }

        /* --- FAQ --- */
        .faq-section {
          padding: 120px 0;
          background: var(--bg-muted);
        }

        .faq-container {
           max-width: 800px;
           margin: 0 auto;
        }

        .faq-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          margin-bottom: 16px;
          transition: all 0.3s ease;
          color: var(--text-primary);
        }

        .faq-item:hover {
           border-color: var(--primary);
        }

        .faq-question {
          color: var(--text-primary);
        }

        .faq-answer {
          color: var(--text-secondary);
        }

        .faq-chevron {
          color: var(--text-muted);
        }

        /* --- Footer --- */
        .landing-footer {
          padding: 100px 0 60px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1fr 1fr 1.2fr;
          gap: 64px;
          margin-bottom: 80px;
        }

        .footer-copy {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 320px;
          margin-top: 24px;
        }

        .footer-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 28px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .footer-links a {
          font-size: 15px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--primary);
        }

        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid var(--border-subtle);
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* --- Responsive --- */
        @media (max-width: 1200px) {
           .footer-grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
        }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 64px; text-align: center; }
          .hero-audience { border-left: 0; padding-left: 0; margin: 0 auto 40px; max-width: 500px; }
          .hero-actions { justify-content: center; }
          .hero-metrics { grid-template-columns: repeat(3, 1fr); }
          .hero-preview-shell { transform: none !important; }
          .demo-grid { grid-template-columns: 1fr !important; gap: 48px; }
          .feature-grid--primary, .feature-grid--secondary { grid-template-columns: 1fr; }
          .trust-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 640px) {
          .lp-container { padding: 0 24px; }
          .hero-title { font-size: 2.75rem; }
          .hero-metrics { grid-template-columns: 1fr; }
          .trust-metrics { grid-template-columns: 1fr; gap: 32px; }
          .cta-panel { padding: 64px 24px; }
          .cta-title { font-size: 2.75rem; }
          .cta-actions { flex-direction: column; width: 100%; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  );
}
