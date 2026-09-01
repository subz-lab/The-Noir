import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from threat_summary_formatter import ThreatSummaryFormatter
from severity_scorer import SeverityScorer
from report_storage import ReportStorage

# Load environment variables
load_dotenv()

class IncidentReportGenerator:
    """
    Uses OpenAI GPT-4 to generate detailed security incident reports 
    based on threat snapshots provided by the ThreatSummaryFormatter.
    """
    
    def __init__(self, api_key=None):
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if groq_key or (openai_key and openai_key.startswith("gsk_")):
            self.api_key = groq_key or openai_key
            self.client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=self.api_key)
            self.model = os.getenv("MODEL_NAME", "groq/compound")
        elif openai_key:
            self.api_key = openai_key
            self.client = OpenAI(api_key=self.api_key)
            self.model = os.getenv("MODEL_NAME", "gpt-4")
        else:
            print("⚠ Warning: No Groq/OpenAI API key found. Reports will be mocked.")
            self.client = None
            self.model = os.getenv("MODEL_NAME", "groq/compound")
        
        self.formatter = ThreatSummaryFormatter()
        self.scorer = SeverityScorer()
        self.storage = ReportStorage()

    def generate_report(self, log_entry, ml_result=None):
        """
        Generates a professional incident report using the LLM.
        """
        # 1. Calculate Granular Severity
        severity_data = self.scorer.calculate_severity(ml_result or {}, log_entry)
        
        # 2. Prepare context using the formatter
        context = self.formatter.format_threat_context(log_entry, ml_result)
        
        prompt = f"""
        You are a highly experienced Senior SOC Analyst and Incident Responder.
        Analyze the following security event snapshot and provide a formal Incident Report.
        
        {context}
        
        --- AUTOMATED RISK ASSESSMENT ---
        Calculated Severity Score: {severity_data['score']}/100
        Assigned Level: {severity_data['label']}
        Risk Justification: {severity_data['justification']}
        
        Your report MUST include the following sections:
        1. **Executive Summary**: High-level overview of what happened.
        2. **Technical Analysis**: Deep dive into the behavioral characteristics and potential impact.
        3. **Attack Classification**: Identify the specific type of attack (e.g., Brute Force, SQL Injection, Port Scan).
        4. **Severity Assessment**: Critical/High/Medium/Low with justification.
        5. **Immediate Mitigation Steps**: Actionable steps to stop the current threat.
        6. **Long-Term Protection**: Strategies to prevent this in the future.
        
        Format the response in clean Markdown.
        """
        
        report_content = ""
        if not self.client:
            report_content = self._mock_report(context)
        else:
            try:
                print(f"Requesting AI analysis for IP {log_entry.get('ip_address')}...")
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional security analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                report_content = response.choices[0].message.content
            except Exception as e:
                print(f"Error generating report: {e}")
                report_content = self._mock_report(context, error=str(e))
        
        # 3. Store the report
        self.storage.save_report(log_entry, ml_result, severity_data, report_content)
        
        return report_content

    def _mock_report(self, context, error=None):
        """Returns a generic template if API is unavailable."""
        error_msg = f"\n(Note: Generated via fallback mode due to: {error})" if error else "\n(Note: API Key missing, showing template)"
        
        report = f"""
# INCIDENT REPORT (DRAFT)
{error_msg}

## 1. Executive Summary
A security event was detected involving a potential threat from an external source.

## 2. Technical Analysis
The event shows activity consistent with automated scanning or unauthorized access attempts.
{context}

## 3. Attack Classification
Undetermined (Requires deeper investigation)

## 4. Severity Assessment
MEDIUM (Based on initial automated scoring)

## 5. Immediate Mitigation Steps
- Block Source IP at the firewall level.
- Audit the target user's account for successful follow-up actions.
- Review server logs for further lateral movement.

## 6. Long-Term Protection
- Implement multi-factor authentication.
- Deploy a Web Application Firewall (WAF).
- Adjust rate-limiting thresholds.
        """
        return report

# Test Block
if __name__ == "__main__":
    test_log = {
        "timestamp": "2026-01-28T21:00:45Z",
        "ip_address": "45.18.29.102",
        "user_id": "admin",
        "event_type": "login_failed",
        "port_number": 22,
        "status": "failed",
        "request_payload": None
    }
    
    test_ml = {
        "label": 2,
        "confidence": 0.992,
        "features": {
            "failed_attempt_count": 25,
            "unique_ports_accessed": 1,
            "request_frequency": 45,
            "sql_flag": 0,
            "time_gap": 0.2
        }
    }
    
    generator = IncidentReportGenerator()
    report = generator.generate_report(test_log, test_ml)
    print(report)
