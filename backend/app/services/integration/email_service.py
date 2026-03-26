import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import List

logger = logging.getLogger(__name__)

class EmailIntegration:
    def __init__(self, smtp_server: str, smtp_port: int, username: str, password: str):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password

    async def send_email(self, recipients: List[str], subject: str, body: str) -> bool:
        try:
            message = MIMEMultipart()
            message["From"] = self.username
            message["To"] = ", ".join(recipients)
            message["Subject"] = subject
            message.attach(MIMEText(body, "html"))

            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(message)
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return False

    async def test_connection(self) -> bool:
        # In a real implementation, send a test email
        return True