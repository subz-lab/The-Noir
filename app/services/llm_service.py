import os
import re
from typing import Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    """
    Service for AI-powered security analysis and incident reporting.
    Wraps GPT-4 logic and heuristic severity scoring.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
        
        self.model = os.getenv("MODEL_NAME", "gpt-4")
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
            return f"# [MOCK] Incident Report\nSeverity: {severity_data['label']}\nAnalysis: Mock report generated (API key missing)."

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
            return f"# [ERROR] Incident Report\nCould not generate report: {str(e)}"

# Singleton instance
llm_service = LLMService()

def get_llm_service():
    return llm_service
