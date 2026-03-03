package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
)

// handleListRegistries is an HTTP handler that lists all configured registries.
func (a *App) handleListRegistries(w http.ResponseWriter, _ *http.Request) {
	output, err := a.runCli("registry", "list", "--format", "json")
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

// handleRegistry is an HTTP handler that routes registry-related requests.
func (a *App) handleRegistry(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		a.handleListRegistries(w, r)
	}
}

// handleRegistryLogin is an HTTP handler that performs a registry login.
func (a *App) handleRegistryLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Server   string `json:"server"`
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// container registry login --username <user> --password-stdin <server>
	cmd := exec.Command("container", "registry", "login", "--username", req.Username, "--password-stdin", req.Server)
	cmd.Stdin = strings.NewReader(req.Password + "\n")
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Login Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
