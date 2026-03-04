package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/creack/pty"
)

// CommandLog represents a single command execution log entry.
type CommandLog struct {
	ID        string    `json:"id"`
	ExeID     string    `json:"exeId"` // Stable ID for a single command execution
	Timestamp time.Time `json:"timestamp"`
	Command   string    `json:"command"`
	Output    string    `json:"output"`
	IsError   bool      `json:"isError"`
	IsPartial bool      `json:"isPartial"`
}

// Broker manages SSE clients and broadcasts messages
type Broker struct {
	notifier       chan []byte
	clients        map[chan []byte]bool
	newClients     chan chan []byte
	closingClients chan chan []byte
}

// NewBroker creates and initializes a new Broker instance.
func NewBroker() *Broker {
	return &Broker{
		notifier:       make(chan []byte, 1),
		clients:        make(map[chan []byte]bool),
		newClients:     make(chan chan []byte),
		closingClients: make(chan chan []byte),
	}
}

// Start runs the broker's message loop for client management and broadcasting.
func (b *Broker) Start() {
	for {
		select {
		case s := <-b.newClients:
			b.clients[s] = true
		case s := <-b.closingClients:
			if _, ok := b.clients[s]; ok {
				delete(b.clients, s)
				close(s)
			}
		case event := <-b.notifier:
			for client := range b.clients {
				client <- event
			}
		}
	}
}

// ServeHTTP handles SSE client connections and message streaming.
func (b *Broker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	messageChan := make(chan []byte)
	b.newClients <- messageChan
	defer func() {
		b.closingClients <- messageChan
	}()

	notify := r.Context().Done()
	go func() {
		<-notify
		b.closingClients <- messageChan
	}()

	for {
		msg, ok := <-messageChan
		if !ok {
			break
		}
		fmt.Fprintf(w, "data: %s\n\n", msg)
		flusher.Flush()
	}
}

// handleActionLogs manages command execution history (list or clear).
func (a *App) handleActionLogs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		w.Header().Set("Content-Type", "application/json")
		a.mu.Lock()
		defer a.mu.Unlock()
		if a.actionLogs == nil {
			json.NewEncoder(w).Encode([]CommandLog{})
			return
		}
		json.NewEncoder(w).Encode(a.actionLogs)
	case "DELETE":
		a.mu.Lock()
		a.actionLogs = []CommandLog{}
		a.mu.Unlock()
		w.WriteHeader(http.StatusOK)
	}
}

// handleLogsSSE is an HTTP handler that streams container logs using Server-Sent Events.
func (a *App) handleLogsSSE(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/containers/logs/stream/")
	if id == "" {
		http.Error(w, "missing container id", http.StatusBadRequest)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Use container logs -f to follow logs
	cmd := exec.Command("container", "logs", "-f", id)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating stdout pipe: %v", err), http.StatusInternalServerError)
		return
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		http.Error(w, fmt.Sprintf("Error starting logs: %v", err), http.StatusInternalServerError)
		return
	}
	defer cmd.Process.Kill()

	// Handle client disconnect
	notify := r.Context().Done()
	go func() {
		<-notify
		cmd.Process.Kill()
	}()

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		fmt.Fprintf(w, "data: %s\n\n", line)
		flusher.Flush()
	}

	if err := scanner.Err(); err != nil {
		fmt.Fprintf(w, "event: error\ndata: %v\n\n", err)
		flusher.Flush()
	}
}

// logAction logs a command action. If exeID is empty, a new one is generated.
func (a *App) logAction(exeID string, command string, output string, isError bool) {
	if exeID == "" {
		exeID = fmt.Sprintf("%d", time.Now().UnixNano())
	}
	a.logActionExt(exeID, command, output, isError, false)
}

// logActionExt logs a command action with optional partial output and filtering.
func (a *App) logActionExt(exeID string, command string, output string, isError bool, isPartial bool) {
	// Simple noise filtering for background/polling commands
	if strings.Contains(command, "ls --all") ||
		strings.Contains(command, "image list") ||
		strings.Contains(command, "network ls") ||
		strings.Contains(command, "volume ls") ||
		strings.Contains(command, "inspect") ||
		strings.Contains(command, "top") ||
		strings.Contains(command, "stats") ||
		strings.Contains(command, "ps --all") ||
		strings.Contains(command, "system status") {
		if !isError {
			return
		}
	}

	logEntry := CommandLog{
		ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
		ExeID:     exeID,
		Timestamp: time.Now(),
		Command:   command,
		Output:    output,
		IsError:   isError,
		IsPartial: isPartial,
	}

	// Only persist full logs to history
	if !isPartial {
		a.mu.Lock()
		a.actionLogs = append(a.actionLogs, logEntry)
		// Keep only last 100 logs
		if len(a.actionLogs) > 100 {
			a.actionLogs = a.actionLogs[1:]
		}
		a.mu.Unlock()
	}

	// Broadcast to SSE clients
	if data, err := json.Marshal(logEntry); err == nil {
		a.logBroker.notifier <- data
	}
}

// runCli executes a CLI command, streams output to logs, and returns the full output.
// runCli runs a command cleanly (no TTY) for programmatic consumption of output (e.g. JSON list).
func (a *App) runCli(args ...string) ([]byte, error) {
	fullCmd := "container " + strings.Join(args, " ")
	cmd := exec.Command("container", args...)
	exeID := fmt.Sprintf("%d", time.Now().UnixNano())

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		a.logAction(exeID, fullCmd, fmt.Sprintf("Error: %v", err), true)
		return nil, err
	}

	var outBuf bytes.Buffer
	var mu sync.Mutex

	// Stream stdout and stderr
	go func() {
		s := bufio.NewScanner(stdout)
		for s.Scan() {
			line := s.Text()
			mu.Lock()
			outBuf.WriteString(line + "\n")
			mu.Unlock()
			a.logActionExt(exeID, fullCmd, line+"\n", false, true)
		}
	}()

	go func() {
		s := bufio.NewScanner(stderr)
		for s.Scan() {
			line := s.Text()
			mu.Lock()
			outBuf.WriteString(line + "\n")
			mu.Unlock()
			a.logActionExt(exeID, fullCmd, line+"\n", true, true)
		}
	}()

	err := cmd.Wait()

	if err != nil {
		a.logAction(exeID, fullCmd, fmt.Sprintf("Command failed: %v", err), true)
	} else {
		a.logAction(exeID, fullCmd, "Command completed successfully", false)
	}

	return outBuf.Bytes(), err
}

// runCliTTY runs a command using a PTY for high-fidelity terminal streaming (xterm.js).
func (a *App) runCliTTY(args ...string) ([]byte, error) {
	fullCmd := "container " + strings.Join(args, " ")
	cmd := exec.Command("container", args...)
	exeID := fmt.Sprintf("%d", time.Now().UnixNano())

	f, err := pty.StartWithSize(cmd, &pty.Winsize{Rows: 24, Cols: 80})
	if err != nil {
		a.logAction(exeID, fullCmd, fmt.Sprintf("Error starting PTY: %v", err), true)
		return nil, err
	}
	defer f.Close()

	var outBuf bytes.Buffer
	var mu sync.Mutex

	// Stream raw byte chunks
	go func() {
		buf := make([]byte, 1024)
		for {
			n, err := f.Read(buf)
			if n > 0 {
				chunk := string(buf[:n])
				mu.Lock()
				outBuf.WriteString(chunk)
				mu.Unlock()
				a.logActionExt(exeID, fullCmd, chunk, false, true)
			}
			if err != nil {
				if err != io.EOF {
					// log error if not EOF
				}
				break
			}
		}
	}()

	err = cmd.Wait()

	if err != nil {
		a.logAction(exeID, fullCmd, fmt.Sprintf("Command failed: %v", err), true)
	} else {
		a.logAction(exeID, fullCmd, "Command completed successfully", false)
	}

	return outBuf.Bytes(), err
}

// parseCommand parses a command string into a slice of arguments, handling quotes.
func parseCommand(cmdStr string) []string {
	var args []string
	var current strings.Builder
	inQuotes := false
	for _, r := range cmdStr {
		if r == '"' {
			inQuotes = !inQuotes
		} else if r == ' ' && !inQuotes {
			if current.Len() > 0 {
				args = append(args, current.String())
				current.Reset()
			}
		} else {
			current.WriteRune(r)
		}
	}
	if current.Len() > 0 {
		args = append(args, current.String())
	}
	return args
}

// handleCommand is an HTTP handler to execute CLI commands via POST or DELETE requests.
func (a *App) handleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" && r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Command string `json:"command"`
		NoTTY   bool   `json:"noTty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	args := parseCommand(req.Command)
	if len(args) == 0 || args[0] != "container" {
		http.Error(w, "invalid command: must start with 'container'", http.StatusBadRequest)
		return
	}

	var output []byte
	var err error
	if req.NoTTY {
		output, err = a.runCli(args[1:]...)
	} else {
		// Use the TTY version for user-initiated commands so they stream nicely to xterm
		output, err = a.runCliTTY(args[1:]...)
	}
	if err != nil {
		http.Error(w, string(output), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": string(output)})
}
