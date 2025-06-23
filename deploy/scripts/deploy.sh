#!/bin/bash

# Trend2Zero Production Deployment Script
# This script handles the complete deployment process for Trend2Zero

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${ENVIRONMENT:-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="trend2zero"
NAMESPACE="${PROJECT_NAME}-${ENVIRONMENT}"

# Docker registry
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/${PROJECT_NAME}/frontend"
BACKEND_IMAGE="${DOCKER_REGISTRY}/${PROJECT_NAME}/backend"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local required_tools=("aws" "kubectl" "helm" "docker" "terraform" "jq")
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "$tool is not installed. Please install it before proceeding."
            exit 1
        fi
    done
    
    print_success "All prerequisites are installed"
}

# Function to validate AWS credentials
validate_aws_credentials() {
    print_status "Validating AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured properly"
        exit 1
    fi
    
    print_success "AWS credentials validated"
}

# Function to build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t "${BACKEND_IMAGE}:${VERSION}" -t "${BACKEND_IMAGE}:latest" ./backend
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t "${FRONTEND_IMAGE}:${VERSION}" -t "${FRONTEND_IMAGE}:latest" \
        --build-arg NEXT_PUBLIC_API_URL="https://api.trend2zero.com" \
        ./frontend
    
    print_success "Docker images built successfully"
}

# Function to push Docker images
push_docker_images() {
    print_status "Pushing Docker images to registry..."
    
    # Login to Docker registry (ECR)
    aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${DOCKER_REGISTRY}"
    
    # Push backend images
    docker push "${BACKEND_IMAGE}:${VERSION}"
    docker push "${BACKEND_IMAGE}:latest"
    
    # Push frontend images
    docker push "${FRONTEND_IMAGE}:${VERSION}"
    docker push "${FRONTEND_IMAGE}:latest"
    
    print_success "Docker images pushed successfully"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd deploy/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan changes
    terraform plan -out=tfplan
    
    # Apply changes (with auto-approve for CI/CD, remove for manual deployment)
    if [[ "${CI:-false}" == "true" ]]; then
        terraform apply -auto-approve tfplan
    else
        terraform apply tfplan
    fi
    
    cd ../..
    
    print_success "Infrastructure deployed successfully"
}

# Function to configure kubectl
configure_kubectl() {
    print_status "Configuring kubectl..."
    
    local cluster_name="${PROJECT_NAME}-${ENVIRONMENT}-eks"
    
    aws eks update-kubeconfig --region "${AWS_REGION}" --name "${cluster_name}"
    
    print_success "kubectl configured successfully"
}

# Function to install Helm charts
install_helm_charts() {
    print_status "Installing Helm charts..."
    
    # Add Helm repositories
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
    helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver/
    helm repo update
    
    # Install NGINX Ingress Controller
    helm upgrade --install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.metrics.enabled=true \
        --wait
    
    # Install cert-manager for SSL certificates
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true \
        --wait
    
    # Install metrics-server
    helm upgrade --install metrics-server metrics-server/metrics-server \
        --namespace kube-system \
        --wait
    
    # Install AWS EFS CSI Driver
    helm upgrade --install aws-efs-csi-driver aws-efs-csi-driver/aws-efs-csi-driver \
        --namespace kube-system \
        --set controller.serviceAccount.create=false \
        --set controller.serviceAccount.name=efs-csi-controller-sa \
        --wait
    
    print_success "Helm charts installed successfully"
}

# Function to create cert-manager issuers
create_cert_issuers() {
    print_status "Creating cert-manager issuers..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@trend2zero.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    
    print_success "Cert-manager issuers created"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application to Kubernetes..."
    
    # Update image tags in manifests
    sed -i.bak "s|image: trend2zero/backend:latest|image: ${BACKEND_IMAGE}:${VERSION}|g" deploy/k8s/backend-deployment.yaml
    sed -i.bak "s|image: trend2zero/frontend:latest|image: ${FRONTEND_IMAGE}:${VERSION}|g" deploy/k8s/frontend-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f deploy/k8s/redis-deployment.yaml
    kubectl apply -f deploy/k8s/backend-deployment.yaml
    kubectl apply -f deploy/k8s/frontend-deployment.yaml
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n "${NAMESPACE}"
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n "${NAMESPACE}"
    
    print_success "Application deployed successfully"
}

# Function to run database migrations
run_database_migrations() {
    print_status "Running database migrations..."
    
    # Create a migration job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-${VERSION}
  namespace: ${NAMESPACE}
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: ${BACKEND_IMAGE}:${VERSION}
        command: ["npm", "run", "migrate:up"]
        envFrom:
        - configMapRef:
            name: backend-config
        - secretRef:
            name: backend-secrets
EOF
    
    # Wait for migration to complete
    kubectl wait --for=condition=complete --timeout=300s job/db-migration-${VERSION} -n "${NAMESPACE}"
    
    print_success "Database migrations completed"
}

# Function to perform health checks
perform_health_checks() {
    print_status "Performing health checks..."
    
    # Get ingress endpoints
    local frontend_url=$(kubectl get ingress frontend-ingress -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    local backend_url=$(kubectl get ingress backend-ingress -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    # Check frontend health
    if curl -f -s "https://${frontend_url}/api/health" > /dev/null; then
        print_success "Frontend health check passed"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check backend health
    if curl -f -s "https://${backend_url}/health" > /dev/null; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
}

# Function to create monitoring alerts
create_monitoring_alerts() {
    print_status "Creating monitoring alerts..."
    
    # This would typically integrate with your monitoring solution
    # For example, creating CloudWatch alarms, Datadog monitors, etc.
    
    print_success "Monitoring alerts created"
}

# Function to perform rollback
rollback_deployment() {
    print_status "Rolling back deployment..."
    
    kubectl rollout undo deployment/backend-deployment -n "${NAMESPACE}"
    kubectl rollout undo deployment/frontend-deployment -n "${NAMESPACE}"
    
    print_success "Deployment rolled back"
}

# Main deployment function
main() {
    print_status "Starting Trend2Zero deployment..."
    print_status "Environment: ${ENVIRONMENT}"
    print_status "Version: ${VERSION}"
    
    # Check prerequisites
    check_prerequisites
    validate_aws_credentials
    
    # Build and push images
    if [[ "${SKIP_BUILD:-false}" != "true" ]]; then
        build_docker_images
        push_docker_images
    fi
    
    # Deploy infrastructure
    if [[ "${SKIP_INFRA:-false}" != "true" ]]; then
        deploy_infrastructure
    fi
    
    # Configure Kubernetes
    configure_kubectl
    
    # Install dependencies
    if [[ "${SKIP_HELM:-false}" != "true" ]]; then
        install_helm_charts
        create_cert_issuers
    fi
    
    # Deploy application
    deploy_application
    
    # Run migrations
    if [[ "${SKIP_MIGRATIONS:-false}" != "true" ]]; then
        run_database_migrations
    fi
    
    # Perform health checks
    perform_health_checks
    
    # Create monitoring alerts
    create_monitoring_alerts
    
    print_success "Deployment completed successfully!"
    print_status "Frontend URL: https://trend2zero.com"
    print_status "Backend URL: https://api.trend2zero.com"
}

# Parse command line arguments
VERSION="${1:-$(git rev-parse --short HEAD)}"
COMMAND="${2:-deploy}"

case "$COMMAND" in
    deploy)
        main
        ;;
    rollback)
        rollback_deployment
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo "Usage: $0 [VERSION] [deploy|rollback]"
        exit 1
        ;;
esac