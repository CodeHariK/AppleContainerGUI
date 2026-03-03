package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
)

// handleListImages is an HTTP handler that lists all available Docker images in JSON format.
func (a *App) handleListImages(w http.ResponseWriter, _ *http.Request) {
	output, err := a.runCli("image", "list", "--format", "json")
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

// handleReadFile reads and returns the content of a file from the filesystem.
func (a *App) handleReadFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "missing path", http.StatusBadRequest)
		return
	}

	content, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(content)
}
