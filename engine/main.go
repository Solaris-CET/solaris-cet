package main

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/valyala/fasthttp"
)

// WeatherState definește starea vremii
type WeatherState int

const (
	WeatherNormal WeatherState = iota
	WeatherDrought
	WeatherFlood
)

// Land reprezintă un teren virtual
type Land struct {
	mu           sync.Mutex
	ID           uint64       `json:"id"`
	Owner        string       `json:"owner"`        // TON address
	SoilQuality  float32      `json:"soil_quality"` // 0.0 - 1.0
	WaterLevel   float32      `json:"water"`
	SunExposure  float32      `json:"sun"`
	WeatherState WeatherState `json:"weather_state"`
	Crops        []Crop       `json:"crops"`
	LastUpdate   time.Time    `json:"last_update"`
}

// Crop reprezintă o cultură plantată
type Crop struct {
	Type       string  `json:"type"`
	Growth     float32 `json:"growth"` // 0.0 - 1.0
	Health     float32 `json:"health"`
	YieldBonus float32 `json:"yield_bonus"`
}

// Engine-ul principal - ultra optimizat
type FarmingEngine struct {
	db     *badger.DB
	mu     sync.RWMutex
	lands  map[uint64]*Land // cache în memorie (hot data)
	ticker *time.Ticker
	ctx    context.Context
	cancel context.CancelFunc
	saveCh chan *Land
	wg     sync.WaitGroup
}

func NewFarmingEngine(dbPath string) (*FarmingEngine, error) {
	// Optimized for 16GB RAM / 8vCPU
	opts := badger.DefaultOptions(dbPath).
		WithNumMemtables(4).
		WithValueLogFileSize(64 << 20).
		WithMemTableSize(64 << 20).
		WithBlockCacheSize(256 << 20).
		WithIndexCacheSize(128 << 20).
		WithLogger(nil)

	db, err := badger.Open(opts)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithCancel(context.Background())

	engine := &FarmingEngine{
		db:     db,
		lands:  make(map[uint64]*Land, 50000),
		ticker: time.NewTicker(30 * time.Second),
		ctx:    ctx,
		cancel: cancel,
		saveCh: make(chan *Land, 5000), // Buffered channel for persistence
	}

	// Preîncărcare cache
	engine.loadHotLands()

	// Start persistence workers
	for i := 0; i < runtime.NumCPU(); i++ {
		engine.wg.Add(1)
		go engine.persistenceWorker()
	}

	// Simulare background
	go engine.simulationLoop()

	return engine, nil
}

func (e *FarmingEngine) persistenceWorker() {
	defer e.wg.Done()
	for {
		select {
		case land := <-e.saveCh:
			e.saveLand(land)
		case <-e.ctx.Done():
			// Flush remaining saves
			for {
				select {
				case land := <-e.saveCh:
					e.saveLand(land)
				default:
					return
				}
			}
		}
	}
}

func (e *FarmingEngine) loadHotLands() {
	err := e.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchValues = true
		opts.PrefetchSize = 100
		it := txn.NewIterator(opts)
		defer it.Close()

		prefix := []byte("land:")
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			item := it.Item()
			err := item.Value(func(v []byte) error {
				var land Land
				if err := json.Unmarshal(v, &land); err != nil {
					return err
				}
				e.mu.Lock()
				e.lands[land.ID] = &land
				e.mu.Unlock()
				return nil
			})
			if err != nil {
				log.Printf("Error loading land: %v", err)
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("Error during loadHotLands: %v", err)
	}
	e.mu.RLock()
	count := len(e.lands)
	e.mu.RUnlock()
	log.Printf("Loaded %d lands into cache", count)
}

func (e *FarmingEngine) saveLand(land *Land) {
	land.mu.Lock()
	data, err := json.Marshal(land)
	id := land.ID
	land.mu.Unlock()

	if err != nil {
		log.Printf("Error marshaling land %d: %v", id, err)
		return
	}

	key := make([]byte, 5+8)
	copy(key, "land:")
	binary.BigEndian.PutUint64(key[5:], id)

	err = e.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, data)
	})
	if err != nil {
		log.Printf("Error saving land %d to DB: %v", id, err)
	}
}

func (e *FarmingEngine) simulationLoop() {
	for {
		select {
		case <-e.ctx.Done():
			return
		case <-e.ticker.C:
			e.simulateAllLands()
		}
	}
}

func (e *FarmingEngine) simulateAllLands() {
	e.mu.RLock()
	lands := make([]*Land, 0, len(e.lands))
	for _, land := range e.lands {
		lands = append(lands, land)
	}
	e.mu.RUnlock()

	if len(lands) == 0 {
		return
	}

	workers := runtime.NumCPU()
	var wg sync.WaitGroup
	batchSize := (len(lands) + workers - 1) / workers

	for i := 0; i < workers; i++ {
		start := i * batchSize
		if start >= len(lands) {
			break
		}
		end := int(math.Min(float64(start+batchSize), float64(len(lands))))

		wg.Add(1)
		go func(start, end int) {
			defer wg.Done()
			for j := start; j < end; j++ {
				e.simulateLand(lands[j])
			}
		}(start, end)
	}
	wg.Wait()
}

func (e *FarmingEngine) simulateLand(land *Land) {
	land.mu.Lock()
	defer land.mu.Unlock()

	now := time.Now()
	delta := now.Sub(land.LastUpdate).Hours()
	if delta < 0.008 { // ~30 secunde
		return
	}

	// Stochastic Weather Volatility Model (Markov-state transitions)
	r := rand.Float64()
	switch land.WeatherState {
	case WeatherNormal:
		if r < 0.05 {
			land.WeatherState = WeatherDrought
		} else if r > 0.95 {
			land.WeatherState = WeatherFlood
		}
	case WeatherDrought:
		if r < 0.15 {
			land.WeatherState = WeatherNormal
		}
	case WeatherFlood:
		if r < 0.15 {
			land.WeatherState = WeatherNormal
		}
	}

	// Weather impact on resources
	switch land.WeatherState {
	case WeatherDrought:
		land.WaterLevel -= float32(delta * 0.15)
		land.SunExposure += float32(delta * 0.1)
	case WeatherFlood:
		land.WaterLevel += float32(delta * 0.2)
		land.SunExposure -= float32(delta * 0.15)
	default:
		// Evaporation and absorption
		land.WaterLevel -= float32(delta * 0.05)
	}

	// Clamp resource levels
	if land.WaterLevel < 0 {
		land.WaterLevel = 0
	} else if land.WaterLevel > 1.0 {
		land.WaterLevel = 1.0
	}
	if land.SunExposure < 0 {
		land.SunExposure = 0
	} else if land.SunExposure > 1.0 {
		land.SunExposure = 1.0
	}

	// Logistic growth mechanics
	// Capacity K=1.0, growth rate r influenced by soil and ideal resources
	waterOptimality := 1.0 - math.Abs(float64(land.WaterLevel)-0.5)*2.0
	sunOptimality := 1.0 - math.Abs(float64(land.SunExposure)-0.6)*2.0
	intrinsicGrowthRate := float64(land.SoilQuality) * (0.4*waterOptimality + 0.6*sunOptimality)

	for i := range land.Crops {
		crop := &land.Crops[i]

		// Logistic growth: dG/dt = r * G * (1 - G/K)
		if crop.Growth < 1.0 {
			growthStep := intrinsicGrowthRate * float64(crop.Growth) * (1.0 - float64(crop.Growth)) * delta
			if crop.Growth < 0.05 {
				growthStep = intrinsicGrowthRate * 0.05 * delta // Minimal base growth for sprouts
			}
			crop.Growth += float32(growthStep)
		}

		if crop.Growth > 1.0 {
			crop.Growth = 1.0
		}

		// Health dynamics based on weather stress
		healthDelta := 0.03 // base recovery
		if land.WeatherState != WeatherNormal {
			healthDelta = -0.12 // stress penalty
		}
		if land.WaterLevel < 0.1 || land.WaterLevel > 0.9 {
			healthDelta -= 0.05
		}

		crop.Health += float32(healthDelta * delta)
		if crop.Health > 1.0 {
			crop.Health = 1.0
		} else if crop.Health < 0 {
			crop.Health = 0
		}
	}

	land.LastUpdate = now

	// Queue for persistence (non-blocking)
	select {
	case e.saveCh <- land:
	default:
		// Channel full, skip this save for now
	}
}

func (e *FarmingEngine) handleSimulate(ctx *fasthttp.RequestCtx) {
	idStr := string(ctx.QueryArgs().Peek("id"))
	landID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.SetStatusCode(fasthttp.StatusBadRequest)
		fmt.Fprintf(ctx, `{"error":"invalid id"}`)
		return
	}
	owner := string(ctx.QueryArgs().Peek("owner"))

	e.mu.RLock()
	land, exists := e.lands[landID]
	e.mu.RUnlock()

	if !exists {
		ctx.SetStatusCode(fasthttp.StatusNotFound)
		return
	}

	if land.Owner != owner {
		ctx.SetStatusCode(fasthttp.StatusForbidden)
		return
	}

	e.simulateLand(land)

	land.mu.Lock()
	avgG := averageGrowth(land)
	avgH := averageHealth(land)
	land.mu.Unlock()

	ctx.SetContentType("application/json")
	fmt.Fprintf(ctx, `{"status":"ok","growth":%.4f,"health":%.4f}`, avgG, avgH)
}

func averageGrowth(land *Land) float32 {
	if len(land.Crops) == 0 {
		return 0
	}
	sum := float32(0)
	for _, c := range land.Crops {
		sum += c.Growth
	}
	return sum / float32(len(land.Crops))
}

func averageHealth(land *Land) float32 {
	if len(land.Crops) == 0 {
		return 0
	}
	sum := float32(0)
	for _, c := range land.Crops {
		sum += c.Health
	}
	return sum / float32(len(land.Crops))
}

func (e *FarmingEngine) Close() error {
	e.cancel()
	e.ticker.Stop()
	e.wg.Wait()
	return e.db.Close()
}

func main() {
	engine, err := NewFarmingEngine("./data/lands")
	if err != nil {
		log.Fatal(err)
	}
	defer engine.Close()

	s := &fasthttp.Server{
		Handler: func(ctx *fasthttp.RequestCtx) {
			switch string(ctx.Path()) {
			case "/api/farm/simulate":
				engine.handleSimulate(ctx)
			default:
				ctx.SetStatusCode(fasthttp.StatusNotFound)
			}
		},
		Concurrency:        4096,
		ReadTimeout:        5 * time.Second,
		WriteTimeout:       5 * time.Second,
		MaxConnsPerIP:      50,
		TCPKeepalive:       true,
		ReduceMemoryUsage:  true,
	}

	log.Println("Solaris CET Farming Engine pornit pe port 8080")
	log.Fatal(s.ListenAndServe(":8080"))
}
