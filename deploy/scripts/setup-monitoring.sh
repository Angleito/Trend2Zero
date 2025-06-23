#!/bin/bash

# Trend2Zero Monitoring Setup Script
# Sets up Prometheus, Grafana, and CloudWatch integration

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

# Install Prometheus Stack
install_prometheus_stack() {
    print_status "Installing Prometheus monitoring stack..."
    
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    cat > prometheus-values.yaml <<EOF
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi
    serviceMonitorSelectorNilUsesHelmValues: false
    podMonitorSelectorNilUsesHelmValues: false
    ruleSelectorNilUsesHelmValues: false
    
grafana:
  adminPassword: ${GRAFANA_ADMIN_PASSWORD:-admin}
  persistence:
    enabled: true
    size: 10Gi
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/default
  dashboardsConfigMaps:
    default: grafana-dashboards
    
alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
EOF
    
    helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values prometheus-values.yaml \
        --wait
    
    rm prometheus-values.yaml
    print_success "Prometheus stack installed"
}

# Create custom dashboards
create_dashboards() {
    print_status "Creating Grafana dashboards..."
    
    kubectl create configmap grafana-dashboards \
        --from-file=deploy/monitoring/dashboards/ \
        --namespace monitoring \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_success "Dashboards created"
}

# Setup CloudWatch integration
setup_cloudwatch() {
    print_status "Setting up CloudWatch integration..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "trend2zero-prod-eks",
            "metrics_collection_interval": 60
          }
        },
        "force_flush_interval": 5
      },
      "metrics": {
        "namespace": "Trend2Zero/Production",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60,
            "totalcpu": false
          },
          "disk": {
            "measurement": [
              "used_percent",
              "inodes_free"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
EOF
    
    print_success "CloudWatch integration configured"
}

# Setup alerts
setup_alerts() {
    print_status "Setting up monitoring alerts..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: trend2zero-alerts
  namespace: monitoring
spec:
  groups:
  - name: trend2zero
    interval: 30s
    rules:
    - alert: HighCPUUsage
      expr: |
        (100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage detected"
        description: "CPU usage is above 80% (current value: {{ \$value }}%)"
    
    - alert: HighMemoryUsage
      expr: |
        (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage detected"
        description: "Memory usage is above 85% (current value: {{ \$value }}%)"
    
    - alert: PodCrashLooping
      expr: |
        rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod is crash looping"
        description: "Pod {{ \$labels.namespace }}/{{ \$labels.pod }} is crash looping"
    
    - alert: HighResponseTime
      expr: |
        histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is above 1s"
    
    - alert: HighErrorRate
      expr: |
        sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is above 5% (current value: {{ \$value }}%)"
EOF
    
    print_success "Alerts configured"
}

# Main function
main() {
    print_status "Setting up monitoring for Trend2Zero production..."
    
    install_prometheus_stack
    create_dashboards
    setup_cloudwatch
    setup_alerts
    
    print_success "Monitoring setup completed!"
    print_status "Grafana URL: kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80"
    print_status "Prometheus URL: kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus 9090:9090"
}

main "$@"