#!/bin/bash

# Trend2Zero Production Rollback Script
# This script handles emergency rollbacks

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="trend2zero"
NAMESPACE="${PROJECT_NAME}-${ENVIRONMENT}"

print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
}

# Function to perform rollback
rollback_deployment() {
    local rollback_to="${1:-}"
    
    print_status "Starting rollback process..."
    
    # Configure kubectl
    aws eks update-kubeconfig --region "${AWS_REGION}" --name "${PROJECT_NAME}-${ENVIRONMENT}-eks"
    
    # Get current deployment status
    print_status "Current deployment status:"
    kubectl get deployments -n "${NAMESPACE}"
    
    if [[ -n "${rollback_to}" ]]; then
        # Rollback to specific revision
        print_status "Rolling back to revision ${rollback_to}..."
        kubectl rollout undo deployment/backend-deployment --to-revision="${rollback_to}" -n "${NAMESPACE}"
        kubectl rollout undo deployment/frontend-deployment --to-revision="${rollback_to}" -n "${NAMESPACE}"
    else
        # Rollback to previous revision
        print_status "Rolling back to previous revision..."
        kubectl rollout undo deployment/backend-deployment -n "${NAMESPACE}"
        kubectl rollout undo deployment/frontend-deployment -n "${NAMESPACE}"
    fi
    
    # Wait for rollback to complete
    print_status "Waiting for rollback to complete..."
    kubectl rollout status deployment/backend-deployment -n "${NAMESPACE}" --timeout=5m
    kubectl rollout status deployment/frontend-deployment -n "${NAMESPACE}" --timeout=5m
    
    # Verify health
    print_status "Verifying application health after rollback..."
    sleep 30
    
    local backend_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=backend -o jsonpath='{.items[*].status.phase}' | grep -c "Running" || echo 0)
    local frontend_pods=$(kubectl get pods -n "${NAMESPACE}" -l app=frontend -o jsonpath='{.items[*].status.phase}' | grep -c "Running" || echo 0)
    
    if [[ ${backend_pods} -gt 0 ]] && [[ ${frontend_pods} -gt 0 ]]; then
        print_success "Rollback completed successfully"
        print_status "Running pods - Backend: ${backend_pods}, Frontend: ${frontend_pods}"
    else
        print_error "Rollback may have failed - some pods are not running"
        kubectl get pods -n "${NAMESPACE}"
    fi
}

# Function to view rollout history
view_rollout_history() {
    print_status "Deployment rollout history:"
    echo ""
    echo "Backend deployment history:"
    kubectl rollout history deployment/backend-deployment -n "${NAMESPACE}"
    echo ""
    echo "Frontend deployment history:"
    kubectl rollout history deployment/frontend-deployment -n "${NAMESPACE}"
}

# Main function
main() {
    local command="${1:-rollback}"
    local revision="${2:-}"
    
    case "${command}" in
        rollback)
            rollback_deployment "${revision}"
            ;;
        history)
            view_rollout_history
            ;;
        *)
            print_error "Unknown command: ${command}"
            echo "Usage: $0 [rollback|history] [revision]"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"