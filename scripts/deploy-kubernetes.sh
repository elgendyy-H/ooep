#!/bin/bash
set -e
NAMESPACE="oepp"
kubectl get namespace $NAMESPACE > /dev/null 2>&1 || kubectl create namespace $NAMESPACE
kubectl apply -f kubernetes/secrets/oepp-secrets.yaml -n $NAMESPACE
kubectl apply -f kubernetes/manifests/ -n $NAMESPACE
kubectl apply -f kubernetes/letsencrypt/issuer.yaml
echo "Deployment complete. Check with: kubectl get all -n $NAMESPACE"
