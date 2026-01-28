# Real-Time Log Streaming

## Overview

The `stream_logs.py` script generates security logs in **real-time**, appending them to `server_logs.json` one at a time with realistic delays (0.2-0.5 seconds by default). This simulates a live log stream for testing real-time detection systems.

---

## Quick Start

### Basic Usage

Generate 100 logs with default settings:
```bash
python stream_logs.py
```

### Generate Specific Number of Logs

```bash
python stream_logs.py -n 1000
```

### Custom Delay Range

```bash
# Faster streaming (0.1-0.2 seconds)
python stream_logs.py --min-delay 0.1 --max-delay 0.2

# Slower streaming (1-2 seconds)
python stream_logs.py --min-delay 1.0 --max-delay 2.0
```

### Custom Output File

```bash
python stream_logs.py -o live_logs.json -n 500
```

### Quiet Mode

```bash
python stream_logs.py -n 1000 --quiet
```

---

## Command-Line Arguments

| Argument | Short | Default | Description |
|----------|-------|---------|-------------|
| `--num-logs` | `-n` | 100 | Number of logs to generate |
| `--output` | `-o` | `server_logs.json` | Output file path |
| `--min-delay` | - | 0.2 | Minimum delay between logs (seconds) |
| `--max-delay` | - | 0.5 | Maximum delay between logs (seconds) |
| `--quiet` | `-q` | False | Suppress progress updates |

---

## Example Output

```
======================================================================
REAL-TIME LOG STREAMING
======================================================================
Target: 100 logs
Delay: 0.2-0.5 seconds per log
Output: server_logs.json

Starting stream... (Press Ctrl+C to stop)
----------------------------------------------------------------------
[10/100] web_request     | Rate: 3.2 logs/sec | ETA: 28s
[20/100] login_success   | Rate: 3.1 logs/sec | ETA: 26s
[30/100] port_access     | Rate: 3.0 logs/sec | ETA: 23s
...
[100/100] file_access    | Rate: 2.9 logs/sec | ETA: 0s

======================================================================
STREAMING COMPLETE
======================================================================
Total logs generated: 100
Time elapsed: 34.2 seconds
Average rate: 2.92 logs/second
Output file: server_logs.json
======================================================================
```

---

## Features

### Real-Time Generation

- Logs are generated **one at a time**
- Each log is **immediately appended** to the JSON file
- Configurable **random delays** between logs (0.2-0.5s default)
- Simulates **live log stream** from a real server

### Realistic Log Mix

The streamer generates a realistic mix of:
- **20%** Normal user activities (work hours, consistent IPs)
- **5%** Attack activities (brute force, port scans, SQL injection)
- **75%** Random normal events

### Attacker & User Profiles

Uses the same profiles from `log_generator.py`:
- 12 distinct attacker profiles (5 brute force, 3 port scanners, 4 SQL injectors)
- 55 normal user profiles (developers, analysts, managers, support)

### Progress Tracking

- Real-time progress updates every 10 logs
- Shows current event type
- Displays generation rate (logs/second)
- Estimates time remaining (ETA)

### Graceful Interruption

- Press `Ctrl+C` to stop streaming
- Shows final statistics
- File remains valid JSON

---

## Use Cases

### 1. Real-Time Detection Testing

Test your ML classifier or rule-based detection system with live logs:

```bash
# Terminal 1: Stream logs
python stream_logs.py -n 10000

# Terminal 2: Monitor and detect in real-time
python real_time_detector.py --watch server_logs.json
```

### 2. Dashboard Development

Build live dashboards that update as logs arrive:

```bash
# Stream logs continuously
python stream_logs.py -n 100000 --min-delay 0.5 --max-delay 1.0
```

### 3. Performance Testing

Test how your system handles incoming log volume:

```bash
# High-speed streaming
python stream_logs.py -n 5000 --min-delay 0.05 --max-delay 0.1
```

### 4. Demo & Presentations

Show live threat detection during demos:

```bash
# Slower pace for visibility
python stream_logs.py -n 200 --min-delay 1.0 --max-delay 2.0
```

---

## Technical Details

### File Appending Strategy

The script uses a **read-modify-write** approach:
1. Read existing logs from JSON file
2. Append new log entry
3. Write entire array back to file

**Note**: For very large files (>100K logs), this approach may slow down. For production systems, consider using:
- Line-delimited JSON (JSONL format)
- Database storage
- Message queue systems (Kafka, RabbitMQ)

### Timestamp Handling

- Logs use **current real time** as base timestamp
- Each log's timestamp increments by the delay amount
- Ensures chronological ordering
- Realistic time gaps between events

### Memory Efficiency

- Generates **one log at a time**
- No large in-memory arrays
- Suitable for long-running streams

---

## Comparison: Batch vs Streaming

| Feature | `log_generator.py` (Batch) | `stream_logs.py` (Streaming) |
|---------|---------------------------|------------------------------|
| Speed | Very fast (~30K logs in 2s) | Realistic (2-5 logs/sec) |
| Use Case | Training data generation | Real-time testing |
| File Writing | Once at end | After each log |
| Memory | Holds all logs | One log at a time |
| Interruption | Lose all progress | Keeps generated logs |
| Timestamps | Historical (30 days ago) | Current real-time |

---

## Tips & Best Practices

### 1. Start Small

Test with a small number of logs first:
```bash
python stream_logs.py -n 10
```

### 2. Monitor File Size

For long streams, check file size periodically:
```bash
# Windows
dir server_logs.json

# Linux/Mac
ls -lh server_logs.json
```

### 3. Clear Old Logs

The script will prompt before overwriting:
```
⚠ Warning: server_logs.json already exists.
  Clear existing file? (y/n):
```

### 4. Adjust Speed for Testing

- **Fast**: `--min-delay 0.1 --max-delay 0.2` (5-10 logs/sec)
- **Normal**: `--min-delay 0.2 --max-delay 0.5` (2-5 logs/sec)
- **Slow**: `--min-delay 1.0 --max-delay 2.0` (0.5-1 logs/sec)

---

## Future Enhancements

Potential improvements for production use:

1. **JSONL Format**: Line-delimited JSON for better performance
2. **WebSocket Streaming**: Real-time push to connected clients
3. **Kafka Integration**: Publish to message queue
4. **Multi-threaded**: Generate multiple streams simultaneously
5. **Configurable Profiles**: Load custom attacker/user profiles from config

---

## Summary

✅ Real-time log generation with configurable delays  
✅ Incremental file appending (one log at a time)  
✅ Uses realistic attacker and user profiles  
✅ Command-line interface with flexible options  
✅ Progress tracking and graceful interruption  
✅ Perfect for testing real-time detection systems  

The streaming generator bridges the gap between batch training data generation and live production log ingestion, enabling realistic testing of real-time threat detection systems.
