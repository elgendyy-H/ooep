import aiohttp
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class GitHubIntegration:
    def __init__(self, token: str, repository: str = None):
        self.token = token
        self.repository = repository
        self.headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}

    async def create_issue(self, title: str, body: str) -> bool:
        if not self.repository:
            return False
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://api.github.com/repos/{self.repository}/issues"
                data = {"title": title, "body": body}
                async with session.post(url, json=data, headers=self.headers) as resp:
                    return resp.status == 201
        except Exception as e:
            logger.error(f"GitHub issue creation failed: {e}")
            return False

    async def test_connection(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://api.github.com/user", headers=self.headers) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"GitHub connection test failed: {e}")
            return False