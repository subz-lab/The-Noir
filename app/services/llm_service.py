import os
import re
import asyncio
from typing import Dict, Any, Optional
from openai import OpenAI, AuthenticationError, NotFoundError, RateLimitError

from app.core.config import settings
from app.core.logger import app_logger

class LLMService:
    """
    Service for AI-powered security analysis and incident reporting.
    Supports Groq (high-speed inference) and OpenAI models with heuristic fallbacks.
    """
    
    def __init__(self):
        # Priority: GROQ_API_KEY, then OPENAI_API_KEY
        self.groq_key = settings.GROQ_API_KEY or (settings.OPENAI_API_KEY if settings.OPENAI_API_KEY.startswith("gsk_") else "")
        self.openai_key = settings.OPENAI_API_KEY if not settings.OPENAI_API_KEY.startswith("gsk_") else ""
        
        if self.groq_key:
            self.provider = "Groq"
            self.api_key = self.groq_key
            self.client = OpenAI(base_url=settings.GROQ_BASE_URL, api_key=self.groq_key)
            self.model = settings.MODEL_NAME if settings.MODEL_NAME != "gpt-4" else "groq/compound"
            app_logger.info(f"Groq API Key verified. Initializing Groq Engine with model: {self.model}")
        elif self.openai_key:
            self.provider = "OpenAI"
            self.api_key = self.openai_key
            self.client = OpenAI(api_key=self.openai_key)
            self.model = settings.MODEL_NAME
            app_logger.info(f"OpenAI API Key verified. Initializing GPT Engine with model: {self.model}")
        else:
            self.provider = "Mock"
            self.client = None
            self.model = settings.MODEL_NAME
            app_logger.warning("No LLM API Key (Groq/OpenAI) found. Operating in HEURISTIC MOCK mode via BaseSettings.")

        self.sql_pattern = r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns the active LLM provider, configured model, and mode."""
        return {
            "provider": self.provider,
            "model": self.model,
            "is_live": bool(self.client),
            "mode": "Live LLM Inference" if self.client else "Heuristic Fallback",
        }

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

        # FIX: Wrap synchronous OpenAI client in asyncio.to_thread() to avoid
        # blocking the FastAPI event loop during LLM calls under concurrent load.
        def _call_llm():
            return self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional SOC analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

        try:
            response = await asyncio.to_thread(_call_llm)
            return response.choices[0].message.content
        except AuthenticationError:
            # FIX: Catch invalid/expired API key explicitly — never embed raw exception in reports.
            app_logger.error(f"{self.provider} AuthenticationError: API key is invalid or expired. Check GROQ_API_KEY in .env")
            return self._generate_heuristic_report(log_entry, ml_result, severity_data, f"HEURISTIC FALLBACK ({self.provider} Auth Failed — Check API Key)")
        except NotFoundError:
            app_logger.error(f"{self.provider} NotFoundError: Model '{self.model}' not found. Check MODEL_NAME in .env")
            return self._generate_heuristic_report(log_entry, ml_result, severity_data, f"HEURISTIC FALLBACK ({self.provider} Model Not Found)")
        except RateLimitError:
            app_logger.warning(f"{self.provider} RateLimitError: Rate limit hit. Falling back to heuristic report.")
            return self._generate_heuristic_report(log_entry, ml_result, severity_data, f"HEURISTIC FALLBACK ({self.provider} Rate Limit)")
        except Exception as e:
            error_msg = str(e)
            app_logger.error(f"{self.provider} API Error during report compilation: {error_msg}")
            if "insufficient_quota" in error_msg or "billing" in error_msg or "quota" in error_msg:
                app_logger.warning(f"Quota/billing issue — falling back to heuristic report.")
                return self._generate_heuristic_report(log_entry, ml_result, severity_data, f"HEURISTIC FALLBACK ({self.provider} Quota)")
            return self._generate_heuristic_report(log_entry, ml_result, severity_data, f"HEURISTIC FALLBACK ({self.provider} Error)")

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
