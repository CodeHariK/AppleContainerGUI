package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"sync"
)

//go:embed all:dist
var staticFiles embed.FS

// --- Types ---

// StatusResponse represents the health status of the system.
type StatusResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	Timestamp string `json:"timestamp"`
}

// App holds the application dependencies and state.
type App struct {
	actionLogs []CommandLog
	logBroker  *Broker
	mu         sync.Mutex
}

// --- Helpers ---

// enableCors is a middleware that enables Cross-Origin Resource Sharing.
func enableCors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// main is the application entry point that sets up routes and starts the server.
func main() {
	app := &App{
		logBroker: NewBroker(),
	}

	mux := http.NewServeMux()

	go app.logBroker.Start()

	mux.HandleFunc("/api/status", app.handleStatus)
	mux.HandleFunc("/api/containers/ws/", app.handleTerminalWS)
	mux.HandleFunc("/api/containers/exec-stream/", app.handleExecStream)
	mux.HandleFunc("/api/containers/exec/", app.handleExec)
	mux.HandleFunc("/api/containers/logs/stream/", app.handleLogsSSE)
	mux.HandleFunc("/api/containers/logs/", app.handleLogs)
	mux.HandleFunc("/api/command", app.handleCommand)
	mux.HandleFunc("/api/containers", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			app.handleListContainers(w, r)
		} else {
			app.handleCommand(w, r)
		}
	})
	mux.HandleFunc("/api/images", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			app.handleListImages(w, r)
		} else {
			app.handleCommand(w, r)
		}
	})
	mux.HandleFunc("/api/logs", app.handleActionLogs)
	mux.HandleFunc("/api/stats", app.handleGetStats)
	mux.HandleFunc("/api/logs/stream", app.logBroker.ServeHTTP)

	// --- Registry ---
	mux.HandleFunc("/api/registry", app.handleRegistry)
	mux.HandleFunc("/api/registry/login", app.handleRegistryLogin)

	// --- System ---
	mux.HandleFunc("/api/system/", app.handleSystemAction)
	mux.HandleFunc("/api/system/properties", app.handleSystemProperties)

	// --- Volumes ---
	mux.HandleFunc("/api/volumes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			output, err := app.runCli("volume", "ls", "--format", "json")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write(output)
		} else {
			app.handleCommand(w, r)
		}
	})

	// --- Networks ---
	routeNetworks(mux, app)

	// --- Builder ---
	mux.HandleFunc("/api/builder/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			output, err := app.runCli("builder", "status", "--format", "json")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write(output)
		} else {
			app.handleCommand(w, r)
		}
	})

	// --- Dockerfiles ---
	mux.HandleFunc("/api/dockerfiles", app.handleFindDockerfiles)
	mux.HandleFunc("/api/files/read", app.handleReadFile)

	// --- Compose ---
	mux.HandleFunc("/api/compose/up", app.handleComposeUp)
	mux.HandleFunc("/api/compose/down", app.handleComposeDown)
	mux.HandleFunc("/api/compose/status", app.handleComposeStatus)
	mux.HandleFunc("/api/compose/parse", app.handleComposeParse)
	mux.HandleFunc("/api/compose/discover", app.handleFindComposeFiles)

	// Actions like start/stop
	mux.HandleFunc("/api/containers/", func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) == 4 {
			app.handleContainerAction(w, r)
		} else if r.Method == "DELETE" {
			app.handleRemoveContainer(w, r)
		} else {
			http.NotFound(w, r)
		}
	})

	uiServe(mux)

	fmt.Println("🍎 Cider Backend starting on :7777...")
	log.Fatal(http.ListenAndServe(":7777", enableCors(mux)))
}

func uiServe(mux *http.ServeMux) {
	// Static UI and SPA support
	staticFS, _ := fs.Sub(staticFiles, "dist")
	fileServer := http.FileServer(http.FS(staticFS))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If requesting an API route, don't serve static files here
		// The specific API handlers are already registered on the mux
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		// Try to find the file
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		_, err := staticFS.Open(path)
		if err != nil {
			// File not found, serve index.html for SPA routing
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})

}
