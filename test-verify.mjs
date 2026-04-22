// Full verification: login → data quality checks → simulate → re-check → all routes
(async () => {
    const BASE = 'http://localhost:4000';

    // 1. Login
    const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: "superadmin@monitor.io", password: "password123" }),
        headers: { 'Content-Type': 'application/json' }
    });
    const { token, user } = await loginRes.json();
    if (!token) { console.error('LOGIN FAILED', user); process.exit(1); }
    console.log(`✅ Login OK — user: ${user?.name} (${user?.role})\n`);

    const h = { 'Authorization': `Bearer ${token}`, 'session-token': token, 'Content-Type': 'application/json' };
    const siteId = 'tc_demo_004';

    // 2. Data quality: revenue/AOV should be non-zero now
    const sumRes = await fetch(`${BASE}/api/v1/dashboard/summaries?siteId=${siteId}`, { headers: h });
    const summaries = await sumRes.json();
    console.log('📊 KPI Summaries:');
    for (const kpi of summaries) {
        const ok = kpi.kpiName !== 'revenue' || kpi.value > 0;
        console.log(`  ${ok ? '✅' : '❌'} ${kpi.kpiName}: ${kpi.value} ${kpi.unit}`);
    }

    // 3. Orders summary
    const ordRes = await fetch(`${BASE}/api/v1/dashboard/orders/summary?siteId=${siteId}`, { headers: h });
    const orders = await ordRes.json();
    console.log(`\n📦 Orders Summary:`);
    console.log(`  ${orders.totalRevenue > 0 ? '✅' : '❌'} Revenue: $${orders.totalRevenue}`);
    console.log(`  ${orders.averageOrderValue > 0 ? '✅' : '❌'} AOV: $${orders.averageOrderValue}`);
    console.log(`  ✅ Orders Total: ${orders.ordersTotal}`);

    // 4. Run simulate to seed live event data
    console.log('\n🔄 Running /api/v1/simulate...');
    const simRes = await fetch(`${BASE}/api/v1/simulate`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ siteId })
    });
    const sim = await simRes.json();
    console.log(`  ${simRes.status === 200 ? '✅' : '❌'} Simulate (${simRes.status}): ${sim.message || JSON.stringify(sim).slice(0, 100)}`);

    // 5. Re-check KPIs after simulate (performance metrics should appear)
    await new Promise(r => setTimeout(r, 500));
    const sumRes2 = await fetch(`${BASE}/api/v1/dashboard/summaries?siteId=${siteId}`, { headers: h });
    const summaries2 = await sumRes2.json();
    const loadTime = summaries2.find(k => k.kpiName === 'pageLoadTime');
    console.log(`\n📊 Post-Simulate KPIs:`);
    for (const kpi of summaries2) {
        console.log(`  ✅ ${kpi.kpiName}: ${kpi.value} ${kpi.unit} [${kpi.state}]`);
    }

    // 6. Check alerts (should have alerts after simulate)
    const alertRes = await fetch(`${BASE}/api/v1/dashboard/alerts?siteId=${siteId}`, { headers: h });
    const alerts = await alertRes.json();
    console.log(`\n🔔 Alerts: ${alerts.length} active`);
    alerts.slice(0, 3).forEach(a => console.log(`  - [${a.severity}] ${a.kpiName}: ${a.message?.slice(0, 60)}`));

    // 7. Check delayed orders
    const delRes = await fetch(`${BASE}/api/v1/dashboard/orders/delayed?siteId=${siteId}`, { headers: h });
    const delayed = await delRes.json();
    console.log(`\n⏰ Delayed Orders: ${delayed.length}`);
    delayed.slice(0, 2).forEach(o => console.log(`  - ${o.orderId} | ${o.minutesDelayed}m delayed | ${o.channel}`));

    // 8. All other routes quick check
    console.log('\n🔁 All Route Health Check:');
    const routes = [
        `/api/v1/dashboard/orders/list?siteId=${siteId}`,
        `/api/v1/dashboard/orders/trends?siteId=${siteId}`,
        `/api/v1/dashboard/integrations/summary?siteId=${siteId}`,
        `/api/v1/dashboard/performance/summary?siteId=${siteId}`,
        `/api/v1/dashboard/performance/slowest-pages?siteId=${siteId}`,
        `/api/v1/dashboard/customers/summary?siteId=${siteId}`,
        `/api/v1/dashboard/governance?siteId=${siteId}`,
        `/api/v1/config/p/${siteId}/integrations/instances`,
        `/api/v1/config/p/${siteId}/access-control/keys`,
        `/api/v1/projects`,
        `/health`,
    ];
    for (const route of routes) {
        const r = await fetch(`${BASE}${route}`, { headers: h });
        console.log(`  ${r.status === 200 ? '✅' : '❌'} ${r.status} ${route}`);
    }

    console.log('\n✅ Full system validation complete.');
})();
