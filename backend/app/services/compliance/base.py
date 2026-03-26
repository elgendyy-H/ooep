from abc import ABC, abstractmethod

class ComplianceChecker(ABC):
    @abstractmethod
    async def check_all(self, targets, db, user_id) -> dict:
        pass