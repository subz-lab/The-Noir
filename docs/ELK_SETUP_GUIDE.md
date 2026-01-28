# ELK Stack Setup Guide

## Overview

This guide will help you set up the complete ELK Stack (Elasticsearch, Logstash, Kibana) using Docker Compose to ingest and analyze your security logs.

---

## Prerequisites

### Required Software

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Minimum version: 20.10+

2. **Docker Compose**
   - Included with Docker Desktop
   - Verify: `docker-compose --version`

3. **System Requirements**
   - RAM: Minimum 4GB (8GB recommended)
   - Disk Space: 10GB free
   - CPU: 2+ cores

---

## Quick Start

### 1. Verify Docker Installation

```bash
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version

# Test Docker
docker run hello-world
```

### 2. Start the ELK Stack

```bash
# Navigate to project directory
cd "c:\Users\Vishal Pednekar\OneDrive\Desktop\soc anti"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Wait for Services to Start

The stack takes **2-5 minutes** to fully initialize. Monitor progress:

```bash
# Check service status
docker-compose ps

# Watch Elasticsearch health
docker-compose logs -f elasticsearch

# Watch Logstash startup
docker-compose logs -f logstash
```

### 4. Verify Services

Once started, verify each service:

```bash
# Elasticsearch (should return cluster info)
curl http://localhost:9200

# Logstash (should return node stats)
curl http://localhost:9600/_node/stats

# Kibana (open in browser)
# http://localhost:5601
```

---

## Service Details

### Elasticsearch
- **Port**: 9200 (HTTP API)
- **Port**: 9300 (Node communication)
- **URL**: http://localhost:9200
- **Purpose**: Stores and indexes security logs
- **Health Check**: `curl http://localhost:9200/_cluster/health`

### Logstash
- **Port**: 5000 (TCP input for real-time logs)
- **Port**: 9600 (Monitoring API)
- **Purpose**: Processes and enriches logs before indexing
- **Pipeline**: `/logstash/pipeline/logstash.conf`

### Kibana
- **Port**: 5601
- **URL**: http://localhost:5601
- **Purpose**: Visualization and dashboard interface
- **Default Credentials**: None (security disabled for development)

---

## Ingesting Your Logs

### Method 1: Batch Ingestion (Recommended for Testing)

The Logstash pipeline is already configured to read `server_logs.json`:

```bash
# 1. Ensure you have generated logs
python log_generator.py

# 2. Restart Logstash to ingest
docker-compose restart logstash

# 3. Watch ingestion progress
docker-compose logs -f logstash
```

### Method 2: Real-Time Streaming

Stream logs directly to Logstash via TCP:

```bash
# Terminal 1: Start streaming
python stream_logs.py -n 1000 | nc localhost 5000

# Terminal 2: Monitor Kibana
# Open http://localhost:5601
```

---

## Accessing Kibana

### 1. Open Kibana

Navigate to: **http://localhost:5601**

### 2. Create Index Pattern

1. Click **☰ Menu** → **Stack Management** → **Index Patterns**
2. Click **Create index pattern**
3. Enter pattern: `security-logs-*`
4. Click **Next step**
5. Select time field: `@timestamp`
6. Click **Create index pattern**

### 3. View Your Logs

1. Click **☰ Menu** → **Discover**
2. Select index pattern: `security-logs-*`
3. You should see your ingested security logs!

---

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### Restart Specific Service
```bash
docker-compose restart logstash
docker-compose restart elasticsearch
docker-compose restart kibana
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f elasticsearch
docker-compose logs -f logstash
docker-compose logs -f kibana
```

### Check Service Health
```bash
# All services
docker-compose ps

# Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Logstash stats
curl http://localhost:9600/_node/stats?pretty

# Kibana status
curl http://localhost:5601/api/status
```

---

## Troubleshooting

### Issue: Elasticsearch won't start

**Symptoms**: Container keeps restarting

**Solution 1**: Increase Docker memory
- Docker Desktop → Settings → Resources
- Set memory to at least 4GB

**Solution 2**: Check vm.max_map_count (Linux/WSL)
```bash
# Check current value
sysctl vm.max_map_count

# Set to required value
sudo sysctl -w vm.max_map_count=262144

# Make permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Issue: Logstash not ingesting logs

**Check 1**: Verify file path
```bash
# Check if Logstash can see the file
docker-compose exec logstash ls -la /usr/share/logstash/data/
```

**Check 2**: Check pipeline syntax
```bash
# Test configuration
docker-compose exec logstash bin/logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf
```

**Check 3**: View Logstash logs
```bash
docker-compose logs logstash | grep -i error
```

### Issue: Kibana shows "No data"

**Check 1**: Verify Elasticsearch has data
```bash
# Check index exists
curl http://localhost:9200/_cat/indices?v

# Count documents
curl http://localhost:9200/security-logs-*/_count
```

**Check 2**: Verify index pattern
- Go to Stack Management → Index Patterns
- Ensure `security-logs-*` exists and matches your indices

**Check 3**: Check time range
- In Discover, expand time range to "Last 90 days"

### Issue: Port already in use

**Symptoms**: Error binding to port 9200, 5601, or 5000

**Solution**: Stop conflicting services or change ports in `docker-compose.yml`

```bash
# Find process using port
netstat -ano | findstr :9200

# Kill process (Windows)
taskkill /PID <process_id> /F
```

---

## File Structure

```
soc anti/
├── docker-compose.yml          # Main Docker Compose configuration
├── logstash/
│   ├── config/
│   │   └── logstash.yml       # Logstash settings
│   └── pipeline/
│       └── logstash.conf      # Log processing pipeline
├── server_logs.json           # Your generated security logs
└── ELK_SETUP_GUIDE.md        # This file
```

---

## Next Steps

Once your ELK Stack is running:

1. ✅ **Verify Data Ingestion**
   - Check Kibana Discover for logs
   - Verify all fields are parsed correctly

2. ✅ **Create Visualizations**
   - Event type distribution (pie chart)
   - Failed logins over time (line chart)
   - Top attacking IPs (table)
   - Threat score heatmap

3. ✅ **Build Dashboards**
   - SOC Overview Dashboard
   - Attack Detection Dashboard
   - User Activity Dashboard

4. ✅ **Set Up Alerts** (Next Stage)
   - Brute force detection rules
   - Port scan detection
   - SQL injection alerts

---

## Performance Tuning

### For Development (Current Setup)
- Elasticsearch: 512MB heap
- Logstash: 256MB heap
- Good for: 10K-100K logs

### For Production
Edit `docker-compose.yml`:

```yaml
# Elasticsearch
ES_JAVA_OPTS: "-Xms2g -Xmx2g"

# Logstash
LS_JAVA_OPTS: "-Xms1g -Xmx1g"
```

---

## Security Notes

⚠️ **Current Configuration**: Security is **DISABLED** for development

For production:
- Enable X-Pack security
- Set up authentication
- Configure TLS/SSL
- Restrict network access

---

## Useful Elasticsearch Queries

### Count all logs
```bash
curl http://localhost:9200/security-logs-*/_count?pretty
```

### Get sample documents
```bash
curl http://localhost:9200/security-logs-*/_search?size=5&pretty
```

### Search for failed logins
```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "event_type": "login_failed"
    }
  }
}
'
```

### Aggregate by severity
```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "severity_breakdown": {
      "terms": {
        "field": "severity.keyword"
      }
    }
  }
}
'
```

---

## Summary

✅ **ELK Stack Components**
- Elasticsearch: Data storage and search
- Logstash: Log processing and enrichment
- Kibana: Visualization and analysis

✅ **Key Features**
- Automatic severity scoring
- Attack type detection (SQL injection, brute force)
- GeoIP enrichment
- Real-time and batch ingestion

✅ **Access Points**
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601
- Logstash: TCP port 5000

**You're now ready to analyze your security logs with a professional SIEM!** 🎉
