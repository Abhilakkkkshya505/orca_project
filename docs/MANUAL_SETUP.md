# Project ORCA: Human Manual Setup & Production Deployment Checklist

This document contains the step-by-step checklist, in chronological order, for everything the human operator must configure in external cloud services. Every configuration maps directly to an environment variable in `backend/.env` or `frontend/.env`.

---

## Pre-Deployment Overview: Variable Mapping Summary

| Service | Setting / Credential | Target Env Variable | Target File |
| :--- | :--- | :--- | :--- |
| **Domain & DNS** | Primary Domain Name | `COOKIE_DOMAIN`, `ALLOWED_HOSTS` | `backend/.env`, `frontend/.env` |
| **Cloudflare Pages** | Production Frontend URL | `VITE_API_BASE_URL` | `frontend/.env` |
| **Cloudflare Tunnel** | Tunnel Secret Token | `CLOUDFLARE_TUNNEL_TOKEN` | `infra/cloudflared/` |
| **Cloudflare Access** | Application Audience Tag (AUD) | `CF_ACCESS_AUD` | `backend/.env` |
| **Cloudflare Access** | Access Policy Team Domain | `CF_ACCESS_TEAM_DOMAIN` | `backend/.env` |
| **Cloudflare Turnstile** | Public Site Key | `VITE_TURNSTILE_SITE_KEY` | `frontend/.env` |
| **Cloudflare Turnstile** | Secret Key | `TURNSTILE_SECRET_KEY` | `backend/.env` |
| **Cloudflare R2** | Bucket Name & Endpoint | `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL` | `backend/.env` |
| **Cloudflare R2** | Access Key ID & Secret | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `backend/.env` |
| **Transactional Email** | SMTP Host, Port, User, Password | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | `backend/.env` |
| **Sentry Error Tracking** | Backend DSN | `SENTRY_DSN` | `backend/.env` |
| **Sentry Error Tracking** | Frontend DSN | `VITE_SENTRY_DSN` | `frontend/.env` |
| **LLM Provider (Anthropic)** | Anthropic Claude API Key | `ANTHROPIC_API_KEY`, `LLM_MODEL_NAME` | `backend/.env` |
| **LLM Provider (Google)** | Google Cloud Gemini API Key | `GEMINI_API_KEY`, `LLM_MODEL_NAME` | `backend/.env` |
| **Copernicus Marine** | Copernicus Username & Password | `COPERNICUS_USERNAME`, `COPERNICUS_PASSWORD` | `backend/.env` |
| **NASA Earthdata** | Earthdata Bearer Token | `NASA_EARTHDATA_TOKEN` | `backend/.env` |

---

## Step 1: Domain Registration & Cloudflare Zone Onboarding
1. Purchase a primary domain (e.g., `orca-marine.org`).
2. Add the domain to your Cloudflare dashboard (free tier is sufficient).
3. Update nameservers at your domain registrar to point to Cloudflare's assigned nameservers.
4. Verify DNS propagation in Cloudflare.
5. In Cloudflare **SSL/TLS** settings:
   - Set encryption mode to **Full (Strict)**.
   - Enable **Always Use HTTPS**, **HTTP Strict Transport Security (HSTS)**, and **Minimum TLS Version: 1.2**.

---

## Step 2: VPS Server Provisioning & Linux Hardening
1. Provision an Ubuntu 24.04 LTS VPS (minimum 4GB RAM, 2 vCPUs, 40GB SSD; e.g., Hetzner, DigitalOcean, or Linode).
2. Configure SSH key authentication and disable password login:
   ```bash
   sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```
3. Enable Uncomplicated Firewall (UFW):
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```
   *(Note: No web ports 80/443 need to be opened if using Cloudflare Tunnel! Traffic routes securely over outbound tunnel).*
4. Install Docker Engine and Docker Compose v2:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

---

## Step 3: Cloudflare Tunnel Configuration (`cloudflared`)
Cloudflare Tunnel connects the backend Docker container securely to the Cloudflare network without opening public ports.
1. In Cloudflare Zero Trust dashboard, navigate to **Networks > Tunnels > Create a Tunnel**.
2. Name the tunnel `orca-production-tunnel`.
3. Copy the tunnel token into `infra/cloudflared/cert.json` or as an environment secret `CLOUDFLARE_TUNNEL_TOKEN`.
4. In the Public Hostname tab, configure routing:
   - **Service:** `HTTP`
   - **URL:** `api:8000` (Docker internal network service name)
   - **Domain:** `api.orca-marine.org`
5. Enable HTTP Keep-Alive and Chunked Transfer Encoding for SSE support.

---

## Step 4: Cloudflare Access for Django Admin (`/admin/`)
1. In Cloudflare Zero Trust, navigate to **Access > Applications > Add an Application**.
2. Select **Self-hosted**.
3. Set Application domain to `api.orca-marine.org` with path `/admin/`.
4. Add an Access Policy allowing only your administrator email address (e.g., One-Time PIN authentication).
5. Under Application Settings, copy the **Application Audience (AUD) Tag**.
6. Set in `backend/.env`:
   ```bash
   CF_ACCESS_AUD=your_application_audience_tag_here
   CF_ACCESS_TEAM_DOMAIN=your_team_name.cloudflareaccess.com
   ```
   *(The backend `CloudflareAccessMiddleware` validates cryptographic JWT signatures with this AUD before allowing any admin access).*

---

## Step 5: Cloudflare Turnstile Bot Verification
Turnstile provides seamless bot defense without annoying image captchas.
1. In Cloudflare dashboard, navigate to **Turnstile > Add Widget**.
2. Set Widget Name to `ORCA Production Auth`.
3. Set Domain to `orca-marine.org`.
4. Select Widget Mode: **Managed**.
5. Copy the **Site Key** and **Secret Key**.
6. Set in `frontend/.env`:
   ```bash
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   ```
7. Set in `backend/.env`:
   ```bash
   TURNSTILE_SECRET_KEY=0x4AAAAAA...
   TURNSTILE_ENABLED=True
   ```

---

## Step 6: Cloudflare Pages Deployment (Frontend SPA)
1. In Cloudflare dashboard, navigate to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your GitHub repository: `Abhilakkkkshya505/orca_project`.
3. Configure build settings:
   - **Framework preset:** `Vite`
   - **Root directory:** `frontend`
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://api.orca-marine.org`
   - `VITE_TURNSTILE_SITE_KEY`: Your Turnstile public key
5. Under Custom Domains, bind `app.orca-marine.org` (or apex domain `orca-marine.org`).

---

## Step 7: Cloudflare R2 Object Storage (Media & Spatial Assets)
1. In Cloudflare dashboard, navigate to **R2 > Create bucket**.
2. Name the bucket `orca-spatial-assets`.
3. Create an API token with Object Read & Write permissions.
4. Copy Endpoint URL, Access Key ID, and Secret Access Key.
5. Set in `backend/.env`:
   ```bash
   AWS_STORAGE_BUCKET_NAME=orca-spatial-assets
   AWS_S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
   AWS_ACCESS_KEY_ID=<r2_access_key_id>
   AWS_SECRET_ACCESS_KEY=<r2_secret_access_key>
   ```

---

## Step 8: Transactional Email Service (SMTP & DNS)
For user email verification tokens and password resets:
1. Create an account with a transactional email provider (e.g., Postmark, SendGrid, or Resend).
2. Verify domain ownership by adding DNS records in Cloudflare:
   - **TXT (SPF):** `v=spf1 include:spf.provider.com ~all`
   - **CNAME (DKIM):** `pm._domainkey.orca-marine.org`
   - **TXT (DMARC):** `_dmarc.orca-marine.org` with `v=DMARC1; p=reject; rua=mailto:dmarc@orca-marine.org`
3. Generate SMTP API credentials and set in `backend/.env`:
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.provider.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=<smtp_secret_password>
   DEFAULT_FROM_EMAIL=ORCA Maritime Alerts <alerts@orca-marine.org>
   ```

---

## Step 9: Sentry Error Monitoring
1. Create a project in Sentry for Django (`orca-backend`).
2. Copy the Python DSN and set in `backend/.env`:
   ```bash
   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project_id>
   ```
3. Create a project in Sentry for React (`orca-frontend`).
4. Copy the JavaScript DSN and set in `frontend/.env`:
   ```bash
   VITE_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project_id>
   ```

---

## Step 10: Earth Observation & LLM Provider API Keys
1. **Copernicus Marine Service:**
   - Register at [marine.copernicus.eu](https://marine.copernicus.eu).
   - Set in `backend/.env`:
     ```bash
     COPERNICUS_ENABLED=True
     COPERNICUS_USERNAME=your_copernicus_user
     COPERNICUS_PASSWORD=your_copernicus_password
     ```
2. **LLM Provider:**
   - For Anthropic Claude: Register at [console.anthropic.com](https://console.anthropic.com).
     ```bash
     LLM_PROVIDER=anthropic
     ANTHROPIC_API_KEY=sk-ant-api03-...
     LLM_MODEL_NAME=claude-3-5-sonnet-20241022
     ```
   - For Google Gemini: Register at [aistudio.google.com](https://aistudio.google.com).
     ```bash
     LLM_PROVIDER=gemini
     GEMINI_API_KEY=AIzaSy...
     LLM_MODEL_NAME=gemini-1.5-pro
     ```
   - *(Offline mode: leave `LLM_PROVIDER=template`, requires zero API keys).*

---

## Step 11: GitHub Actions Secrets Configuration
In your repository (`Abhilakkkkshya505/orca_project`), navigate to **Settings > Secrets and variables > Actions** and add:
- `VPS_SSH_HOST`: IP address of production VPS
- `VPS_SSH_USER`: `deploy` or `ubuntu`
- `VPS_SSH_KEY`: Private SSH deployment key
- `CLOUDFLARE_API_TOKEN`: Cloudflare token with Pages Deploy permissions
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

---

## Step 12: External Uptime Monitoring
1. Set up a free monitor on Better Uptime or UptimeRobot.
2. Target Health Check URL: `https://api.orca-marine.org/api/v1/health/ready/`
3. Expected Status Code: `200 OK`
4. Alert Threshold: Alert if unreachable for 2 consecutive 60-second intervals.
