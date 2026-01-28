# Kibana Quick Start Checklist

## Prerequisites
- [ ] ELK Stack running: `docker-compose up -d`
- [ ] Logs generated: `python log_generator.py`
- [ ] Logstash ingested data: `docker-compose restart logstash`

---

## Step 1: Access Kibana
- [ ] Open http://localhost:5601
- [ ] Wait for Kibana to load

## Step 2: Create Index Pattern
- [ ] ☰ Menu → Stack Management → Index Patterns
- [ ] Create index pattern: `security-logs-*`
- [ ] Time field: `@timestamp`
- [ ] Click Create

## Step 3: View Logs
- [ ] ☰ Menu → Discover
- [ ] Set time range: Last 90 days
- [ ] Verify logs appear (30,000+ hits)

## Step 4: Add Key Fields
Add these fields to table (click + icon):
- [ ] `@timestamp`
- [ ] `ip_address`
- [ ] `event_type`
- [ ] `status`
- [ ] `severity`
- [ ] `threat_score`

## Step 5: Test Searches
Try these in search bar:
- [ ] `event_type: "login_failed"`
- [ ] `severity: "critical"`
- [ ] `tags: "brute_force_indicator"`

---

## Create Dashboard (5 minutes)

### Visualization 1: Events by Type (Pie)
- [ ] Dashboard → Create visualization → Pie
- [ ] Slice by: `event_type`
- [ ] Title: "Events by Type"

### Visualization 2: Top 10 IPs (Bar)
- [ ] Create visualization → Bar vertical
- [ ] Horizontal axis: `ip_address` (Top 10)
- [ ] Title: "Top 10 Source IPs"

### Visualization 3: Timeline (Line)
- [ ] Create visualization → Line
- [ ] Horizontal: `@timestamp`
- [ ] Break down by: `severity`
- [ ] Title: "Events Timeline by Severity"

### Visualization 4: Threat Scores (Histogram)
- [ ] Create visualization → Bar vertical
- [ ] Horizontal: `threat_score` (interval: 10)
- [ ] Title: "Threat Score Distribution"

### Visualization 5: Attack Types (Table)
- [ ] Create visualization → Table
- [ ] Rows: `attack_type`, `severity`
- [ ] Title: "Attack Types Summary"

### Save Dashboard
- [ ] Arrange panels
- [ ] Save → Title: "SOC Security Overview"

---

## Verification
- [ ] All visualizations show data
- [ ] No error messages
- [ ] Dashboard auto-refreshes (optional)
- [ ] Filters work correctly

---

## Troubleshooting

**No logs?**
```bash
curl http://localhost:9200/security-logs-*/_count
docker-compose restart logstash
```

**No index pattern?**
- Delete and recreate with `security-logs-*`

**Visualizations empty?**
- Expand time range to "Last 90 days"
- Remove all filters

---

See **KIBANA_DASHBOARD_GUIDE.md** for detailed instructions.
