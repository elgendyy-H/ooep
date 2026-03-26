#!/bin/bash
docker-compose exec backend python -c "from app.services.ml.model_manager import ModelManager; import asyncio; asyncio.run(ModelManager.update_model())"