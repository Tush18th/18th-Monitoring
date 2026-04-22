// Extended API audit — tests all major dashboard routes
(async () => {
    const login = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: "superadmin@monitor.io", password: "password123" }),
        headers: { 'Content-Type': 'application/json' }
    });
    const { token } = await login.json();

    const h = { 'Authorization': `Bearer ${token}`, 'session-token': token };
    const siteId = 'tc_demo_004';
    
    const routes = [
        `/api/v1/dashboard/orders/list?siteId=${siteId}`,
        `/api/v1/dashboard/orders/delayed?siteId=${siteId}`,
        `/api/v1/dashboard/orders/trends?siteId=${siteId}`,
        `/api/v1/dashboard/integrations/summary?siteId=${siteId}`,
        `/api/v1/dashboard/integrations/failed?siteId=${siteId}`,
        `/api/v1/dashboard/performance/summary?siteId=${siteId}`,
        `/api/v1/dashboard/performance/slowest-pages?siteId=${siteId}`,
        `/api/v1/dashboard/customers/summary?siteId=${siteId}`,
        `/api/v1/dashboard/customers/analytics?siteId=${siteId}`,
        `/api/v1/dashboard/audit?siteId=${siteId}`,
        `/api/v1/dashboard/activity?siteId=${siteId}`,
        `/api/v1/dashboard/governance?siteId=${siteId}`,
        `/api/v1/config/p/${siteId}/integrations/instances`,
        `/api/v1/config/p/${siteId}/access-control/keys`,
        `/health`,
        `/ready`,
    ];

    for (const route of routes) {
        try {
            const res = await fetch(`http://localhost:4000${route}`, { headers: h });
            const body = await res.text();
            let parsed;
            try { parsed = JSON.parse(body); } catch { parsed = body; }
            const isErr = res.status >= 400;
            console.log(`[${isErr ? 'FAIL' : ' OK '}] ${res.status} ${route}`);
            if (isErr) console.log(`       → ${JSON.stringify(parsed).slice(0, 200)}`);
        } catch(e) {
            console.log(`[ERR ] ${route} — ${e.message}`);
        }
    }
})();
