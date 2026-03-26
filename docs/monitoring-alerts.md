
---

### 143. `docs/monitoring-alerts.md`
```markdown
# Monitoring and Alerts

## Overview

OEPP includes Prometheus for metrics collection and Grafana for dashboards. Alerts are configured to notify of critical issues.

## Components

- **Prometheus**: scrapes metrics from backend, postgres_exporter, redis_exporter, node_exporter.
- **Alertmanager**: forwards alerts to email, Slack, etc.
- **Grafana**: visualisation and alert management.

## Setup

1. Start monitoring stack:
   ```bash
   docker-compose up -d prometheus grafana alertmanager