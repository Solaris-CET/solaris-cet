# Docker / static hosting

Production uses **Coolify** on the project VPS; this folder is a **reference** for serving `app/dist` with nginx (or any reverse proxy) in front of the same API process if you build a custom image.

## `nginx.conf`

Example **SPA** config for serving a Vite production build (e.g. `app/dist` copied into the image as `/usr/share/nginx/html`):

- `try_files` fallback to `index.html` for client-side routing (excluding `/sovereign/*`)
- **Gzip** for text assets
- Long cache for hashed static files (`immutable`)
- Explicit static routing for root favicon/PWA assets and `/fonts/*`

### Sample usage

```dockerfile
FROM nginx:alpine
COPY app/dist/ /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
```

Tune `server_name`, TLS (reverse proxy or `nginx:alpine` + cert mount), and cache headers for your CDN.
