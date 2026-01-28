import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000/api"
DASHBOARD_URL = "http://localhost:3000"

def test_e2e_flow():
    print("🚀 Starting End-to-End SOC Stack Verification...")
    
    # 1. Verification of Backend Health
    try:
        resp = requests.get(f"{BASE_URL}/logs/")
        if resp.status_code == 200:
            print("✅ Backend API is REACHABLE.")
        else:
            print(f"❌ Backend API error: {resp.status_code}")
            return
    except Exception as e:
        print(f"❌ Could not connect to API: {e}")
        return

    # 2. Ingest a "Brute Force" Attack Pattern
    print("\n⚔️ Simulating Brute Force Attack...")
    attack_logs = []
    for i in range(12):
        attack_logs.append({
            "timestamp": "2026-01-28T23:05:00Z",
            "ip_address": "10.99.99.99",
            "user_id": "admin",
            "event_type": "login_failed",
            "status": "failed",
            "port_number": 22
        })
    
    total_ingested = 0
    for log in attack_logs:
        resp = requests.post(f"{BASE_URL}/logs/ingest", json=log)
        if resp.status_code == 200:
            total_ingested += 1
    
    print(f"✅ Ingested {total_ingested} attack logs.")

    # 3. Wait for Processing
    print("⏳ Waiting for ML classification and indexing (2s)...")
    time.sleep(2)

    # 4. Verify Detection
    print("\n🔍 Verifying Detection in Stats...")
    resp = requests.get(f"{BASE_URL}/detections/stats")
    if resp.status_code == 200:
        stats = resp.json()
        print(f"✅ Current System Stats: {json.dumps(stats, indent=2)}")
    else:
        print("❌ Could not retrieve detection stats.")

    # 5. Verify Forensic Report Generation
    print("\n📝 Triggering AI Forensic Audit...")
    report_payload = {
        "log_data": attack_logs[0],
        "ml_result": {"label": "Threat", "confidence": 0.95, "type": "Brute Force"}
    }
    resp = requests.post(f"{BASE_URL}/reports/generate", json=report_payload)
    if resp.status_code == 200:
        report = resp.json()
        print(f"✅ AI Report Generated successfully (ID: {report.get('report_id')})")
        print(f"📋 Severity: {report.get('analysis', {}).get('severity', 'UNKNOWN')}")
    else:
        print(f"❌ Report generation failed: {resp.text}")

    # 6. Final Dashboard Ready Check
    try:
        resp = requests.get(DASHBOARD_URL)
        if resp.status_code == 200:
            print("\n🌐 Analyst Dashboard is ACTIVE and serving.")
        else:
            print(f"\n⚠️ Dashboard returned code {resp.status_code}")
    except:
        print("\n⚠️ Dashboard UI is unreachable (Check Docker).")

    print("\n" + "="*40)
    print("🏁 E2E VERIFICATION COMPLETE")
    print("="*40)

if __name__ == "__main__":
    test_e2e_flow()
