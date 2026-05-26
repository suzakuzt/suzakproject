# H5 Linux MySQL Release

## Release

- Current release date: 2026-05-27
- Current Git commit: a3abf89d5f62961828e3d367dbabed8a09677119
- H5 external URL: https://raised-kay-corners-config.trycloudflare.com/activity/home
- Health check URL: https://raised-kay-corners-config.trycloudflare.com/api/health

## Runtime

- Backend command: `/root/suzakproject/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
- Backend working directory: `/root/suzakproject`
- Nginx config path: `/etc/nginx/sites-available/gaokao-h5`
- Frontend dist deploy path: `/var/www/gaokao-h5`
- Nginx static root: `/var/www/gaokao-h5`
- Nginx API proxy: `/api/` -> `http://127.0.0.1:8000/api/`

## Environment

- `GAOKAO_H5_DB_ENGINE=mysql`
- `GAOKAO_H5_MYSQL_HOST=已配置`
- `GAOKAO_H5_MYSQL_PORT=已配置`
- `GAOKAO_H5_MYSQL_DATABASE=已配置`
- `GAOKAO_H5_MYSQL_USER=已配置`
- `GAOKAO_H5_MYSQL_PASSWORD=已配置`
- `PORTAL_BASE_URL=已配置`
- `PORTAL_USERNAME=已配置`
- `PORTAL_PASSWORD=已配置`
- `GAOKAO_H5_ADMIN_TOKEN=已配置`

## Verified

- MySQL health check verified through `/api/health`.
- `tracking/event` MySQL client time normalization fix is committed in `c31d068`.
- Hermes coupon issuing has been verified through the backend claim flow.
- Grand prize admin draw config now requires `GAOKAO_H5_ADMIN_TOKEN`.

## Mini Program

- Mini program `web-view` H5 domain to configure: `raised-kay-corners-config.trycloudflare.com`
- Current coupon package jump path: `/pages/my-coupon/index`

## Rollback

1. Stop or keep the backend process in place depending on rollback scope.
2. Restore the previous frontend files under `/var/www/gaokao-h5` from the last known-good artifact.
3. Restore the previous backend Git revision:
   ```bash
   cd /root/suzakproject
   git fetch origin
   git checkout <previous-good-commit>
   ```
4. Reinstall dependencies only if `backend/requirements.txt` changed:
   ```bash
   /root/suzakproject/.venv/bin/pip install -r backend/requirements.txt
   ```
5. Restart backend:
   ```bash
   pkill -f "uvicorn backend.app.main:app"
   cd /root/suzakproject
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
