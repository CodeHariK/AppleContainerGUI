import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Terminal,
    Folder,
    File as FileIcon,
    RefreshCw,
    CornerLeftUp,
    Info,
    Plus,
    X,
    ChevronRight,
    StopCircle,
    RotateCcw,
    Download,
    Ban,
    Filter,
    ArrowDown,
    Upload,
    Copy,
    Maximize,
    Server,
    Cpu,
    Network,
    HardDrive,
    Tag,
    Box
} from "lucide-react";
import TerminalComponent from "../modals/TerminalComponent";
import {
    execContainer,
    listContainers,
    getContainerLogs,
    checkSystemStatus,
    stopContainer,
    restartContainer,
    API_BASE
} from "../lib/container";
import type { ContainerInfo } from "../lib/container";
import { NavBar } from "../components/NavBar";
import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { Checkbox } from "../components/Checkbox";

export default function ContainerDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const [containerName, setContainerName] = useState<string>("Loading...");
    const [isRunning, setIsRunning] = useState<boolean>(true);
    const [containerInfo, setContainerInfo] = useState<ContainerInfo | null>(null);
    const [systemRunning, setSystemRunning] = useState<boolean>(true);

    // Tabs: 'overview', 'logs', 'files'
    const [activeTab, setActiveTab] = useState<"overview" | "logs" | "files">("overview");

    const [logs, setLogs] = useState<string>("");
    const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
    const logsEndRef = useRef<HTMLDivElement | null>(null);

    // Terminal Multi-tab State
    const [terminalTabs, setTerminalTabs] = useState<{ id: string, title: string }[]>([
        { id: "term-1", title: "Terminal 1" }
    ]);
    const [activeTerminalId, setActiveTerminalId] = useState<string>("term-1");

    // Filesystem State
    const [currentPath, setCurrentPath] = useState<string>("/");
    const [files, setFiles] = useState<{ name: string, isDir: boolean, size: string, permissions: string }[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Actions State
    const [isActionPending, setIsActionPending] = useState(false);
    const [pendingAction, setPendingAction] = useState<"restart" | "stop" | null>(null);

    const handleRestart = async () => {
        if (!id) return;
        setIsActionPending(true);
        setPendingAction("restart");
        try {
            await restartContainer(id);
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            console.error("Failed to restart", e);
        } finally {
            setIsActionPending(false);
            setPendingAction(null);
        }
    };

    const handleStop = async () => {
        if (!id) return;
        setIsActionPending(true);
        setPendingAction("stop");
        try {
            await stopContainer(id);
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            console.error("Failed to stop", e);
        } finally {
            setIsActionPending(false);
            setPendingAction(null);
        }
    };

    useEffect(() => {
        if (!id) return;

        const init = async () => {
            try {
                const isSystemRunning = await checkSystemStatus();
                setSystemRunning(isSystemRunning);
                if (!isSystemRunning) {
                    setContainerName("System Offline");
                    setIsRunning(false);
                    return;
                }

                const cList = await listContainers();
                const me = cList.find(c => c.ID === id || c.ID.startsWith(id));
                if (me) {
                    setContainerInfo(me);
                    setContainerName(me.Names || me.ID.substring(0, 8));
                    setIsRunning(me.State === "running");
                } else {
                    setContainerName(id.substring(0, 8));
                    setIsRunning(false);
                }
            } catch (e) {
                console.error(e);
            }
        };
        init();
    }, [id]);

    useEffect(() => {
        if (activeTab === "files" && isRunning) {
            loadFiles(currentPath);
        }
    }, [activeTab, currentPath, isRunning]);

    useEffect(() => {
        if (activeTab !== "logs" || !id) return;

        setIsLoadingLogs(true);
        const eventSource = new EventSource(`${API_BASE}/containers/logs/stream/${id}`);

        eventSource.onopen = () => {
            setIsLoadingLogs(false);
            setLogs(""); // Clear initial "loading" state
        };

        eventSource.onmessage = (event) => {
            setLogs(prev => {
                const newLogs = prev + event.data + "\n";
                // Keep only last 1000 lines roughly
                const lines = newLogs.split("\n");
                if (lines.length > 1000) {
                    return lines.slice(lines.length - 1000).join("\n");
                }
                return newLogs;
            });
            if (logsEndRef.current) {
                logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            eventSource.close();
            setIsLoadingLogs(false);
        };

        return () => {
            eventSource.close();
        };
    }, [activeTab, id]);

    const fetchLogs = async () => {
        if (!id) return;
        setIsLoadingLogs(true);
        try {
            const out = await getContainerLogs(id, 200);
            setLogs(out || "No logs available.");
        } catch (e: any) {
            setLogs(e.message || "Error fetching logs");
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const loadFiles = async (path: string) => {
        if (!id) return;
        setIsLoadingFiles(true);
        try {
            const res = await execContainer(id, `ls -la ${path}`);
            if (res.error) {
                setFiles([]);
                return;
            }

            const stdout = res.stdout || "";
            const lines = stdout.split('\n').slice(1); // skip total
            const parsedFiles = lines.map((line: string) => {
                const parts = line.split(/\s+/);
                if (parts.length < 9) return null;

                const permissions = parts[0];
                const isDir = permissions.startsWith('d');
                const size = parts[4];
                const name = parts.slice(8).join(' ');

                if (name === '.' || name === '..') return null;

                return { name, isDir, size, permissions };
            }).filter(Boolean) as any[];

            parsedFiles.sort((a, b) => {
                if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
                return a.isDir ? -1 : 1;
            });

            setFiles(parsedFiles);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const navigateTo = (dirName: string) => {
        if (currentPath.endsWith('/')) {
            setCurrentPath(currentPath + dirName);
        } else {
            setCurrentPath(currentPath + '/' + dirName);
        }
    };

    const navigateUp = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        setCurrentPath('/' + parts.join('/'));
    };

    const addTerminalTab = () => {
        const newId = `term-${Date.now()}`;
        const newTitle = `Terminal ${terminalTabs.length + 1}`;
        setTerminalTabs([...terminalTabs, { id: newId, title: newTitle }]);
        setActiveTerminalId(newId);
    };

    const closeTerminalTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        if (terminalTabs.length === 1) return;

        const newTabs = terminalTabs.filter(t => t.id !== tabId);
        setTerminalTabs(newTabs);

        if (activeTerminalId === tabId) {
            setActiveTerminalId(newTabs[newTabs.length - 1].id);
        }
    };

    // Calculate uptime or status details based on HTML layout
    const statusText = isRunning ? "Running" : "Stopped";
    const statusColor = isRunning ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20";
    const dotColor = isRunning ? "bg-green-500" : "bg-red-500";

    return (
        <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-display min-h-screen flex flex-col overflow-hidden">
            <NavBar systemRunning={systemRunning} onSystemStop={() => window.location.reload()} />

            <PageHeader
                title={containerName || "Container Details"}
                icon={Box}
                actions={
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${statusColor}`}>
                            <span className={`size-1.5 rounded-full ${dotColor}`}></span>
                            {statusText}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={handleRestart}
                            disabled={isActionPending}
                            loading={isActionPending && pendingAction === 'restart'}
                            icon={RotateCcw}
                        >
                            Restart
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleStop}
                            disabled={!isRunning || isActionPending}
                            loading={isActionPending && pendingAction === 'stop'}
                            icon={StopCircle}
                        >
                            Stop
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-col border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
                <div className="flex px-6 gap-2">
                    <Button
                        variant={activeTab === 'overview' ? 'primary' : 'glass'}
                        size="sm"
                        className="rounded-t-lg rounded-b-none border-b-0"
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview & Inspect
                    </Button>
                    <Button
                        variant={activeTab === 'logs' ? 'primary' : 'glass'}
                        size="sm"
                        className="rounded-t-lg rounded-b-none border-b-0"
                        onClick={() => setActiveTab('logs')}
                    >
                        Logs
                    </Button>
                    <Button
                        variant={activeTab === 'files' ? 'primary' : 'glass'}
                        size="sm"
                        className="rounded-t-lg rounded-b-none border-b-0"
                        onClick={() => setActiveTab('files')}
                    >
                        Files & Terminal
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
                {!isRunning && activeTab === "files" ? (
                    <div className="flex items-center justify-center p-8 flex-1">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md text-center">
                            <Ban size={48} className="mx-auto text-red-500 mb-4" />
                            <h2 className="text-xl font-bold text-red-500 mb-2">Container Not Running</h2>
                            <p className="text-[var(--text-secondary)] mb-6">
                                The container must be running to inspect its filesystem or execute terminal commands.
                            </p>
                            <Button as={Link} to="/" variant="primary">
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab Content */}
                        {activeTab === "overview" && containerInfo && (
                            <OverviewTab containerInfo={containerInfo} containerName={containerName} />
                        )}

                        {/* Logs Tab Content */}
                        {activeTab === "logs" && (
                            <LogsTab containerName={containerName} logs={logs} isLoadingLogs={isLoadingLogs} logsEndRef={logsEndRef} fetchLogs={fetchLogs} />
                        )}

                        {/* Files & Terminal Tab Content */}
                        {activeTab === "files" && id && (
                            <FilesTerminalTab
                                id={id}
                                currentPath={currentPath}
                                files={files}
                                isLoadingFiles={isLoadingFiles}
                                navigateUp={navigateUp}
                                navigateTo={navigateTo}
                                loadFiles={loadFiles}
                                terminalTabs={terminalTabs}
                                activeTerminalId={activeTerminalId}
                                setActiveTerminalId={setActiveTerminalId}
                                addTerminalTab={addTerminalTab}
                                closeTerminalTab={closeTerminalTab}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

// --- Extracted Components ---

function OverviewTab({ containerInfo, containerName }: { containerInfo: ContainerInfo, containerName: string }) {
    return (
        <div className="p-6 bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Information */}
                <Card className="overflow-hidden">
                    <SectionHeader title="General Information" icon={Info} />
                    <div className="p-5 space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--text-secondary)] uppercase">Container Name</span>
                            <span className="font-mono text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">
                                {containerName}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--text-secondary)] uppercase">Container ID</span>
                            <span className="font-mono text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)] truncate">
                                {containerInfo.ID}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-secondary)] uppercase">Image</span>
                                <span className="font-mono text-sm text-[var(--accent-primary)] truncate">{containerInfo.Image}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-secondary)] uppercase">Status</span>
                                <span className="font-mono text-sm text-[var(--text-primary)] truncate">{containerInfo.Status}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Resources & Limits */}
                <Card className="overflow-hidden">
                    <SectionHeader title="Resources & Limits" icon={Cpu} />
                    <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-xs text-[var(--text-secondary)] uppercase block mb-3">CPU Allocation</span>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-[var(--text-secondary)]">CPUs</span>
                                        <span className="text-[var(--text-primary)]">{containerInfo.CPUs || "Unlimited"}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--accent-primary)]" style={{ width: containerInfo.CPUs ? '50%' : '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-[var(--text-secondary)] uppercase block mb-3">Memory Allocation</span>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-[var(--text-secondary)]">Limit</span>
                                        <span className="text-[var(--text-primary)]">
                                            {containerInfo.MemoryBytes ? (containerInfo.MemoryBytes / 1024 / 1024).toFixed(0) + " MB" : "Unlimited"}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--accent-primary)]" style={{ width: containerInfo.MemoryBytes ? '25%' : '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-[var(--border-color)] grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-secondary)] uppercase">Created</span>
                                <span className="font-mono text-[11px] text-[var(--text-primary)]">{containerInfo.CreatedAt}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-[var(--text-secondary)] uppercase">State</span>
                                <span className="font-mono text-[13px] text-[var(--text-primary)]">{containerInfo.State}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Network & Ports */}
                <Card className="overflow-hidden lg:col-span-2">
                    <SectionHeader title="Network & Ports" icon={Network} />
                    <div className="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase">Interfaces</h4>
                                <div className="space-y-3">
                                    {Array.isArray(containerInfo.Networks) && containerInfo.Networks.length > 0 ? (
                                        containerInfo.Networks.map((n: any, i: number) => (
                                            <div key={i} className="mb-4">
                                                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                                                    <span className="text-sm text-[var(--text-secondary)]">Network Mode</span>
                                                    <span className="text-sm font-mono text-[var(--text-primary)]">{n.network || "Unknown"}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                                                    <span className="text-sm text-[var(--text-secondary)]">IP Address</span>
                                                    <span className="text-sm font-mono text-[var(--accent-primary)]">{n.ipv4Address || n.ipv6Address || "-"}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-[var(--border-color)]/50">
                                                    <span className="text-sm text-[var(--text-secondary)]">MAC</span>
                                                    <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-[120px]">{n.macAddress || "-"}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-[var(--text-secondary)] italic">No network details available.</div>
                                    )}
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase">Port Mappings</h4>
                                <div className="overflow-hidden border border-[var(--border-color)] rounded bg-[var(--bg-primary)] overflow-x-auto">
                                    <table className="w-full text-left text-sm font-mono">
                                        <thead className="bg-[var(--glass-bg)] text-[var(--text-secondary)] uppercase text-[10px] tracking-widest border-b border-[var(--border-color)]">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Host IP</th>
                                                <th className="px-4 py-2 font-medium">Host Port</th>
                                                <th className="px-4 py-2 font-medium">Container Port</th>
                                                <th className="px-4 py-2 font-medium">Protocol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]/50">
                                            {Array.isArray(containerInfo.Ports) && containerInfo.Ports.length > 0 ? (
                                                containerInfo.Ports.map((p: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{p.hostAddress || "0.0.0.0"}</td>
                                                        <td className="px-4 py-3 text-[var(--accent-primary)] font-bold">{p.hostPort || "-"}</td>
                                                        <td className="px-4 py-3 text-[var(--text-primary)]">{p.containerPort}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] uppercase">
                                                                {p.proto || "TCP"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-4 text-center text-[var(--text-secondary)] italic">No published ports</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Volumes & Mounts */}
                <Card className="overflow-hidden">
                    <SectionHeader title="Volumes & Mounts" icon={HardDrive} />
                    <div className="p-5 space-y-4">
                        {Array.isArray(containerInfo.Mounts) && containerInfo.Mounts.length > 0 ? (
                            containerInfo.Mounts.map((m: any, i: number) => (
                                <div key={i} className="bg-[var(--bg-primary)] rounded border border-[var(--border-color)] p-3 group hover:border-[var(--accent-primary)]/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase text-[var(--accent-primary)] tracking-wider">
                                            {typeof m.type === "string" ? m.type : typeof m.type === "object" ? Object.keys(m.type)[0] : "volume"}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Read/Write</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase">Host Path / Source</span>
                                            <span className="text-xs font-mono text-[var(--text-primary)] truncate" title={m.source || m.Name}>{m.source || m.Name || "-"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase">Container Path</span>
                                            <span className="text-xs font-mono text-[var(--text-primary)] truncate">{m.destination || m.Destination || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-4 text-[var(--text-secondary)] italic">No volumes or mounts configured</div>
                        )}
                    </div>
                </Card>

                {/* Environment Variables */}
                <Card className="overflow-hidden">
                    <SectionHeader title="Environment Variables" icon={Server} />
                    <div className="p-5">
                        <div className="space-y-2 font-mono text-xs max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {Array.isArray(containerInfo.Env) && containerInfo.Env.length > 0 ? (
                                containerInfo.Env.map((e: string, i: number) => {
                                    const [key, ...rest] = e.split('=');
                                    const val = rest.join('=');
                                    return (
                                        <div key={i} className="flex items-start gap-2 bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)] group hover:bg-[var(--glass-bg)] transition-colors">
                                            <span className="text-blue-400 w-32 shrink-0 truncate break-all" title={key}>{key}</span>
                                            <span className="text-[var(--text-secondary)]">=</span>
                                            <span className="text-green-400 break-all">{val}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center p-4 text-[var(--text-secondary)] italic">No environment variables found</div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Metadata & Labels */}
                <Card className="overflow-hidden lg:col-span-2">
                    <SectionHeader title="Metadata & Labels" icon={Tag} />
                    <div className="p-5">
                        <div className="flex flex-wrap gap-3">
                            {containerInfo.Labels && Object.keys(containerInfo.Labels).length > 0 ? (
                                Object.entries(containerInfo.Labels).map(([key, value]) => (
                                    <div key={key} className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full px-3 py-1.5 shadow-sm">
                                        <span className="text-[10px] text-[var(--accent-primary)] font-bold mr-2 uppercase">{key}:</span>
                                        <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-[200px]" title={value as string}>{value as string}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-[var(--text-secondary)] italic">No labels assigned</div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function LogsTab({ containerName, logs, isLoadingLogs, logsEndRef, fetchLogs }: { containerName: string, logs: string, isLoadingLogs: boolean, logsEndRef: React.RefObject<HTMLDivElement | null>, fetchLogs: () => void }) {
    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar Filters */}
            <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex-col shrink-0 z-10 hidden lg:flex overflow-y-auto custom-scrollbar">
                <div className="p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Sources</h3>
                    <div className="space-y-1">
                        <Checkbox
                            checked={true}
                            readOnly
                            label={containerName}
                        />
                    </div>
                </div>
                <div className="p-4 flex-1">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Log Level</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Button variant="glass" size="sm" className="flex-1">Info</Button>
                            <Button variant="glass" size="sm" className="flex-1">Warn</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="danger" size="sm" className="flex-1 bg-red-500/10 border-red-500/30">Error</Button>
                            <Button variant="glass" size="sm" className="flex-1">Debug</Button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-[var(--border-color)]">
                    <Button variant="secondary" fullWidth icon={Filter}>
                        Advanced Filters
                    </Button>
                </div>
            </aside>

            {/* Log Output Console */}
            <div className="flex-1 flex flex-col bg-black">
                <div className="flex items-center justify-between bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                            <div className={`size-2 rounded-full bg-[var(--accent-primary)] ${isLoadingLogs ? 'animate-pulse' : ''}`}></div>
                            <span className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">
                                {isLoadingLogs ? 'Streaming' : 'Loaded'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="glass"
                            size="sm"
                            onClick={fetchLogs}
                            loading={isLoadingLogs}
                            icon={RefreshCw}
                        >
                            Refresh
                        </Button>
                        <Button variant="glass" size="sm" icon={Ban}>
                            Clear
                        </Button>
                        <Button variant="primary" size="sm" icon={Download}>
                            Export
                        </Button>
                    </div>
                </div>
                <div className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar relative">
                    {logs ? (
                        <div className="whitespace-pre-wrap text-[#d1d5db]">
                            {logs}
                        </div>
                    ) : (
                        <div className="text-[var(--text-secondary)] italic">Waiting for logs...</div>
                    )}
                    <div ref={logsEndRef} />

                    {/* Floating Scroll to Bottom Button */}
                    <div className="absolute bottom-6 right-8">
                        <IconButton
                            icon={ArrowDown}
                            variant="primary"
                            onClick={() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="size-10 shadow-lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilesTerminalTab({
    id, currentPath, files, isLoadingFiles, navigateUp, navigateTo, loadFiles,
    terminalTabs, activeTerminalId, setActiveTerminalId, addTerminalTab, closeTerminalTab
}: {
    id: string, currentPath: string, files: any[], isLoadingFiles: boolean,
    navigateUp: () => void, navigateTo: (dir: string) => void, loadFiles: (path: string) => void,
    terminalTabs: any[], activeTerminalId: string, setActiveTerminalId: (id: string) => void,
    addTerminalTab: () => void, closeTerminalTab: (e: React.MouseEvent, id: string) => void
}) {
    return (
        <div className="flex-1 flex overflow-hidden">
            <aside className="w-80 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
                <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Filesystem</h3>
                    <div className="flex gap-1">
                        <IconButton icon={CornerLeftUp} variant="ghost" size="sm" onClick={navigateUp} title="Navigate Up" />
                        <IconButton icon={Upload} variant="ghost" size="sm" title="Upload File" />
                        <IconButton
                            icon={RefreshCw}
                            variant="ghost"
                            size="sm"
                            onClick={() => loadFiles(currentPath)}
                            title="Refresh"
                            loading={isLoadingFiles}
                        />
                    </div>
                </div>
                <div className="px-4 py-2 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono overflow-hidden">
                    <Folder size={16} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="text-[var(--text-primary)] truncate" title={currentPath}>{currentPath}</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {files.length === 0 && !isLoadingFiles ? (
                        <div className="text-center p-4 text-[var(--text-secondary)] text-sm italic">Directory empty or access denied.</div>
                    ) : (
                        <div className="flex flex-col gap-0.5 text-sm font-mono text-[var(--text-primary)]">
                            {files.map(f => (
                                <div
                                    key={f.name}
                                    onClick={() => f.isDir && navigateTo(f.name)}
                                    className="group flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[var(--glass-bg)] cursor-pointer select-none"
                                >
                                    <ChevronRight size={14} className={`text-[var(--text-secondary)] ${!f.isDir && 'opacity-0'}`} />
                                    {f.isDir ? <Folder size={16} className="text-[var(--accent-primary)]" /> : <FileIcon size={16} className="text-[var(--text-secondary)]" />}
                                    <span className="truncate flex-1" title={f.name}>{f.name}</span>
                                    {!f.isDir && <span className="text-[10px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100">{f.size}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            <section className="flex-1 flex flex-col bg-black relative">
                <div className="flex items-center justify-between bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-2">
                    <div className="flex items-center flex-1 overflow-x-auto custom-scrollbar">
                        {terminalTabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTerminalId(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-mono border-r border-[var(--border-color)] cursor-pointer select-none relative
                                                        ${activeTerminalId === tab.id ? 'bg-black text-[var(--text-primary)] border-t-[3px] border-t-[var(--accent-primary)]' : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] border-t-[3px] border-t-transparent'}
                                                    `}
                                style={{ minWidth: '140px', maxWidth: '200px' }}
                            >
                                <Terminal size={14} className={activeTerminalId === tab.id ? 'text-[var(--accent-primary)]' : ''} />
                                <span className="truncate flex-1">{tab.title}</span>
                                {terminalTabs.length > 1 && (
                                    <IconButton
                                        variant="ghost"
                                        size="xs"
                                        icon={X}
                                        onClick={(e) => closeTerminalTab(e, tab.id)}
                                        className="ml-1 hover:text-red-400"
                                    />
                                )}
                            </div>
                        ))}
                        <IconButton icon={Plus} variant="ghost" size="sm" onClick={addTerminalTab} title="New Terminal" />
                    </div>
                    <div className="flex items-center gap-2 pr-2 shrink-0">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            icon={Copy}
                            title="Copy Output"
                            onClick={() => { }}
                        />
                        <IconButton
                            variant="ghost"
                            size="sm"
                            icon={Maximize}
                            title="Maximize"
                            onClick={() => { }}
                        />
                    </div>
                </div>

                <div className="flex-1 relative">
                    {terminalTabs.map(tab => (
                        <div
                            key={tab.id}
                            style={{
                                display: activeTerminalId === tab.id ? 'block' : 'none',
                                height: '100%',
                                width: '100%'
                            }}
                        >
                            <TerminalComponent containerId={id} isActive={activeTerminalId === tab.id} />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
