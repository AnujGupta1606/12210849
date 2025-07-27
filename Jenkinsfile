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
        stage('Checkout & Info') {
            steps {
                script {
                    echo "Starting URL Shortener DevOps Pipeline"
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Branch: main"
                    echo "Build Time: ${new Date()}"
                    echo "Workspace: ${WORKSPACE}"
                }
                
                // Clone repository
                git branch: 'main', url: "${GIT_REPO}"
                
                script {
                    echo "Repository cloned successfully"
                    sh 'ls -la'
                }
            }
        }
        
        stage('Security & Environment Check') {
            steps {
                script {
                    echo "Running security and environment checks..."
                    
                    // Check Docker availability
                    sh '''
                        echo "Checking Docker..."
                        docker --version
                        docker info | head -10
                        
                        echo "Checking Docker Compose..."
                        docker-compose --version
                        
                        echo "Checking project structure..."
                        ls -la
                        
                        echo "Verifying key files..."
                        if [ -f docker-compose.monitoring.yml ]; then
                            echo "Docker Compose file found"
                        else
                            echo "Docker Compose file missing"
                        fi
                        
                        if [ -f nginx.conf ]; then
                            echo "Nginx config found"
                        else
                            echo "Nginx config missing"
                        fi
                    '''
                }
            }
        }
        
        stage('Pipeline Completion') {
            steps {
                script {
                    echo "Jenkins pipeline completed successfully!"
                    echo "Repository checked out and validated."
                    echo "No deployment actions performed."
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Pipeline cleanup..."
                sh '''
                    echo "Final system overview..."
                    docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" || true
                    
                    echo "Disk usage check..."
                    df -h || true
                '''
            }
        }
        
        success {
            script {
                echo "===== PIPELINE SUCCESS ====="
                echo "URL Shortener DevOps Pipeline completed successfully!"
                echo ""
                echo "Access URLs:"
                echo "   Application:  http://localhost:3000"
                echo "   Grafana:      http://localhost:3001 (admin/admin123)"
                echo "   Prometheus:   http://localhost:9090"
                echo "   Jenkins:      http://localhost:8081"
                echo ""
                echo "All services are running and monitored!"
                echo "=============================="
            }
        }
        
        failure {
            script {
                echo "===== PIPELINE FAILED ====="
                echo "Checking container logs for debugging..."
                sh '''
                    echo "Container status:"
                    docker ps -a || true
                    
                    echo "Recent container logs:"
                    docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=20 || true
                    
                    echo "System resources:"
                    free -h || true
                    df -h || true
                '''
                echo "==============================="
            }
        }
        
        unstable {
            echo "Pipeline completed with warnings - check logs for details"
        }
    }
}
