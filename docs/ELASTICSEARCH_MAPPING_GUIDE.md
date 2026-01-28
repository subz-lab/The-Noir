# Elasticsearch Index Mapping Guide

## Overview

This guide explains the optimized Elasticsearch index mapping for security logs, designed for fast searches on IP addresses, timestamps, event types, and status fields.

---

## Index Template

The index template automatically applies to all indices matching:
- `security-logs-*`
- `security-alerts-*`

### Apply the Template

**Windows (PowerShell):**
```powershell
.\elasticsearch\apply-template.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x elasticsearch/apply-template.sh
./elasticsearch/apply-template.sh
```

**Manual (curl):**
```bash
curl -X PUT "http://localhost:9200/_index_template/security-logs-template" \
  -H 'Content-Type: application/json' \
  -d @elasticsearch/index-template.json
```

---

## Field Mappings

### Core Fields (Optimized for Search)

| Field | Type | Optimized For | Notes |
|-------|------|---------------|-------|
| `@timestamp` | `date` | Time-based queries | Primary timestamp field |
| `timestamp` | `date` | Original log timestamp | ISO8601 format |
| `ip_address` | `ip` | **IP range queries** | Supports CIDR notation |
| `event_type` | `keyword` | **Exact match, aggregations** | Not analyzed |
| `status` | `keyword` | **Exact match, filtering** | success/failed |
| `port_number` | `integer` | Range queries | Numeric comparisons |
| `user_id` | `keyword` | Exact match | With text field for search |

### Enriched Fields

| Field | Type | Purpose |
|-------|------|---------|
| `severity` | `keyword` | Filtering by severity level |
| `threat_score` | `integer` | Range queries (0-100) |
| `risk_level` | `keyword` | Aggregations by risk |
| `attack_type` | `keyword` | Filter by attack category |
| `event_category` | `keyword` | Group by event category |

### GeoIP Fields

| Field | Type | Purpose |
|-------|------|---------|
| `geoip.location` | `geo_point` | **Map visualizations** |
| `geoip.country_name` | `keyword` | Country aggregations |
| `geoip.city_name` | `keyword` | City-level filtering |
| `geoip.country_code2` | `keyword` | ISO country codes |

### Text Fields

| Field | Type | Purpose |
|-------|------|---------|
| `request_payload` | `text` + `keyword` | Full-text search + exact match |
| `tags` | `keyword` | Multi-value filtering |

---

## Optimizations

### 1. IP Address Type (`ip`)

**Why**: Special `ip` type enables:
- CIDR range queries: `192.168.0.0/16`
- IP range filtering
- Efficient storage

**Example Queries:**
```json
// Find all events from specific IP
{
  "query": {
    "term": {"ip_address": "185.144.143.34"}
  }
}

// Find all events from IP range
{
  "query": {
    "term": {"ip_address": "192.168.0.0/16"}
  }
}
```

### 2. Keyword Fields

**Why**: `keyword` type for exact matching:
- No text analysis
- Fast aggregations
- Efficient filtering
- Used for: `event_type`, `status`, `severity`

**Example Queries:**
```json
// Exact match on event_type
{
  "query": {
    "term": {"event_type": "login_failed"}
  }
}

// Aggregate by severity
{
  "aggs": {
    "severity_breakdown": {
      "terms": {"field": "severity"}
    }
  }
}
```

### 3. Date Fields

**Why**: Optimized for time-based queries:
- Range queries
- Date histograms
- Time-series analysis

**Example Queries:**
```json
// Events in last 24 hours
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-24h"
      }
    }
  }
}

// Events between specific dates
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "2026-01-01",
        "lte": "2026-01-31"
      }
    }
  }
}
```

### 4. Integer Fields

**Why**: Numeric types for:
- Range queries
- Sorting
- Aggregations

**Example Queries:**
```json
// High threat scores only
{
  "query": {
    "range": {
      "threat_score": {"gte": 80}
    }
  }
}

// Suspicious ports
{
  "query": {
    "terms": {
      "port_number": [4444, 31337, 12345]
    }
  }
}
```

### 5. Geo Point

**Why**: Enables map visualizations in Kibana:
- Coordinate maps
- Heat maps
- Region maps

**Example Queries:**
```json
// Events within bounding box
{
  "query": {
    "geo_bounding_box": {
      "geoip.location": {
        "top_left": {"lat": 60, "lon": -10},
        "bottom_right": {"lat": 40, "lon": 40}
      }
    }
  }
}
```

---

## Performance Settings

### Shards and Replicas

```json
"number_of_shards": 1,
"number_of_replicas": 0
```

**Why**:
- **Single shard**: Sufficient for development (<10M docs)
- **No replicas**: Faster indexing, saves disk space
- **For production**: Increase based on data volume

### Refresh Interval

```json
"refresh_interval": "5s"
```

**Why**:
- Balance between search freshness and indexing speed
- **5s**: Good for real-time dashboards
- **30s or -1**: Better for bulk ingestion

### Max Result Window

```json
"max_result_window": 50000
```

**Why**:
- Default is 10,000
- Allows deeper pagination
- Use scroll API for >50K results

---

## Common Search Patterns

### 1. Find Failed Logins from Specific IP

```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"event_type": "login_failed"}},
        {"term": {"ip_address": "185.144.143.34"}}
      ]
    }
  }
}
'
```

### 2. Find All Critical Threats in Last Hour

```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"severity": "critical"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}
'
```

### 3. Aggregate Events by IP Address

```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "top_ips": {
      "terms": {
        "field": "ip_address",
        "size": 10
      }
    }
  }
}
'
```

### 4. Find SQL Injection Attempts

```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"attack_type": "sql_injection"}},
        {"term": {"status": "success"}}
      ]
    }
  }
}
'
```

### 5. Time-Series Aggregation

```bash
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "events_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "1h"
      },
      "aggs": {
        "by_severity": {
          "terms": {"field": "severity"}
        }
      }
    }
  }
}
'
```

---

## Kibana Index Pattern

### Create Index Pattern

1. Open Kibana: http://localhost:5601
2. Go to **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter: `security-logs-*`
5. Select time field: `@timestamp`
6. Click **Create**

### Recommended Field Formats

In Kibana, set these field formats:

| Field | Format |
|-------|--------|
| `@timestamp` | Date (MMM D, YYYY @ HH:mm:ss.SSS) |
| `threat_score` | Number (0 decimals) |
| `ip_address` | String |
| `geoip.location` | Geo point |

---

## Verification

### Check Template Applied

```bash
curl -X GET "http://localhost:9200/_index_template/security-logs-template?pretty"
```

### Check Index Mapping

```bash
curl -X GET "http://localhost:9200/security-logs-*/_mapping?pretty"
```

### Test Search Performance

```bash
# Should be fast (< 100ms)
curl -X GET "http://localhost:9200/security-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"term": {"event_type": "login_failed"}},
        {"range": {"@timestamp": {"gte": "now-24h"}}}
      ]
    }
  }
}
'
```

---

## Troubleshooting

### Issue: Template not applied to existing indices

**Solution**: Template only applies to NEW indices. Delete and re-create:

```bash
# Delete old indices
curl -X DELETE "http://localhost:9200/security-logs-*"

# Re-ingest data
docker-compose restart logstash
```

### Issue: Mapping conflicts

**Symptom**: Field type mismatch errors

**Solution**: Ensure Logstash converts fields correctly:
```conf
mutate {
  convert => {
    "threat_score" => "integer"
    "port_number" => "integer"
  }
}
```

---

## Summary

✅ **Optimized Field Types**
- `ip` for IP addresses (CIDR support)
- `keyword` for exact matching (event_type, status)
- `date` for time-based queries
- `integer` for numeric fields
- `geo_point` for map visualizations

✅ **Performance Tuned**
- Single shard for development
- 5s refresh interval
- 50K max result window

✅ **Search Patterns**
- Fast IP filtering
- Time-based queries
- Aggregations by severity
- Attack type detection

Your Elasticsearch indices are now optimized for SOC operations! 🚀
