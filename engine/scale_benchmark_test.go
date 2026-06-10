package main

import (
	"fmt"
	"runtime"
	"testing"
	"time"
)

func BenchmarkSimulationScale(b *testing.B) {
	// Setup simulation with 1,000,000 lands to demonstrate efficiency on 16GB RAM
	const count = 1000000
	lands := make([]*Land, count)
	for i := 0; i < count; i++ {
		lands[i] = &Land{
			ID:          uint64(i),
			SoilQuality: 0.8,
			WaterLevel:  0.5,
			SunExposure: 0.6,
			LastUpdate:  time.Now().Add(-1 * time.Hour),
			Crops: []Crop{
				{Type: "wheat", Growth: 0.2, Health: 0.9},
			},
		}
	}

	engine := &FarmingEngine{
		lands: make(map[uint64]*Land, count),
	}
	for _, l := range lands {
		engine.lands[l.ID] = l
	}

	runtime.GC()
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("\nMemory allocated for 1M lands: %d MB\n", m.Alloc/1024/1024)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		engine.simulateAllLands()
	}
}
