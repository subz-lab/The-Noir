import os
from elasticsearch import Elasticsearch
from typing import List, Dict, Any

from app.core.config import settings
from app.core.logger import app_logger

class ElasticsearchService:
    """
    Service for interacting with Elasticsearch to retrieve security logs.
    """
    
    def __init__(self):
        self.es_url = settings.ELASTICSEARCH_URL
        self.index_name = settings.ES_LOG_INDEX
        try:
            self.client = Elasticsearch(self.es_url)
            if not self.client.ping():
                app_logger.warning(f"Could not reach Elasticsearch ping destination at {self.es_url}. Operating in Memory Buffer failover.")
                self.client = None
            else:
                app_logger.info(f"Successfully connected to Elasticsearch node at {self.es_url}")
        except Exception as e:
            app_logger.error(f"Error initializing Elasticsearch telemetry hook: {e}", exc_info=True)
            self.client = None

    def get_latest_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetches the most recent logs from Elasticsearch.
        """
        if not self.client:
            return []

        query = {
            "query": {"match_all": {}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit
        }

        try:
            response = self.client.search(index=self.index_name, body=query)
            hits = response['hits']['hits']
            return [hit['_source'] for hit in hits]
        except Exception as e:
            app_logger.error(f"Error querying Elasticsearch block (get_latest_logs): {e}", exc_info=True)
            return []

    def get_logs_by_ip(self, ip_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Retrieves logs filtered by source IP address.
        """
        if not self.client:
            return []

        query = {
            "query": {"term": {"ip_address.keyword": ip_address}},
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": limit
        }

        try:
            response = self.client.search(index=self.index_name, body=query)
            hits = response['hits']['hits']
            return [hit['_source'] for hit in hits]
        except Exception as e:
            app_logger.error(f"Error searching logs by targeted IP stream: {e}", exc_info=True)
            return []

# Singleton instance
es_service = ElasticsearchService()

def get_es_service():
    return es_service
