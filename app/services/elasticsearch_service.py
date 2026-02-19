import os
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

class ElasticsearchService:
    """
    Service for interacting with Elasticsearch to retrieve security logs.
    """
    
    def __init__(self):
        self.es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
        self.index_name = os.getenv("ES_LOG_INDEX", "server-logs-*")
        try:
            self.client = Elasticsearch(self.es_url)
            if not self.client.ping():
                print(f"⚠ Warning: Could not connect to Elasticsearch at {self.es_url}")
                self.client = None
        except Exception as e:
            print(f"Error initializing Elasticsearch client: {e}")
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
            print(f"Error searching Elasticsearch: {e}")
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
            print(f"Error searching logs by IP: {e}")
            return []

# Singleton instance
es_service = ElasticsearchService()

def get_es_service():
    return es_service
