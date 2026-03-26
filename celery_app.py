celery_app.conf.update(
    worker_concurrency=4,        # number of concurrent tasks per worker
    worker_prefetch_multiplier=1, # prevent queue hoarding
    task_acks_late=True,          # acknowledge after task completion
    task_reject_on_worker_lost=True,
)