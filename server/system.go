package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

// handleStatus returns the current system status as JSON.
func (a *App) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	cmd := exec.Command("container", "system", "status")
	err := cmd.Run()
	status := "ok"
	if err != nil {
		status = "offline"
	}

	json.NewEncoder(w).Encode(StatusResponse{
		Status:    status,
		Version:   "0.0.1",
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

// handleSystemAction processes system-level actions like start, stop, or prune.
func (a *App) handleSystemAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	action := strings.TrimPrefix(r.URL.Path, "/api/system/")
	var output []byte
	var err error

	switch action {
	case "start":
		output, err = a.runCli("system", "start")
	case "stop":
		output, err = a.runCli("system", "stop")
	case "prune":
		output, err = a.runCli("system", "prune", "--force")
	default:
		http.Error(w, "invalid system action", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, string(output), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// handleListSystemProperties lists system properties using the CLI in JSON format.
func (a *App) handleListSystemProperties(w http.ResponseWriter, _ *http.Request) {
	output, err := a.runCli("system", "property", "list", "--format", "json")
	if err != nil {
		outStr := string(output)
		if strings.Contains(outStr, "container system start") ||
			strings.Contains(outStr, "XPC connection error") ||
			strings.Contains(outStr, "Connection invalid") {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("[]"))
			return
		}
		http.Error(w, fmt.Sprintf("CLI Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

// handleSystemProperties is a wrapper for listing system properties.
func (a *App) handleSystemProperties(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		a.handleListSystemProperties(w, r)
	}
}
