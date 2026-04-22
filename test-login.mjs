// Uses Node 18+ native fetch
(async () => {
    try {
        const res = await fetch('http://localhost:4000/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: "superadmin@monitor.io", password: "password123" }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Body:", JSON.stringify(data, null, 2));

        if (data.token) {
            // Test /api/v1/projects with the token
            const projRes = await fetch('http://localhost:4000/api/v1/projects', {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'session-token': data.token
                }
            });
            const projects = await projRes.json();
            console.log("\nProjects status:", projRes.status);
            console.log("Projects:", JSON.stringify(projects, null, 2));

            // Test /api/v1/dashboard/summaries?siteId=tc_demo_004
            const siteId = 'tc_demo_004';
            const sumRes = await fetch(`http://localhost:4000/api/v1/dashboard/summaries?siteId=${siteId}`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'session-token': data.token
                }
            });
            const summaries = await sumRes.json();
            console.log("\nSummaries status:", sumRes.status);
            console.log("Summaries:", JSON.stringify(summaries, null, 2));

            // Test /api/v1/dashboard/alerts?siteId=tc_demo_004
            const alertRes = await fetch(`http://localhost:4000/api/v1/dashboard/alerts?siteId=${siteId}`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'session-token': data.token
                }
            });
            const alerts = await alertRes.json();
            console.log("\nAlerts status:", alertRes.status);
            console.log("Alerts:", JSON.stringify(alerts, null, 2));

            // Test /api/v1/dashboard/performance/trends?siteId=tc_demo_004
            const trendsRes = await fetch(`http://localhost:4000/api/v1/dashboard/performance/trends?siteId=${siteId}`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'session-token': data.token
                }
            });
            const trends = await trendsRes.json();
            console.log("\nTrends status:", trendsRes.status);
            console.log("Trends:", JSON.stringify(trends, null, 2));

            // Test /api/v1/dashboard/orders/summary?siteId=tc_demo_004
            const ordersRes = await fetch(`http://localhost:4000/api/v1/dashboard/orders/summary?siteId=${siteId}`, {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'session-token': data.token
                }
            });
            const orders = await ordersRes.json();
            console.log("\nOrders summary status:", ordersRes.status);
            console.log("Orders:", JSON.stringify(orders, null, 2));
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
})();
