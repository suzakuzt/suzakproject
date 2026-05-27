# H5 Linux MySQL Release

## Release

- Release date: 2026-05-27
- Server-verified release baseline commit: `4c0d258f19f39c0cfd46f1065940c8403f2ff9db`
- Check the currently deployed revision with `git log -1 --oneline` on the server before each release.
- H5 external URL: `https://raised-kay-corners-config.trycloudflare.com/activity/home`
- Health check URL: `https://raised-kay-corners-config.trycloudflare.com/api/health`

## Runtime

- Backend command: `/root/festival-activity/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
- Backend working directory: `/root/festival-activity`
- Nginx config path: `/etc/nginx/sites-available/festival-activity`
- Frontend dist deploy path: `/var/www/festival-activity`
- Nginx static root: `/var/www/festival-activity`
- Nginx API proxy: `/api/` -> `http://127.0.0.1:8000/api/`

## Environment

- `GAOKAO_H5_DB_ENGINE=mysql`
- `GAOKAO_H5_MYSQL_HOST`: configured on server, redacted from Git
- `GAOKAO_H5_MYSQL_PORT`: configured on server, redacted from Git
- `GAOKAO_H5_MYSQL_DATABASE`: configured on server, redacted from Git
- `GAOKAO_H5_MYSQL_USER`: configured on server, redacted from Git
- `GAOKAO_H5_MYSQL_PASSWORD`: configured on server, redacted from Git
- `PORTAL_BASE_URL`: configured on server, redacted from Git
- `PORTAL_USERNAME`: configured on server, redacted from Git
- `PORTAL_PASSWORD`: configured on server, redacted from Git
- `GAOKAO_H5_ADMIN_TOKEN`: configured on server, redacted from Git
- Do not commit `backend/.env`, runtime logs, tokens, database passwords, portal credentials, or certificate private keys.

## Verified

- MySQL health check verified through `/api/health`.
- `tracking/event` MySQL client time normalization fix is committed in `c31d068`.
- Hermes coupon issuing has been verified through the backend claim flow.
- Grand prize admin draw config requires `GAOKAO_H5_ADMIN_TOKEN`.

## Mini Program

- Mini program `web-view` H5 domain to configure: `raised-kay-corners-config.trycloudflare.com`
- Current coupon package jump path: `/pages/my-coupon/index`

## Rollback

1. Stop or keep the backend process in place depending on rollback scope.
2. Restore the previous frontend files under `/var/www/festival-activity` from the last known-good artifact.
3. Restore the previous backend Git revision:
   ```bash
   cd /root/festival-activity
   git fetch origin
   git checkout <previous-good-commit>
   ```
4. Reinstall dependencies only if `backend/requirements.txt` changed:
   ```bash
   /root/festival-activity/.venv/bin/pip install -r backend/requirements.txt
   ```
5. Restart backend:
   ```bash
   pkill -f "uvicorn backend.app.main:app"
   cd /root/festival-activity
   mkdir -p runtime
   setsid .venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 > runtime/backend.log 2>&1 < /dev/null &
   ```
6. Reload Nginx if the static path or Nginx config changed:
   ```bash
   nginx -t && systemctl reload nginx
   ```
7. Verify rollback:
   ```bash
   curl -sS http://127.0.0.1:8000/api/health
   curl -sS https://raised-kay-corners-config.trycloudflare.com/api/health
   ```
