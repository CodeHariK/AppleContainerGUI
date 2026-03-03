package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strings"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // In a real app, restrict this
	},
}

// handleTerminalWS is an HTTP handler that upgrades to WebSocket for interactive terminal access.
func (a *App) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/ws/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Websocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Use /bin/sh by default. In the future, this could be configurable.
	cmd := exec.Command("container", "exec", "-it", id, "/bin/sh")

	f, err := pty.Start(cmd)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("\r\n[Cider] Error starting PTY: %v\r\n", err)))
		return
	}
	defer f.Close()

	// Bridge PTY to WebSocket
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := f.Read(buf)
			if err != nil {
				conn.WriteMessage(websocket.TextMessage, []byte("\r\n[Cider] PTY closed\r\n"))
				return
			}
			if err := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); err != nil {
				return
			}
		}
	}()

	// Bridge WebSocket to PTY
	for {
		mt, data, err := conn.ReadMessage()
		if err != nil {
			break
		}

		if mt == websocket.TextMessage {
			// Check for resize command
			var msg struct {
				Type string `json:"type"`
				Rows uint16 `json:"rows"`
				Cols uint16 `json:"cols"`
			}
			if err := json.Unmarshal(data, &msg); err == nil && msg.Type == "resize" {
				pty.Setsize(f, &pty.Winsize{Rows: msg.Rows, Cols: msg.Cols})
				continue
			}
		}

		if _, err := f.Write(data); err != nil {
			break
		}
	}

	cmd.Process.Kill()
	cmd.Wait()
}
