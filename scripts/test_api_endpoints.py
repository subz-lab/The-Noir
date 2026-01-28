import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_logs_ingest():
    print("\n--- Testing Log Ingestion ---")
    payload = {
        "timestamp": "2026-01-28T22:30:00Z",
        "ip_address": "192.168.1.102",
        "event_type": "login_failed",
        "status": "failed",
        "port_number": 22
    }
    response = requests.post(f"{BASE_URL}/logs/ingest", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()

def test_detections_predict():
    print("\n--- Testing Standalone Prediction ---")
    payload = {
        "log_data": {
            "timestamp": "2026-01-28T22:35:00Z",
            "ip_address": "185.144.143.34",
            "event_type": "login_failed",
            "request_frequency": 50,
            "failed_attempt_count": 30
        }
    }
    response = requests.post(f"{BASE_URL}/detections/predict", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_reports_flow(ml_analysis):
    print("\n--- Testing Report Generation ---")
    payload = {
        "log_data": ml_analysis["log"],
        "ml_result": ml_analysis["analysis"]
    }
    response = requests.post(f"{BASE_URL}/reports/generate", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response (Partial): {json.dumps(response.json(), indent=2)[:500]}...")
    
    report_id = response.json().get("report_id")
    if report_id:
        print(f"\nVerifying Report Retrieval for {report_id}...")
        get_res = requests.get(f"{BASE_URL}/reports/{report_id}")
        print(f"Status: {get_res.status_code}")
        print(f"Report Excerpt: {get_res.json().get('report_markdown')[:200]}...")

if __name__ == "__main__":
    try:
        # Step 1: Ingest log and get analysis
        analysis = test_logs_ingest()
        # Step 2: Test standalone predict
        test_detections_predict()
        # Step 3: Test report generation using analysis from step 1
        test_reports_flow(analysis)
    except Exception as e:
        print(f"ERROR: {e}")
