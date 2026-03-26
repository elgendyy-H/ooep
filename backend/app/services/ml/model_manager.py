
import os
import logging
import joblib
from typing import Optional

logger = logging.getLogger(__name__)

class ModelManager:
    MODEL_PATH = "data/models/classifier.pkl"
    VECTORIZER_PATH = "data/models/vectorizer.pkl"
    _model = None
    _vectorizer = None

    @classmethod
    def load_model(cls):
        if cls._model is None and os.path.exists(cls.MODEL_PATH):
            cls._model = joblib.load(cls.MODEL_PATH)
            cls._vectorizer = joblib.load(cls.VECTORIZER_PATH)
            logger.info("Model loaded successfully")
        return cls._model, cls._vectorizer

    @classmethod
    def predict(cls, text: str) -> Optional[str]:
        model, vectorizer = cls.load_model()
        if model is None:
            return None
        X = vectorizer.transform([text])
        return model.predict(X)[0]

    @classmethod
    async def update_model(cls):
        # In production, call a background task to retrain
        logger.info("Model update requested. Use training script.")
        return {"status": "not implemented"}
