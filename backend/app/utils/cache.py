import json
import redis.asyncio as redis
from .config import settings

class RedisCache:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)

    async def get(self, key: str):
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, key: str, value, ttl=300):
        await self.redis.setex(key, ttl, json.dumps(value))