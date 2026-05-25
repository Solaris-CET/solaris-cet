# Solaris CET Farming Engine

High-performance agricultural simulation engine for the Solaris CET ecosystem.

## Overview

This engine is written in Go and designed for ultra-fast, concurrent simulation of virtual land parcels. It uses `fasthttp` for its web interface and `badger` for persistent storage of land data.

## Features

- **Concurrent Simulation**: Utilizes all available CPU cores to simulate thousands of land parcels in parallel.
- **In-Memory Cache**: Keeps hot data in memory for immediate access and updates.
- **Asynchronous Persistence**: Saves land state to disk without blocking simulation or API responses.
- **Realistic Formulas**: Implements non-linear growth curves and environmental impact factors (soil, water, sun).

## API Endpoints

### `GET /api/farm/simulate?id={id}&owner={owner}`

Forces an immediate simulation tick for the specified land parcel and returns its current growth and health.

- `id`: uint64 land ID.
- `owner`: TON wallet address of the owner.

## Build and Run

### Prerequisites

- Go 1.24+

### Build

```bash
go build -o farming-engine main.go
```

### Run

```bash
./farming-engine
```

The engine will start on port `8080` by default and use `./data/lands` for its database.
