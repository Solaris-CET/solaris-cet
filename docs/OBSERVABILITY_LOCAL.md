# Observability (Local)

## Stack

- Solaris container (serves website + API + `/metrics`)
- Prometheus (scrapes `/metrics`)
- Grafana (auto-provisioned dashboard)

## Run

```bash
cd docker
docker compose -f compose.observability.yml up --build
```

## URLs

- Website: `http://localhost:3000/`
- Metrics: `http://localhost:3000/metrics`
- Prometheus: `http://localhost:9090/`
- Alertmanager: `http://localhost:9093/`
- Grafana: `http://localhost:3001/` (admin/admin)

## Optional: protect /metrics

If you set `METRICS_TOKEN` in the runtime container env, `GET /metrics` requires either:

- `Authorization: Bearer <token>`
- or `GET /metrics?token=<token>`
