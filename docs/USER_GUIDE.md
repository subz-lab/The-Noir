# Analyst User Guide: AI-Powered SOC

Welcome to the SOC Automation Platform. This guide helps security analysts navigate the dashboard and respond to threats.

## 🛡️ Monitoring the Dashboard
1. Open `http://localhost:3000` in your browser.
2. **Real-Time Feed**: Watch logs stream in. The "Severity" color indicates ML-flagged risks.
3. **Detection Stats**: Monitor the ratio of Normal to Threat events in the header cards.

## 🕵️ Investigating Detections
- When a log is flagged as a **Threat** (Red), click on it to see the raw data.
- The **ML Insight** will show you the specific features that triggered the alert (e.g., high failed login count).

## 🤖 Generating AI Forensic Reports
1. Navigate to the **Incident Reports** tab.
2. If a threat is high priority, use the "Generate Forensic Report" button.
3. **Review**: The AI will analyze the "Blast Radius", suggest "Mitigation Steps", and provide a "Mitigation Confidence Score".

## 🛠️ Mitigation Workflow
1. Read the **AI-generated Mitigation Plan**.
2. Execute blocks on the firewall/IP if recommended.
3. Mark the incident as "Analyzed" (Future feature).

---
*SOC Platform v1.0.0 - Empowering Analysts with AI*
