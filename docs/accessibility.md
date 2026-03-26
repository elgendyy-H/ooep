
---

### 137. `docs/accessibility.md`
```markdown
# Accessibility Guide

OEPP aims to meet **WCAG 2.1 Level AA** standards.

## Implemented Features

- Semantic HTML (`main`, `nav`, `button`, `h1`-`h6`)
- Keyboard navigation (Tab, Enter, Space) on all interactive elements
- Skip‑to‑main‑content link for screen readers
- ARIA labels on icons and complex controls
- High contrast support in theme (dark mode)
- Responsive design for mobile devices
- Automated accessibility testing with `jest-axe`

## Testing

### Automated (Unit Tests)
```bash
cd frontend
npm test -- --watchAll=false