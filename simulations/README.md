# Simulations

| File | Purpose |
|------|---------|
| [mining_schedule.py](./mining_schedule.py) | BTC-S style **smooth exponential** mining schedule (90-year horizon); prints a summary table and optionally a chart |

## Run

```bash
python3 simulations/mining_schedule.py
```

## Optional chart

If `matplotlib` is installed, the script can render a chart; otherwise it skips plotting.

```bash
pip install matplotlib   # optional
python3 simulations/mining_schedule.py
```

This folder is **standalone** from the Node app in `app/` — no shared dependency lockfile.
