# backend/app/core/scanner.py
import logging
import re
import subprocess
import asyncio
from typing import List, Dict, Any
from urllib.parse import urljoin, urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class OWASPScanner:
    """OWASP Top 10 vulnerability scanner with external tool integration."""

    def __init__(self, timeout=10):
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)
        self.session = httpx.Client(timeout=timeout, follow_redirects=True)  # sync for nmap etc.

    async def close(self):
        await self.client.aclose()

    # ------------------------------------------------------------------
    # External Tools
    # ------------------------------------------------------------------
    async def run_nmap(self, target_host: str) -> Dict[str, Any]:
        """Run nmap scan (simplified, non‑intrusive)."""
        try:
            # Basic port scan (use -sV for version detection)
            result = subprocess.run(
                ["nmap", "-sV", "-p-", "--open", target_host],
                capture_output=True,
                text=True,
                timeout=60
            )
            # Parse output (simplified)
            return {
                "tool": "nmap",
                "output": result.stdout,
                "open_ports": re.findall(r'(\d+)/tcp\s+open', result.stdout)
            }
        except Exception as e:
            logger.error(f"nmap failed: {e}")
            return {"error": str(e)}

    async def run_whatweb(self, target_url: str) -> Dict[str, Any]:
        """Run whatweb to detect technologies."""
        try:
            result = subprocess.run(
                ["whatweb", target_url],
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "tool": "whatweb",
                "output": result.stdout,
                "technologies": re.findall(r'\[(.*?)\]', result.stdout)
            }
        except Exception as e:
            logger.error(f"whatweb failed: {e}")
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------
    async def run_full_scan(self, target_url: str, include_external=True) -> Dict[str, Any]:
        """Run all OWASP tests plus optional external tools."""
        logger.info(f"Starting full scan on {target_url}")
        findings = []

        # Validate URL
        parsed = urlparse(target_url)
        if not parsed.scheme:
            target_url = "http://" + target_url
            parsed = urlparse(target_url)

        host = parsed.netloc.split(":")[0]

        # OWASP Top 10 modules
        findings.extend(await self.test_broken_access_control(target_url))
        findings.extend(await self.test_cryptographic_failures(target_url))
        findings.extend(await self.test_injection(target_url))
        findings.extend(await self.test_insecure_design(target_url))
        findings.extend(await self.test_security_misconfiguration(target_url))
        findings.extend(await self.test_vulnerable_components(target_url))
        findings.extend(await self.test_identification_auth_failures(target_url))
        findings.extend(await self.test_software_data_integrity_failures(target_url))
        findings.extend(await self.test_security_logging_monitoring_failures(target_url))
        findings.extend(await self.test_ssrf(target_url))

        # Additional: CSRF, XXE, Path Traversal
        findings.extend(await self.test_csrf(target_url))
        findings.extend(await self.test_xxe(target_url))
        findings.extend(await self.test_path_traversal(target_url))

        # External tools (optional)
        external = {}
        if include_external:
            external["nmap"] = await self.run_nmap(host)
            external["whatweb"] = await self.run_whatweb(target_url)
            # Add more tools as needed

        return {
            "target": target_url,
            "findings": findings,
            "external": external,
            "total_findings": len(findings)
        }

    # ------------------------------------------------------------------
    # Test methods
    # ------------------------------------------------------------------
    async def test_broken_access_control(self, url: str) -> List[Dict]:
        findings = []
        # Test for directory listing
        try:
            resp = await self.client.get(urljoin(url, "/"), params={"dir": ".."})
            if "Index of /" in resp.text or "Parent Directory" in resp.text:
                findings.append({
                    "title": "Directory Listing Enabled",
                    "description": "Directory listing is enabled, exposing file structure.",
                    "severity": "medium",
                    "location": url,
                    "remediation": "Disable directory indexing in web server configuration."
                })
        except Exception:
            pass

        # Test for IDOR by trying to access another user's data
        # (simplified: try to access /users/1, /users/2, etc.)
        for i in range(1, 4):
            try:
                resp = await self.client.get(urljoin(url, f"/api/users/{i}"))
                if resp.status_code == 200 and "email" in resp.text:
                    findings.append({
                        "title": "Potential IDOR",
                        "description": f"Endpoint /api/users/{i} is accessible without authentication.",
                        "severity": "high",
                        "location": urljoin(url, f"/api/users/{i}"),
                        "remediation": "Implement proper access controls and authentication."
                    })
                    break
            except Exception:
                pass

        return findings

    async def test_cryptographic_failures(self, url: str) -> List[Dict]:
        findings = []
        # Check if HTTPS is used
        if not url.startswith("https://"):
            findings.append({
                "title": "Missing HTTPS",
                "description": "The site does not enforce HTTPS.",
                "severity": "high",
                "location": url,
                "remediation": "Redirect all traffic to HTTPS and obtain a valid certificate."
            })
        else:
            # Check SSL certificate (basic)
            try:
                resp = await self.client.get(url, verify=True)  # verify SSL
            except httpx.ConnectError:
                findings.append({
                    "title": "Invalid SSL Certificate",
                    "description": "The SSL certificate is invalid or self-signed.",
                    "severity": "high",
                    "location": url,
                    "remediation": "Install a valid SSL certificate from a trusted CA."
                })

        # Check for insecure cookies
        try:
            resp = await self.client.get(url)
            if 'set-cookie' in resp.headers:
                cookie = resp.headers['set-cookie']
                if 'secure' not in cookie.lower():
                    findings.append({
                        "title": "Insecure Cookie",
                        "description": "Cookies are missing the Secure flag.",
                        "severity": "medium",
                        "location": url,
                        "remediation": "Set Secure flag on all cookies."
                    })
                if 'httponly' not in cookie.lower():
                    findings.append({
                        "title": "Insecure Cookie (No HttpOnly)",
                        "description": "Cookies are missing the HttpOnly flag.",
                        "severity": "medium",
                        "location": url,
                        "remediation": "Set HttpOnly flag on session cookies."
                    })
        except Exception:
            pass

        return findings

    async def test_injection(self, url: str) -> List[Dict]:
        findings = []
        # SQL Injection payloads
        sqli_payloads = [
            "'",
            "\"",
            "1' OR '1'='1",
            "1' OR '1'='1'--",
            "1' OR 1=1--",
            "1' UNION SELECT NULL--",
            "'; DROP TABLE users--"
        ]
        # XSS payloads
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "';alert('XSS');//",
            "<img src=x onerror=alert('XSS')>"
        ]

        # Test injection in parameters (GET)
        # We'll try to find a parameter by parsing forms or common parameters
        # For simplicity, test common parameters
        test_params = ['id', 'q', 'search', 'user', 'name', 'page']
        base_url = url.split('?')[0]

        for param in test_params:
            for payload in sqli_payloads:
                try:
                    resp = await self.client.get(base_url, params={param: payload})
                    if "sql" in resp.text.lower() or "mysql" in resp.text.lower() or "syntax error" in resp.text.lower():
                        findings.append({
                            "title": "Potential SQL Injection",
                            "description": f"Parameter '{param}' triggered database error with payload '{payload}'.",
                            "severity": "critical",
                            "location": f"{base_url}?{param}={payload}",
                            "remediation": "Use parameterized queries."
                        })
                        break
                except Exception:
                    pass

            for payload in xss_payloads:
                try:
                    resp = await self.client.get(base_url, params={param: payload})
                    if payload in resp.text:
                        findings.append({
                            "title": "Reflected XSS",
                            "description": f"Payload '{payload}' reflected in response for parameter '{param}'.",
                            "severity": "high",
                            "location": f"{base_url}?{param}={payload}",
                            "remediation": "Encode output and sanitize input."
                        })
                        break
                except Exception:
                    pass

        # Check for POST injection (if there's a login form)
        try:
            soup = BeautifulSoup(await self.client.get(url), 'html.parser')
            forms = soup.find_all('form')
            for form in forms:
                if form.get('method', '').lower() == 'post':
                    action = form.get('action', '')
                    if not action.startswith('http'):
                        action = urljoin(url, action)
                    # Try SQLi in username field
                    data = {}
                    for input_tag in form.find_all('input'):
                        name = input_tag.get('name')
                        if name:
                            if 'user' in name.lower() or 'email' in name.lower():
                                data[name] = "' OR '1'='1"
                            else:
                                data[name] = 'test'
                    try:
                        resp = await self.client.post(action, data=data)
                        if "sql" in resp.text.lower() or "mysql" in resp.text.lower():
                            findings.append({
                                "title": "Potential SQL Injection (POST)",
                                "description": "SQL error detected during login form submission.",
                                "severity": "critical",
                                "location": action,
                                "remediation": "Use parameterized queries."
                            })
                            break
                    except Exception:
                        pass
        except Exception:
            pass

        return findings

    async def test_csrf(self, url: str) -> List[Dict]:
        findings = []
        # Check for missing CSRF tokens in forms
        try:
            soup = BeautifulSoup(await self.client.get(url), 'html.parser')
            forms = soup.find_all('form')
            for form in forms:
                # Check for CSRF token input
                has_csrf = any(
                    input_tag.get('name', '').lower() in ['csrf', 'csrf_token', 'authenticity_token', '_token']
                    for input_tag in form.find_all('input')
                )
                if not has_csrf:
                    findings.append({
                        "title": "Missing CSRF Protection",
                        "description": f"Form at {form.get('action', url)} lacks a CSRF token.",
                        "severity": "medium",
                        "location": form.get('action', url),
                        "remediation": "Implement CSRF tokens for all state-changing requests."
                    })
        except Exception:
            pass
        return findings

    async def test_xxe(self, url: str) -> List[Dict]:
        # Placeholder: XXE detection would require sending XML payloads.
        # For now, we note it's not implemented.
        return []

    async def test_path_traversal(self, url: str) -> List[Dict]:
        findings = []
        # Test for path traversal using ../ sequences
        traversal_payloads = [
            "../../../etc/passwd",
            "../../../../windows/win.ini",
            "....//....//....//etc/passwd"
        ]
        test_params = ['file', 'path', 'doc', 'page']
        base_url = url.split('?')[0]
        for param in test_params:
            for payload in traversal_payloads:
                try:
                    resp = await self.client.get(base_url, params={param: payload})
                    if "root:" in resp.text or "[extensions]" in resp.text:
                        findings.append({
                            "title": "Path Traversal Vulnerability",
                            "description": f"Parameter '{param}' allowed file read: {payload}",
                            "severity": "high",
                            "location": f"{base_url}?{param}={payload}",
                            "remediation": "Validate and sanitize file paths; use whitelist."
                        })
                        break
                except Exception:
                    pass
        return findings

    async def test_insecure_design(self, url: str) -> List[Dict]:
        findings = []
        # Check for exposure of internal IPs in headers
        try:
            resp = await self.client.get(url)
            if 'X-Forwarded-For' in resp.headers:
                ip = resp.headers['X-Forwarded-For']
                if ip.startswith('10.') or ip.startswith('192.168.'):
                    findings.append({
                        "title": "Internal IP Disclosure",
                        "description": f"Internal IP address disclosed in X-Forwarded-For: {ip}",
                        "severity": "low",
                        "location": url,
                        "remediation": "Remove internal IPs from headers."
                    })
        except Exception:
            pass
        return findings

    async def test_security_misconfiguration(self, url: str) -> List[Dict]:
        findings = []
        # Check security headers
        try:
            resp = await self.client.get(url)
            headers = resp.headers

            # Strict-Transport-Security
            if 'strict-transport-security' not in headers:
                findings.append({
                    "title": "Missing HSTS Header",
                    "description": "Strict-Transport-Security header not set.",
                    "severity": "medium",
                    "location": url,
                    "remediation": "Add HSTS header to enforce HTTPS."
                })

            # X-Frame-Options
            if 'x-frame-options' not in headers:
                findings.append({
                    "title": "Missing Clickjacking Protection",
                    "description": "X-Frame-Options header missing.",
                    "severity": "medium",
                    "location": url,
                    "remediation": "Set X-Frame-Options: DENY or SAMEORIGIN."
                })

            # X-Content-Type-Options
            if 'x-content-type-options' not in headers:
                findings.append({
                    "title": "Missing MIME Sniffing Protection",
                    "description": "X-Content-Type-Options header missing.",
                    "severity": "low",
                    "location": url,
                    "remediation": "Set X-Content-Type-Options: nosniff."
                })

            # Server version disclosure
            if 'server' in headers:
                findings.append({
                    "title": "Server Version Disclosure",
                    "description": f"Server header reveals: {headers['server']}",
                    "severity": "low",
                    "location": url,
                    "remediation": "Remove or obfuscate Server header."
                })
        except Exception:
            pass

        return findings

    async def test_vulnerable_components(self, url: str) -> List[Dict]:
        findings = []
        # Check for known version strings in HTTP headers, footers, etc.
        # This is a placeholder; we could parse version from headers.
        try:
            resp = await self.client.get(url)
            # Look for version patterns
            if 'Apache/2.2.' in resp.text or 'nginx/1.0.' in resp.text:
                findings.append({
                    "title": "Outdated Web Server Version",
                    "description": "Old web server version detected.",
                    "severity": "high",
                    "location": url,
                    "remediation": "Upgrade to latest stable version."
                })
        except Exception:
            pass
        return findings

    async def test_identification_auth_failures(self, url: str) -> List[Dict]:
        findings = []
        # Check for default credentials (simple example)
        try:
            # Try admin/admin on login page
            login_url = urljoin(url, '/login')
            resp = await self.client.post(login_url, data={'username': 'admin', 'password': 'admin'})
            if resp.status_code == 200 and 'dashboard' in resp.url.path:
                findings.append({
                    "title": "Default Credentials",
                    "description": "Default admin/admin credentials are accepted.",
                    "severity": "critical",
                    "location": login_url,
                    "remediation": "Change default credentials and enforce strong passwords."
                })
        except Exception:
            pass
        return findings

    async def test_software_data_integrity_failures(self, url: str) -> List[Dict]:
        # Placeholder for integrity checks (e.g., checksum verification)
        return []

    async def test_security_logging_monitoring_failures(self, url: str) -> List[Dict]:
        # Placeholder for logging failures
        return []

    async def test_ssrf(self, url: str) -> List[Dict]:
        findings = []
        # Try to make the server fetch internal resources via a parameter
        test_params = ['url', 'dest', 'redirect', 'path']
        base_url = url.split('?')[0]
        for param in test_params:
            try:
                resp = await self.client.get(base_url, params={param: 'http://169.254.169.254/latest/meta-data/'})
                if 'instance-id' in resp.text or 'ami-id' in resp.text:
                    findings.append({
                        "title": "SSRF Vulnerability",
                        "description": f"Parameter '{param}' allowed access to AWS metadata.",
                        "severity": "critical",
                        "location": f"{base_url}?{param}=...",
                        "remediation": "Validate and whitelist URLs."
                    })
                    break
            except Exception:
                pass
        return findings