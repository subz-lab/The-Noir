# Logstash Pipeline Configuration Guide

## Overview

The enhanced Logstash pipeline continuously monitors `server_logs.json` for updates and processes logs with advanced threat detection, enrichment, and classification.

---

## Key Features

### 1. **Continuous File Monitoring**
```conf
mode => "tail"  # Watches file for new entries
sincedb_path => "/usr/share/logstash/data/.sincedb"  # Tracks read position
```

- **Tail mode**: Continuously monitors file for new log entries
- **Sincedb**: Remembers last read position (won't re-process old logs)
- **Perfect for**: Real-time streaming with `stream_logs.py`

### 2. **Multiple Input Methods**

| Input | Port | Use Case |
|-------|------|----------|
| **File** | N/A | Batch processing or continuous monitoring |
| **TCP** | 5000 | Real-time streaming from Python scripts |
| **HTTP** | 8080 | REST API ingestion |

### 3. **Advanced Threat Detection**

#### SQL Injection Detection
- Detects: `OR`, `DROP TABLE`, `UNION SELECT`, `--`, `' OR '1'='1`
- Severity: **Critical**
- Threat Score: **95**

#### Sensitive File Access
- Detects: `/etc/passwd`, `/etc/shadow`, `.ssh/id_rsa`, `bash_history`
- Severity: **High**
- Threat Score: **85**

#### Path Traversal
- Detects: `../`, `..\`, `%2e%2e`
- Severity: **High**
- Threat Score: **80**

#### Backdoor Ports
- Detects: 4444, 31337, 12345, 6666, 1337
- Severity: **Medium**
- Threat Score: **65**

### 4. **Event Classification**

Every log gets:
- **Severity**: `info`, `low`, `medium`, `high`, `critical`
- **Threat Score**: 0-100 (integer)
- **Risk Level**: Auto-calculated from threat score
- **Event Category**: `authentication`, `network`, `web`, `file_system`
- **Attack Type**: `sql_injection`, `path_traversal`, etc.

### 5. **GeoIP Enrichment**

External IPs get geolocation data:
```json
"geoip": {
  "country_name": "Russia",
  "country_code2": "RU",
  "city_name": "Moscow",
  "location": {"lat": 55.7558, "lon": 37.6173}
}
```

### 6. **Dual Index Strategy**

- **security-logs-YYYY.MM.dd**: All events
- **security-alerts-YYYY.MM.dd**: High/critical events only

---

## Usage Examples

### Method 1: Batch Processing

Process existing `server_logs.json`:

```bash
# 1. Generate logs
python log_generator.py

# 2. Start ELK Stack
docker-compose up -d

# 3. Logstash will automatically ingest
docker-compose logs -f logstash
```

### Method 2: Real-Time Streaming (File)

Stream logs and Logstash will pick them up automatically:

```bash
# Terminal 1: Start ELK Stack
docker-compose up -d

# Terminal 2: Stream logs to file
python stream_logs.py -n 1000

# Terminal 3: Watch Logstash process them
docker-compose logs -f logstash
```

### Method 3: Real-Time Streaming (TCP)

Send logs directly to Logstash via TCP:

```python
# Python script
import socket
import json

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('localhost', 5000))

log = {
    "timestamp": "2026-01-28T19:45:01Z",
    "ip_address": "185.144.143.34",
    "event_type": "login_failed",
    "user_id": "admin",
    "port_number": 22,
    "status": "failed"
}

sock.send(json.dumps(log).encode() + b'\n')
sock.close()
```

### Method 4: HTTP API

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-28T19:45:01Z",
    "ip_address": "185.144.143.34",
    "event_type": "login_failed",
    "user_id": "admin",
    "port_number": 22,
    "status": "failed"
  }'
```

---

## Field Mappings

### Input Fields (from your logs)
- `timestamp` → `@timestamp` (parsed)
- `ip_address` → `ip_address` (enriched with GeoIP)
- `user_id` → `user_id`
- `event_type` → `event_type`
- `port_number` → `port_number` (integer)
- `status` → `status`
- `request_payload` → `request_payload`

### Added Fields (by Logstash)
- `severity` → `info`, `low`, `medium`, `high`, `critical`
- `threat_score` → 0-100 (integer)
- `risk_level` → `info`, `low`, `medium`, `high`, `critical`
- `event_category` → `authentication`, `network`, `web`, `file_system`
- `attack_type` → `sql_injection`, `path_traversal`, etc.
- `geoip.*` → Geolocation data (if external IP)
- `ingestion_timestamp` → When log was processed

### Tags Added
- `authentication_failure`, `authentication_success`
- `brute_force_indicator`
- `port_scan_indicator`
- `sql_injection_detected`
- `suspicious_file_access`
- `path_traversal_detected`
- `admin_access_attempt`
- `suspicious_port`, `backdoor_port`
- `external_ip`, `internal_ip`
- `critical_threat`, `high_threat`

---

## Troubleshooting

### Issue: Logs not being ingested

**Check 1**: Verify file path
```bash
docker-compose exec logstash ls -la /usr/share/logstash/data/
```

**Check 2**: Check sincedb position
```bash
# Delete sincedb to re-read from beginning
docker-compose exec logstash rm /usr/share/logstash/data/.sincedb
docker-compose restart logstash
```

**Check 3**: Verify pipeline syntax
```bash
docker-compose exec logstash bin/logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf
```

### Issue: Duplicate logs

**Cause**: Sincedb was deleted or file was re-read

**Solution**: Sincedb tracks position. Don't delete it unless you want to re-process.

### Issue: GeoIP not working

**Cause**: GeoIP database not included in Docker image

**Solution**: GeoIP enrichment will fail silently. For production, add GeoIP database:
```yaml
# docker-compose.yml
volumes:
  - ./GeoLite2-City.mmdb:/usr/share/logstash/GeoLite2-City.mmdb
```

---

## Performance Tuning

### For High-Volume Ingestion

Edit `docker-compose.yml`:

```yaml
logstash:
  environment:
    - "LS_JAVA_OPTS=-Xmx1g -Xms1g"  # Increase heap
```

Edit `logstash.conf`:

```conf
# Batch processing
output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "security-logs-%{+YYYY.MM.dd}"
    workers => 4  # Parallel workers
    flush_size => 500  # Batch size
  }
}
```

### For Development (Current)

- Heap: 256MB
- Workers: 1
- Good for: 100-1000 logs/second

---

## Querying Processed Logs

### Count by Severity
```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "severity_breakdown": {
      "terms": {"field": "severity.keyword"}
    }
  }
}
'
```

### Find Critical Threats
```bash
curl -X GET "http://localhost:9200/security-alerts-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {"severity": "critical"}
  }
}
'
```

### Find SQL Injection Attacks
```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {"attack_type": "sql_injection"}
  }
}
'
```

---

## Next Steps

1. ✅ **Start ELK Stack**: `docker-compose up -d`
2. ✅ **Ingest Logs**: `python log_generator.py` + restart Logstash
3. ✅ **View in Kibana**: http://localhost:5601
4. ✅ **Create Visualizations**: Severity pie chart, threat timeline
5. ✅ **Build Dashboards**: SOC overview, attack detection
6. ✅ **Set Up Alerts**: Watcher rules for critical threats

---

## Summary

✅ **Continuous Monitoring**: Tail mode watches file for updates  
✅ **Multiple Inputs**: File, TCP, HTTP  
✅ **Advanced Detection**: SQL injection, path traversal, suspicious files  
✅ **Auto-Classification**: Severity, threat score, risk level  
✅ **GeoIP Enrichment**: Location data for external IPs  
✅ **Dual Indexing**: All logs + high-severity alerts  
✅ **Production-Ready**: Configurable, scalable, debuggable  

Your Logstash pipeline is now ready to process security logs in real-time! 🚀
