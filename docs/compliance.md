
---

### 138. `docs/compliance.md`
```markdown
# Compliance Frameworks

OEPP automates checks for the following frameworks:

- **ISO 27001**: Information Security Management
- **GDPR**: General Data Protection Regulation
- **PCI DSS**: Payment Card Industry Data Security Standard
- **HIPAA**: Health Insurance Portability and Accountability Act

## How It Works

Each framework is defined by a set of controls stored in JSON files in `data/compliance/`. The compliance checker runs those controls against a target and returns a score.

## Adding a New Framework

1. Create a new checker class in `backend/app/services/compliance/`, e.g., `nist.py`.
2. Implement `ComplianceChecker` interface.
3. Add the framework to `get_compliance_checker` in `__init__.py`.
4. Create a JSON file with the controls.
5. Update the frontend dropdown in `Compliance.js`.

## Example Control (ISO 27001)

```json
{
  "id": "A.5.1.1",
  "name": "Information security policy",
  "description": "Policies for information security should be defined and approved by management."
}