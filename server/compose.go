package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// ComposeFile represents the structure of a Docker Compose file.
type ComposeFile struct {
	Version  string                    `yaml:"version" json:"version"`
	Services map[string]ComposeService `yaml:"services" json:"services"`
	Networks map[string]interface{}    `yaml:"networks" json:"networks"`
	Volumes  map[string]interface{}    `yaml:"volumes" json:"volumes"`
}

// ComposeService defines a service within a Docker Compose file.
type ComposeService struct {
	Image         string      `yaml:"image" json:"image"`
	Build         interface{} `yaml:"build" json:"build"` // string context or struct
	Ports         []string    `yaml:"ports" json:"ports"`
	Environment   interface{} `yaml:"environment" json:"environment"` // map or array
	EnvFile       interface{} `yaml:"env_file" json:"env_file"`       // string or array
	Volumes       []string    `yaml:"volumes" json:"volumes"`
	Networks      []string    `yaml:"networks" json:"networks"`
	DependsOn     []string    `yaml:"depends_on" json:"depends_on"`
	ContainerName string      `yaml:"container_name" json:"container_name"`
	Command       interface{} `yaml:"command" json:"command"`       // string or array
	Entrypoint    interface{} `yaml:"entrypoint" json:"entrypoint"` // string or array
	WorkingDir    string      `yaml:"working_dir" json:"working_dir"`
	CPUs          string      `yaml:"cpus" json:"cpus"`
	MemLimit      string      `yaml:"mem_limit" json:"mem_limit"`
	DNS           interface{} `yaml:"dns" json:"dns"` // string or array
	ReadOnly      bool        `yaml:"read_only" json:"read_only"`
	Init          bool        `yaml:"init" json:"init"`
}

// BuildInfo contains build configuration for a service.
type BuildInfo struct {
	Context    string            `yaml:"context" json:"context"`
	Dockerfile string            `yaml:"dockerfile" json:"dockerfile"`
	Args       map[string]string `yaml:"args" json:"args"`
}

// CliContainer represents container information returned by the CLI.
type CliContainer struct {
	Configuration struct {
		ID     string            `json:"id"`
		Labels map[string]string `json:"labels"`
		Image  struct {
			Reference string `json:"reference"`
		} `json:"image"`
	} `json:"configuration"`
	Status      string  `json:"status"`
	StartedDate float64 `json:"startedDate"`
}

// parseComposeFile parses a YAML compose file into a ComposeFile struct.
func parseComposeFile(path string) (*ComposeFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cf ComposeFile
	if err := yaml.Unmarshal(data, &cf); err != nil {
		return nil, err
	}

	return &cf, nil
}

// getSortedServices returns service names sorted by their dependencies.
func (cf *ComposeFile) getSortedServices() ([]string, error) {
	visited := make(map[string]bool)
	temp := make(map[string]bool)
	var result []string

	var visit func(string) error
	visit = func(name string) error {
		if temp[name] {
			return fmt.Errorf("cycle detected in depends_on for service %s", name)
		}
		if visited[name] {
			return nil
		}
		temp[name] = true
		service := cf.Services[name]
		for _, dep := range service.DependsOn {
			if _, ok := cf.Services[dep]; !ok {
				log.Printf("[Compose] Warning: service %s depends on non-existent service %s", name, dep)
				continue
			}
			if err := visit(dep); err != nil {
				return err
			}
		}
		temp[name] = false
		visited[name] = true
		result = append(result, name)
		return nil
	}

	for name := range cf.Services {
		if !visited[name] {
			if err := visit(name); err != nil {
				return nil, err
			}
		}
	}
	return result, nil
}

// composeUp deploys all services defined in the compose file.
func (a *App) composeUp(cf *ComposeFile, projectDir string, projectName string) error {
	// 1. Create networks
	// Always create a default network for the project if not explicitly defined with others
	defaultNet := fmt.Sprintf("%s-default", projectName)
	log.Printf("[Compose] Ensuring default network: %s", defaultNet)
	a.runCli("network", "create", defaultNet)

	for netName := range cf.Networks {
		fullNetName := fmt.Sprintf("%s-%s", projectName, netName)
		log.Printf("[Compose] Creating network: %s", fullNetName)
		a.runCli("network", "create", fullNetName)
	}

	// 2. Create volumes
	for volName := range cf.Volumes {
		fullVolName := fmt.Sprintf("%s-%s", projectName, volName)
		log.Printf("[Compose] Creating volume: %s", fullVolName)
		a.runCli("volume", "create", fullVolName)
	}

	// 3. Sort services
	sorted, err := cf.getSortedServices()
	if err != nil {
		return err
	}

	// 4. Launch in order
	for _, name := range sorted {
		if err := a.launchService(name, cf.Services[name], projectDir, projectName); err != nil {
			return err
		}
	}

	return nil
}

// launchService builds the image (if needed) and runs a specific service container.
func (a *App) launchService(name string, service ComposeService, projectDir string, projectName string) error {
	imageName := service.Image
	if service.Build != nil {
		// Handle build
		var buildInfo BuildInfo
		data, _ := yaml.Marshal(service.Build)
		if err := yaml.Unmarshal(data, &buildInfo); err == nil && buildInfo.Context != "" {
			// complex build info
		} else {
			// simple build string
			var context string
			yaml.Unmarshal(data, &context)
			buildInfo = BuildInfo{Context: context}
		}

		if buildInfo.Dockerfile == "" {
			buildInfo.Dockerfile = "Dockerfile"
		}

		absContext := filepath.Join(projectDir, buildInfo.Context)
		absDockerfile := filepath.Join(absContext, buildInfo.Dockerfile)

		if imageName == "" {
			imageName = fmt.Sprintf("%s-%s:latest", projectName, name)
		}

		log.Printf("[Compose] Building service %s: %s", name, imageName)
		output, err := a.runCli("build", "-t", imageName, "-f", absDockerfile, absContext)
		if err != nil {
			return fmt.Errorf("build failed: %v\n%s", err, string(output))
		}
	}

	// Run container
	containerName := fmt.Sprintf("%s-%s", projectName, name)
	log.Printf("[Compose] Launching service %s as %s", name, containerName)

	args := []string{"run", "-d", "--name", containerName}

	// Add labels
	args = append(args, "--label", fmt.Sprintf("com.apple.container.project=%s", projectName))
	args = append(args, "--label", fmt.Sprintf("com.apple.container.service=%s", name))

	// Networks
	if len(service.Networks) > 0 {
		for _, net := range service.Networks {
			fullNetName := fmt.Sprintf("%s-%s", projectName, net)
			args = append(args, "--net", fullNetName)
		}
	} else {
		// Use default net
		defaultNet := fmt.Sprintf("%s-default", projectName)
		args = append(args, "--net", defaultNet)
	}

	// Ports
	for _, p := range service.Ports {
		args = append(args, "-p", p)
	}

	// Volumes
	for _, v := range service.Volumes {
		parts := strings.Split(v, ":")
		if len(parts) >= 2 {
			// Check if host side is a project volume name
			volName := parts[0]
			fullVolName := fmt.Sprintf("%s-%s", projectName, volName)
			// Logic to check if volName is in cf.Volumes would be good, but we'll assume for now
			// or just use the name as is if it exists.
			// CLI will fail if volume doesn't exist and isn't a path.
			args = append(args, "-v", fmt.Sprintf("%s:%s", fullVolName, parts[1]))
		} else {
			args = append(args, "-v", v)
		}
	}

	// Env
	if service.Environment != nil {
		switch env := service.Environment.(type) {
		case map[string]interface{}:
			for k, v := range env {
				args = append(args, "-e", fmt.Sprintf("%s=%v", k, v))
			}
		case []interface{}:
			for _, v := range env {
				args = append(args, "-e", fmt.Sprintf("%v", v))
			}
		}
	}

	// Command
	if service.Command != nil {
		switch cmd := service.Command.(type) {
		case string:
			args = append(args, strings.Fields(cmd)...)
		case []interface{}:
			for _, v := range cmd {
				args = append(args, fmt.Sprintf("%v", v))
			}
		}
	}

	args = append(args, imageName)

	output, err := a.runCli(args...)
	if err != nil {
		// If name already exists, maybe try to stop/rm it?
		if strings.Contains(string(output), "already in use") {
			log.Printf("[Compose] Container %s exists, recreating...", containerName)
			a.runCli("stop", containerName)
			a.runCli("rm", containerName)
			output, err = a.runCli(args...)
		}

		if err != nil {
			return fmt.Errorf("run failed: %v\n%s", err, string(output))
		}
	}

	return nil
}

// composeDown stops and removes all containers belonging to a compose project.
func (a *App) composeDown(projectName string) error {
	// 1. Find containers with label project=projectName
	out, err := a.runCli("list", "--all", "--format", "json")
	if err != nil {
		return err
	}

	var containers []CliContainer
	if err := json.Unmarshal(out, &containers); err != nil {
		return err
	}

	for _, c := range containers {
		if c.Configuration.Labels["com.apple.container.project"] == projectName {
			log.Printf("[Compose] Stopping and removing container: %s", c.Configuration.ID)
			a.runCli("stop", c.Configuration.ID)
			a.runCli("delete", c.Configuration.ID)
		}
	}

	// 2. Remove default network
	defaultNet := fmt.Sprintf("%s-default", projectName)
	a.runCli("network", "delete", defaultNet)

	return nil
}

// composeStatus retrieves the status of all containers in a compose project.
func (a *App) composeStatus(projectName string) ([]CliContainer, error) {
	out, err := a.runCli("list", "--all", "--format", "json")
	if err != nil {
		return nil, err
	}

	var containers []CliContainer
	if err := json.Unmarshal(out, &containers); err != nil {
		return nil, err
	}

	var projectContainers []CliContainer
	for _, c := range containers {
		if c.Configuration.Labels["com.apple.container.project"] == projectName {
			projectContainers = append(projectContainers, c)
		}
	}

	return projectContainers, nil
}

// ---------------- Handlers ----------------

// handleComposeStatus is an HTTP handler to return the status of a compose project.
func (a *App) handleComposeStatus(w http.ResponseWriter, r *http.Request) {
	projectName := r.URL.Query().Get("project")
	if projectName == "" {
		http.Error(w, "missing project query param", http.StatusBadRequest)
		return
	}

	status, err := a.composeStatus(projectName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleComposeParse is an HTTP handler to parse and return a compose file's content.
func (a *App) handleComposeParse(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cf, err := parseComposeFile(req.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cf)
}

// handleFindComposeFiles is an HTTP handler to discover compose files in a directory.
func (a *App) handleFindComposeFiles(w http.ResponseWriter, r *http.Request) {
	baseDir := r.URL.Query().Get("baseDir")
	if baseDir == "" {
		cwd, _ := os.Getwd()
		baseDir = cwd
	}

	if !filepath.IsAbs(baseDir) {
		cwd, _ := os.Getwd()
		baseDir = filepath.Join(cwd, baseDir)
	}

	type ComposeFileInfo struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	results := []ComposeFileInfo{}

	filepath.Walk(baseDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if info.Name() == "node_modules" || strings.HasPrefix(info.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}

		name := info.Name()
		if name == "docker-compose.yml" || name == "docker-compose.yaml" || name == "compose.yml" || name == "compose.yaml" {
			rel, _ := filepath.Rel(baseDir, path)
			results = append(results, ComposeFileInfo{
				Path: path,
				Name: rel,
			})
		}
		return nil
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// handleComposeUp is an HTTP handler to trigger a compose up action.
func (a *App) handleComposeUp(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path        string `json:"path"`
		ProjectName string `json:"projectName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cf, err := parseComposeFile(req.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	projectDir := filepath.Dir(req.Path)
	if err := a.composeUp(cf, projectDir, req.ProjectName); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handleComposeDown is an HTTP handler to trigger a compose down action.
func (a *App) handleComposeDown(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProjectName string `json:"projectName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := a.composeDown(req.ProjectName); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
