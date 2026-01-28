# Deployment Guide: The Noir Stack

## Prerequisites
- **Docker** & **Docker Compose**
- **OpenAI API Key** (Set in `.env`)

## 1. Quick Start
Deploy the entire stack (Elasticsearch, Logstash, Kibana, FastAPI, React Dashboard):

```bash
docker compose up -d --build
```

## 2. Service Access Points

| Service | Port | Description |
| :--- | :--- | :--- |
| **Dashboard** | `3000` | Analyst Web Interface |
| **Backend API** | `8000` | FastAPI Detection Hub |
| **Kibana** | `5601` | Raw Log Visualization |
| **Elasticsearch**| `9200` | Data Source |

## 3. Environment Configuration
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=sk-your-key-here
ELASTICSEARCH_URL=http://elasticsearch:9200
```

## 4. Scaling
To scale the worker/generator nodes:
```bash
docker compose up -d --scale generator=3
```

## 5. Troubleshooting
- **Logs**: `docker compose logs -f backend`
- **Restart**: `docker compose restart dashboard`
- **Cleanup**: `docker compose down -v` (Warning: deletes database volumes)

---
*For technical support, consult the Research findings in docs/RESEARCH.md*
