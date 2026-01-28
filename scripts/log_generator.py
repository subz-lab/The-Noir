"""
AI-Powered SOC Automation - Security Log Generator
===================================================
Generates realistic server security logs for training and testing the SOC automation system.

This script simulates various security events including:
- Normal user logins
- Failed login attempts (potential brute force)
- Port access events
- Web requests (including suspicious patterns)
- File access events (including suspicious file operations)
- Time-based attack patterns:
  * Brute force attacks: 20 failed logins in 30 seconds from same IP
  * Slow port scans: 30 different ports over 5 minutes from same IP

Output: server_logs.json (30,000+ log entries)
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import ipaddress
from dataclasses import dataclass


@dataclass
class AttackerProfile:
    """Represents a consistent attacker with specific behavioral patterns."""
    ip_address: str
    attacker_type: str  # 'brute_force', 'port_scanner', 'sql_injector'
    target_users: List[str]
    preferred_ports: List[int]
    attack_frequency: str  # 'high', 'medium', 'low'
    
    def __repr__(self):
        return f"AttackerProfile({self.attacker_type}, {self.ip_address})"


@dataclass
class NormalUserProfile:
    """Represents a normal user with realistic human behavioral patterns."""
    user_id: str
    ip_address: str  # Usually consistent (home/office)
    role: str  # 'developer', 'analyst', 'manager', 'support'
    work_hours: tuple  # (start_hour, end_hour) in 24h format
    typical_ports: List[int]  # Ports they normally access
    activity_level: str  # 'high', 'medium', 'low'
    
    def __repr__(self):
        return f"NormalUserProfile({self.role}, {self.user_id})"


class SecurityLogGenerator:
    """Generates realistic security logs with various event types and attack patterns."""
    
    def __init__(self, num_logs: int = 30000):
        self.num_logs = num_logs
        self.logs: List[Dict] = []
        
        # Realistic data pools
        self.normal_users = [f"user_{i:04d}" for i in range(1, 501)]  # 500 normal users
        self.suspicious_users = ["admin", "root", "test", "guest", "administrator"]
        
        # IP address pools
        self.internal_ips = self._generate_internal_ips(200)
        self.external_ips = self._generate_external_ips(100)
        self.suspicious_ips = self._generate_suspicious_ips(20)
        
        # Port configurations
        self.common_ports = [80, 443, 22, 21, 3306, 5432, 8080, 8443]
        self.suspicious_ports = [4444, 31337, 12345, 6666, 1337]
        self.high_ports = list(range(8000, 9000))
        
        # Web request patterns
        self.normal_endpoints = [
            "/api/users", "/api/products", "/api/orders", "/dashboard",
            "/login", "/logout", "/profile", "/settings", "/home"
        ]
        self.suspicious_endpoints = [
            "/admin/config", "/etc/passwd", "/../../../etc/shadow",
            "/wp-admin", "/phpmyadmin", "/admin/login"
        ]
        self.sql_injection_patterns = [
            "' OR '1'='1", "'; DROP TABLE users--", "' UNION SELECT * FROM passwords--",
            "admin'--", "1' OR '1' = '1'--", "' OR 1=1--", "' UNION ALL SELECT NULL--"
        ]
        
        # File paths
        self.normal_files = [
            "/var/www/html/index.html", "/home/user/document.pdf",
            "/var/log/app.log", "/tmp/upload.txt", "/data/report.csv"
        ]
        self.suspicious_files = [
            "/etc/passwd", "/etc/shadow", "/root/.ssh/id_rsa",
            "/var/www/.htpasswd", "/home/user/.bash_history"
        ]
        
        # Event type distributions (weighted probabilities)
        self.event_weights = {
            "login_success": 40,
            "login_failed": 15,
            "port_access": 20,
            "web_request": 20,
            "file_access": 5
        }
        
        # Attacker profiles - consistent behavioral patterns
        self.attacker_profiles: List[AttackerProfile] = self._create_attacker_profiles()
        
        # Normal user profiles - realistic human behavior
        self.normal_user_profiles: List[NormalUserProfile] = self._create_normal_user_profiles()
        
    def _generate_internal_ips(self, count: int) -> List[str]:
        """Generate realistic internal IP addresses (192.168.x.x, 10.x.x.x)."""
        ips = []
        for _ in range(count):
            if random.random() < 0.7:
                # 192.168.x.x range
                ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 254)}"
            else:
                # 10.x.x.x range
                ip = f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
            ips.append(ip)
        return ips
    
    def _generate_external_ips(self, count: int) -> List[str]:
        """Generate realistic external IP addresses."""
        ips = []
        for _ in range(count):
            # Avoid private ranges
            while True:
                ip = f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
                if not (ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172.")):
                    ips.append(ip)
                    break
        return ips
    
    def _generate_suspicious_ips(self, count: int) -> List[str]:
        """Generate IPs that will be flagged as suspicious (simulated threat intelligence)."""
        # These represent known malicious IPs in our simulation
        return [f"185.{random.randint(100, 200)}.{random.randint(0, 255)}.{random.randint(1, 254)}" 
                for _ in range(count)]
    
    def _create_attacker_profiles(self) -> List[AttackerProfile]:
        """Create distinct attacker profiles with consistent behaviors."""
        profiles = []
        
        # Brute Force Attackers (5 profiles)
        # Characteristics: Target admin accounts, use SSH/RDP, high frequency
        for i in range(5):
            profiles.append(AttackerProfile(
                ip_address=random.choice(self.suspicious_ips[:10]),
                attacker_type='brute_force',
                target_users=random.sample(self.suspicious_users, 2),  # Focus on 2 admin accounts
                preferred_ports=[22, 3389, 21],  # SSH, RDP, FTP
                attack_frequency='high'
            ))
        
        # Port Scanners (3 profiles)
        # Characteristics: Scan many ports, no specific user, methodical
        for i in range(3):
            profiles.append(AttackerProfile(
                ip_address=random.choice(self.suspicious_ips[10:15]),
                attacker_type='port_scanner',
                target_users=[],  # Port scans don't target users
                preferred_ports=self.common_ports + self.suspicious_ports + random.sample(self.high_ports, 20),
                attack_frequency='medium'
            ))
        
        # SQL Injection Attackers (4 profiles)
        # Characteristics: Target web endpoints, use SQL payloads, medium frequency
        for i in range(4):
            profiles.append(AttackerProfile(
                ip_address=random.choice(self.suspicious_ips[15:]),
                attacker_type='sql_injector',
                target_users=random.sample(self.normal_users, 3),  # Sometimes use normal user context
                preferred_ports=[80, 443, 8080],  # Web ports
                attack_frequency='medium'
            ))
        
        return profiles
    
    def _get_attacker_by_type(self, attacker_type: str) -> Optional[AttackerProfile]:
        """Get a random attacker of specific type."""
        attackers = [a for a in self.attacker_profiles if a.attacker_type == attacker_type]
        return random.choice(attackers) if attackers else None
    
    def _create_normal_user_profiles(self) -> List[NormalUserProfile]:
        """Create normal user profiles with realistic human behavioral patterns."""
        profiles = []
        
        # Developers (20 profiles) - High activity, technical ports
        for i in range(20):
            user = random.choice(self.normal_users)
            profiles.append(NormalUserProfile(
                user_id=user,
                ip_address=random.choice(self.internal_ips),
                role='developer',
                work_hours=(9, 18),  # 9 AM to 6 PM
                typical_ports=[22, 443, 8080, 3306, 5432],  # SSH, HTTPS, dev servers, databases
                activity_level='high'
            ))
        
        # Analysts (15 profiles) - Medium activity, web-focused
        for i in range(15):
            user = random.choice(self.normal_users)
            profiles.append(NormalUserProfile(
                user_id=user,
                ip_address=random.choice(self.internal_ips),
                role='analyst',
                work_hours=(8, 17),  # 8 AM to 5 PM
                typical_ports=[80, 443, 8080],  # Web browsing, dashboards
                activity_level='medium'
            ))
        
        # Managers (10 profiles) - Low activity, basic web access
        for i in range(10):
            user = random.choice(self.normal_users)
            profiles.append(NormalUserProfile(
                user_id=user,
                ip_address=random.choice(self.internal_ips),
                role='manager',
                work_hours=(9, 17),  # 9 AM to 5 PM
                typical_ports=[80, 443],  # Basic web access
                activity_level='low'
            ))
        
        # Support Staff (10 profiles) - Medium activity, varied hours
        for i in range(10):
            user = random.choice(self.normal_users)
            profiles.append(NormalUserProfile(
                user_id=user,
                ip_address=random.choice(self.internal_ips),
                role='support',
                work_hours=(7, 19),  # 7 AM to 7 PM (longer hours)
                typical_ports=[80, 443, 22, 21],  # Web + some technical access
                activity_level='medium'
            ))
        
        return profiles
    
    def _generate_normal_user_session(self, user_profile: NormalUserProfile, base_timestamp: datetime) -> List[Dict]:
        """Generate a realistic user session with natural time gaps and activities."""
        session_logs = []
        
        # Check if timestamp is within user's work hours
        hour = base_timestamp.hour
        if hour < user_profile.work_hours[0] or hour > user_profile.work_hours[1]:
            return []  # User not active outside work hours
        
        # Determine session length based on activity level
        if user_profile.activity_level == 'high':
            num_activities = random.randint(8, 15)
        elif user_profile.activity_level == 'medium':
            num_activities = random.randint(4, 8)
        else:  # low
            num_activities = random.randint(2, 5)
        
        current_time = base_timestamp
        
        # 1. Login (successful)
        session_logs.append({
            "timestamp": current_time.isoformat() + "Z",
            "ip_address": user_profile.ip_address,  # Consistent IP
            "user_id": user_profile.user_id,
            "event_type": "login_success",
            "port_number": 22 if 'developer' in user_profile.role else 443,
            "status": "success",
            "request_payload": None
        })
        
        # 2. Normal activities with realistic time gaps
        for i in range(num_activities):
            # Natural time gap: 2-15 minutes between activities
            time_gap = random.randint(120, 900)  # 2-15 minutes in seconds
            current_time += timedelta(seconds=time_gap)
            
            # Choose activity type based on role
            if user_profile.role == 'developer':
                # Developers: code commits, database access, API calls
                activity_type = random.choice(['web_request', 'port_access', 'file_access'])
            elif user_profile.role == 'analyst':
                # Analysts: dashboard viewing, report generation
                activity_type = random.choice(['web_request', 'web_request', 'file_access'])
            else:
                # Managers/Support: mostly web browsing
                activity_type = 'web_request'
            
            if activity_type == 'web_request':
                endpoint = random.choice(self.normal_endpoints)
                port = random.choice(user_profile.typical_ports)
                session_logs.append({
                    "timestamp": current_time.isoformat() + "Z",
                    "ip_address": user_profile.ip_address,
                    "user_id": user_profile.user_id,
                    "event_type": "web_request",
                    "port_number": port,
                    "status": "success",
                    "request_payload": f"GET {endpoint} HTTP/1.1"
                })
            elif activity_type == 'port_access':
                port = random.choice(user_profile.typical_ports)
                session_logs.append({
                    "timestamp": current_time.isoformat() + "Z",
                    "ip_address": user_profile.ip_address,
                    "user_id": user_profile.user_id,
                    "event_type": "port_access",
                    "port_number": port,
                    "status": "success",
                    "request_payload": None
                })
            else:  # file_access
                file_path = random.choice(self.normal_files)
                session_logs.append({
                    "timestamp": current_time.isoformat() + "Z",
                    "ip_address": user_profile.ip_address,
                    "user_id": user_profile.user_id,
                    "event_type": "file_access",
                    "port_number": random.choice([22, 445]),
                    "status": "success",
                    "request_payload": f"ACCESS {file_path}"
                })
        
        return session_logs
    
    def _random_timestamp(self, start_date: datetime, end_date: datetime) -> str:
        """Generate random timestamp within date range."""
        time_delta = end_date - start_date
        random_seconds = random.randint(0, int(time_delta.total_seconds()))
        random_time = start_date + timedelta(seconds=random_seconds)
        return random_time.isoformat() + "Z"
    
    def _generate_login_success(self, timestamp: str) -> Dict:
        """Generate successful login event."""
        # 95% normal users, 5% suspicious users
        if random.random() < 0.95:
            user = random.choice(self.normal_users)
            ip = random.choice(self.internal_ips)
        else:
            user = random.choice(self.suspicious_users)
            ip = random.choice(self.external_ips)
        
        return {
            "timestamp": timestamp,
            "ip_address": ip,
            "user_id": user,
            "event_type": "login_success",
            "port_number": 22 if random.random() < 0.7 else 3389,  # SSH or RDP
            "status": "success",
            "request_payload": None
        }
    
    def _generate_login_failed(self, timestamp: str) -> Dict:
        """Generate failed login event (potential brute force)."""
        # Failed logins are more likely to be attacks
        if random.random() < 0.6:
            # Brute force attempt
            user = random.choice(self.suspicious_users)
            ip = random.choice(self.suspicious_ips + self.external_ips)
        else:
            # Legitimate failed login
            user = random.choice(self.normal_users)
            ip = random.choice(self.internal_ips)
        
        return {
            "timestamp": timestamp,
            "ip_address": ip,
            "user_id": user,
            "event_type": "login_failed",
            "port_number": random.choice([22, 3389, 21]),
            "status": "failed",
            "request_payload": None
        }
    
    def _generate_port_access(self, timestamp: str) -> Dict:
        """Generate port access event."""
        # 80% normal ports, 20% suspicious
        if random.random() < 0.8:
            port = random.choice(self.common_ports + self.high_ports)
            ip = random.choice(self.internal_ips + self.external_ips)
            status = "success"
        else:
            # Suspicious port scan
            port = random.choice(self.suspicious_ports)
            ip = random.choice(self.suspicious_ips + self.external_ips)
            status = random.choice(["success", "failed"])
        
        return {
            "timestamp": timestamp,
            "ip_address": ip,
            "user_id": random.choice(self.normal_users) if random.random() < 0.7 else None,
            "event_type": "port_access",
            "port_number": port,
            "status": status,
            "request_payload": None
        }
    
    def _generate_web_request(self, timestamp: str) -> Dict:
        """Generate web request event (including potential attacks)."""
        # 85% normal requests, 15% suspicious
        if random.random() < 0.85:
            endpoint = random.choice(self.normal_endpoints)
            ip = random.choice(self.internal_ips + self.external_ips)
            payload = f"GET {endpoint} HTTP/1.1"
            status = "success"
        else:
            # Suspicious web request (SQL injection, path traversal, etc.)
            if random.random() < 0.5:
                # SQL injection attempt
                endpoint = random.choice(self.normal_endpoints)
                injection = random.choice(self.sql_injection_patterns)
                payload = f"GET {endpoint}?id={injection} HTTP/1.1"
            else:
                # Suspicious endpoint access
                endpoint = random.choice(self.suspicious_endpoints)
                payload = f"GET {endpoint} HTTP/1.1"
            
            ip = random.choice(self.suspicious_ips + self.external_ips)
            status = random.choice(["success", "failed"])
        
        return {
            "timestamp": timestamp,
            "ip_address": ip,
            "user_id": random.choice(self.normal_users) if random.random() < 0.5 else None,
            "event_type": "web_request",
            "port_number": random.choice([80, 443, 8080]),
            "status": status,
            "request_payload": payload
        }
    
    def _generate_file_access(self, timestamp: str) -> Dict:
        """Generate file access event (including suspicious file operations)."""
        # 70% normal file access, 30% suspicious
        if random.random() < 0.7:
            file_path = random.choice(self.normal_files)
            ip = random.choice(self.internal_ips)
            user = random.choice(self.normal_users)
            status = "success"
        else:
            # Suspicious file access
            file_path = random.choice(self.suspicious_files)
            ip = random.choice(self.suspicious_ips + self.external_ips)
            user = random.choice(self.suspicious_users) if random.random() < 0.5 else random.choice(self.normal_users)
            status = random.choice(["success", "failed"])
        
        return {
            "timestamp": timestamp,
            "ip_address": ip,
            "user_id": user,
            "event_type": "file_access",
            "port_number": random.choice([22, 21, 445]),  # SSH, FTP, SMB
            "status": status,
            "request_payload": f"ACCESS {file_path}"
        }
    
    def _generate_brute_force_attack(self, base_timestamp: datetime, attacker: Optional[AttackerProfile] = None) -> List[Dict]:
        """Generate a brute force attack: 20 failed login attempts in 30 seconds using consistent attacker profile."""
        attack_logs = []
        
        # Use attacker profile if provided, otherwise get a brute force attacker
        if attacker is None:
            attacker = self._get_attacker_by_type('brute_force')
        
        if attacker is None:
            return []  # No brute force attackers available
        
        # Use attacker's consistent IP and target users
        attacker_ip = attacker.ip_address
        target_user = random.choice(attacker.target_users)
        port = random.choice(attacker.preferred_ports)
        
        # Generate 20 failed attempts spread over 30 seconds
        for i in range(20):
            # Random offset within 30 seconds
            offset_seconds = random.uniform(0, 30)
            timestamp = (base_timestamp + timedelta(seconds=offset_seconds)).isoformat() + "Z"
            
            attack_logs.append({
                "timestamp": timestamp,
                "ip_address": attacker_ip,  # Consistent IP from profile
                "user_id": target_user,     # Consistent target from profile
                "event_type": "login_failed",
                "port_number": port,
                "status": "failed",
                "request_payload": None
            })
        
        return attack_logs
    
    def _generate_slow_port_scan(self, base_timestamp: datetime, attacker: Optional[AttackerProfile] = None) -> List[Dict]:
        """Generate a slow port scan: 30 different ports over 5 minutes using consistent attacker profile."""
        scan_logs = []
        
        # Use attacker profile if provided, otherwise get a port scanner
        if attacker is None:
            attacker = self._get_attacker_by_type('port_scanner')
        
        if attacker is None:
            return []  # No port scanners available
        
        # Use attacker's consistent IP and preferred ports
        scanner_ip = attacker.ip_address
        ports_to_scan = random.sample(attacker.preferred_ports, min(30, len(attacker.preferred_ports)))
        
        # Spread scans over 5 minutes (300 seconds)
        for i, port in enumerate(ports_to_scan):
            # Sequential scanning with small random delays (5-15 seconds between scans)
            offset_seconds = i * random.uniform(5, 15)
            if offset_seconds > 300:  # Cap at 5 minutes
                offset_seconds = 300
            
            timestamp = (base_timestamp + timedelta(seconds=offset_seconds)).isoformat() + "Z"
            
            # Most scans fail (port closed), some succeed
            status = "failed" if random.random() < 0.7 else "success"
            
            scan_logs.append({
                "timestamp": timestamp,
                "ip_address": scanner_ip,  # Consistent IP from profile
                "user_id": None,  # Port scans typically don't have user context
                "event_type": "port_access",
                "port_number": port,
                "status": status,
                "request_payload": None
            })
        
        return scan_logs
    
    def _generate_sql_injection_attack(self, base_timestamp: datetime, attacker: Optional[AttackerProfile] = None) -> List[Dict]:
        """Generate SQL injection attack: 10-15 injection attempts over 2 minutes using consistent attacker profile."""
        attack_logs = []
        
        # Use attacker profile if provided, otherwise get a SQL injector
        if attacker is None:
            attacker = self._get_attacker_by_type('sql_injector')
        
        if attacker is None:
            return []  # No SQL injectors available
        
        # Use attacker's consistent IP
        attacker_ip = attacker.ip_address
        num_attempts = random.randint(10, 15)
        
        # Generate injection attempts spread over 2 minutes (120 seconds)
        for i in range(num_attempts):
            # Random offset within 2 minutes
            offset_seconds = random.uniform(0, 120)
            timestamp = (base_timestamp + timedelta(seconds=offset_seconds)).isoformat() + "Z"
            
            # Choose injection pattern and endpoint
            injection_payload = random.choice(self.sql_injection_patterns)
            endpoint = random.choice(self.normal_endpoints)
            port = random.choice(attacker.preferred_ports)
            
            # Sometimes use a user context from attacker's target list
            user = random.choice(attacker.target_users) if attacker.target_users and random.random() < 0.3 else None
            
            # Most attempts fail, some succeed (vulnerable endpoint)
            status = "failed" if random.random() < 0.8 else "success"
            
            attack_logs.append({
                "timestamp": timestamp,
                "ip_address": attacker_ip,  # Consistent IP from profile
                "user_id": user,
                "event_type": "web_request",
                "port_number": port,
                "status": status,
                "request_payload": f"GET {endpoint}?id={injection_payload} HTTP/1.1"
            })
        
        return attack_logs
    
    def generate_logs(self) -> List[Dict]:
        """Generate all security logs with realistic distributions and time-based attack patterns."""
        print(f"Generating {self.num_logs:,} security logs...")
        print("  Including time-based attack patterns...")
        
        # Time range: last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Calculate how many logs to reserve for attack patterns
        # ~8% of logs will be part of coordinated attacks
        num_attack_logs = int(self.num_logs * 0.08)
        
        # ~20% of logs will be from normal user sessions (realistic human behavior)
        num_session_logs = int(self.num_logs * 0.20)
        
        num_normal_logs = self.num_logs - num_attack_logs - num_session_logs
        
        # Generate normal user sessions with realistic behavior
        print("  Generating normal user sessions...")
        num_sessions = 0
        session_attempts = 0
        max_attempts = 200  # Prevent infinite loop
        
        while len(self.logs) < num_session_logs and session_attempts < max_attempts:
            session_attempts += 1
            # Pick a random user profile
            user_profile = random.choice(self.normal_user_profiles)
            
            # Random time during the 30-day period
            session_start = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            
            # Generate session (will be empty if outside work hours)
            session_logs = self._generate_normal_user_session(user_profile, session_start)
            
            if session_logs:
                self.logs.extend(session_logs)
                num_sessions += 1
                
                if num_sessions % 20 == 0:
                    print(f"    Generated {num_sessions} user sessions ({len(self.logs):,} logs)...")
        
        print(f"  ✓ Generated {num_sessions} normal user sessions ({len(self.logs):,} logs)")
        
        # Generate time-based attack patterns using consistent attacker profiles
        print("  Generating brute force attacks...")
        num_brute_force = num_attack_logs // 3 // 20  # Each attack is 20 logs
        for _ in range(num_brute_force):
            # Random time for attack to start
            attack_start = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            attack_logs = self._generate_brute_force_attack(attack_start)
            self.logs.extend(attack_logs)
        
        print("  Generating slow port scans...")
        num_port_scans = num_attack_logs // 3 // 30  # Each scan is 30 logs
        for _ in range(num_port_scans):
            # Random time for scan to start
            scan_start = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            scan_logs = self._generate_slow_port_scan(scan_start)
            self.logs.extend(scan_logs)
        
        print("  Generating SQL injection attacks...")
        num_sql_attacks = num_attack_logs // 3 // 12  # Each attack is ~12 logs
        for _ in range(num_sql_attacks):
            # Random time for attack to start
            attack_start = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            attack_logs = self._generate_sql_injection_attack(attack_start)
            self.logs.extend(attack_logs)
        
        # Create weighted event type list for normal traffic
        event_types = []
        for event_type, weight in self.event_weights.items():
            event_types.extend([event_type] * weight)
        
        # Generate normal logs
        print("  Generating normal traffic...")
        for i in range(num_normal_logs):
            if (i + 1) % 5000 == 0:
                print(f"    Generated {i + 1:,} normal logs...")
            
            # Random timestamp
            timestamp = self._random_timestamp(start_date, end_date)
            
            # Select event type based on weights
            event_type = random.choice(event_types)
            
            # Generate appropriate log entry
            if event_type == "login_success":
                log = self._generate_login_success(timestamp)
            elif event_type == "login_failed":
                log = self._generate_login_failed(timestamp)
            elif event_type == "port_access":
                log = self._generate_port_access(timestamp)
            elif event_type == "web_request":
                log = self._generate_web_request(timestamp)
            else:  # file_access
                log = self._generate_file_access(timestamp)
            
            self.logs.append(log)
        
        # Sort logs by timestamp for realism
        print("  Sorting logs chronologically...")
        self.logs.sort(key=lambda x: x["timestamp"])
        
        print(f"✓ Successfully generated {len(self.logs):,} logs")
        print(f"  - Normal user sessions: {num_sessions}")
        print(f"  - Brute force attacks: {num_brute_force}")
        print(f"  - Port scans: {num_port_scans}")
        print(f"  - SQL injection attacks: {num_sql_attacks}")
        print(f"  - Random normal traffic: {num_normal_logs:,}")
        return self.logs
    
    def save_to_file(self, filename: str = "data/server_logs.jsonl"):
        """Save generated logs to JSONL file."""
        print(f"\nSaving logs to {filename} (JSONL format)...")
        
        with open(filename, 'w') as f:
            for log in self.logs:
                f.write(json.dumps(log) + '\n')
        
        # Calculate file size
        import os
        file_size = os.path.getsize(filename)
        size_mb = file_size / (1024 * 1024)
        
        print(f"✓ Logs saved successfully")
        print(f"  File: {filename}")
        print(f"  Size: {size_mb:.2f} MB")
        print(f"  Total logs: {len(self.logs):,}")
        
    def print_statistics(self):
        """Print statistics about generated logs."""
        print("\n" + "="*60)
        print("LOG GENERATION STATISTICS")
        print("="*60)
        
        # Event type distribution
        event_counts = {}
        status_counts = {"success": 0, "failed": 0}
        
        for log in self.logs:
            event_type = log["event_type"]
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            status_counts[log["status"]] += 1
        
        print("\nEvent Type Distribution:")
        for event_type, count in sorted(event_counts.items()):
            percentage = (count / len(self.logs)) * 100
            print(f"  {event_type:20s}: {count:6,} ({percentage:5.2f}%)")
        
        print("\nStatus Distribution:")
        for status, count in status_counts.items():
            percentage = (count / len(self.logs)) * 100
            print(f"  {status:20s}: {count:6,} ({percentage:5.2f}%)")
        
        # Unique counts
        unique_ips = len(set(log["ip_address"] for log in self.logs))
        unique_users = len(set(log["user_id"] for log in self.logs if log["user_id"]))
        unique_ports = len(set(log["port_number"] for log in self.logs))
        
        print(f"\nUnique Values:")
        print(f"  IP Addresses: {unique_ips}")
        print(f"  Users: {unique_users}")
        print(f"  Ports: {unique_ports}")
        
        print("\n" + "="*60)


def main():
    """Main execution function."""
    print("="*60)
    print("AI-Powered SOC Automation - Log Generator")
    print("="*60)
    print()
    
    # Generate 30,000 logs
    generator = SecurityLogGenerator(num_logs=30000)
    generator.generate_logs()
    generator.save_to_file("data/server_logs.jsonl")
    generator.print_statistics()
    
    print("\n✓ Log generation complete!")
    print("\nNext steps:")
    print("  1. Review server_logs.json")
    print("  2. Use these logs for ML model training")
    print("  3. Test threat classification algorithms")


if __name__ == "__main__":
    main()
