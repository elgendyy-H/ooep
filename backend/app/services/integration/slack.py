import aiohttp
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SlackIntegration:
    def __init__(self, webhook_url: str, timeout: int = 10):
        self.webhook_url = webhook_url
        self.timeout = timeout

    async def send_notification(self, message: Dict[str, Any]) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=message, timeout=self.timeout) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
            return False

    async def test_connection(self) -> bool:
        test_message = {"text": "OEPP Platform Integration Test"}
        return await self.send_notification(test_message)