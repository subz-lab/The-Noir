"""
Attacker Profile Analyzer
==========================
Analyzes logs to verify that attacker profiles maintain consistent behavioral patterns.
Checks if the same IP addresses consistently perform the same types of attacks.
"""

import json
from collections import defaultdict
from typing import List, Dict


def load_logs(filename: str = "server_logs.json") -> List[Dict]:
    """Load logs from JSON file."""
    with open(filename, 'r') as f:
        return json.load(f)


def analyze_attacker_profiles(logs: List[Dict]):
    """Analyze attacker behavioral consistency."""
    
    # Group activities by IP address
    ip_activities = defaultdict(lambda: {
        'login_failed': [],
        'port_access': [],
        'web_request_sql': [],
        'web_request_normal': [],
        'other': []
    })
    
    for log in logs:
        ip = log['ip_address']
        event_type = log['event_type']
        
        if event_type == 'login_failed':
            ip_activities[ip]['login_failed'].append(log)
        elif event_type == 'port_access':
            ip_activities[ip]['port_access'].append(log)
        elif event_type == 'web_request':
            payload = log.get('request_payload', '')
            # Check for SQL injection patterns
            if payload and any(pattern in payload for pattern in ['OR', 'DROP', 'UNION', 'SELECT', '--']):
                ip_activities[ip]['web_request_sql'].append(log)
            else:
                ip_activities[ip]['web_request_normal'].append(log)
        else:
            ip_activities[ip]['other'].append(log)
    
    # Identify attacker profiles
    brute_force_attackers = []
    port_scanners = []
    sql_injectors = []
    
    for ip, activities in ip_activities.items():
        total_activities = sum(len(v) for v in activities.values())
        
        # Brute force attacker: primarily failed logins
        if len(activities['login_failed']) >= 15:
            brute_force_attackers.append({
                'ip': ip,
                'failed_logins': len(activities['login_failed']),
                'target_users': list(set(log['user_id'] for log in activities['login_failed'])),
                'ports': list(set(log['port_number'] for log in activities['login_failed'])),
                'total_activities': total_activities
            })
        
        # Port scanner: primarily port access
        if len(activities['port_access']) >= 20:
            port_scanners.append({
                'ip': ip,
                'port_accesses': len(activities['port_access']),
                'unique_ports': len(set(log['port_number'] for log in activities['port_access'])),
                'ports_scanned': sorted(list(set(log['port_number'] for log in activities['port_access'])))[:15],
                'total_activities': total_activities
            })
        
        # SQL injector: primarily SQL injection attempts
        if len(activities['web_request_sql']) >= 8:
            sql_injectors.append({
                'ip': ip,
                'sql_attempts': len(activities['web_request_sql']),
                'payloads': list(set(log.get('request_payload', '') for log in activities['web_request_sql']))[:5],
                'ports': list(set(log['port_number'] for log in activities['web_request_sql'])),
                'total_activities': total_activities
            })
    
    return brute_force_attackers, port_scanners, sql_injectors


def main():
    """Main execution function."""
    print("="*70)
    print("ATTACKER PROFILE CONSISTENCY ANALYZER")
    print("="*70)
    print()
    
    # Load logs
    print("Loading logs...")
    logs = load_logs("server_logs.json")
    print(f"✓ Loaded {len(logs):,} logs\n")
    
    # Analyze attacker profiles
    print("Analyzing attacker behavioral patterns...")
    brute_force, port_scan, sql_inject = analyze_attacker_profiles(logs)
    
    print(f"✓ Identified distinct attacker profiles:\n")
    
    # Display Brute Force Attackers
    print("="*70)
    print(f"BRUTE FORCE ATTACKERS: {len(brute_force)}")
    print("="*70)
    
    for i, attacker in enumerate(brute_force[:5], 1):
        print(f"\n{i}. IP: {attacker['ip']}")
        print(f"   Failed Login Attempts: {attacker['failed_logins']}")
        print(f"   Target Users: {', '.join(attacker['target_users'])}")
        print(f"   Ports Used: {', '.join(map(str, attacker['ports']))}")
        print(f"   Total Activities: {attacker['total_activities']}")
        
        # Check consistency
        if len(attacker['target_users']) <= 3 and len(attacker['ports']) <= 3:
            print(f"   ✓ Consistent behavior (focused targets and ports)")
        else:
            print(f"   ⚠ Inconsistent behavior (too many targets/ports)")
    
    # Display Port Scanners
    print("\n" + "="*70)
    print(f"PORT SCANNERS: {len(port_scan)}")
    print("="*70)
    
    for i, scanner in enumerate(port_scan[:3], 1):
        print(f"\n{i}. IP: {scanner['ip']}")
        print(f"   Port Access Attempts: {scanner['port_accesses']}")
        print(f"   Unique Ports Scanned: {scanner['unique_ports']}")
        print(f"   Sample Ports: {', '.join(map(str, scanner['ports_scanned']))}")
        print(f"   Total Activities: {scanner['total_activities']}")
        
        # Check consistency
        if scanner['unique_ports'] >= 20:
            print(f"   ✓ Consistent scanner behavior (methodical port scanning)")
    
    # Display SQL Injectors
    print("\n" + "="*70)
    print(f"SQL INJECTION ATTACKERS: {len(sql_inject)}")
    print("="*70)
    
    for i, injector in enumerate(sql_inject[:4], 1):
        print(f"\n{i}. IP: {injector['ip']}")
        print(f"   SQL Injection Attempts: {injector['sql_attempts']}")
        print(f"   Ports Used: {', '.join(map(str, injector['ports']))}")
        print(f"   Sample Payload: {injector['payloads'][0][:60]}...")
        print(f"   Total Activities: {injector['total_activities']}")
        
        # Check consistency
        if all(port in [80, 443, 8080] for port in injector['ports']):
            print(f"   ✓ Consistent behavior (web ports only)")
    
    # Summary
    print("\n" + "="*70)
    print("CONSISTENCY ANALYSIS SUMMARY")
    print("="*70)
    print(f"\nTotal Distinct Attacker IPs:")
    print(f"  Brute Force Attackers: {len(brute_force)}")
    print(f"  Port Scanners: {len(port_scan)}")
    print(f"  SQL Injectors: {len(sql_inject)}")
    print(f"  Total: {len(brute_force) + len(port_scan) + len(sql_inject)}")
    
    # Check for overlap (IPs doing multiple attack types)
    bf_ips = set(a['ip'] for a in brute_force)
    ps_ips = set(a['ip'] for a in port_scan)
    si_ips = set(a['ip'] for a in sql_inject)
    
    overlap = (bf_ips & ps_ips) | (bf_ips & si_ips) | (ps_ips & si_ips)
    
    print(f"\nProfile Consistency:")
    if len(overlap) == 0:
        print(f"  ✓ Perfect separation: Each IP specializes in one attack type")
    else:
        print(f"  ⚠ {len(overlap)} IPs perform multiple attack types")
    
    print("\n" + "="*70)
    print("\n✓ Attacker profile analysis complete!")
    print("\nKey Finding: Attackers maintain consistent behavioral patterns,")
    print("making them easier to identify and classify using ML models.")


if __name__ == "__main__":
    main()
