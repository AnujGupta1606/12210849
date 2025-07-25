# URL Shortener DevOps Project Configuration for Existing Jenkins

## 🎯 Jenkins Job Configuration

### **1. Manual Job Creation Steps:**

1. **Jenkins में जाएं**: http://localhost:8081
2. **"New Item"** click करें
3. **Job name**: `URL-Shortener-DevOps-Pipeline`
4. **"Pipeline"** select करें
5. **OK** click करें

### **2. Pipeline Configuration:**

**In "Pipeline" section:**
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: `https://github.com/AnujGupta1606/12210849.git`
- **Branch**: `*/main`
- **Script Path**: `Jenkinsfile`

### **3. Build Triggers:**
- ✅ **GitHub hook trigger for GITScm polling**
- ✅ **Poll SCM**: `H/5 * * * *` (every 5 minutes)
- ✅ **Build periodically**: `H 2 * * *` (daily at 2 AM)

### **4. Pipeline Script (Alternative):**

If you want to paste script directly instead of using Jenkinsfile:

```groovy
pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'url-shortener-devops'
        DOCKER_COMPOSE_FILE = 'docker-compose.monitoring.yml'
    }
    
    stages {
        stage('🔍 Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/AnujGupta1606/12210849.git'
                script {
                    echo "🚀 Starting URL Shortener DevOps Pipeline"
                    echo "📊 Build: ${BUILD_NUMBER}"
                    echo "🕒 Time: ${new Date()}"
                }
            }
        }
        
        stage('🛡️ Security Scan') {
            steps {
                script {
                    echo "🔒 Running security checks..."
                    sh '''
                        echo "Checking Docker security..."
                        docker --version
                        echo "Project structure:"
                        ls -la
                    '''
                }
            }
        }
        
        stage('🐳 Docker Build') {
            steps {
                script {
                    echo "🐳 Building containers..."
                    sh '''
                        docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache
                    '''
                }
            }
        }
        
        stage('🧪 Deploy & Test') {
            steps {
                script {
                    echo "🚀 Deploying services..."
                    sh '''
                        # Stop existing containers
                        docker-compose -f ${DOCKER_COMPOSE_FILE} down || true
                        
                        # Start all services
                        docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
                        
                        # Wait for services
                        echo "⏳ Waiting for services to start..."
                        sleep 30
                        
                        # Health checks
                        echo "🔍 Running health checks..."
                        curl -f http://localhost:3000/health || echo "Frontend health check failed"
                        curl -f http://localhost:9090/-/healthy || echo "Prometheus health check failed"
                        curl -f http://localhost:3001/api/health || echo "Grafana health check failed"
                    '''
                }
            }
        }
        
        stage('📊 Monitoring Check') {
            steps {
                script {
                    echo "📊 Verifying monitoring stack..."
                    sh '''
                        echo "Checking container status:"
                        docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                        
                        echo "\\nChecking Prometheus targets:"
                        curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' || true
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Pipeline cleanup..."
                sh 'docker system prune -f || true'
            }
        }
        
        success {
            script {
                echo "✅ URL Shortener DevOps Pipeline - SUCCESS!"
                echo "🔗 Application: http://localhost:3000"
                echo "📊 Grafana: http://localhost:3001"
                echo "📈 Prometheus: http://localhost:9090"
                echo "🔧 Jenkins: http://localhost:8081"
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                echo "📋 Check container logs:"
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=50 || true'
            }
        }
    }
}
```

## 🚀 **Quick Setup Commands:**

### **Option 1: Manual Setup (Recommended)**
1. Open Jenkins: http://localhost:8081
2. Create new Pipeline job
3. Use above configuration

### **Option 2: Automated Setup**
Run this in existing Jenkins container:
```bash
# Access Jenkins container
docker exec -it jenkins-flask bash

# Create job directory
mkdir -p /var/jenkins_home/jobs/URL-Shortener-DevOps

# Copy job config (you'll need to create config.xml)
```

## 📋 **Job Features:**
- ✅ **Git integration** with your repository
- ✅ **Automated builds** on code changes
- ✅ **Docker container management**
- ✅ **Health monitoring** integration
- ✅ **Security scanning** capabilities
- ✅ **Prometheus/Grafana** monitoring
- ✅ **Post-build notifications**

## 🎯 **Access URLs After Setup:**
- **Jenkins**: http://localhost:8081
- **Application**: http://localhost:3000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

Your existing Jenkins को अब पूरा DevOps pipeline मिल गया है! 🔥
