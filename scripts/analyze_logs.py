"""
Quick statistics analyzer for generated security logs
"""
import json
from collections import Counter

# Load logs
with open('server_logs.json', 'r') as f:
    data = json.load(f)

# Event distribution
events = Counter(log['event_type'] for log in data)
statuses = Counter(log['status'] for log in data)

print("="*60)
print("SECURITY LOG STATISTICS")
print("="*60)

print("\nEvent Distribution:")
for event_type, count in events.most_common():
    percentage = (count / len(data)) * 100
    print(f"  {event_type:20s}: {count:6,} ({percentage:5.1f}%)")

print("\nStatus Distribution:")
for status, count in statuses.items():
    percentage = (count / len(data)) * 100
    print(f"  {status:20s}: {count:6,} ({percentage:5.1f}%)")

# Unique values
unique_ips = len(set(log['ip_address'] for log in data))
unique_users = len(set(log['user_id'] for log in data if log['user_id']))
unique_ports = len(set(log['port_number'] for log in data))

print(f"\nUnique Values:")
print(f"  IP Addresses: {unique_ips:,}")
print(f"  Users: {unique_users:,}")
print(f"  Ports: {unique_ports:,}")

# Suspicious activity detection
suspicious_keywords = ['OR', 'DROP', 'UNION', 'passwd', 'shadow', 'wp-admin', 'phpmyadmin']
suspicious_users = ['admin', 'root', 'administrator', 'test', 'guest']
suspicious_ports = [4444, 31337, 12345, 6666, 1337]

suspicious = [
    log for log in data 
    if any(x in str(log.get('request_payload', '')) for x in suspicious_keywords)
    or log.get('user_id') in suspicious_users
    or log.get('port_number') in suspicious_ports
]

print(f"\nSuspicious Activity:")
print(f"  Total suspicious events: {len(suspicious):,} ({len(suspicious)/len(data)*100:.1f}%)")

# Failed logins
failed_logins = [log for log in data if log['event_type'] == 'login_failed']
print(f"  Failed login attempts: {len(failed_logins):,}")

# SQL injection attempts
sql_injections = [
    log for log in data 
    if log.get('request_payload') and any(x in log['request_payload'] for x in ['OR', 'DROP', 'UNION'])
]
print(f"  SQL injection attempts: {len(sql_injections):,}")

print(f"\nTotal Logs: {len(data):,}")
print("="*60)

# Sample suspicious logs
print("\nSample Suspicious Logs:")
print("-"*60)
for i, log in enumerate(suspicious[:3], 1):
    print(f"\n{i}. {log['event_type'].upper()}")
    print(f"   IP: {log['ip_address']}")
    print(f"   User: {log.get('user_id', 'N/A')}")
    print(f"   Port: {log['port_number']}")
    if log.get('request_payload'):
        print(f"   Payload: {log['request_payload']}")
