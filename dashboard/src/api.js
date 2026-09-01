/**
 * api.js — Centralized API service for The Noir SOC Dashboard
 * All calls point to the FastAPI backend at localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Logs ────────────────────────────────────────────────────────────────────

export async function fetchLogs(limit = 20) {
    const res = await fetch(`${BASE_URL}/api/logs/?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
    return res.json(); // { status, count, logs }
}

export async function ingestLog(logEntry) {
    const res = await fetch(`${BASE_URL}/api/logs/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
    });
    if (!res.ok) throw new Error(`Failed to ingest log: ${res.status}`);
    return res.json(); // { status, log, analysis }
}

export async function bulkIngestLogs(logs) {
    const res = await fetch(`${BASE_URL}/api/logs/bulk-ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
    });
    if (!res.ok) throw new Error(`Bulk ingestion failed: ${res.status}`);
    return res.json(); // { status, processed, last_analysis }
}

// ─── Detections ───────────────────────────────────────────────────────────────

export async function fetchDetections() {
    const res = await fetch(`${BASE_URL}/api/detections/`);
    if (!res.ok) throw new Error(`Failed to fetch detections: ${res.status}`);
    return res.json();
}

// ─── Real-Time WebSockets ────────────────────────────────────────────────────

export function subscribeToLogs(onMessage) {
    const wsUrl = BASE_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/api/logs/ws`);

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error("WS Parse Error:", e);
        }
    };

    ws.onclose = () => {
        console.warn("WS Connection Closed. Retrying in 3s...");
        setTimeout(() => subscribeToLogs(onMessage), 3000);
    };

    ws.onerror = (err) => {
        console.error("WS Error:", err);
    };

    return ws;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function fetchReports() {
    const res = await fetch(`${BASE_URL}/api/reports/`);
    if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
    return res.json(); // array of report objects
}

export async function fetchReport(reportId) {
    const res = await fetch(`${BASE_URL}/api/reports/${reportId}`);
    if (!res.ok) throw new Error(`Report not found: ${res.status}`);
    return res.json();
}

export async function generateReport(logData, mlResult) {
    const res = await fetch(`${BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_data: logData, ml_result: mlResult }),
    });
    if (!res.ok) throw new Error(`Failed to generate report: ${res.status}`);
    return res.json(); // { report_id, severity, markdown }
}

// ─── Dashboard Aggregated Data ───────────────────────────────────────────────

export async function fetchSystemHealth() {
    const res = await fetch(`${BASE_URL}/api/dashboard/system-health`);
    if (!res.ok) throw new Error(`Failed to fetch system health: ${res.status}`);
    return res.json();
}

export async function fetchTimeline() {
    const res = await fetch(`${BASE_URL}/api/dashboard/timeline`);
    if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`);
    return res.json();
}

export async function fetchPlaybooks() {
    const res = await fetch(`${BASE_URL}/api/dashboard/playbooks`);
    if (!res.ok) throw new Error(`Failed to fetch playbooks: ${res.status}`);
    return res.json();
}

export async function fetchInsights() {
    const res = await fetch(`${BASE_URL}/api/dashboard/insights`);
    if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`);
    return res.json();
}

export async function fetchTopology() {
    const res = await fetch(`${BASE_URL}/api/dashboard/topology`);
    if (!res.ok) throw new Error(`Failed to fetch topology: ${res.status}`);
    return res.json();
}

// ─── SOAR (Automation & Playbooks) ─────────────────────────────────────────────

export async function fetchSOARPlaybooks() {
    const res = await fetch(`${BASE_URL}/api/soar/playbooks`);
    if (!res.ok) throw new Error(`Failed to fetch SOAR playbooks: ${res.status}`);
    return res.json();
}

export async function createSOARPlaybook(playbookData) {
    const res = await fetch(`${BASE_URL}/api/soar/playbooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playbookData),
    });
    if (!res.ok) throw new Error(`Failed to create playbook: ${res.status}`);
    return res.json();
}

export async function deleteSOARPlaybook(playbookId) {
    const res = await fetch(`${BASE_URL}/api/soar/playbooks/${playbookId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete playbook: ${res.status}`);
    return res.json();
}

export async function fetchActionHistory(limit = 50) {
    const res = await fetch(`${BASE_URL}/api/soar/actions/history?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch action history: ${res.status}`);
    return res.json();
}

export async function executePlaybook(playbookId, incidentData) {
    const res = await fetch(`${BASE_URL}/api/soar/playbooks/${playbookId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
    });
    if (!res.ok) throw new Error(`Failed to execute playbook: ${res.status}`);
    return res.json();
}

// ─── Attack Simulation Payloads ───────────────────────────────────────────────

export const ATTACK_PRESETS = {
    brute_force: {
        label: 'Brute Force',
        description: 'Rapid failed login attempts from a single IP',
        logs: Array.from({ length: 12 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 4000).toISOString(),
            ip_address: '185.220.101.45',
            user_id: 'admin',
            event_type: 'login_failed',
            port_number: 22,
            status: 'failed',
            request_payload: null,
        })),
    },
    sql_injection: {
        label: 'SQL Injection',
        description: 'Malicious SQL payload in web request',
        logs: [{
            timestamp: new Date().toISOString(),
            ip_address: '203.0.113.99',
            user_id: null,
            event_type: 'web_request',
            port_number: 80,
            status: 'failed',
            request_payload: "GET /login?id=' OR '1'='1 HTTP/1.1",
        }],
    },
    port_scan: {
        label: 'Port Scan',
        description: 'Systematic scan of multiple ports from one IP',
        logs: [21, 22, 23, 25, 80, 443, 3306, 5432, 6379, 8080, 8443, 9200, 27017, 3389, 5900, 11211, 6667, 1433, 5000, 4444].map((port, i) => ({
            timestamp: new Date(Date.now() - i * 500).toISOString(),
            ip_address: '198.51.100.77',
            user_id: null,
            event_type: 'port_access',
            port_number: port,
            status: 'failed',
            request_payload: null,
        })),
    },
};
