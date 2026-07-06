# Observability (Local)

## Stack

- Solaris container (serves website + API + `/metrics`)
- Prometheus (scrapes `/metrics`)
- Grafana (auto-provisioned dashboard)
- Tempo (traces via OTLP)
- OpenTelemetry Collector (receives OTLP, forwards to Tempo)
- Loki (logs)
- Promtail (ships Docker logs to Loki)

## Run

```bash
cd docker
docker compose -f compose.observability.yml up --build
```

## URLs

- Website: `http://localhost:3000/`
- Status page: `http://localhost:3000/status` (redirects to `/status.html`)
- Metrics: `http://localhost:3000/metrics`
- Prometheus: `http://localhost:9090/`
- Alertmanager: `http://localhost:9093/`
- Grafana: `http://localhost:3001/` (admin/admin)
- Tempo: `http://localhost:3200/`
- Loki: `http://localhost:3100/`

## Optional: protect /metrics

If you set `METRICS_TOKEN` in the runtime container env, `GET /metrics` requires either:

- `Authorization: Bearer <token>`
- or `GET /metrics?token=<token>`
