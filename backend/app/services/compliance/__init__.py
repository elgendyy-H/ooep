from .base import ComplianceChecker
from .iso27001 import ISO27001Checker
from .gdpr import GDPRChecker
from .pci_dss import PCIDSSChecker
from .hipaa import HIPAAChecker

def get_compliance_checker(framework: str):
    if framework == "iso27001":
        return ISO27001Checker()
    elif framework == "gdpr":
        return GDPRChecker()
    elif framework == "pci_dss":
        return PCIDSSChecker()
    elif framework == "hipaa":
        return HIPAAChecker()
    return None