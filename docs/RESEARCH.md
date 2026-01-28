# Research Analysis: ML vs. Rule-Based Threat Detection

## Overview
This document summarizes the research findings for **The Noir** project. We evaluated two distinct approaches to threat detection: a behavioral **Machine Learning (Random Forest)** model and a traditional **Rule-Based Engine** using static thresholds.

## Evaluation Dataset
- **Total Logs Analyzed**: 24,787
- **Attack Types Layered**: Brute Force, Port Scanning, SQL Injection, DDoS.
- **Normal Traffic Ratio**: ~85% (Simulated background noise).

## Performance Comparison Table

| Metric | ML Model (Behavioral) | Rule Engine (Thresholds) | Delta |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 90.10% | 87.44% | +2.66% ML |
| **False Positive Rate** | 0.00% | 0.00% | 0% (Equiv) |
| **Avg. Inference Latency** | 5.2908 ms | 0.0236 ms | +5.26 ms (Rule) |
| **Complexity** | High (Stateful) | Low (Stateless) | - |

## Key Findings

### 1. The Accuracy Gap
The ML model outperformed the static rule engine by **2.66%**. While the rule engine is effective at catching obvious "smash and grab" attacks (e.g., 10+ failed logins), the ML model's ability to recognize patterns in request frequency and temporal gaps allows it to flag suspicious behavior that hasn't yet crossed a hard threshold.

### 2. Latency vs. Intelligence
The Rule Engine is approximately **220x faster** than the ML model. 
- **Rule Engine (0.02ms)**: Ideal for high-throughput edge filtering.
- **ML Model (5.29ms)**: While slower, it is still well within the requirements for real-time SOC monitoring (sub-10ms). 

### 3. False Positive Suppression
Both systems achieved a 0% False Positive Rate on the "Threat" category within this controlled simulation. This is largely due to the highly distinct signatures of the simulated attacks. In a real-production environment, we expect the ML model to show significantly lower FPR than static rules as it adapts to "Normal" baseline drift.

## Future Recommendations
1. **Hybrid Layering**: Use the Rule Engine as a "First-Pass" filter to drop 90% of noise, and pass survivors to the ML Model for forensic classification.
2. **Online Learning**: Implement model retraining pipelines to adapt to new attacker profiles identified by human analysts.
3. **Hardware Acceleration**: For multi-GB/s log streams, port the Random Forest inference to specialized C++ backends or GPU runtimes.

---
*Audit conducted on 2026-01-28 using `scripts/research_audit.py`*
