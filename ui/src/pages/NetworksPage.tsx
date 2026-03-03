import { useState, useEffect } from "react";
import {
    Network,
    Trash2,
    RefreshCw,
    Plus,
    Server,
    Share2,
    Globe,
    ArrowRight,
    Cloud,
    Lock,
    Settings,
    AlertTriangle
} from "lucide-react";
import {
    listNetworks,
    removeNetwork,
    checkSystemStatus,
    listDnsDomains,
    deleteDnsDomain,
    listContainers
} from "../lib/container";
import type {
    NetworkInfo,
    ContainerInfo
} from "../lib/container";
import { CreateNetworkModal } from "../components/CreateNetworkModal";
import { AddDnsModal } from "../components/AddDnsModal";
import { NavBar } from "../components/NavBar";
export default function NetworksPage() {
    const [networks, setNetworks] = useState<NetworkInfo[]>([]);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);

    // Modal States
    const [createNetOpen, setCreateNetOpen] = useState(false);
    const [addDnsOpen, setAddDnsOpen] = useState(false);

    // DNS Domains State
    const [dnsDomains, setDnsDomains] = useState<string[]>([]);
    const [isLoadingDns, setIsLoadingDns] = useState(false);

    const refreshData = async () => {
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            if (isRunning) {
                const [nets, conts] = await Promise.all([
                    listNetworks(),
                    listContainers()
                ]);

                // Sort builtin networks to the top, then alphabetically
                nets.sort((a, b) => {
                    const aIsBuiltin = a.config?.labels?.["com.apple.container.resource.role"] === "builtin";
                    const bIsBuiltin = b.config?.labels?.["com.apple.container.resource.role"] === "builtin";

                    if (aIsBuiltin && !bIsBuiltin) return -1;
                    if (!aIsBuiltin && bIsBuiltin) return 1;
                    return a.id.localeCompare(b.id);
                });

                setNetworks(nets);
                setContainers(conts);

                // Fetch DNS Domains concurrently
                fetchDnsDomains();
            } else {
                setNetworks([]);
                setContainers([]);
                setDnsDomains([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDnsDomains = async () => {
        setIsLoadingDns(true);
        try {
            const domains = await listDnsDomains();
            setDnsDomains(domains);
        } catch (e) {
            console.error("Failed to fetch DNS domains:", e);
        } finally {
            setIsLoadingDns(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (name: string) => {
        if (!confirm(`Are you sure you want to delete network '${name}'?`)) return;
        setActionLoading("delete-" + name);
        try {
            await removeNetwork(name);
            refreshData();
        } catch (e: any) {
            alert(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteDns = async (domain: string) => {
        if (!confirm(`Are you sure you want to delete local DNS domain '${domain}'? (Requires admin privileges)`)) return;
        setActionLoading("delete-dns-" + domain);
        try {
            await deleteDnsDomain(domain);
            refreshData();
        } catch (e: any) {
            alert(e);
        } finally {
            setActionLoading(null);
        }
    };

    // Helper functions for UI
    const getNetworkIconInfos = (name: string, driver: string) => {
        if (name.includes('overlay')) return { icon: Cloud, label: "cloud", color: "text-orange-500", bg: "bg-orange-500/10", borderHover: "hover:border-orange-500/50", pulse: "status-pulse-green", statusBg: "bg-green-500" };
        if (name.includes('secure') || name.includes('internal')) return { icon: Lock, label: "secure", color: "text-teal-500", bg: "bg-teal-500/10", borderHover: "hover:border-teal-500/50", pulse: "status-pulse-green", statusBg: "bg-green-500" };
        if (driver === 'host' || name === 'host') return { icon: Server, label: "host", color: "text-purple-500", bg: "bg-purple-500/10", borderHover: "hover:border-purple-500/50", pulse: "status-pulse-green", statusBg: "bg-green-500" };
        if (driver === 'bridge' || name === 'bridge') return { icon: Network, label: "bridge", color: "text-blue-500", bg: "bg-blue-500/10", borderHover: "hover:border-blue-500/50", pulse: "status-pulse-green", statusBg: "bg-green-500" };
        if (name.includes('legacy') || driver === 'macvlan') return { icon: Settings, label: "legacy", color: "text-slate-500", bg: "bg-slate-500/10", borderHover: "hover:border-red-500/50", pulse: "status-pulse-red", statusBg: "bg-red-500", error: true };

        return { icon: Network, label: "custom", color: "text-primary", bg: "bg-primary/10", borderHover: "hover:border-primary/50", pulse: "status-pulse-green", statusBg: "bg-green-500" };
    };

    const countContainersForNetwork = (networkName: string) => {
        return containers.filter(c => c.Networks && c.Networks[networkName]).length;
    };


    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />
            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                {createNetOpen && (
                    <CreateNetworkModal
                        onClose={() => setCreateNetOpen(false)}
                        onCreated={() => {
                            setCreateNetOpen(false);
                            refreshData();
                        }}
                    />
                )}
                {addDnsOpen && (
                    <AddDnsModal
                        onClose={() => setAddDnsOpen(false)}
                        onAdded={() => {
                            setAddDnsOpen(false);
                            refreshData();
                        }}
                    />
                )}

                <div className="flex flex-col gap-6 mb-8">

                    <div className="flex flex-row md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Networks & DNS</h1>
                            </div>
                            <p className="text-slate-500 dark:text-text-secondary mt-1">
                                Manage network interfaces, subnets, and DNS configurations for your environment.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCreateNetOpen(true)}
                                disabled={!systemRunning}
                                className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={20} />
                                <span>Create Network</span>
                            </button>
                            <button
                                onClick={() => setAddDnsOpen(true)}
                                disabled={!systemRunning}
                                className="flex items-center gap-2 h-10 px-4 bg-surface-dark border border-primary/50 hover:bg-primary/10 text-primary text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Globe size={20} />
                                <span>Add DNS</span>
                            </button>
                        </div>
                    </div>
                </div>

                {!systemRunning ? (
                    <div className="empty-state premium-card text-center p-12">
                        <Network size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                        <p className="text-slate-900 dark:text-white font-medium">The container daemon is offline.</p>
                        <p className="text-text-secondary mt-1">Start the system from the dashboard to manage networks.</p>
                    </div>
                ) : (
                    <>
                        {networks.length === 0 ? (
                            <div className="empty-state premium-card text-center p-12 mb-8">
                                <Network size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                                <p className="text-slate-900 dark:text-white font-medium">No networks found.</p>
                                <p className="text-text-secondary mt-1">Create one to isolate container traffic.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                                {networks.map(net => {
                                    const isSystem = net.config?.labels?.["com.apple.container.resource.role"] === "builtin";
                                    const driver = net.config?.pluginInfo?.plugin || "unknown";
                                    const netTheme = getNetworkIconInfos(net.id, driver);
                                    const Icon = netTheme.icon;
                                    const connectedCount = countContainersForNetwork(net.id);

                                    return (
                                        <div key={net.id} className={`bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden transition-colors ${netTheme.borderHover} flex flex-col`}>
                                            <div className="p-6 border-b border-slate-600 dark:border-surface-border flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${netTheme.bg} ${netTheme.color}`}>
                                                            <Icon size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                                {net.id}
                                                                {isSystem && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/20 text-text-secondary">System</span>}
                                                            </h3>
                                                            <span className="text-xs text-text-secondary font-mono lg:truncate block max-w-[150px]">
                                                                {net.config?.id?.substring(0, 12) || "unknown"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!isSystem && (
                                                            <button
                                                                onClick={() => handleDelete(net.id)}
                                                                disabled={actionLoading === "delete-" + net.id}
                                                                className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                                                title="Delete Network"
                                                            >
                                                                {actionLoading === "delete-" + net.id ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />}
                                                            </button>
                                                        )}
                                                        <div className="relative flex items-center justify-center ml-2">
                                                            <div className={`h-3 w-3 rounded-full ${netTheme.statusBg} ${netTheme.pulse}`}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm mt-6">
                                                    <div>
                                                        <p className="text-text-secondary text-xs mb-1">Driver</p>
                                                        <span className="font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-purple-900 px-2 py-0.5 rounded text-xs inline-block">
                                                            {driver}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-secondary text-xs mb-1">Scope</p>
                                                        <span className="font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-purple-900 px-2 py-0.5 rounded text-xs inline-block">
                                                            {net.config?.mode || "local"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-slate-50/50 dark:bg-[#181818]">
                                                <div className="flex flex-col gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-2">
                                                            <Share2 size={14} /> Subnet Configuration
                                                        </p>

                                                        {driver === 'host' ? (
                                                            <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-lg p-3 text-center">
                                                                <span className="text-xs text-text-secondary italic">Host network mode shares the host's networking stack.</span>
                                                            </div>
                                                        ) : netTheme.error ? (
                                                            <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-lg p-3 opacity-60">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs text-text-secondary">Subnet</span>
                                                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">10.20.0.0/16</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-text-secondary">Gateway</span>
                                                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">10.20.0.1</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-lg p-3">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs text-text-secondary">Subnet</span>
                                                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                                                                        {net.status?.ipv4Subnet || "Automated"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-text-secondary">Gateway</span>
                                                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                                                                        {net.status?.ipv4Gateway || "Automated"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-2">
                                                            <Globe size={14} /> DNS Servers
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {driver === 'host' ? (
                                                                <span className="text-xs text-text-secondary italic">Inherited from host</span>
                                                            ) : netTheme.error ? (
                                                                <span className="text-xs text-red-400 italic">Configuration Error</span>
                                                            ) : (
                                                                <>
                                                                    <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded">8.8.8.8</span>
                                                                    {net.id === 'bridge' && (
                                                                        <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded">8.8.4.4</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-6 py-3 border-t border-slate-600 dark:border-surface-border flex justify-between items-center bg-white dark:bg-surface-dark">
                                                <span className="text-xs text-text-secondary">{connectedCount} Container{connectedCount !== 1 ? 's' : ''} connected</span>
                                                {netTheme.error ? (
                                                    <button className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                                        Troubleshoot <AlertTriangle size={14} />
                                                    </button>
                                                ) : (
                                                    <button className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                                                        Manage <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    <Globe size={24} className="text-primary" />
                                    Local DNS Domains
                                </h2>
                                <button className="btn btn-ghost hover:bg-surface-dark hover:text-white transition-colors" onClick={fetchDnsDomains} disabled={isLoadingDns}>
                                    <RefreshCw size={16} className={isLoadingDns ? "spin" : ""} /> Refresh
                                </button>
                            </div>

                            {dnsDomains.length === 0 ? (
                                <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden text-center p-8">
                                    <p className="text-text-secondary">No local DNS domains configured.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {dnsDomains.map((domain, i) => (
                                        <div key={i} className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm p-4 flex justify-between items-center hover:border-primary/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                    <Globe size={18} />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white truncate" title={domain}>{domain}</span>
                                            </div>
                                            <button
                                                className="text-text-secondary hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                onClick={() => handleDeleteDns(domain)}
                                                disabled={actionLoading === "delete-dns-" + domain}
                                                title="Delete Domain"
                                            >
                                                {actionLoading === "delete-dns-" + domain ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
