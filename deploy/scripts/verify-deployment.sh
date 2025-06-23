#!/bin/bash

# Trend2Zero Deployment Verification Script
# Verifies all components are properly deployed and healthy

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-trend2zero-prod}"
EXPECTED_BACKEND_REPLICAS=3
EXPECTED_FRONTEND_REPLICAS=3
EXPECTED_REDIS_REPLICAS=3

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check Kubernetes connectivity
check_kubernetes() {
    print_header "Kubernetes Cluster"
    
    if kubectl cluster-info &>/dev/null; then
        print_success "Connected to Kubernetes cluster"
        kubectl cluster-info | head -n 1
    else
        print_error "Cannot connect to Kubernetes cluster"
        return 1
    fi
}

# Check namespace
check_namespace() {
    print_header "Namespace"
    
    if kubectl get namespace "${NAMESPACE}" &>/dev/null; then
        print_success "Namespace '${NAMESPACE}' exists"
    else
        print_error "Namespace '${NAMESPACE}' does not exist"
        return 1
    fi
}

# Check deployments
check_deployments() {
    print_header "Deployments"
    
    local deployments=("backend-deployment" "frontend-deployment")
    local all_healthy=true
    
    for deployment in "${deployments[@]}"; do
        local ready=$(kubectl get deployment "${deployment}" -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired=$(kubectl get deployment "${deployment}" -n "${NAMESPACE}" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [[ "${ready}" == "${desired}" ]] && [[ "${ready}" -gt 0 ]]; then
            print_success "${deployment}: ${ready}/${desired} replicas ready"
        else
            print_error "${deployment}: ${ready}/${desired} replicas ready"
            all_healthy=false
        fi
    done
    
    if ! $all_healthy; then
        return 1
    fi
}

# Check StatefulSets
check_statefulsets() {
    print_header "StatefulSets"
    
    local ready=$(kubectl get statefulset redis-statefulset -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    local desired=$(kubectl get statefulset redis-statefulset -n "${NAMESPACE}" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    if [[ "${ready}" == "${desired}" ]] && [[ "${ready}" -gt 0 ]]; then
        print_success "redis-statefulset: ${ready}/${desired} replicas ready"
    else
        print_error "redis-statefulset: ${ready}/${desired} replicas ready"
        return 1
    fi
}

# Check pods
check_pods() {
    print_header "Pod Status"
    
    local unhealthy_pods=$(kubectl get pods -n "${NAMESPACE}" --field-selector=status.phase!=Running,status.phase!=Succeeded -o json | jq -r '.items | length')
    
    if [[ "${unhealthy_pods}" -eq 0 ]]; then
        print_success "All pods are healthy"
    else
        print_error "${unhealthy_pods} unhealthy pods found"
        kubectl get pods -n "${NAMESPACE}" --field-selector=status.phase!=Running,status.phase!=Succeeded
        return 1
    fi
}

# Check services
check_services() {
    print_header "Services"
    
    local services=("backend-service" "frontend-service" "redis-service")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if kubectl get service "${service}" -n "${NAMESPACE}" &>/dev/null; then
            local endpoints=$(kubectl get endpoints "${service}" -n "${NAMESPACE}" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
            if [[ "${endpoints}" -gt 0 ]]; then
                print_success "${service}: ${endpoints} endpoints"
            else
                print_error "${service}: No endpoints"
                all_healthy=false
            fi
        else
            print_error "${service}: Not found"
            all_healthy=false
        fi
    done
    
    if ! $all_healthy; then
        return 1
    fi
}

# Check ingress
check_ingress() {
    print_header "Ingress"
    
    local ingresses=("frontend-ingress" "backend-ingress")
    local all_healthy=true
    
    for ingress in "${ingresses[@]}"; do
        if kubectl get ingress "${ingress}" -n "${NAMESPACE}" &>/dev/null; then
            local host=$(kubectl get ingress "${ingress}" -n "${NAMESPACE}" -o jsonpath='{.spec.rules[0].host}')
            local address=$(kubectl get ingress "${ingress}" -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
            if [[ -n "${address}" ]]; then
                print_success "${ingress}: ${host} -> ${address}"
            else
                print_warning "${ingress}: No load balancer address yet"
            fi
        else
            print_error "${ingress}: Not found"
            all_healthy=false
        fi
    done
    
    if ! $all_healthy; then
        return 1
    fi
}

# Check persistent volumes
check_storage() {
    print_header "Storage"
    
    local pvcs=$(kubectl get pvc -n "${NAMESPACE}" -o json | jq -r '.items[] | select(.status.phase == "Bound") | .metadata.name' | wc -l)
    local total_pvcs=$(kubectl get pvc -n "${NAMESPACE}" -o json | jq -r '.items | length')
    
    if [[ "${pvcs}" -eq "${total_pvcs}" ]] && [[ "${total_pvcs}" -gt 0 ]]; then
        print_success "All ${pvcs} PVCs are bound"
    else
        print_error "Only ${pvcs}/${total_pvcs} PVCs are bound"
        kubectl get pvc -n "${NAMESPACE}"
        return 1
    fi
}

# Check certificates
check_certificates() {
    print_header "SSL Certificates"
    
    if kubectl get certificates -n "${NAMESPACE}" &>/dev/null; then
        local certs=$(kubectl get certificates -n "${NAMESPACE}" -o json | jq -r '.items[] | select(.status.conditions[] | select(.type == "Ready" and .status == "True")) | .metadata.name' | wc -l)
        local total_certs=$(kubectl get certificates -n "${NAMESPACE}" -o json | jq -r '.items | length')
        
        if [[ "${certs}" -eq "${total_certs}" ]] && [[ "${total_certs}" -gt 0 ]]; then
            print_success "All ${certs} certificates are ready"
        else
            print_warning "Only ${certs}/${total_certs} certificates are ready"
            kubectl get certificates -n "${NAMESPACE}"
        fi
    else
        print_warning "No certificates found (cert-manager may not be installed)"
    fi
}

# Check HPA
check_autoscaling() {
    print_header "Autoscaling"
    
    local hpas=$(kubectl get hpa -n "${NAMESPACE}" -o json 2>/dev/null | jq -r '.items | length' || echo "0")
    
    if [[ "${hpas}" -gt 0 ]]; then
        kubectl get hpa -n "${NAMESPACE}"
        print_success "${hpas} HPA configurations active"
    else
        print_warning "No HPA configurations found"
    fi
}

# Health check endpoints
check_health_endpoints() {
    print_header "Health Endpoints"
    
    # Get ingress hosts
    local frontend_host=$(kubectl get ingress frontend-ingress -n "${NAMESPACE}" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    local backend_host=$(kubectl get ingress backend-ingress -n "${NAMESPACE}" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "")
    
    if [[ -n "${frontend_host}" ]]; then
        if curl -f -s -k "https://${frontend_host}/api/health" &>/dev/null; then
            print_success "Frontend health check: OK"
        else
            print_warning "Frontend health check: Cannot reach https://${frontend_host}/api/health"
        fi
    fi
    
    if [[ -n "${backend_host}" ]]; then
        if curl -f -s -k "https://${backend_host}/health" &>/dev/null; then
            print_success "Backend health check: OK"
        else
            print_warning "Backend health check: Cannot reach https://${backend_host}/health"
        fi
    fi
}

# Check recent events
check_events() {
    print_header "Recent Events"
    
    local warning_events=$(kubectl get events -n "${NAMESPACE}" --field-selector type=Warning -o json | jq -r '.items | length')
    
    if [[ "${warning_events}" -eq 0 ]]; then
        print_success "No warning events in the last hour"
    else
        print_warning "${warning_events} warning events found"
        echo ""
        kubectl get events -n "${NAMESPACE}" --field-selector type=Warning --sort-by='.lastTimestamp' | tail -5
    fi
}

# Main verification
main() {
    echo -e "${BLUE}Trend2Zero Production Deployment Verification${NC}"
    echo -e "${BLUE}============================================${NC}"
    
    local failed_checks=0
    
    # Run all checks
    check_kubernetes || ((failed_checks++))
    check_namespace || ((failed_checks++))
    check_deployments || ((failed_checks++))
    check_statefulsets || ((failed_checks++))
    check_pods || ((failed_checks++))
    check_services || ((failed_checks++))
    check_ingress || ((failed_checks++))
    check_storage || ((failed_checks++))
    check_certificates || ((failed_checks++))
    check_autoscaling || ((failed_checks++))
    check_health_endpoints || ((failed_checks++))
    check_events || ((failed_checks++))
    
    # Summary
    echo ""
    echo -e "${BLUE}============================================${NC}"
    if [[ "${failed_checks}" -eq 0 ]]; then
        echo -e "${GREEN}✓ All checks passed! Deployment is healthy.${NC}"
        exit 0
    else
        echo -e "${RED}✗ ${failed_checks} checks failed. Please investigate.${NC}"
        exit 1
    fi
}

# Run verification
main "$@"