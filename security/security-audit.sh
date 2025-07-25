#!/bin/bash
# DevOps Security Scanning & Monitoring Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Docker Security Scan
docker_security_scan() {
    log "${YELLOW}🔍 Running Docker Security Scan...${NC}"
    
    # Check for Docker Bench Security
    if ! command -v docker-bench-security &> /dev/null; then
        log "Installing Docker Bench Security..."
        git clone https://github.com/docker/docker-bench-security.git
        cd docker-bench-security
    fi
    
    # Run Docker security benchmark
    ./docker-bench-security.sh -l /tmp/docker-bench-security.log
    
    # Check for high-risk containers
    log "Checking for privileged containers..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "label=privileged=true"
    
    # Check for containers running as root
    log "Checking for containers running as root..."
    docker ps -q | xargs docker inspect --format '{{.Name}} runs as user: {{.Config.User}}' | grep -E "(root|^$|runs as user: $)"
}

# Vulnerability Scanning
vulnerability_scan() {
    log "${YELLOW}🛡️ Running Vulnerability Scan...${NC}"
    
    # Scan Docker images for vulnerabilities using Trivy
    if command -v trivy &> /dev/null; then
        log "Scanning Docker images with Trivy..."
        
        # Scan all running containers
        docker images --format "{{.Repository}}:{{.Tag}}" | while read image; do
            if [[ "$image" != "<none>:<none>" ]]; then
                log "Scanning image: $image"
                trivy image --severity HIGH,CRITICAL "$image"
            fi
        done
    else
        log "${RED}Trivy not installed. Installing...${NC}"
        # Install Trivy
        wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
        echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
        sudo apt-get update && sudo apt-get install trivy
    fi
}

# Network Security Check
network_security_check() {
    log "${YELLOW}🌐 Checking Network Security...${NC}"
    
    # Check open ports
    log "Scanning open ports..."
    netstat -tulpn | grep LISTEN
    
    # Check Docker networks
    log "Checking Docker networks..."
    docker network ls
    
    # Check for exposed sensitive ports
    log "Checking for exposed sensitive services..."
    docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(27017|6379|3306|5432)" || log "${GREEN}No exposed database ports found${NC}"
    
    # Check firewall status
    if command -v ufw &> /dev/null; then
        log "UFW Firewall status:"
        ufw status verbose
    fi
}

# SSL/TLS Certificate Check
ssl_check() {
    log "${YELLOW}🔒 Checking SSL/TLS Configuration...${NC}"
    
    # Check if SSL certificates exist
    if [[ -f "/etc/nginx/ssl/nginx.crt" ]]; then
        log "Checking SSL certificate validity..."
        openssl x509 -in /etc/nginx/ssl/nginx.crt -text -noout | grep -E "(Not Before|Not After)"
    else
        log "${YELLOW}SSL certificate not found. Generating self-signed certificate...${NC}"
        mkdir -p /etc/nginx/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/nginx.key \
            -out /etc/nginx/ssl/nginx.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
    
    # Test SSL configuration
    if command -v testssl &> /dev/null; then
        log "Testing SSL configuration..."
        testssl --quiet --color 0 https://localhost:443
    fi
}

# Compliance Check
compliance_check() {
    log "${YELLOW}📋 Running Compliance Checks...${NC}"
    
    # CIS Docker Benchmark
    log "Checking CIS Docker Benchmark compliance..."
    
    # Check Docker daemon configuration
    docker info | grep -E "(Security Options|Cgroup Driver|Logging Driver)"
    
    # Check container resource limits
    log "Checking container resource limits..."
    docker ps -q | xargs docker inspect --format '{{.Name}}: Memory={{.HostConfig.Memory}} CPU={{.HostConfig.CpuShares}}' | grep -v "Memory=0"
    
    # Check for read-only containers
    log "Checking for read-only root filesystems..."
    docker ps -q | xargs docker inspect --format '{{.Name}}: ReadonlyRootfs={{.HostConfig.ReadonlyRootfs}}'
}

# Security Monitoring Setup
setup_security_monitoring() {
    log "${YELLOW}📊 Setting up Security Monitoring...${NC}"
    
    # Falco for runtime security monitoring
    if ! command -v falco &> /dev/null; then
        log "Installing Falco for runtime security monitoring..."
        curl -s https://falco.org/repo/falcosecurity-3672BA8F.asc | apt-key add -
        echo "deb https://download.falco.org/packages/deb stable main" | tee -a /etc/apt/sources.list.d/falcosecurity.list
        apt-get update -y && apt-get install -y falco
    fi
    
    # Start Falco
    systemctl enable falco && systemctl start falco
    
    # AIDE for file integrity monitoring
    if ! command -v aide &> /dev/null; then
        log "Installing AIDE for file integrity monitoring..."
        apt-get install -y aide
        aideinit
        mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    fi
}

# Generate Security Report
generate_security_report() {
    log "${YELLOW}📄 Generating Security Report...${NC}"
    
    REPORT_FILE="/tmp/security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "==========================================="
        echo "DevOps Security Report"
        echo "Generated on: $(date)"
        echo "==========================================="
        echo ""
        
        echo "1. DOCKER SECURITY STATUS"
        echo "-------------------------"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"
        echo ""
        
        echo "2. NETWORK SECURITY"
        echo "------------------"
        netstat -tulpn | grep LISTEN
        echo ""
        
        echo "3. FIREWALL STATUS"
        echo "-----------------"
        if command -v ufw &> /dev/null; then
            ufw status
        else
            echo "UFW not installed"
        fi
        echo ""
        
        echo "4. SSL CERTIFICATE STATUS"
        echo "-------------------------"
        if [[ -f "/etc/nginx/ssl/nginx.crt" ]]; then
            openssl x509 -in /etc/nginx/ssl/nginx.crt -text -noout | grep -E "(Not Before|Not After)"
        else
            echo "SSL certificate not found"
        fi
        echo ""
        
        echo "5. CONTAINER RESOURCE LIMITS"
        echo "----------------------------"
        docker ps -q | xargs docker inspect --format '{{.Name}}: Memory={{.HostConfig.Memory}} CPU={{.HostConfig.CpuShares}}'
        echo ""
        
    } > "$REPORT_FILE"
    
    log "${GREEN}Security report generated: $REPORT_FILE${NC}"
}

# Main function
main() {
    log "${GREEN}🔒 Starting DevOps Security Audit...${NC}"
    
    case "${1:-all}" in
        "docker")
            docker_security_scan
            ;;
        "vuln")
            vulnerability_scan
            ;;
        "network")
            network_security_check
            ;;
        "ssl")
            ssl_check
            ;;
        "compliance")
            compliance_check
            ;;
        "monitor")
            setup_security_monitoring
            ;;
        "report")
            generate_security_report
            ;;
        "all")
            docker_security_scan
            vulnerability_scan
            network_security_check
            ssl_check
            compliance_check
            generate_security_report
            ;;
        *)
            echo "Usage: $0 [docker|vuln|network|ssl|compliance|monitor|report|all]"
            exit 1
            ;;
    esac
    
    log "${GREEN}✅ Security audit completed!${NC}"
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
