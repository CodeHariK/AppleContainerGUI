package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
)

// handleListContainers is an HTTP handler that lists all containers in JSON format.
func (a *App) handleListContainers(w http.ResponseWriter, r *http.Request) {
	output, err := a.runCli("ls", "--all", "--format", "json")
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

// handleLogs is an HTTP handler that retrieves logs for a specific container.
func (a *App) handleLogs(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/logs/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}
	lines := r.URL.Query().Get("n")
	if lines == "" {
		lines = "100"
	}

	output, err := a.runCli("logs", "-n", lines, id)
	if err != nil {
		http.Error(w, fmt.Sprintf("CLI Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.Write(output)
}

// handleExec is an HTTP handler that executes a command inside a container.
func (a *App) handleExec(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/exec/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	args := []string{"exec", id}
	args = append(args, strings.Fields(req.Command)...)

	cmd := exec.Command("container", args...)
	stdout, err := cmd.Output()

	resp := struct {
		Stdout string `json:"stdout"`
		Stderr string `json:"stderr"`
		Error  string `json:"error,omitempty"`
	}{
		Stdout: string(stdout),
	}

	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			resp.Stderr = string(exitErr.Stderr)
		}
		resp.Error = err.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// handleExecStream is an HTTP handler that executes a command and streams the output.
func (a *App) handleExecStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/exec-stream/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/x-ndjson")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	args := []string{"exec", id}
	args = append(args, strings.Fields(req.Command)...)
	cmd := exec.Command("container", args...)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sendChunk := func(typ, text string) {
		resp := struct {
			Type string `json:"type"`
			Text string `json:"text"`
		}{Type: typ, Text: text}
		json.NewEncoder(w).Encode(resp)
		fmt.Fprint(w, "\n")
		flusher.Flush()
	}

	// Stream stdout in a goroutine
	done := make(chan bool)
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			sendChunk("out", scanner.Text())
		}
		done <- true
	}()

	// Stream stderr
	scannerErr := bufio.NewScanner(stderr)
	for scannerErr.Scan() {
		sendChunk("err", scannerErr.Text())
	}

	<-done
	if err := cmd.Wait(); err != nil {
		sendChunk("err", fmt.Sprintf("Command exited with error: %v", err))
	} else {
		sendChunk("sys", "Command finished")
	}
}

// handleInspectContainer is an HTTP handler that returns detailed container information.
func (a *App) handleInspectContainer(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/inspect/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	output, err := a.runCli("inspect", id)
	if err != nil {
		http.Error(w, fmt.Sprintf("CLI Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

// handleGetStats is an HTTP handler that retrieves container resource usage statistics.
func (a *App) handleGetStats(w http.ResponseWriter, r *http.Request) {
	output, err := a.runCli("stats", "--no-stream", "--format", "json")
	if err != nil {
		// If no containers are running, 'stats' might error or return empty.
		// For now, return empty array.
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

// handleContainerAction is an HTTP handler that starts, stops, or restarts a container.
func (a *App) handleContainerAction(w http.ResponseWriter, r *http.Request) {
	// Simple routing for /api/containers/{id}/{action}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 4 {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	id := parts[2]
	action := parts[3]

	var output []byte
	var err error

	switch action {
	case "stop":
		output, err = a.runCli("stop", id)
	case "restart":
		_, stopErr := a.runCli("stop", id)
		if stopErr != nil {
			err = stopErr
		} else {
			output, err = a.runCli("start", id)
		}
	case "start":
		output, err = a.runCli("start", id)
	default:
		http.Error(w, "invalid action", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("CLI Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// handleRemoveContainer is an HTTP handler that deletes a container from the system.
func (a *App) handleRemoveContainer(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	output, err := a.runCli("rm", "--force", id)
	if err != nil {
		// If container is already gone, don't return 500
		if strings.Contains(string(output), "failed to delete one or more containers") {
			w.WriteHeader(http.StatusNoContent) // 204 already gone
			return
		}
		http.Error(w, fmt.Sprintf("CLI Error: %v\nOutput: %s", err, string(output)), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
