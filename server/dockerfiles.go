package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// handleFindDockerfiles is an HTTP handler that recursively finds Dockerfiles in a directory.
func (a *App) handleFindDockerfiles(w http.ResponseWriter, r *http.Request) {
	baseDir := r.URL.Query().Get("baseDir")
	if baseDir == "" {
		cwd, _ := os.Getwd()
		baseDir = cwd
	}

	// If it's relative, make it absolute based on CWD
	if !filepath.IsAbs(baseDir) {
		cwd, _ := os.Getwd()
		baseDir = filepath.Join(cwd, baseDir)
	}

	type DockerfileInfo struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	results := []DockerfileInfo{}

	filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // ignore errors
		}
		if info.IsDir() {
			if info.Name() == "node_modules" || strings.HasPrefix(info.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}

		name := info.Name()
		if strings.HasSuffix(name, ".Dockerfile") {
			rel, _ := filepath.Rel(baseDir, path)
			results = append(results, DockerfileInfo{
				Path: path,
				Name: rel,
			})
		}
		return nil
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
