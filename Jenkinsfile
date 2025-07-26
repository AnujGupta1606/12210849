pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'url-shortener-devops'
        DOCKER_COMPOSE_FILE = 'docker-compose.monitoring.yml'
        GIT_REPO = 'https://github.com/AnujGupta1606/12210849.git'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('🔍 Checkout & Info') {
            steps {
                script {
                    echo "🚀 Starting URL Shortener DevOps Pipeline"
                    echo "📊 Build Number: ${BUILD_NUMBER}"
                    echo "🌿 Branch: main"
                    echo "🕒 Build Time: ${new Date()}"
                    echo "📁 Workspace: ${WORKSPACE}"
                }
                
                // Clone repository
                git branch: 'main', url: "${GIT_REPO}"
                
                script {
                    echo "📝 Repository cloned successfully"
                    sh 'ls -la'
                }
            }
        }
        
        stage('🔒 Security & Environment Check') {
            steps {
                script {
                    echo "🛡️ Running security and environment checks..."
                    
                    // Check Docker availability
                    sh '''
                        echo "🐳 Checking Docker..."
                        docker --version
                        docker info | head -10
                        
                        echo "📋 Checking Docker Compose..."
                        docker-compose --version
                        
                        echo "🔍 Checking project structure..."
                        ls -la
                        
                        echo "📄 Verifying key files..."
                        if [ -f docker-compose.monitoring.yml ]; then
                            echo "✅ Docker Compose file found"
                        else
                            echo "❌ Docker Compose file missing"
                        fi
                        
                        if [ -f nginx.conf ]; then
                            echo "✅ Nginx config found"
                        else
                            echo "❌ Nginx config missing"
                        fi
                    '''
                }
            }
        }
        
        stage('🧹 Cleanup Previous Deployment') {
            steps {
                script {
                    echo "🧹 Cleaning up previous deployment..."
                    sh '''
                        echo "Stopping existing containers..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} down || true
                        
                        echo "Removing orphaned containers..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} down --remove-orphans || true
                        
                        echo "Pruning Docker system..."
                        docker system prune -f || true
                    '''
                }
            }
        }
        
        stage('🐳 Docker Build & Deploy') {
            steps {
                script {
                    echo "🐳 Building and deploying containers..."
                    sh '''
                        echo "🔨 Building Docker images..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache
                        
                        echo "🚀 Starting all services..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} up -d
                        
                        echo "⏳ Waiting for services to initialize..."
                        sleep 30
                        
                        echo "📊 Checking container status..."
                        docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                    '''
                }
            }
        }
        stage('Nginx Status Health Check') {
    steps {
        script {
            echo "Checking Nginx status endpoint..."
            sh '''
                curl -f http://localhost:3000/nginx_status || exit 1
            '''
        }
    }
}
        
        stage('🧪 Health Checks & Validation') {
            steps {
                script {
                    echo "🧪 Running comprehensive health checks..."
                    sh '''
                        echo "🔍 Testing application endpoints..."
                        
                        # Frontend health check
                        echo "Testing Frontend (localhost:3000)..."
                        curl -f http://localhost:3000/health || echo "Frontend health check failed"
                        
                        # Prometheus health check
                        echo "Testing Prometheus (localhost:9090)..."
                        curl -f http://localhost:9090/-/healthy || echo "Prometheus health check failed"
                        
                        # Grafana health check
                        echo "Testing Grafana (localhost:3001)..."
                        curl -f http://localhost:3001/api/health || echo "Grafana health check failed"
                        
                        echo "📊 Checking container health status..."
                        docker ps --format "table {{.Names}}\\t{{.Status}}" | grep -E "(healthy|Up)" || true
                        
                        echo "🔍 Checking Prometheus targets..."
                        curl -s http://localhost:9090/api/v1/targets | head -200 || true
                    '''
                }
            }
        }
        
        stage('📊 Monitoring & Metrics Verification') {
            steps {
                script {
                    echo "📊 Verifying monitoring stack..."
                    sh '''
                        echo "🔍 Checking Prometheus metrics..."
                        curl -s "http://localhost:9090/api/v1/query?query=up" | grep -o '"result":\\[.*\\]' || true
                        
                        echo "📈 Checking container metrics..."
                        curl -s "http://localhost:9090/api/v1/query?query=container_memory_usage_bytes" | head -100 || true
                        
                        echo "🌐 Checking nginx status..."
                        curl -s http://localhost:3000/nginx_status || true
                        
                        echo "📊 Final container overview..."
                        docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}" || true
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Pipeline cleanup..."
                sh '''
                    echo "📊 Final system overview..."
                    docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" || true
                    
                    echo "💾 Disk usage check..."
                    df -h || true
                '''
            }
        }
        
        success {
            script {
                echo "✅ ===== PIPELINE SUCCESS ====="
                echo "🎉 URL Shortener DevOps Pipeline completed successfully!"
                echo ""
                echo "🔗 Access URLs:"
                echo "   📱 Application:  http://localhost:3000"
                echo "   📊 Grafana:      http://localhost:3001 (admin/admin123)"
                echo "   📈 Prometheus:   http://localhost:9090"
                echo "   🔧 Jenkins:      http://localhost:8081"
                echo ""
                echo "🚀 All services are running and monitored!"
                echo "=============================="
            }
        }
        
        failure {
            script {
                echo "❌ ===== PIPELINE FAILED ====="
                echo "🔍 Checking container logs for debugging..."
                sh '''
                    echo "📋 Container status:"
                    docker ps -a || true
                    
                    echo "📄 Recent container logs:"
                    docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=20 || true
                    
                    echo "🔧 System resources:"
                    free -h || true
                    df -h || true
                '''
                echo "==============================="
            }
        }
        
        unstable {
            echo "⚠️ Pipeline completed with warnings - check logs for details"
        }
    }
}
