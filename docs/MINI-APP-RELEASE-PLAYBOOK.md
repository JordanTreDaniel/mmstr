# Mini-App Release Playbook

> **Goal:** Deploy a new small Next.js (or static) app from this GCP VM in 5 minutes, not 5 days.  
> **Infrastructure:** GCP e2-small (20GB disk), Cloudflare named tunnel `vm-services`, domain `jordanchristley.com`.  
> **Convention over configuration.** Follow the checklist, don't reinvent.

---

## Table of Contents

1. [Repo Structure Standard](#1-repo-structure-standard)
2. [Build + Deploy Checklist](#2-build--deploy-checklist)
3. [DNS Naming Convention](#3-dns-naming-convention)
4. [Env Var Template Pattern](#4-env-var-template-pattern)
5. [Port Allocation Registry](#5-port-allocation-registry)
6. [Monitoring Basics](#6-monitoring-basics)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Template: systemd Service File](#8-template-systemd-service-file)
9. [Template: cloudflared Ingress Entry](#9-template-cloudflared-ingress-entry)

---

## 1. Repo Structure Standard

All mini-app code lives under `/home/jordanc/dev/<app-name>/`. The name is short, lowercase, hyphen-separated.

```
/home/jordanc/dev/<app-name>/
├── .env.local              # Secrets & env vars (gitignored)
├── package.json            # Next.js or plain Node project
├── next.config.js          # (if Next.js)
├── app/ or src/            # App source
├── public/                 # Static assets
├── AGENTS.md               # Optional: agent instructions
└── docs/                   # Optional: docs like this playbook
```

### Existing apps on this VM

| App              | Path                                  | Type        |
|------------------|---------------------------------------|-------------|
| review-dash      | `/home/jordanc/dev/review-dash/app/`  | Node (mjs)  |
| youtube-university | `/home/jordanc/dev/youtube-university/` | Python/Static |
| walker           | `/home/jordanc/walker-county-case/`   | Static HTML |
| hermes-webui     | `/home/jordanc/dev/hermes-webui/`     | Python (Flask) |
| mmstr            | `/home/jordanc/dev/mmstr/`            | Next.js     |
| hermes-dash      | (served via dedicated cloudflared)    | Next.js     |

> **Note:** walker lives outside `dev/` at `/home/jordanc/walker-county-case/`. New apps should go under `dev/`.

---

## 2. Build + Deploy Checklist

For a **Next.js app**, the deploy sequence is:

### Step 1: Clone / create repo

```bash
cd /home/jordanc/dev
git clone git@github.com:jordanchristley/<app-name>.git
cd <app-name>
npm install
npm run build
```

### Step 2: Create `.env.local`

```bash
cp .env.example .env.local   # or create manually
# Fill in secrets — see Section 4
```

### Step 3: Pick a port

Check the [Port Registry](#5-port-allocation-registry) and claim the next available port. **Don't reuse a port.**

### Step 4: Create systemd user service

```bash
# Copy template, edit port and paths
cp /home/jordanc/dev/mmstr/docs/templates/next-app.service \
   ~/.config/systemd/user/<app-name>.service

# Edit the file
nano ~/.config/systemd/user/<app-name>.service
```

Update: `Description`, `WorkingDirectory`, `ExecStart` (port), `EnvironmentFile` path.

### Step 5: Create cloudflared ingress entry

Add to `~/.cloudflared/config.yml` (see [Template](#9-template-cloudflared-ingress-entry)):

```yaml
  # <App Name> - <description>
  - hostname: <app>.jordanchristley.com
    service: http://127.0.0.1:<PORT>
    originRequest:
      noTLSVerify: true
```

> **Important:** Add the entry **above** the catch-all `http_status:404` line.

### Step 6: Route DNS

```bash
cloudflared tunnel route dns vm-services <app>.jordanchristley.com
```

This creates the CNAME record in Cloudflare automatically.

### Step 7: Enable and start

```bash
# Reload systemd
systemctl --user daemon-reload

# Enable (start on boot)
systemctl --user enable <app-name>.service

# Start now
systemctl --user start <app-name>.service

# Restart tunnel to pick up new ingress
systemctl --user restart cloudflared-vm-tunnel.service
```

### Step 8: Verify

```bash
# Check service is running
systemctl --user status <app-name>.service

# Check logs
journalctl --user -u <app-name>.service -f

# Verify tunnel is healthy
systemctl --user status cloudflared-vm-tunnel.service

# Test the public URL
curl -I https://<app>.jordanchristley.com
```

---

## 3. DNS Naming Convention

**Pattern:** `<app>.jordanchristley.com`

The subdomain should be short, memorable, and match the repo name. Examples:

| Repo               | Subdomain                      |
|--------------------|--------------------------------|
| review-dash        | review.jordanchristley.com     |
| youtube-university | yu.jordanchristley.com         |
| walker-county-case | cases.jordanchristley.com      |
| hermes-webui       | chat.jordanchristley.com       |
| mmstr              | mmstr.jordanchristley.com      |
| hermes-dash        | dash.jordanchristley.com       |

**Rules:**
- Use the shortest recognizable abbreviation (yu not youtube-university)
- All lowercase, no underscores
- `cloudflared tunnel route dns vm-services <subdomain>.jordanchristley.com` creates the DNS automatically

---

## 4. Env Var Template Pattern

### For Node/Next.js apps

Store secrets in `~/.config/<app-name>/.env` (systemd `EnvironmentFile`) or in the repo's `.env.local` (for Next.js `next start`).

**Pattern A — systemd EnvironmentFile (review-dash style):**

```bash
# ~/.config/review-dash/.env
NOTION_TOKEN=secret_value
PORT=3001
REVIEW_DASH_TOKEN=secret_value
```

Referenced in systemd unit:
```ini
EnvironmentFile=/home/jordanc/.config/review-dash/.env
```

**Pattern B — Next.js .env.local (mmstr style):**

```bash
# .env.local (in repo root, gitignored)
# MMSTR Environment Variables
# ============================
# AI Provider Configuration
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=https://mmstr.jordanchristley.com
```

### .env.example template

Every repo should include a `.env.example` with placeholder values:

```bash
# Required
PORT=9XXX
API_KEY=your-key-here

# Optional
NEXT_PUBLIC_BASE_URL=https://<app>.jordanchristley.com
```

**Never commit `.env.local` or `.env`.** Add to `.gitignore`:

```
.env
.env.local
.env.*.local
```

---

## 5. Port Allocation Registry

All apps bind to `127.0.0.1` (loopback only). Cloudflared tunnels them to the public internet.

| Port  | App             | Subdomain                   | Status  |
|-------|-----------------|-----------------------------|---------|
| 3001  | review-dash     | review.jordanchristley.com  | Active  |
| 8080  | youtube-university | yu.jordanchristley.com   | Active  |
| 8090  | walker          | cases.jordanchristley.com   | Active  |
| 8780  | hermes-webui    | chat.jordanchristley.com    | Active  |
| 8811  | ledori-demo     | demos.jordanchristley.com   | Active  |
| 8812  | motion-script   | apps.jordanchristley.com    | Active  |
| 9119  | hermes-dash     | dash.jordanchristley.com    | Active  |
| 9200  | mmstr           | mmstr.jordanchristley.com   | Active  |

### Next available ports

```
9201, 9202, 9203, ...
```

**Rule:** Pick the next unused port above 9200. Update this table when you deploy.

### How to check if a port is free

```bash
# Check if port is in use
ss -tlnp | grep :9XXX

# Or more specific
lsof -i :9XXX
```

---

## 6. Monitoring Basics

### systemd status check

```bash
# Check a specific app
systemctl --user status <app-name>.service

# Check all user services
systemctl --user list-units --type=service --state=running

# Check the tunnel
systemctl --user status cloudflared-vm-tunnel.service
```

### Logs

```bash
# Follow logs for an app
journalctl --user -u <app-name>.service -f

# Last 50 lines
journalctl --user -u <app-name>.service -n 50

# Since last boot
journalctl --user -u <app-name>.service -b
```

### Quick health check script

```bash
#!/bin/bash
# /home/jordanc/bin/check-services.sh

APPS=("review-dash:3001" "yu:8080" "walker:8090" "hermes-webui:8780" "hermes-dash:9119" "mmstr:9200")

echo "=== Service Status ==="
for app in "${APPS[@]}"; do
    name="${app%%:*}"
    port="${app##*:}"
    status=$(systemctl --user is-active "$name.service" 2>/dev/null || echo "not-found")
    http=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port" 2>/dev/null || echo "fail")
    printf "%-20s systemd=%-10s http=%s\n" "$name" "$status" "$http"
done

echo ""
echo "=== Tunnel ==="
systemctl --user is-active cloudflared-vm-tunnel.service
```

### Cloudflare tunnel liveness

The tunnel service (`cloudflared-vm-tunnel.service`) auto-restarts on failure:

```ini
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=5
```

Check tunnel health:
```bash
# Quick check
systemctl --user status cloudflared-vm-tunnel.service

# Cloudflare dashboard also shows tunnel status at:
# https://one.dash.cloudflare.com → Networks → Tunnels
```

---

## 7. Rollback Procedure

### If the new version is broken

```bash
# 1. Stop the broken service
systemctl --user stop <app-name>.service

# 2. Go to the repo
cd /home/jordanc/dev/<app-name>

# 3. Revert to last known-good commit
git log --oneline -5          # find the good commit
git checkout <good-commit>    # or git revert HEAD

# 4. Rebuild
npm install && npm run build

# 5. Restart
systemctl --user start <app-name>.service

# 6. Verify
curl -I https://<app>.jordanchristley.com
```

### If you need to fully remove an app

```bash
# 1. Stop and disable service
systemctl --user stop <app-name>.service
systemctl --user disable <app-name>.service

# 2. Remove systemd unit
rm ~/.config/systemd/user/<app-name>.service
systemctl --user daemon-reload

# 3. Remove cloudflared ingress entry
# Edit ~/.cloudflared/config.yml, remove the entry, then:
systemctl --user restart cloudflared-vm-tunnel.service

# 4. Unroute DNS (optional)
cloudflared tunnel route dns --overwrite-dns vm-services <app>.jordanchristley.com

# 5. Remove code (optional)
rm -rf /home/jordanc/dev/<app-name>

# 6. Free the port in the registry
```

### Nuclear rollback — restart everything

```bash
# Restart all services
systemctl --user restart review-dash.service
systemctl --user restart hermes-webui.service
systemctl --user restart walker-dash.service
systemctl --user restart mmstr.service
systemctl --user restart cloudflared-vm-tunnel.service
```

---

## 8. Template: systemd Service File

### Next.js app template

```ini
[Unit]
Description=<APP_DESCRIPTION> (port <PORT>, loopback only)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/jordanc/dev/<app-name>
ExecStart=/home/jordanc/dev/<app-name>/node_modules/.bin/next start -p <PORT>
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=<PORT>

[Install]
WantedBy=default.target
```

### With secrets (EnvironmentFile)

```ini
[Unit]
Description=<APP_DESCRIPTION> (port <PORT>, loopback only)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/home/jordanc/.config/<app-name>/.env
WorkingDirectory=/home/jordanc/dev/<app-name>
ExecStart=/home/jordanc/dev/<app-name>/node_modules/.bin/next start -p <PORT>
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### Python/Flask app template

```ini
[Unit]
Description=<APP_DESCRIPTION> (port <PORT>)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/jordanc/dev/<app-name>
ExecStart=/home/jordanc/dev/<app-name>/.venv/bin/python3 app.py --port <PORT> --host 127.0.0.1
Restart=on-failure
RestartSec=5
Environment=FLASK_PORT=<PORT>

[Install]
WantedBy=default.target
```

### Static file server template

```ini
[Unit]
Description=<APP_DESCRIPTION> (port <PORT>)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/home/jordanc/dev/<app-name>
ExecStart=/usr/bin/python3 -m http.server <PORT> --directory /home/jordanc/dev/<app-name>
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

### Install the unit file

```bash
# Copy to systemd user directory
cp <app-name>.service ~/.config/systemd/user/<app-name>.service

# Reload and enable
systemctl --user daemon-reload
systemctl --user enable <app-name>.service
systemctl --user start <app-name>.service
```

---

## 9. Template: cloudflared Ingress Entry

Add this to `~/.cloudflared/config.yml`, **above** the catch-all 404 entry:

```yaml
  # <App Name> — <one-line description>
  - hostname: <app>.jordanchristley.com
    service: http://127.0.0.1:<PORT>
    originRequest:
      noTLSVerify: true
```

### Real examples from this VM

```yaml
  # Review Dash — envelope API + SPA
  - hostname: review.jordanchristley.com
    service: http://127.0.0.1:3001
    originRequest:
      noTLSVerify: true

  # MMSTR — Make Me Say That's Right
  - hostname: mmstr.jordanchristley.com
    service: http://127.0.0.1:9200
    originRequest:
      noTLSVerify: true
```

### After editing config.yml

```bash
# Route the DNS
cloudflared tunnel route dns vm-services <app>.jordanchristley.com

# Restart the tunnel to pick up changes
systemctl --user restart cloudflared-vm-tunnel.service
```

### The full config lives at

```
/home/jordanc/.cloudflared/config.yml
```

Tunnel UUID: `926521d0-c92a-4104-b496-c99b51128c21`  
Tunnel name: `vm-services`  
Credentials: `/home/jordanc/.cloudflared/926521d0-c92a-4104-b496-c99b51128c21.json`

---

## Quick Reference Card

```bash
# === DEPLOY NEW APP (5 steps) ===

# 1. Claim a port: next free is 9201
PORT=9201

# 2. Create repo + build
cd /home/jordanc/dev && git clone git@github.com:jordanchristley/<app>.git
cd <app> && npm install && npm run build

# 3. Create systemd unit
nano ~/.config/systemd/user/<app>.service  # use template from Section 8

# 4. Add cloudflared entry
nano ~/.cloudflared/config.yml  # add entry from Section 9, above catch-all
cloudflared tunnel route dns vm-services <app>.jordanchristley.com

# 5. Start everything
systemctl --user daemon-reload
systemctl --user enable --now <app>.service
systemctl --user restart cloudflared-vm-tunnel.service

# Verify
curl -I https://<app>.jordanchristley.com
```

---

*Last updated: 2026-08-27 — based on real VM patterns from jordanchristley.com infrastructure.*
