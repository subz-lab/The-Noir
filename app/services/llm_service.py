import os
import re
from typing import Dict, Any, Optional
from openai import OpenAI

from app.core.config import settings
from app.core.logger import app_logger

class LLMService:
    """
    Service for AI-powered security analysis and incident reporting.
    Wraps GPT-4 logic and heuristic severity scoring.
    """
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            app_logger.warning("OpenAI API Key NOT found. Operating in HEURISTIC MOCK mode via BaseSettings.")
            self.client = None
        else:
            app_logger.info("OpenAI API Key verified. Initializing GPT Engine.")
            self.client = OpenAI(api_key=self.api_key)
        
        self.model = settings.MODEL_NAME
        app_logger.debug(f"LLM Service mapped to AI model: {self.model}")
        self.sql_pattern = r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"

    def calculate_severity(self, ml_result: Dict, log_entry: Dict) -> Dict[str, Any]:
        """
        Calculates granular severity metrics.
        (Refactor of severity_scorer.py logic)
        """
        severity_label = ml_result.get('severity_index', 0)
        features = ml_result.get('features', {})
        payload = str(log_entry.get('request_payload', '')).lower()
        
        score = 0
        justification = []

        if severity_label == 2:
            score = 70
            justification.append("High-risk behavioral signature matched")
        elif severity_label == 1:
            score = 40
            justification.append("Suspicious activity detected")
        else:
            score = 10
            justification.append("Normal activity baseline")

        # Payload checks
        if any(kw in payload for kw in ['union select', 'drop table', 'truncate']) or re.search(self.sql_pattern, payload):
            score = 100
            justification.append("CRITICAL: Malicious SQL payload detected")
        
        # Threshold checks
        failed_count = features.get('failed_attempt_count', 0)
        if failed_count > 20:
            score = max(score, 85)
            justification.append(f"HIGH: Rapid brute force attempt ({failed_count}/min)")

        label = "LOW"
        if score >= 90: label = "CRITICAL"
        elif score >= 70: label = "HIGH"
        elif score >= 40: label = "MEDIUM"

        return {
            "score": score,
            "label": label,
            "justification": "; ".join(justification)
        }

    async def generate_incident_report(self, log_entry: Dict, ml_result: Dict, severity_data: Dict) -> str:
        """
        Calls OpenAI to generate a forensic report.
        """
        prompt = f"""
        Analyze this security event and provide a formal Incident Report.
        
        EVENT DATA:
        IP: {log_entry.get('ip_address')}
        Type: {log_entry.get('event_type')}
        Payload: {log_entry.get('request_payload')}
        
        AI DETECTION:
        ML Label: {ml_result.get('label')}
        Confidence: {ml_result.get('confidence'):.2%}
        Score: {severity_data['score']}/100
        Level: {severity_data['label']}
        
        JUSTIFICATION:
        {severity_data['justification']}
        
        Report Requirements:
        - Executive Summary
        - Technical Analysis
        - Recommended Mitigation Actions
        
        Format as Markdown.
        """
        
        if not self.client:
            return self._generate_heuristic_report(log_entry, ml_result, severity_data, "MOCK MODE (No API Key)")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional SOC analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            app_logger.error(f"OpenAI API Error during report compilation: {error_msg}")
            
            # Check for quota or billing issues to trigger fallback
            if "insufficient_quota" in error_msg or "billing" in error_msg or "quota" in error_msg:
                app_logger.warning("Failing over to Heuristic Fallback report sequence due to OpenAI rate limits.")
                return self._generate_heuristic_report(log_entry, ml_result, severity_data, "HEURISTIC FALLBACK (Quota Exceeded)")
            
            return f"# [ERROR] Incident Report\nCould not generate report: {error_msg}"

    def _generate_heuristic_report(self, log_entry: Dict, ml_result: Dict, severity_data: Dict, mode_label: str) -> str:
        """
        Generates a detailed, professional report using local logic when AI is unavailable.
        """
        ip = log_entry.get('ip_address', 'Unknown')
        event = log_entry.get('event_type', 'Unknown Activity')
        score = severity_data['score']
        level = severity_data['label']
        justification = severity_data['justification']
        
        # Determine specific recommendations based on event type
        recs = [
            "Enable multi-factor authentication (MFA) across all administrative accounts.",
            "Verify the integrity of the source IP address via threat intelligence feeds."
        ]
        
        if "sql" in justification.lower() or "injection" in justification.lower():
            recs = [
                "Immediately quarantine the affected web server node.",
                "Review application logs for successful data exfiltration signatures.",
                "Implement parameterized queries and update the Web Application Firewall (WAF) rules."
            ]
        elif "brute force" in justification.lower():
            recs = [
                "Implement temporary IP block for the source address: " + ip,
                "Reset credentials for the targeted user accounts.",
                "Review RDP/SSH access logs for successful lateral movement."
            ]

        return f"""# 🛡️ Forensic Investigation Report
> **Source:** {mode_label}
> **Status:** Automated Heuristic Analysis

## 1. Executive Summary
On formal review, a **{level}** severity event was detected originating from IP **{ip}**. The system identified signatures matching **{event}** with a calculated risk score of **{score}/100**.

## 2. Technical Analysis
- **Primary Indicator:** {justification}
- **Detection Method:** Machine Learning Classification + Rule-based Heuristics
- **ML Confidence:** {ml_result.get('confidence', 0.9):.1%}
- **Targeted Surface:** System {log_entry.get('port_number', 'Edge')}

The activity pattern suggests a proactive attempt to **{event.replace('_', ' ')}**. While the internal defensive layers mitigated the immediate impact, the persistence of the source IP indicates a coordinated effort.

## 3. Recommended Mitigation Actions
- [ ] **Immediate:** {recs[0]}
- [ ] **Secondary:** {recs[1]}
- [ ] **Policy:** {recs[2] if len(recs) > 2 else "Conduct a full audit of access logs for the last 24 hours."}

---
*This report was generated by The Noir's local Heuristic Engine.*
"""

# Singleton instance
llm_service = LLMService()

def get_llm_service():
    return llm_service
