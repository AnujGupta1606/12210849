#!/bin/bash
# Network Security & Firewall Configuration

# UFW Firewall Rules for Production
setup_firewall() {
    echo "🔥 Setting up UFW Firewall Rules..."
    
    # Default policies
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (change port as needed)
    ufw allow 22/tcp
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow only specific monitoring ports from internal networks
    ufw allow from 172.16.0.0/12 to any port 9090  # Prometheus
    ufw allow from 172.16.0.0/12 to any port 3001  # Grafana
    ufw allow from 172.16.0.0/12 to any port 9100  # Node Exporter
    
    # Block common attack ports
    ufw deny 23    # Telnet
    ufw deny 135   # RPC
    ufw deny 445   # SMB
    ufw deny 1433  # SQL Server
    ufw deny 3389  # RDP
    
    # Enable firewall
    ufw --force enable
    ufw status verbose
}

# Docker Network Security
setup_docker_networks() {
    echo "🐳 Configuring Docker Network Security..."
    
    # Create isolated networks
    docker network create --driver bridge \
        --subnet=172.20.0.0/16 \
        --ip-range=172.20.240.0/20 \
        --gateway=172.20.0.1 \
        secure-frontend-network
    
    docker network create --driver bridge \
        --subnet=172.21.0.0/16 \
        --ip-range=172.21.240.0/20 \
        --gateway=172.21.0.1 \
        secure-backend-network
    
    docker network create --driver bridge \
        --subnet=172.22.0.0/16 \
        --ip-range=172.22.240.0/20 \
        --gateway=172.22.0.1 \
        secure-db-network
}

# IP Tables Rules for Container Security
setup_iptables() {
    echo "🛡️ Setting up IPTables for Container Security..."
    
    # Drop all traffic to sensitive ports from external networks
    iptables -A INPUT -p tcp --dport 27017 -s 172.16.0.0/12 -j ACCEPT  # MongoDB internal only
    iptables -A INPUT -p tcp --dport 27017 -j DROP
    
    iptables -A INPUT -p tcp --dport 6379 -s 172.16.0.0/12 -j ACCEPT   # Redis internal only
    iptables -A INPUT -p tcp --dport 6379 -j DROP
    
    # Rate limiting for HTTP requests
    iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT
}

# Run all security configurations
main() {
    echo "🔒 Starting DevOps Security Configuration..."
    setup_firewall
    setup_docker_networks
    setup_iptables
    echo "✅ Security configuration completed!"
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
