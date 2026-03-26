
---

### 141. `docs/uat-plan.md`
```markdown
# User Acceptance Testing (UAT) Plan – OEPP v5.0

## 1. Overview

**Objective:** Validate that the OWASP Enterprise Pentesting Platform meets business requirements, is user‑friendly, and operates correctly in a production‑like environment.

**Scope:** All core features: scanning, reporting, compliance, integrations, automation, monitoring, and administration.

**Duration:** 5 working days.

**Participants:**  
- 2–3 security testers (end users)  
- 1 developer for support  
- 1 project manager to oversee

---

## 2. Test Environment

- **URL:** Staging environment (e.g., https://staging.oepp.com)  
- **Credentials:** Provided to testers (admin, user, auditor roles)  
- **Data:** Pre‑populated with sample targets, scans, findings, and reports.  
- **Tools:**  
  - Browser (Chrome, Firefox)  
  - Postman (for API testing)  
  - OWASP ZAP (optional for additional testing)  
- **Backend:** Running latest code (commit hash provided)  
- **Frontend:** Latest build from main branch

---

## 3. Test Data

Create the following test data before UAT:

- **Targets:**  
  - A local test server with known vulnerabilities (e.g., DVWA, WebGoat)  
  - A public demo site (e.g., testphp.vulnweb.com)  
  - A simulated API endpoint

- **Scans:**  
  - At least 5 completed scans with various severities  
  - 2 running scans (to test real‑time updates)  
  - 1 failed scan

- **Findings:**  
  - At least 20 findings across all severity levels  
  - Some findings with status “open”, “closed”, “accepted”

- **Reports:**  
  - 3 reports generated (HTML, PDF, JSON)

- **Automation:**  
  - 2 schedules (one active, one paused)

- **Integrations:**  
  - Slack webhook URL (test workspace)  
  - Email test account  
  - Jira test project  
  - GitHub test repo

- **Compliance:**  
  - At least one target with completed compliance checks for each framework (ISO27001, GDPR, PCI DSS, HIPAA)

---

## 4. Test Cases

| ID | Feature | Test Case | Expected Result | Priority |
|----|---------|-----------|-----------------|----------|
| **AUTH-01** | Authentication | Login with valid credentials | Access granted, redirected to dashboard | High |
| **AUTH-02** | Authentication | Login with invalid credentials | Error message, no access | High |
| **AUTH-03** | Authentication | Password reset flow | User receives email, can reset | Medium |
| **AUTH-04** | Authentication | Session timeout after inactivity | Redirect to login after inactivity period | High |
| **AUTH-05** | Role‑based access | Auditor role can view findings but cannot edit | Permissions enforced | High |
| **DASH-01** | Dashboard | Load dashboard | Stats cards display correct numbers | High |
| **DASH-02** | Dashboard | Charts display data | Graphs populated with recent scan activity | High |
| **DASH-03** | Dashboard | Manual refresh button | Updates stats | Medium |
| **DASH-04** | Dashboard | Real‑time updates | New scans appear within 30 seconds | Medium |
| **SCAN-01** | Scans | Create a new scan (full) | Scan appears in list with status “pending” | High |
| **SCAN-02** | Scans | Start a scan | Status changes to “running”; WebSocket updates; progress shown | High |
| **SCAN-03** | Scans | View scan details | Shows metadata, findings table | High |
| **SCAN-04** | Scans | Filter findings in scan details | Filter by severity/status works | Medium |
| **SCAN-05** | Scans | Delete a scan | Scan removed from list | Medium |
| **SCAN-06** | Scans | Re‑run scan | New scan created with same target/type | Medium |
| **SCAN-07** | Scans | Stop a running scan (if implemented) | Scan status changes to “cancelled” | Low |
| **TGT-01** | Targets | Add a new target | Target appears in list | High |
| **TGT-02** | Targets | Edit target | Changes saved | Medium |
| **TGT-03** | Targets | Delete target | Removed; associated scans remain | Medium |
| **TGT-04** | Targets | Scan now button | Quick scan created and started | High |
| **TGT-05** | Targets | Search/filter | Filters by name/URL | Medium |
| **FIND-01** | Findings | List findings with filters | Filters (severity, status, scan) work | High |
| **FIND-02** | Findings | Update finding status | Status changes, reflects in UI | High |
| **FIND-03** | Findings | Search | Search by title/description | Medium |
| **RPT-01** | Reports | Generate report | Report appears in list | High |
| **RPT-02** | Reports | Download report (HTML, PDF, JSON, CSV) | File downloads with correct content | High |
| **RPT-03** | Reports | Include charts | Charts included in report (if selected) | Medium |
| **AUTO-01** | Automation | Create schedule | Schedule appears in list | High |
| **AUTO-02** | Automation | Edit schedule | Changes saved | Medium |
| **AUTO-03** | Automation | Delete schedule | Removed | Medium |
| **AUTO-04** | Automation | Activate/pause schedule | Status changes | High |
| **AUTO-05** | Automation | Scheduled scan runs at expected time | Scan created at specified cron time | High |
| **COMP-01** | Compliance | Run compliance check | Results shown with score and details | High |
| **COMP-02** | Compliance | Different frameworks | Each returns appropriate controls | Medium |
| **INT-01** | Integrations | Configure Slack | Save configuration, test connection succeeds | High |
| **INT-02** | Integrations | Send test notification | Slack channel receives message | Medium |
| **INT-03** | Integrations | Configure Email | Save config, test connection succeeds | High |
| **INT-04** | Integrations | Configure Jira | Save, test connection | Medium |
| **INT-05** | Integrations | Configure GitHub | Save, test connection | Medium |
| **MON-01** | Monitoring | View system metrics | Charts display CPU, memory, disk usage | Medium |
| **MON-02** | Monitoring | Alerts | Recent alerts appear | Low |
| **SET-01** | Settings | Update profile | Name/email saved | High |
| **SET-02** | Settings | Change password | Password updated, login with new works | High |
| **SET-03** | Settings | Preferences | Dark mode, notifications toggle | Medium |
| **SEC-01** | Security | HTTPS enforced | Redirect from HTTP to HTTPS | High |
| **SEC-02** | Security | Rate limiting | Too many requests in short time returns 429 | High |
| **SEC-03** | Security | SQL injection attempt on forms | Error not displayed, input sanitized | High |
| **SEC-04** | Security | XSS attempt | Script not executed | High |
| **SEC-05** | Security | Access to admin‑only endpoints with user token | 403 Forbidden | High |
| **SEC-06** | Security | No sensitive data in logs | Logs contain no passwords or tokens | Medium |
| **PERF-01** | Performance | Concurrent scans (3) | No crashes, all complete within expected time | Medium |
| **PERF-02** | Performance | Large report generation | PDF generated within 10 seconds | Medium |
| **PERF-03** | Performance | Dashboard load time | < 2 seconds | Medium |

---

## 5. Test Execution

- Testers follow the test case list, marking each as **Pass**, **Fail**, or **Not Applicable**.
- Use a shared spreadsheet or bug tracking tool (e.g., Jira) to log defects.
- Defect severity: **Critical** (blocks core functionality), **High** (major feature broken), **Medium** (minor issue), **Low** (cosmetic).

**Testing Sessions:**

| Day | Activities |
|-----|------------|
| 1 | Environment setup, smoke test, authentication, dashboard, targets, scans |
| 2 | Findings, reports, automation |
| 3 | Compliance, integrations, monitoring, settings |
| 4 | Security testing, performance testing, regression |
| 5 | Bug verification, sign‑off |

---

## 6. Bug Reporting Template
