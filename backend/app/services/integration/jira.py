import aiohttp
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class JiraIntegration:
    def __init__(self, url: str, username: str, password: str, project_key: str):
        self.url = url.rstrip('/')
        self.username = username
        self.password = password
        self.project_key = project_key

    async def create_issue(self, summary: str, description: str) -> bool:
        issue_data = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": summary,
                "description": description,
                "issuetype": {"name": "Bug"}
            }
        }
        try:
            async with aiohttp.ClientSession() as session:
                auth = aiohttp.BasicAuth(self.username, self.password)
                async with session.post(f"{self.url}/rest/api/2/issue", json=issue_data, auth=auth) as resp:
                    return resp.status == 201
        except Exception as e:
            logger.error(f"Jira issue creation failed: {e}")
            return False

    async def test_connection(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                auth = aiohttp.BasicAuth(self.username, self.password)
                async with session.get(f"{self.url}/rest/api/2/project/{self.project_key}", auth=auth) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"Jira connection test failed: {e}")
            return False