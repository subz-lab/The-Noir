# How to Start ELK Stack (Activate Localhost)

## Quick Start

### Step 1: Start Docker Desktop

1. **Open Docker Desktop** application
2. **Wait** for Docker to fully start (whale icon in system tray should be steady)
3. **Verify** Docker is running:
   ```powershell
   docker --version
   docker ps
   ```

### Step 2: Start ELK Stack

Open PowerShell in your project directory and run:

```powershell
cd "c:\Users\Vishal Pednekar\OneDrive\Desktop\soc anti"
docker-compose up -d
```

**What this does:**
- `-d` = detached mode (runs in background)
- Starts Elasticsearch, Logstash, and Kibana

### Step 3: Wait for Services to Start (2-5 minutes)

Monitor the startup:

```powershell
# Watch logs
docker-compose logs -f

# Or check status
docker-compose ps
```

**Expected output:**
```
NAME            STATUS          PORTS
elasticsearch   Up (healthy)    0.0.0.0:9200->9200/tcp
logstash        Up (healthy)    0.0.0.0:5000->5000/tcp
kibana          Up (healthy)    0.0.0.0:5601->5601/tcp
```

### Step 4: Verify Services

**Test Elasticsearch:**
```powershell
curl http://localhost:9200
```
Should return cluster information

**Test Kibana:**
Open browser: **http://localhost:5601**

---

## Access Points

Once started, you can access:

- **Kibana Dashboard**: http://localhost:5601
- **Elasticsearch API**: http://localhost:9200
- **Logstash Monitoring**: http://localhost:9600

---

## Common Issues

### Issue: "docker-compose: command not found"

**Solution**: Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Install and restart computer

### Issue: "Cannot connect to Docker daemon"

**Solution**: Start Docker Desktop application
- Look for whale icon in system tray
- Wait for it to turn steady (not animated)

### Issue: "Port already in use"

**Solution**: Stop conflicting services
```powershell
# Find what's using port 9200
netstat -ano | findstr :9200

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

### Issue: Services won't start (keep restarting)

**Solution**: Increase Docker memory
1. Docker Desktop → Settings → Resources
2. Set Memory to at least **4GB**
3. Click Apply & Restart

---

## Stop ELK Stack

When you're done:

```powershell
# Stop services (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## Next Steps After Starting

1. **Generate logs** (if not done):
   ```powershell
   python log_generator.py
   ```

2. **Restart Logstash** to ingest logs:
   ```powershell
   docker-compose restart logstash
   ```

3. **Open Kibana**: http://localhost:5601

4. **Create index pattern**: `security-logs-*`

5. **View your logs** in Discover!

---

## Full Startup Sequence

```powershell
# 1. Navigate to project
cd "c:\Users\Vishal Pednekar\OneDrive\Desktop\soc anti"

# 2. Start ELK Stack
docker-compose up -d

# 3. Wait and monitor
docker-compose logs -f

# 4. Verify (in new terminal)
curl http://localhost:9200
curl http://localhost:9600/_node/stats

# 5. Open Kibana
start http://localhost:5601
```

---

## Summary

✅ **Start**: `docker-compose up -d`  
✅ **Check**: `docker-compose ps`  
✅ **Logs**: `docker-compose logs -f`  
✅ **Access**: http://localhost:5601  
✅ **Stop**: `docker-compose down`  

Your localhost will be active once Docker Compose starts all services! 🚀
