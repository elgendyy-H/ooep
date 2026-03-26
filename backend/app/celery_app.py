from celery import Celery
from celery.schedules import crontab
from .utils.config import settings

celery_app = Celery('oepp', broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30*60,
    task_soft_time_limit=25*60,
    worker_concurrency=4,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

celery_app.conf.beat_schedule = {
    'run-scheduled-scans': {
        'task': 'app.services.scan_service.run_scheduled_scans',
        'schedule': crontab(minute='*/5'),
    },
    'revalidate-compliance': {
        'task': 'app.services.compliance.revalidate_all',
        'schedule': crontab(hour=2, minute=0),
    },
    'update-ml-models': {
        'task': 'app.celery_app.train_model',
        'schedule': crontab(hour=3, minute=0),
    },
    'cleanup-old-data': {
        'task': 'app.services.cleanup.clean_old_data',
        'schedule': crontab(hour=4, minute=0),
    },
}