# The Noir API Documentation

## Base URL
Default: `http://localhost:8000/api`

## Authentication
Currently, the API is open for internal SOC use. Future iterations will include OAuth2/JWT.

---

## Log Management

### 1. Ingest Log
`POST /logs/ingest`
Inbound endpoint for security event logs.
- **Payload**:
```json
{
  "timestamp": "ISO8601",
  "ip_address": "string",
  "user_id": "string (optional)",
  "event_type": "web_request | login_failed | port_access | file_access",
  "port_number": "int",
  "request_payload": "string (optional)"
}
```

### 2. List Logs
`GET /logs/`
Retrieves a list of recent logs from Elasticsearch.

---

## Detection & ML

### 1. Get Detection Stats
`GET /detections/stats`
Returns counts of Normal vs Suspicious vs Threat events.

### 2. Predict Threat (Manual)
`POST /detections/predict`
Runs a log entry through the Random Forest model manually.

---

## AI Forensics & Reporting

### 1. Generate Report
`POST /reports/generate`
Uses GPT-4 to analyze a specific log event and generate a full forensic report.
- **Payload**:
```json
{
  "log_data": { ...raw_log... },
  "ml_result": { "label": "Threat", "confidence": 0.95 }
}
```

### 2. List Reports
`GET /reports/`
Retrieves all generated security reports from Elasticsearch.

---
*Generated: 2026-01-28*
