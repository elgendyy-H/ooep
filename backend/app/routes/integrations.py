from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..database import get_db
from ..models import Integration, User
from ..utils.auth import get_current_user
from ..services.integration import SlackIntegration, EmailIntegration, JiraIntegration, GitHubIntegration
import json

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("/", response_model=list[schemas.IntegrationResponse])
async def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    integrations = db.query(Integration).filter(Integration.user_id == current_user.id).all()
    return integrations

@router.post("/{service}/test")
async def test_integration(
    service: str,
    config: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if service == "slack":
        if "webhook_url" not in config:
            raise HTTPException(400, "Missing webhook_url")
        slack = SlackIntegration(config["webhook_url"])
        success = await slack.test_connection()
        return {"success": success}
    elif service == "email":
        required = ["smtp_server", "smtp_port", "username", "password"]
        for field in required:
            if field not in config:
                raise HTTPException(400, f"Missing {field}")
        email = EmailIntegration(**{k: config[k] for k in required})
        success = await email.test_connection()
        return {"success": success}
    elif service == "jira":
        required = ["url", "username", "password", "project_key"]
        for field in required:
            if field not in config:
                raise HTTPException(400, f"Missing {field}")
        jira = JiraIntegration(**{k: config[k] for k in required})
        success = await jira.test_connection()
        return {"success": success}
    elif service == "github":
        if "token" not in config:
            raise HTTPException(400, "Missing token")
        github = GitHubIntegration(config["token"], config.get("repository"))
        success = await github.test_connection()
        return {"success": success}
    raise HTTPException(400, "Unsupported service")

@router.post("/{service}/configure")
async def configure_integration(
    service: str,
    config: schemas.IntegrationConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    integration = db.query(Integration).filter(
        Integration.service_name == service,
        Integration.user_id == current_user.id
    ).first()
    if not integration:
        integration = Integration(
            user_id=current_user.id,
            service_name=service,
            config=config.config_data,
            is_active=config.is_active
        )
        db.add(integration)
    else:
        integration.config = config.config_data
        integration.is_active = config.is_active
    db.commit()
    return {"message": "Configuration saved"}