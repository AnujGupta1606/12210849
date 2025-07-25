# 🚀 Complete Step-by-Step Setup & Run Guide

## **Pre-Requirements (Must Do First):**

### **1. Install Docker Desktop**
1. Download from: https://www.docker.com/products/docker-desktop-windows
2. Install Docker Desktop for Windows
3. **IMPORTANT**: Start Docker Desktop application
4. Wait for Docker to start completely (green icon in system tray)

### **2. Verify Docker is Running**
```cmd
# Open PowerShell/CMD and run:
docker --version
docker info
```
If you see "error during connect", Docker Desktop is not running.

## **Step-by-Step Project Run:**

### **Step 1: Open Terminal in Project Directory**
```cmd
# Navigate to project folder
cd e:\Project\12210849a

# Check if you're in right directory
dir
# You should see: Dockerfile, docker-compose.demo.yml, backend folder, etc.
```

### **Step 2: Start Docker Desktop**
1. Click on Docker Desktop icon
2. Wait for "Docker Desktop is starting..." to complete
3. You'll see green "Docker Desktop is running" status

### **Step 3: Build and Start All Services**
```cmd
# Start all services (this will take 5-10 minutes first time)
docker-compose -f docker-compose.demo.yml up -d

# Check if services are running
docker-compose -f docker-compose.demo.yml ps
```

### **Step 4: Wait and Access Applications**
```cmd
# Wait 2-3 minutes for all services to start
# Then access these URLs:

Frontend: http://localhost:3000
Backend API: http://localhost:5000/health
Prometheus: http://localhost:9090
Grafana: http://localhost:3001 (admin/admin123)
```

### **Step 5: Test the Application**
1. **Frontend**: Open http://localhost:3000
   - Enter a URL like: https://google.com
   - Click "Shorten URL"
   - You should get a shortened URL

2. **Backend**: Open http://localhost:5000/health
   - Should show: {"status":"healthy"}

3. **Monitoring**: Open http://localhost:9090
   - Prometheus metrics dashboard

4. **Grafana**: Open http://localhost:3001
   - Login: admin / admin123
   - View dashboards

## **Common Issues & Solutions:**

### **Issue 1: Docker not running**
```
Error: "error during connect"
Solution: Start Docker Desktop application
```

### **Issue 2: Port already in use**
```
Error: "port is already allocated"
Solution: 
docker-compose -f docker-compose.demo.yml down
# Wait 30 seconds, then try again
docker-compose -f docker-compose.demo.yml up -d
```

### **Issue 3: Services not starting**
```
# Check logs
docker-compose -f docker-compose.demo.yml logs

# Restart specific service
docker-compose -f docker-compose.demo.yml restart backend
```

### **Issue 4: Out of space**
```
# Clean up Docker
docker system prune -f
```

## **Quick Commands for Demo:**

### **Start Demo:**
```cmd
# Windows batch file
start-demo.bat

# Or manual commands:
docker-compose -f docker-compose.demo.yml up -d
timeout /t 30
docker-compose -f docker-compose.demo.yml ps
```

### **Stop Demo:**
```cmd
docker-compose -f docker-compose.demo.yml down
```

### **View Logs:**
```cmd
# All services
docker-compose -f docker-compose.demo.yml logs

# Specific service
docker-compose -f docker-compose.demo.yml logs backend
```

### **Scale Services (for demo):**
```cmd
# Scale backend to 3 instances
docker-compose -f docker-compose.demo.yml up -d --scale backend=3
```

## **Interview Demo Flow:**

### **1. Architecture Explanation (2 min)**
"I've built a microservices architecture with React frontend, Node.js backend, MongoDB database, and Redis cache, all containerized with Docker."

### **2. Start Demo (1 min)**
```cmd
# Run this command
docker-compose -f docker-compose.demo.yml up -d

# Show services starting
docker-compose -f docker-compose.demo.yml ps
```

### **3. Show Application (2 min)**
- Frontend: http://localhost:3000 (URL shortening)
- Backend: http://localhost:5000/health (API health)
- API docs: http://localhost:5000/metrics (Prometheus metrics)

### **4. Show Monitoring (2 min)**
- Prometheus: http://localhost:9090 (Metrics collection)
- Grafana: http://localhost:3001 (Visualization dashboards)

### **5. Show DevOps Features (2 min)**
```cmd
# Show scaling
docker-compose -f docker-compose.demo.yml up -d --scale backend=3

# Show logs
docker-compose -f docker-compose.demo.yml logs --tail=20 backend

# Show health checks
curl http://localhost:5000/health
```

## **What to Say in Interview:**

### **Opening:**
"I've built a production-ready URL shortener using modern DevOps practices. Let me show you the complete setup running locally."

### **Technical Points:**
- "Multi-stage Docker builds for optimization"
- "Microservices with independent scaling"
- "Redis caching for performance"
- "Prometheus monitoring for observability"
- "Health checks and graceful shutdown"

### **DevOps Points:**
- "Infrastructure as code with Docker Compose"
- "Container orchestration ready for Kubernetes"
- "CI/CD pipeline with GitHub Actions"
- "Security scanning and dependency management"

### **Business Value:**
- "Horizontal scaling for traffic growth"
- "Monitoring for proactive issue detection"
- "Cost-effective using open-source tools"
- "Production-ready with security best practices"

## **Troubleshooting Commands:**

```cmd
# If something goes wrong:

# 1. Stop everything
docker-compose -f docker-compose.demo.yml down

# 2. Clean up
docker system prune -f

# 3. Check Docker Desktop is running
docker info

# 4. Start fresh
docker-compose -f docker-compose.demo.yml up -d

# 5. Monitor startup
docker-compose -f docker-compose.demo.yml logs -f
```

## **Success Criteria:**
✅ All 6 services running (frontend, backend, mongo, redis, prometheus, grafana)
✅ Frontend accessible on port 3000
✅ Backend health check working on port 5000
✅ Can create and access shortened URLs
✅ Monitoring dashboards showing metrics

**Total Setup Time: 10-15 minutes (first time)**
**Demo Time: 5-7 minutes**
**Cost: ₹0 (100% FREE)**
