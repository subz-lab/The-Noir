"""
Time-Based Attack Pattern Detector
===================================
Analyzes server logs to detect time-based attack patterns:
- Brute force attacks (multiple failed logins from same IP in short time)
- Port scans (multiple port accesses from same IP in sequence)
"""

import json
from datetime import datetime
from collections import defaultdict
from typing import List, Dict


def load_logs(filename: str = "server_logs.json") -> List[Dict]:
    """Load logs from JSON file."""
    with open(filename, 'r') as f:
        return json.load(f)


def detect_brute_force_attacks(logs: List[Dict], time_window: int = 60, threshold: int = 10) -> List[Dict]:
    """
    Detect brute force attacks: multiple failed logins from same IP within time window.
    
    Args:
        logs: List of log entries
        time_window: Time window in seconds (default: 60)
        threshold: Minimum failed attempts to consider as attack (default: 10)
    
    Returns:
        List of detected brute force attack patterns
    """
    # Group failed logins by IP
    failed_logins_by_ip = defaultdict(list)
    
    for log in logs:
        if log['event_type'] == 'login_failed':
            failed_logins_by_ip[log['ip_address']].append(log)
    
    # Detect attacks
    attacks = []
    
    for ip, login_attempts in failed_logins_by_ip.items():
        if len(login_attempts) < threshold:
            continue
        
        # Sort by timestamp
        login_attempts.sort(key=lambda x: x['timestamp'])
        
        # Check for bursts within time window
        for i in range(len(login_attempts)):
            burst = [login_attempts[i]]
            start_time = datetime.fromisoformat(login_attempts[i]['timestamp'].replace('Z', ''))
            
            for j in range(i + 1, len(login_attempts)):
                current_time = datetime.fromisoformat(login_attempts[j]['timestamp'].replace('Z', ''))
                time_diff = (current_time - start_time).total_seconds()
                
                if time_diff <= time_window:
                    burst.append(login_attempts[j])
                else:
                    break
            
            if len(burst) >= threshold:
                end_time = datetime.fromisoformat(burst[-1]['timestamp'].replace('Z', ''))
                duration = (end_time - start_time).total_seconds()
                
                attacks.append({
                    'attack_type': 'brute_force',
                    'ip_address': ip,
                    'target_user': burst[0]['user_id'],
                    'attempts': len(burst),
                    'duration_seconds': duration,
                    'start_time': burst[0]['timestamp'],
                    'end_time': burst[-1]['timestamp'],
                    'port': burst[0]['port_number']
                })
                break  # Found attack for this IP
    
    return attacks


def detect_port_scans(logs: List[Dict], time_window: int = 600, threshold: int = 20) -> List[Dict]:
    """
    Detect port scans: multiple port accesses from same IP within time window.
    
    Args:
        logs: List of log entries
        time_window: Time window in seconds (default: 600 = 10 minutes)
        threshold: Minimum unique ports to consider as scan (default: 20)
    
    Returns:
        List of detected port scan patterns
    """
    # Group port accesses by IP
    port_accesses_by_ip = defaultdict(list)
    
    for log in logs:
        if log['event_type'] == 'port_access':
            port_accesses_by_ip[log['ip_address']].append(log)
    
    # Detect scans
    scans = []
    
    for ip, accesses in port_accesses_by_ip.items():
        if len(accesses) < threshold:
            continue
        
        # Sort by timestamp
        accesses.sort(key=lambda x: x['timestamp'])
        
        # Check for sequential port scanning within time window
        for i in range(len(accesses)):
            scan_events = [accesses[i]]
            unique_ports = {accesses[i]['port_number']}
            start_time = datetime.fromisoformat(accesses[i]['timestamp'].replace('Z', ''))
            
            for j in range(i + 1, len(accesses)):
                current_time = datetime.fromisoformat(accesses[j]['timestamp'].replace('Z', ''))
                time_diff = (current_time - start_time).total_seconds()
                
                if time_diff <= time_window:
                    scan_events.append(accesses[j])
                    unique_ports.add(accesses[j]['port_number'])
                else:
                    break
            
            if len(unique_ports) >= threshold:
                end_time = datetime.fromisoformat(scan_events[-1]['timestamp'].replace('Z', ''))
                duration = (end_time - start_time).total_seconds()
                
                scans.append({
                    'attack_type': 'port_scan',
                    'ip_address': ip,
                    'unique_ports': len(unique_ports),
                    'total_attempts': len(scan_events),
                    'duration_seconds': duration,
                    'start_time': scan_events[0]['timestamp'],
                    'end_time': scan_events[-1]['timestamp'],
                    'ports_scanned': sorted(list(unique_ports))[:10]  # Show first 10 ports
                })
                break  # Found scan for this IP
    
    return scans


def main():
    """Main execution function."""
    print("="*70)
    print("TIME-BASED ATTACK PATTERN DETECTOR")
    print("="*70)
    print()
    
    # Load logs
    print("Loading logs...")
    logs = load_logs("server_logs.json")
    print(f"✓ Loaded {len(logs):,} logs\n")
    
    # Detect brute force attacks
    print("Detecting brute force attacks...")
    print("  Criteria: 10+ failed logins from same IP within 60 seconds")
    brute_force_attacks = detect_brute_force_attacks(logs, time_window=60, threshold=10)
    print(f"✓ Found {len(brute_force_attacks)} brute force attacks\n")
    
    if brute_force_attacks:
        print("Sample Brute Force Attacks:")
        print("-"*70)
        for i, attack in enumerate(brute_force_attacks[:3], 1):
            print(f"\n{i}. Brute Force Attack")
            print(f"   Source IP: {attack['ip_address']}")
            print(f"   Target User: {attack['target_user']}")
            print(f"   Failed Attempts: {attack['attempts']}")
            print(f"   Duration: {attack['duration_seconds']:.1f} seconds")
            print(f"   Port: {attack['port']}")
            print(f"   Time: {attack['start_time'][:19]} to {attack['end_time'][11:19]}")
    
    # Detect port scans
    print("\n" + "="*70)
    print("Detecting port scans...")
    print("  Criteria: 20+ unique ports from same IP within 10 minutes")
    port_scans = detect_port_scans(logs, time_window=600, threshold=20)
    print(f"✓ Found {len(port_scans)} port scans\n")
    
    if port_scans:
        print("Sample Port Scans:")
        print("-"*70)
        for i, scan in enumerate(port_scans[:3], 1):
            print(f"\n{i}. Port Scan Attack")
            print(f"   Source IP: {scan['ip_address']}")
            print(f"   Unique Ports Scanned: {scan['unique_ports']}")
            print(f"   Total Attempts: {scan['total_attempts']}")
            print(f"   Duration: {scan['duration_seconds']:.1f} seconds ({scan['duration_seconds']/60:.1f} minutes)")
            print(f"   Sample Ports: {', '.join(map(str, scan['ports_scanned']))}")
            print(f"   Time: {scan['start_time'][:19]} to {scan['end_time'][11:19]}")
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Total Logs Analyzed: {len(logs):,}")
    print(f"Brute Force Attacks Detected: {len(brute_force_attacks)}")
    print(f"Port Scans Detected: {len(port_scans)}")
    print(f"Total Time-Based Attacks: {len(brute_force_attacks) + len(port_scans)}")
    
    if brute_force_attacks:
        avg_attempts = sum(a['attempts'] for a in brute_force_attacks) / len(brute_force_attacks)
        avg_duration = sum(a['duration_seconds'] for a in brute_force_attacks) / len(brute_force_attacks)
        print(f"\nBrute Force Statistics:")
        print(f"  Average attempts per attack: {avg_attempts:.1f}")
        print(f"  Average duration: {avg_duration:.1f} seconds")
    
    if port_scans:
        avg_ports = sum(s['unique_ports'] for s in port_scans) / len(port_scans)
        avg_duration = sum(s['duration_seconds'] for s in port_scans) / len(port_scans)
        print(f"\nPort Scan Statistics:")
        print(f"  Average unique ports per scan: {avg_ports:.1f}")
        print(f"  Average duration: {avg_duration:.1f} seconds ({avg_duration/60:.1f} minutes)")
    
    print("\n" + "="*70)
    print("\n✓ Attack pattern analysis complete!")


if __name__ == "__main__":
    main()
