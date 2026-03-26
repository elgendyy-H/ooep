from ..celery_app import celery_app
from ..services.compliance import revalidate_all_compliance

@celery_app.task
def revalidate_all():
    revalidate_all_compliance()