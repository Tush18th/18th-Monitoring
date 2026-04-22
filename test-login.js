const fetch = require('node-fetch'); // we'll use native fetch in latest node
(async () => {
    try {
        const res = await fetch('http://localhost:4000/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: "superadmin@monitor.io", password: "password123" }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Body:", data);
    } catch(e) {
        console.error("Error:", e);
    }
})();
