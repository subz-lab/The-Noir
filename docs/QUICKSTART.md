# Quick Start - ELK Stack

## 1. Start the Stack

```bash
docker-compose up -d
```

## 2. Wait 2-5 Minutes

Monitor startup:
```bash
docker-compose logs -f
```

## 3. Verify Services

```bash
# Elasticsearch
curl http://localhost:9200

# Kibana (open in browser)
http://localhost:5601
```

## 4. Ingest Logs

```bash
# Restart Logstash to read server_logs.json
docker-compose restart logstash
```

## 5. View in Kibana

1. Open http://localhost:5601
2. Create index pattern: `security-logs-*`
3. Go to Discover → See your logs!

---

## Troubleshooting

**Elasticsearch won't start?**
- Increase Docker memory to 4GB+
- Docker Desktop → Settings → Resources

**No logs in Kibana?**
```bash
# Check if data was ingested
curl http://localhost:9200/_cat/indices?v

# Restart Logstash
docker-compose restart logstash
```

**Port conflicts?**
```bash
# Stop all services
docker-compose down

# Start again
docker-compose up -d
```

---

## Stop Everything

```bash
# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

See **ELK_SETUP_GUIDE.md** for detailed documentation.
