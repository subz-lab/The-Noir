#!/bin/bash
# Script to apply Elasticsearch index template

echo "Applying Elasticsearch index template..."

# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green\|yellow"'; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

echo "Elasticsearch is ready!"

# Apply the index template
curl -X PUT "http://localhost:9200/_index_template/security-logs-template" \
  -H 'Content-Type: application/json' \
  -d @elasticsearch/index-template.json

echo ""
echo "✓ Index template applied successfully!"

# Verify template
echo ""
echo "Verifying template..."
curl -X GET "http://localhost:9200/_index_template/security-logs-template?pretty"
