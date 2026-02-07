# Connecting Windows BoltDIY to WSL Sandbox Agent

## Problem
BoltDIY runs on Windows, but Sandbox Agent runs in WSL (Linux). They need to communicate.

## Solution Options

### Option 1: Run Sandbox Agent on Windows (Recommended)
Stop the WSL version and use the Windows PowerShell version:

**In WSL:**
```bash
pkill sandbox-agent
```

**In Windows PowerShell (from bolt.new directory):**
```powershell
.\start-sandbox-agent.ps1
```

### Option 2: Use WSL IP Address
Find WSL IP and update BoltDIY to connect to it:

**In WSL terminal:**
```bash
hostname -I | awk '{print $1}'
# Example output: 172.18.240.1
```

**Update `.env.local`:**
```
SANDBOX_AGENT_URL=http://172.18.240.1:2468
```

### Option 3: Port Forwarding
Forward WSL port to Windows:

**In Windows PowerShell (as Administrator):**
```powershell
netsh interface portproxy add v4tov4 listenport=2468 listenaddress=127.0.0.1 connectport=2468 connectaddress=<WSL_IP>
```

## Current Status
- Sandbox Agent is running in WSL on 0.0.0.0:2468
- BoltDIY is trying to connect to 127.0.0.1:2468 (Windows localhost)
- Connection fails because they're in different network spaces

## Recommended Action
Use **Option 1** - run everything on Windows for simplicity.
