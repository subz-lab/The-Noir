"""
Real-Time Log Stream Generator
===============================
Generates security logs in real-time, appending to server_logs.json
one log at a time with realistic delays (0.2-0.5 seconds).

This simulates a live log stream for testing real-time detection systems.
"""

import json
import random
import time
import os
from datetime import datetime, timedelta
from typing import List, Dict
from log_generator import SecurityLogGenerator, AttackerProfile, NormalUserProfile


class RealTimeLogStreamer:
    """Generates and streams security logs in real-time."""
    
    def __init__(self, output_file: str = "data/server_logs.jsonl", delay_range: tuple = (0.2, 0.5)):
        self.output_file = output_file
        self.delay_range = delay_range  # (min, max) seconds between logs
        self.generator = SecurityLogGenerator(num_logs=30000)
        self.logs_generated = 0
        
        # Initialize or clear the output file
        if os.path.exists(self.output_file):
            print(f"⚠ Warning: {self.output_file} already exists.")
            response = input("  Clear existing file? (y/n): ").strip().lower()
            if response == 'y':
                with open(self.output_file, 'w') as f:
                    pass # Create empty file
                print(f"  ✓ Cleared {self.output_file}")
            else:
                print(f"  ✓ Will append to existing file")
        else:
            with open(self.output_file, 'w') as f:
                pass # Create empty file
            print(f"✓ Created {self.output_file}")
    
    def _append_log(self, log_entry: Dict):
        """Append a single log entry to the JSONL file."""
        with open(self.output_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        self.logs_generated += 1
    
    def _generate_single_log(self, timestamp: datetime) -> Dict:
        """Generate a single log entry."""
        # Randomly choose between normal user session, attack, or random event
        event_choice = random.random()
        
        if event_choice < 0.20:  # 20% chance of normal user activity
            user_profile = random.choice(self.generator.normal_user_profiles)
            # Check if within work hours
            if user_profile.work_hours[0] <= timestamp.hour <= user_profile.work_hours[1]:
                # Generate a single activity from this user
                activity_type = random.choice(['login_success', 'web_request', 'port_access', 'file_access'])
                
                if activity_type == 'login_success':
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": user_profile.ip_address,
                        "user_id": user_profile.user_id,
                        "event_type": "login_success",
                        "port_number": 22 if user_profile.role == 'developer' else 443,
                        "status": "success",
                        "request_payload": None
                    }
                elif activity_type == 'web_request':
                    endpoint = random.choice(self.generator.normal_endpoints)
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": user_profile.ip_address,
                        "user_id": user_profile.user_id,
                        "event_type": "web_request",
                        "port_number": random.choice(user_profile.typical_ports),
                        "status": "success",
                        "request_payload": f"GET {endpoint} HTTP/1.1"
                    }
                elif activity_type == 'port_access':
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": user_profile.ip_address,
                        "user_id": user_profile.user_id,
                        "event_type": "port_access",
                        "port_number": random.choice(user_profile.typical_ports),
                        "status": "success",
                        "request_payload": None
                    }
                else:  # file_access
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": user_profile.ip_address,
                        "user_id": user_profile.user_id,
                        "event_type": "file_access",
                        "port_number": random.choice([22, 445]),
                        "status": "success",
                        "request_payload": f"ACCESS {random.choice(self.generator.normal_files)}"
                    }
        
        elif event_choice < 0.25:  # 5% chance of attack activity
            attack_type = random.choice(['brute_force', 'port_scanner', 'sql_injector'])
            attacker = self.generator._get_attacker_by_type(attack_type)
            
            if attacker:
                if attack_type == 'brute_force':
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": attacker.ip_address,
                        "user_id": random.choice(attacker.target_users),
                        "event_type": "login_failed",
                        "port_number": random.choice(attacker.preferred_ports),
                        "status": "failed",
                        "request_payload": None
                    }
                elif attack_type == 'port_scanner':
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": attacker.ip_address,
                        "user_id": None,
                        "event_type": "port_access",
                        "port_number": random.choice(attacker.preferred_ports),
                        "status": random.choice(["success", "failed"]),
                        "request_payload": None
                    }
                else:  # sql_injector
                    injection = random.choice(self.generator.sql_injection_patterns)
                    endpoint = random.choice(self.generator.normal_endpoints)
                    return {
                        "timestamp": timestamp.isoformat() + "Z",
                        "ip_address": attacker.ip_address,
                        "user_id": random.choice(attacker.target_users) if attacker.target_users else None,
                        "event_type": "web_request",
                        "port_number": random.choice(attacker.preferred_ports),
                        "status": random.choice(["success", "failed"]),
                        "request_payload": f"GET {endpoint}?id={injection} HTTP/1.1"
                    }
        
        # Default: random normal event (75% of logs)
        event_type = random.choice(['login_success', 'login_failed', 'port_access', 'web_request', 'file_access'])
        
        if event_type == 'login_success':
            return self.generator._generate_login_success(timestamp.isoformat() + "Z")
        elif event_type == 'login_failed':
            return self.generator._generate_login_failed(timestamp.isoformat() + "Z")
        elif event_type == 'port_access':
            return self.generator._generate_port_access(timestamp.isoformat() + "Z")
        elif event_type == 'web_request':
            return self.generator._generate_web_request(timestamp.isoformat() + "Z")
        else:
            return self.generator._generate_file_access(timestamp.isoformat() + "Z")
    
    def stream_logs(self, num_logs: int = 100, verbose: bool = True):
        """
        Stream logs in real-time.
        
        Args:
            num_logs: Number of logs to generate
            verbose: Print progress updates
        """
        print("="*70)
        print("REAL-TIME LOG STREAMING")
        print("="*70)
        print(f"Target: {num_logs} logs")
        print(f"Delay: {self.delay_range[0]}-{self.delay_range[1]} seconds per log")
        print(f"Output: {self.output_file}")
        print()
        print("Starting stream... (Press Ctrl+C to stop)")
        print("-"*70)
        
        start_time = time.time()
        current_timestamp = datetime.now()
        
        try:
            for i in range(num_logs):
                # Generate log with current timestamp
                log_entry = self._generate_single_log(current_timestamp)
                
                # Append to file
                self._append_log(log_entry)
                
                # Progress update
                if verbose and (i + 1) % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = (i + 1) / elapsed
                    eta = (num_logs - i - 1) / rate if rate > 0 else 0
                    print(f"[{i+1:,}/{num_logs:,}] {log_entry['event_type']:15} | "
                          f"Rate: {rate:.1f} logs/sec | ETA: {eta:.0f}s")
                
                # Random delay before next log
                delay = random.uniform(self.delay_range[0], self.delay_range[1])
                time.sleep(delay)
                
                # Increment timestamp by delay
                current_timestamp += timedelta(seconds=delay)
        
        except KeyboardInterrupt:
            print("\n\n⚠ Stream interrupted by user")
        
        finally:
            elapsed = time.time() - start_time
            print("\n" + "="*70)
            print("STREAMING COMPLETE")
            print("="*70)
            print(f"Total logs generated: {self.logs_generated:,}")
            print(f"Time elapsed: {elapsed:.1f} seconds")
            print(f"Average rate: {self.logs_generated/elapsed:.2f} logs/second")
            print(f"Output file: {self.output_file}")
            print("="*70)


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Real-time security log stream generator')
    parser.add_argument('-n', '--num-logs', type=int, default=100,
                        help='Number of logs to generate (default: 100)')
    parser.add_argument('-o', '--output', type=str, default='server_logs.json',
                        help='Output file (default: server_logs.json)')
    parser.add_argument('--min-delay', type=float, default=0.2,
                        help='Minimum delay between logs in seconds (default: 0.2)')
    parser.add_argument('--max-delay', type=float, default=0.5,
                        help='Maximum delay between logs in seconds (default: 0.5)')
    parser.add_argument('-q', '--quiet', action='store_true',
                        help='Suppress progress updates')
    
    args = parser.parse_args()
    
    # Create streamer
    streamer = RealTimeLogStreamer(
        output_file=args.output,
        delay_range=(args.min_delay, args.max_delay)
    )
    
    # Start streaming
    streamer.stream_logs(
        num_logs=args.num_logs,
        verbose=not args.quiet
    )


if __name__ == "__main__":
    main()
