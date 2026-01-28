class SeverityScorer:
    """
    Logic to assign granular severity scores (0-100) and 
    labels (Low, Medium, High, Critical) based on ML features and payload context.
    """
    
    @staticmethod
    def calculate_severity(ml_result, log_entry):
        """
        Calculates a numerical score and categorical label.
        
        Args:
            ml_result (dict): {label: 0/1/2, confidence: float, features: {}}
            log_entry (dict): Raw log data.
            
        Returns:
            dict: {score: int, label: str, justification: str}
        """
        label = ml_result.get('label', 0)
        features = ml_result.get('features', {})
        payload = str(log_entry.get('request_payload', '')).lower()
        
        score = 0
        justification = []

        # 1. Base Score from ML Label
        if label == 2: # Threat
            score = 70
            justification.append("ML model identified high-risk attack pattern.")
        elif label == 1: # Suspicious
            score = 40
            justification.append("ML model identified suspicious behavioral deviation.")
        else:
            score = 10
            justification.append("Normal behavioral baseline.")

        # 2. SQL Injection Escalation
        if features.get('sql_flag') or any(kw in payload for kw in ['union select', 'drop table', 'truncate']):
            score = 100
            justification.append("CRITICAL: Confirmed malicious payload (SQL Injection).")
        
        # 3. Brute Force Intensity
        failed_count = features.get('failed_attempt_count', 0)
        if failed_count > 50:
            score = max(score, 90)
            justification.append(f"CRITICAL: Extreme brute force intensity ({failed_count} attempts/min).")
        elif failed_count > 20:
            score = max(score, 75)
            justification.append(f"HIGH: Sustained brute force attempt ({failed_count} attempts/min).")
        elif failed_count > 10:
            score = max(score, 50)
            justification.append(f"MEDIUM: Low-volume brute force signature ({failed_count} attempts/min).")

        # 4. Reconnaissance Variety
        port_count = features.get('unique_ports_accessed', 0)
        if port_count > 100:
            score = max(score, 80)
            justification.append(f"HIGH: Massive network reconnaissance ({port_count} ports).")
        elif port_count > 30:
            score = max(score, 60)
            justification.append(f"MEDIUM: Significant port scanning activity ({port_count} ports).")

        # 5. Frequency Multiplier
        freq = features.get('request_frequency', 0)
        if freq > 100:
            score = min(100, score + 10)
            justification.append("Alert escalated due to high event frequency.")

        # Map score to label
        if score >= 90:
            result_label = "CRITICAL"
        elif score >= 70:
            result_label = "HIGH"
        elif score >= 40:
            result_label = "MEDIUM"
        else:
            result_label = "LOW"

        return {
            "score": score,
            "label": result_label,
            "justification": "; ".join(justification)
        }

if __name__ == "__main__":
    # Test cases
    scorer = SeverityScorer()
    
    # Test 1: SQL Injection
    res1 = scorer.calculate_severity(
        {"label": 2, "features": {"sql_flag": 1}},
        {"request_payload": "SELECT * FROM users"}
    )
    print(f"Test 1 (SQL): {res1}")
    
    # Test 2: Intense Brute Force
    res2 = scorer.calculate_severity(
        {"label": 2, "features": {"failed_attempt_count": 60}},
        {}
    )
    print(f"Test 2 (Brute): {res2}")
    
    # Test 3: Moderate Scan
    res3 = scorer.calculate_severity(
        {"label": 1, "features": {"unique_ports_accessed": 40}},
        {}
    )
    print(f"Test 3 (Scan): {res3}")
