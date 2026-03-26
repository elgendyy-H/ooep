# Production Deployment with Let's Encrypt SSL

## Prerequisites

- Kubernetes cluster (e.g., EKS, GKE, AKS, or minikube)
- `kubectl` configured
- Helm (optional) or `cert-manager` installed
- Domain name pointing to cluster IP

## Step 1: Install cert-manager

```bash
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml