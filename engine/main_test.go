package main

import (
	"os"
	"testing"
	"time"
)

func TestFarmingEngine_Simulation(t *testing.T) {
	dbPath := "./test_data_sim"
	os.RemoveAll(dbPath)
	defer os.RemoveAll(dbPath)

	engine, err := NewFarmingEngine(dbPath)
	if err != nil {
		t.Fatalf("Failed to create engine: %v", err)
	}
	// No defer engine.Close() here, we'll do it manually to avoid races in test logs

	// Add a test land
	testLand := &Land{
		ID:          1,
		Owner:       "test-owner",
		SoilQuality: 0.8,
		WaterLevel:  0.8,
		SunExposure: 0.8,
		Crops: []Crop{
			{Type: "wheat", Growth: 0.1, Health: 1.0},
		},
		LastUpdate: time.Now().Add(-1 * time.Hour),
	}

	engine.mu.Lock()
	engine.lands[testLand.ID] = testLand
	engine.mu.Unlock()

	// Simulate
	engine.simulateLand(testLand)

	if testLand.Crops[0].Growth <= 0.1 {
		t.Errorf("Expected growth to increase, got %v", testLand.Crops[0].Growth)
	}

	if testLand.Crops[0].Health != 1.0 {
		t.Errorf("Expected health to stay at 1.0 under good conditions, got %v", testLand.Crops[0].Health)
	}

	// Test decay
	testLand.WaterLevel = 0.1
	testLand.LastUpdate = time.Now().Add(-1 * time.Hour)
	engine.simulateLand(testLand)

	if testLand.Crops[0].Health >= 1.0 {
		t.Errorf("Expected health to decay under poor conditions, got %v", testLand.Crops[0].Health)
	}

	// Give a small time for the worker to pick up the task before closing
	time.Sleep(50 * time.Millisecond)
	engine.Close()
}
