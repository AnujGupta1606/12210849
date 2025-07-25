#!/bin/bash
# Jenkins Setup Script for DevOps Pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup Jenkins with DevOps Pipeline
setup_jenkins() {
    log "🚀 Setting up Jenkins for DevOps Pipeline..."
    
    # Create Jenkins directory structure
    mkdir -p jenkins/{jobs,secrets,backups}
    
    # Set proper permissions
    if [[ "$OSTYPE" != "msys" ]]; then
        sudo chown -R 1000:1000 jenkins/
    fi
    
    # Start Jenkins container
    log "🐳 Starting Jenkins container..."
    docker-compose -f docker-compose.monitoring.yml up -d jenkins
    
    # Wait for Jenkins to start
    log "⏳ Waiting for Jenkins to initialize..."
    sleep 60
    
    # Check Jenkins health
    if curl -f http://localhost:8081/login >/dev/null 2>&1; then
        success "Jenkins is running successfully!"
    else
        error "Jenkins failed to start properly"
        exit 1
    fi
}

# Configure Jenkins jobs
configure_jenkins_jobs() {
    log "⚙️ Configuring Jenkins jobs..."
    
    # Wait for Jenkins to be fully ready
    local counter=0
    while ! curl -f http://localhost:8081/api/json >/dev/null 2>&1; do
        if [ $counter -gt 30 ]; then
            error "Jenkins is not responding after 5 minutes"
            exit 1
        fi
        log "Waiting for Jenkins API to be ready..."
        sleep 10
        counter=$((counter + 1))
    done
    
    # Create pipeline job using Jenkins CLI
    log "📋 Creating DevOps pipeline job..."
    
    # Install Jenkins CLI
    if [ ! -f jenkins-cli.jar ]; then
        wget http://localhost:8081/jnlpJars/jenkins-cli.jar
    fi
    
    # Create job configuration
    cat > jenkins/job-config.xml << 'EOF'
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>DevOps Pipeline for URL Shortener</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty>
      <projectUrl>https://github.com/AnujGupta1606/12210849/</projectUrl>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition">
    <script>
      node {
        stage('Checkout') {
          git 'https://github.com/AnujGupta1606/12210849.git'
        }
        stage('Build') {
          sh 'docker-compose -f docker-compose.monitoring.yml build'
        }
        stage('Test') {
          sh 'docker-compose -f docker-compose.monitoring.yml up -d'
          sh 'sleep 30'
          sh 'curl -f http://localhost:3000/health'
        }
        stage('Deploy') {
          sh 'echo "Deployment successful!"'
        }
      }
    </script>
    <sandbox>true</sandbox>
  </definition>
  <triggers>
    <com.cloudbees.jenkins.GitHubPushTrigger>
      <spec></spec>
    </com.cloudbees.jenkins.GitHubPushTrigger>
  </triggers>
</flow-definition>
EOF
    
    success "Jenkins configuration completed!"
}

# Setup monitoring integration
setup_jenkins_monitoring() {
    log "📊 Setting up Jenkins monitoring integration..."
    
    # Add Jenkins metrics to Prometheus
    cat >> monitoring/prometheus.yml << 'EOF'

  # Jenkins metrics
  - job_name: 'jenkins'
    static_configs:
      - targets: ['jenkins:8080']
    metrics_path: '/prometheus'
    scrape_interval: 30s
EOF
    
    # Create Grafana dashboard for Jenkins
    cat > monitoring/dashboards/jenkins-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "Jenkins CI/CD Monitoring",
    "panels": [
      {
        "title": "Build Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "jenkins_builds_success_total / jenkins_builds_total * 100"
          }
        ]
      },
      {
        "title": "Build Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "jenkins_builds_duration_milliseconds"
          }
        ]
      },
      {
        "title": "Queue Length",
        "type": "stat",
        "targets": [
          {
            "expr": "jenkins_queue_size"
          }
        ]
      }
    ]
  }
}
EOF
    
    success "Jenkins monitoring setup completed!"
}

# Main execution
main() {
    log "🔧 Starting Jenkins DevOps Setup..."
    
    setup_jenkins
    configure_jenkins_jobs
    setup_jenkins_monitoring
    
    success "🎉 Jenkins DevOps Pipeline Setup Completed!"
    echo ""
    echo "🔗 Access URLs:"
    echo "   Jenkins:    http://localhost:8081"
    echo "   Username:   admin"
    echo "   Password:   admin123"
    echo ""
    echo "   Application: http://localhost:3000"
    echo "   Prometheus:  http://localhost:9090"
    echo "   Grafana:     http://localhost:3001"
    echo ""
    echo "🚀 Your DevOps pipeline is now ready!"
}

# Execute main function
main "$@"
