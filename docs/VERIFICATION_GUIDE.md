# Manual Verification Guide for Log Generator

This guide shows you how to manually verify that the log generator is working correctly.

## Method 1: View Sample Logs (Quick Check)

### Option A: View First 10 Logs
```powershell
python -c "import json; data = json.load(open('server_logs.json')); import pprint; [pprint.pprint(log) for log in data[:10]]"
```

### Option B: View Random Samples
```powershell
python -c "import json, random; data = json.load(open('server_logs.json')); random.seed(42); samples = random.sample(data, 5); import pprint; [pprint.pprint(log) for log in samples]"
```

---

## Method 2: Count Total Logs

```powershell
python -c "import json; data = json.load(open('server_logs.json')); print(f'Total logs: {len(data):,}')"
```

**Expected Output:** `Total logs: 30,000`

---

## Method 3: Check Event Type Distribution

```powershell
python analyze_logs.py
```

**Expected Output:**
```
Event Distribution:
  login_success       : 12,000 (40.0%)
  port_access         :  6,000 (20.0%)
  web_request         :  6,000 (20.0%)
  login_failed        :  4,500 (15.0%)
  file_access         :  1,500 ( 5.0%)
```

---

## Method 4: Search for Specific Attack Patterns

### Find SQL Injection Attempts
```powershell
python -c "import json; data = json.load(open('server_logs.json')); sql_attacks = [log for log in data if log.get('request_payload') and ('OR' in log['request_payload'] or 'DROP' in log['request_payload'])]; print(f'SQL Injection attempts: {len(sql_attacks)}'); import pprint; pprint.pprint(sql_attacks[0]) if sql_attacks else print('None found')"
```

### Find Failed Root Login Attempts
```powershell
python -c "import json; data = json.load(open('server_logs.json')); root_fails = [log for log in data if log.get('user_id') == 'root' and log['event_type'] == 'login_failed']; print(f'Failed root logins: {len(root_fails)}'); import pprint; [pprint.pprint(log) for log in root_fails[:3]]"
```

### Find Suspicious Port Access
```powershell
python -c "import json; data = json.load(open('server_logs.json')); suspicious_ports = [4444, 31337, 12345, 6666, 1337]; bad_ports = [log for log in data if log['port_number'] in suspicious_ports]; print(f'Suspicious port access: {len(bad_ports)}'); import pprint; [pprint.pprint(log) for log in bad_ports[:3]]"
```

---

## Method 5: Verify Data Structure

Check that all required fields are present:

```powershell
python -c "import json; data = json.load(open('server_logs.json')); required_fields = ['timestamp', 'ip_address', 'user_id', 'event_type', 'port_number', 'status', 'request_payload']; sample = data[0]; print('Checking required fields:'); [print(f'  {field}: {\"✓\" if field in sample else \"✗\"}') for field in required_fields]; print(f'\nSample log:'); import pprint; pprint.pprint(sample)"
```

---

## Method 6: Open in Text Editor

### View in Notepad (First 100 lines)
```powershell
Get-Content server_logs.json -Head 100 | Out-File temp_sample.json
notepad temp_sample.json
```

### View in VS Code (if installed)
```powershell
code server_logs.json
```

**Warning:** The file is 7.3 MB, so it may take a moment to load in a text editor.

---

## Method 7: Interactive Python Exploration

Open Python and explore interactively:

```powershell
python
```

Then in the Python shell:

```python
import json
import pprint

# Load the logs
with open('server_logs.json', 'r') as f:
    logs = json.load(f)

# Basic stats
print(f"Total logs: {len(logs):,}")

# View first log
pprint.pprint(logs[0])

# View last log
pprint.pprint(logs[-1])

# Count event types
from collections import Counter
event_counts = Counter(log['event_type'] for log in logs)
print("\nEvent types:")
for event, count in event_counts.items():
    print(f"  {event}: {count:,}")

# Find all SQL injection attempts
sql_injections = [
    log for log in logs 
    if log.get('request_payload') and 'DROP' in log['request_payload']
]
print(f"\nSQL injections with DROP: {len(sql_injections)}")
if sql_injections:
    pprint.pprint(sql_injections[0])

# Exit when done
exit()
```

---

## Method 8: Validate JSON Format

Ensure the file is valid JSON:

```powershell
python -c "import json; json.load(open('server_logs.json')); print('✓ Valid JSON format')"
```

**Expected Output:** `✓ Valid JSON format`

---

## Method 9: Check Timestamp Ordering

Verify logs are sorted chronologically:

```powershell
python -c "import json; data = json.load(open('server_logs.json')); timestamps = [log['timestamp'] for log in data]; is_sorted = timestamps == sorted(timestamps); print(f'Chronologically sorted: {\"✓ Yes\" if is_sorted else \"✗ No\"}')"
```

**Expected Output:** `Chronologically sorted: ✓ Yes`

---

## Method 10: Generate Custom Report

Create a simple verification report:

```powershell
python -c "import json; from collections import Counter; data = json.load(open('server_logs.json')); print('='*60); print('LOG VERIFICATION REPORT'); print('='*60); print(f'\nTotal Logs: {len(data):,}'); print(f'Unique IPs: {len(set(log[\"ip_address\"] for log in data)):,}'); print(f'Unique Users: {len(set(log[\"user_id\"] for log in data if log[\"user_id\"])):,}'); print(f'Date Range: {data[0][\"timestamp\"][:10]} to {data[-1][\"timestamp\"][:10]}'); events = Counter(log['event_type'] for log in data); print('\nEvent Types:'); [print(f'  {k}: {v:,}') for k,v in events.most_common()]; print('='*60)"
```

---

## Quick Visual Inspection Checklist

After running the commands above, verify:

- [ ] File exists and is ~7.3 MB
- [ ] Contains exactly 30,000 logs
- [ ] All required fields present in each log
- [ ] Event types match expected distribution (40/20/20/15/5)
- [ ] SQL injection patterns found in payloads
- [ ] Failed login attempts with 'root', 'admin' users
- [ ] Suspicious ports (4444, 12345, etc.) present
- [ ] Timestamps are in ISO format and sorted
- [ ] Mix of internal (192.168.x.x, 10.x.x.x) and external IPs
- [ ] Valid JSON format

---

## Troubleshooting

### If file doesn't exist:
```powershell
python log_generator.py
```

### If you get "file not found" errors:
```powershell
# Make sure you're in the correct directory
cd "c:\Users\Vishal Pednekar\OneDrive\Desktop\soc anti"
```

### If Python commands fail:
```powershell
# Check Python is installed
python --version
```

---

## Next: Test Individual Components

Once you've verified the logs are correct, you can test specific scenarios:

1. **Test ML classifier** (Part 2) - Will use these logs for training
2. **Test rule-based detector** (Part 3) - Will compare against ML
3. **Test LLM integration** (Part 4) - Will generate reports from these logs

---

**Pro Tip:** Keep `analyze_logs.py` handy - it's the quickest way to verify everything is working!
