package main

import (
	"net/http"
	"strings"
)

func routeNetworks(mux *http.ServeMux, app *App) {
	mux.HandleFunc("/api/networks", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			output, err := app.runCli("network", "ls", "--format", "json")
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

	mux.HandleFunc("/api/dns/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			output, err := app.runCli("dns", "list", "--format", "json")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write(output)
		case "DELETE":
			domain := strings.TrimPrefix(r.URL.Path, "/api/dns/")
			if domain == "" {
				http.Error(w, "missing domain", http.StatusBadRequest)
				return
			}
			output, err := app.runCli("dns", "delete", domain)
			if err != nil {
				http.Error(w, string(output), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusOK)
		default:
			app.handleCommand(w, r)
		}
	})

	mux.HandleFunc("/api/dns", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			output, err := app.runCli("dns", "list", "--format", "json")
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

}
