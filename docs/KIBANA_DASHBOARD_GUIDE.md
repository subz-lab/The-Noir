# Kibana Verification & Dashboard Guide

## Part 1: Verify Logs in Kibana

### Step 1: Start ELK Stack

```bash
# Start all services
docker-compose up -d

# Wait 2-5 minutes for services to start
docker-compose logs -f
```

### Step 2: Access Kibana

1. Open browser: **http://localhost:5601**
2. Wait for Kibana to load (may take 1-2 minutes first time)
3. You should see the Kibana home page

### Step 3: Create Index Pattern

**Navigate to Index Patterns:**
1. Click **☰** (hamburger menu) in top-left
2. Go to **Stack Management** (bottom of menu)
3. Click **Index Patterns** (under Kibana section)

**Create Pattern:**
1. Click **Create index pattern** button
2. **Index pattern name**: `security-logs-*`
3. Click **Next step**
4. **Time field**: Select `@timestamp` from dropdown
5. Click **Create index pattern**

✅ You should see a success message!

### Step 4: View Your Logs in Discover

**Navigate to Discover:**
1. Click **☰** menu
2. Click **Discover** (Analytics section)

**Verify Logs:**
1. Ensure `security-logs-*` is selected in the dropdown (top-left)
2. Set time range to **Last 90 days** (top-right calendar icon)
3. You should see your logs appear!

**What to Check:**
- ✅ Log count shows in top-right (e.g., "30,000 hits")
- ✅ Histogram shows log distribution over time
- ✅ Individual log entries visible in table below

### Step 5: Explore Log Fields

**In the Discover view:**

1. **Left sidebar** shows available fields
2. **Hover over a field** (e.g., `event_type`) and click **+** to add to table
3. **Add these key fields:**
   - `@timestamp`
   - `ip_address`
   - `event_type`
   - `status`
   - `severity`
   - `threat_score`
   - `user_id`

4. **Click on a log entry** to expand and see all fields

### Step 6: Test Search Functionality

**Try these searches in the search bar:**

```
event_type: "login_failed"
```
```
severity: "critical"
```
```
ip_address: "185.144.143.34"
```
```
event_type: "login_failed" AND status: "failed"
```

✅ Results should filter immediately!

---

## Part 2: Create Basic Dashboard

### Step 1: Navigate to Dashboard

1. Click **☰** menu
2. Click **Dashboard** (Analytics section)
3. Click **Create dashboard** button

### Step 2: Create Visualization 1 - Events by Type (Pie Chart)

**Add Visualization:**
1. Click **Create visualization** button
2. Select **Pie** chart type

**Configure:**
1. **Data source**: Select `security-logs-*`
2. **Slice by**: 
   - Click **Add or drag-and-drop a field**
   - Select **event_type**
3. **Metrics**: Should auto-set to "Count"

**Customize:**
1. Click **⚙** (settings) icon
2. **Panel title**: "Events by Type"
3. **Legend position**: Right
4. Click **Save and return**

### Step 3: Create Visualization 2 - Top 10 IPs (Bar Chart)

**Add New Visualization:**
1. Click **Create visualization**
2. Select **Bar vertical** chart

**Configure:**
1. **Horizontal axis**:
   - Drag **ip_address** field
   - Click field → **Rank by**: Top values
   - **Number of values**: 10
2. **Vertical axis**: Count (auto-set)

**Customize:**
1. **Panel title**: "Top 10 Source IPs"
2. **Show values on chart**: Enable
3. Click **Save and return**

### Step 4: Create Visualization 3 - Events Over Time (Line Chart)

**Add New Visualization:**
1. Click **Create visualization**
2. Select **Line** chart

**Configure:**
1. **Horizontal axis**:
   - Drag **@timestamp** field
   - **Interval**: Auto or 1 hour
2. **Vertical axis**: Count
3. **Break down by**:
   - Drag **severity** field
   - Creates multiple lines by severity

**Customize:**
1. **Panel title**: "Events Timeline by Severity"
2. **Legend**: Right
3. Click **Save and return**

### Step 5: Create Visualization 4 - Threat Score Distribution (Histogram)

**Add New Visualization:**
1. Click **Create visualization**
2. Select **Bar vertical**

**Configure:**
1. **Horizontal axis**:
   - Drag **threat_score** field
   - Click field → **Intervals**: Custom
   - **Minimum interval**: 10
2. **Vertical axis**: Count

**Customize:**
1. **Panel title**: "Threat Score Distribution"
2. Click **Save and return**

### Step 6: Create Visualization 5 - Attack Types (Table)

**Add New Visualization:**
1. Click **Create visualization**
2. Select **Table**

**Configure:**
1. **Rows**:
   - Drag **attack_type** field
   - Drag **severity** field
2. **Metrics**: Count

**Customize:**
1. **Panel title**: "Attack Types Summary"
2. **Rows per page**: 10
3. Click **Save and return**

### Step 7: Create Visualization 6 - Geographic Map (if GeoIP data available)

**Add New Visualization:**
1. Click **Create visualization**
2. Select **Maps**

**Configure:**
1. Click **Add layer**
2. Select **Clusters and grids**
3. **Index pattern**: `security-logs-*`
4. **Geospatial field**: `geoip.location`
5. Click **Add layer**

**Customize:**
1. **Panel title**: "Attack Origins (Geographic)"
2. Zoom to fit data
3. Click **Save and return**

### Step 8: Arrange Dashboard

**Organize your visualizations:**
1. **Drag panels** to rearrange
2. **Resize panels** by dragging corners
3. **Suggested layout:**
   ```
   ┌─────────────────┬─────────────────┐
   │ Events by Type  │ Top 10 IPs      │
   ├─────────────────┴─────────────────┤
   │ Events Timeline by Severity       │
   ├─────────────────┬─────────────────┤
   │ Threat Score    │ Attack Types    │
   ├─────────────────┴─────────────────┤
   │ Geographic Map (if available)     │
   └───────────────────────────────────┘
   ```

### Step 9: Save Dashboard

1. Click **Save** button (top-right)
2. **Title**: "SOC Security Overview"
3. **Description**: "Main dashboard for security event monitoring"
4. Click **Save**

✅ Your dashboard is now saved!

---

## Part 3: Advanced Features

### Add Filters to Dashboard

**Create a filter:**
1. Click **Add filter** (top bar)
2. **Field**: `severity`
3. **Operator**: `is`
4. **Value**: `critical`
5. Click **Save**

**Pin filter** to make it permanent on dashboard

### Set Auto-Refresh

1. Click **🕐** (clock icon) next to time picker
2. Select refresh interval: **5 seconds**, **10 seconds**, etc.
3. Dashboard will auto-update!

### Create Drilldowns

**From pie chart to detailed view:**
1. Click **⚙** on "Events by Type" panel
2. Select **Panel settings**
3. **Drilldowns** → **Create drilldown**
4. **Action**: Go to Discover
5. **Apply filters**: event_type
6. Save

Now clicking a pie slice opens filtered Discover view!

---

## Part 4: Verification Checklist

### ✅ Data Verification

- [ ] Index pattern `security-logs-*` created
- [ ] Logs visible in Discover (30,000+ hits)
- [ ] All fields visible in left sidebar
- [ ] Time range shows correct dates
- [ ] Search functionality works

### ✅ Dashboard Verification

- [ ] 5-6 visualizations created
- [ ] All panels show data (no errors)
- [ ] Dashboard saved successfully
- [ ] Filters work correctly
- [ ] Auto-refresh enabled (optional)

### ✅ Data Quality Checks

**Run these searches to verify data:**

1. **Check for attacks:**
   ```
   severity: "critical" OR severity: "high"
   ```
   Should show SQL injection, file access attempts

2. **Check brute force:**
   ```
   tags: "brute_force_indicator"
   ```
   Should show failed login attempts

3. **Check port scans:**
   ```
   tags: "port_scan_indicator"
   ```
   Should show port access events

4. **Check GeoIP:**
   ```
   _exists_: geoip.country_name
   ```
   Should show logs with geolocation data

---

## Part 5: Troubleshooting

### Issue: No logs in Kibana

**Check 1**: Verify Elasticsearch has data
```bash
curl http://localhost:9200/_cat/indices?v
```
Should show `security-logs-*` indices

**Check 2**: Verify log count
```bash
curl http://localhost:9200/security-logs-*/_count
```

**Check 3**: Check Logstash is running
```bash
docker-compose logs logstash | tail -50
```

**Solution**: Restart Logstash
```bash
docker-compose restart logstash
```

### Issue: Index pattern not found

**Solution**: Recreate index pattern
1. Stack Management → Index Patterns
2. Delete old pattern
3. Create new pattern: `security-logs-*`
4. Select time field: `@timestamp`

### Issue: Visualizations show "No results"

**Check 1**: Verify time range
- Expand to "Last 90 days" or "Last year"

**Check 2**: Remove all filters
- Click **X** on each filter pill

**Check 3**: Verify field exists
- Go to Discover
- Check if field has values in left sidebar

### Issue: Dashboard is slow

**Solution 1**: Reduce time range
- Use "Last 7 days" instead of "Last 90 days"

**Solution 2**: Limit visualizations
- Remove complex aggregations
- Use top 10 instead of top 100

**Solution 3**: Increase Elasticsearch memory
```yaml
# docker-compose.yml
ES_JAVA_OPTS: "-Xms1g -Xmx1g"
```

---

## Part 6: Next Steps

### Create Additional Dashboards

1. **Attack Detection Dashboard**
   - SQL injection attempts
   - Brute force attacks
   - Port scan activity
   - Suspicious file access

2. **User Activity Dashboard**
   - Login success/failure rates
   - Top active users
   - User behavior patterns

3. **Network Dashboard**
   - Port usage distribution
   - Internal vs external traffic
   - Geographic attack sources

### Set Up Alerts (Watcher)

Create alerts for:
- Critical severity events
- Brute force detection (>10 failed logins)
- SQL injection attempts
- Suspicious port access

### Export Dashboard

1. Stack Management → Saved Objects
2. Select your dashboard
3. Click **Export**
4. Share JSON file with team

---

## Quick Reference

### Essential Kibana URLs

- **Home**: http://localhost:5601
- **Discover**: http://localhost:5601/app/discover
- **Dashboard**: http://localhost:5601/app/dashboards
- **Visualize**: http://localhost:5601/app/visualize
- **Stack Management**: http://localhost:5601/app/management

### Useful KQL Queries

```
# Failed logins
event_type: "login_failed"

# Critical threats
severity: "critical"

# Specific IP
ip_address: "185.144.143.34"

# SQL injection
attack_type: "sql_injection"

# Last hour
@timestamp >= now-1h

# Multiple conditions
event_type: "login_failed" AND severity: "high"

# Wildcard search
request_payload: *DROP*TABLE*

# Range query
threat_score >= 80
```

---

## Summary

✅ **Verified Logs**: Index pattern created, logs visible in Discover  
✅ **Created Dashboard**: 6 visualizations showing events, IPs, timeline, threats  
✅ **Tested Search**: KQL queries work for filtering and analysis  
✅ **Configured Features**: Auto-refresh, filters, drilldowns  
✅ **Ready for SOC**: Professional dashboard for security monitoring  

Your Kibana dashboard is now ready for real-time security monitoring! 🎉
