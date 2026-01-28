# The Noir

> **The ultimate Security Operations Center automation platform using Machine Learning and LLM-powered threat analysis**

## 🎯 Project Overview

This project addresses the critical problem of **alert fatigue** in Security Operations Centers (SOCs). Security teams are overwhelmed with thousands of daily alerts, with approximately 80% being false positives. This system automates threat detection, classification, and response using:

- **Machine Learning** for intelligent threat classification
- **LLM-powered analysis** for incident reports and mitigation strategies
- **Real-time monitoring** dashboard for security analysts
- **Comparative research** between ML and rule-based detection

---

## 📁 Project Structure

```
soc-automation/
├── log_generator.py          # Security log simulator (✓ Complete)
├── server_logs.json          # Generated security logs (30,000 entries)
├── requirements.txt          # Python dependencies (Coming soon)
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/              # Data models
│   ├── ml/                  # ML classifiers
│   │   ├── classifier.py    # ML-based detection
│   │   ├── rule_based.py    # Rule-based detection
│   │   └── trainer.py       # Model training
│   ├── llm/                 # LLM integration
│   │   ├── report_generator.py
│   │   └── mitigation.py
│   └── ingestion/           # Log processing
├── dashboard/               # Web dashboard
│   ├── index.html
│   ├── css/
│   └── js/
├── tests/                   # Unit tests
└── docs/                    # Documentation
```

---

## ✅ Part 1: Log Generator (COMPLETE)

### What It Does

The `log_generator.py` script creates **30,000 realistic security logs** simulating various security events:

- **Login Success** (40%) - Normal user authentication
- **Login Failed** (15%) - Failed attempts, potential brute force
- **Port Access** (20%) - Network port connections
- **Web Requests** (20%) - HTTP requests, including SQL injection attempts
- **File Access** (5%) - File operations, including suspicious system files

### Features

✓ **Realistic IP Distributions**
- Internal IPs (192.168.x.x, 10.x.x.x)
- External IPs (public ranges)
- Suspicious IPs (simulated threat intelligence)

✓ **Attack Pattern Simulation**
- SQL injection attempts
- Brute force login patterns
- Port scanning behavior
- Suspicious file access
- Path traversal attempts

✓ **Comprehensive Metadata**
- ISO 8601 timestamps
- User IDs (500 normal users + suspicious accounts)
- Port numbers (common + suspicious)
- Request payloads
- Status indicators

### Usage

```bash
# Generate 30,000 security logs
python log_generator.py
```

**Output:**
- File: `server_logs.json`
- Size: ~5-6 MB
- Format: JSON array of log objects

**Sample Log Entry:**
```json
{
  "timestamp": "2026-01-15T14:23:45.123456Z",
  "ip_address": "192.168.1.105",
  "user_id": "user_0042",
  "event_type": "login_success",
  "port_number": 22,
  "status": "success",
  "request_payload": null
}
```

### Statistics

The generator provides detailed statistics:
- Event type distribution
- Success/failure rates
- Unique IP addresses, users, and ports
- File size and log count

---

## 🚀 Next Steps

### Part 2: ML Threat Classifier (Coming Next)
- Feature extraction from logs
- Random Forest classifier training
- Model evaluation and persistence

### Part 3: Rule-Based Detector
- Pattern matching for known attacks
- Threshold-based anomaly detection
- Comparative analysis with ML

### Part 4: LLM Integration
- OpenAI API for incident reports
- AI-powered mitigation suggestions
- Contextual threat analysis

### Part 5: FastAPI Backend
- RESTful API endpoints
- Real-time alert processing
- Elasticsearch integration

### Part 6: Analyst Dashboard
- Real-time monitoring interface
- Threat visualization
- Interactive incident reports

### Part 7: Docker Deployment
- Multi-container orchestration
- ELK Stack integration
- Production-ready configuration

---

## 📊 Research Component

This project includes a comparative study:

**Research Question:** How does ML-based threat detection compare to traditional rule-based systems?

**Metrics:**
- Accuracy
- Precision & Recall
- F1 Score
- False Positive Rate
- Detection Speed

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python 3.11, FastAPI |
| ML | Scikit-learn (Random Forest) |
| LLM | OpenAI GPT-4 API |
| Database | Elasticsearch |
| Visualization | ELK Stack (Kibana) |
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Deployment | Docker, Docker Compose |

---

## 📝 Current Status

- [x] **Part 1: Log Generator** - ✅ Complete
- [ ] Part 2: ML Classifier
- [ ] Part 3: Rule-Based Detector
- [ ] Part 4: LLM Integration
- [ ] Part 5: API Development
- [ ] Part 6: Dashboard
- [ ] Part 7: Docker Deployment

---

## 📖 Documentation

- [Implementation Plan](docs/implementation_plan.md)
- [API Documentation](docs/API.md) - Coming soon
- [Research Findings](docs/RESEARCH.md) - Coming soon

---

## 🎓 Learning Outcomes

This project demonstrates:
- Real-world cybersecurity automation
- Machine learning in security operations
- LLM integration for intelligent analysis
- Full-stack development (Python + Web)
- DevOps practices (Docker, CI/CD)
- Research methodology and comparative analysis

---

## 📄 License

This is an educational project for demonstrating AI-powered SOC automation concepts.

---

**Built with ❤️ for cybersecurity automation and AI research**
