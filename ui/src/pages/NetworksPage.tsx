import { useState, useEffect } from "react";
import {
    Network,
    Trash2,
    RefreshCw,
    Plus,
    Globe
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
import { CreateNetworkModal } from "../modals/CreateNetworkModal";
import { AddDnsModal } from "../modals/AddDnsModal";
import { NavBar } from "../components/NavBar";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";

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
                setNetworks(nets);
                setContainers(conts);
                loadDnsDomains();
            } else {
                setNetworks([]);
                setContainers([]);
                setDnsDomains([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadDnsDomains = async () => {
        setIsLoadingDns(true);
        try {
            const domains = await listDnsDomains();
            setDnsDomains(domains);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingDns(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete network '${name}'?`)) return;
        setActionLoading(id);
        try {
            await removeNetwork(id);
            refreshData();
        } catch (e: any) {
            alert(e.message || "Failed to delete network");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteDns = async (domain: string) => {
        if (!confirm(`Are you sure you want to remove DNS entry for '${domain}'?`)) return;
        try {
            await deleteDnsDomain(domain);
            loadDnsDomains();
        } catch (e: any) {
            alert(e.message || "Failed to delete DNS entry");
        }
    };

    const countContainersForNetwork = (netId: string) => {
        return containers.filter(c =>
            c.Networks && (Array.isArray(c.Networks) ? c.Networks.includes(netId) : Object.keys(c.Networks).includes(netId))
        ).length;
    };

    const getContainersForNetwork = (netId: string) => {
        return containers.filter(c =>
            c.Networks && (Array.isArray(c.Networks) ? c.Networks.includes(netId) : Object.keys(c.Networks).includes(netId))
        );
    };

    const getNetworkIconInfos = (id: string, driver: string) => {
        if (id === "bridge" || driver === "bridge") return {
            icon: Network,
            bg: "bg-blue-500/10",
            text: "text-blue-500",
            border: "border-blue-500/20",
            borderHover: "hover:border-blue-500/50"
        };
        if (driver === "overlay") return {
            icon: Globe,
            bg: "bg-purple-500/10",
            text: "text-purple-500",
            border: "border-purple-500/20",
            borderHover: "hover:border-purple-500/50"
        };
        if (driver === "macvlan") return {
            icon: Plus,
            bg: "bg-emerald-500/10",
            text: "text-emerald-500",
            border: "border-emerald-500/20",
            borderHover: "hover:border-emerald-500/50"
        };
        return {
            icon: Network,
            bg: "bg-slate-500/10",
            text: "text-slate-500",
            border: "border-slate-500/20",
            borderHover: "hover:border-slate-500/50"
        };
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />

            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                <PageHeader
                    title="Network Infrastructure"
                    description="Manage virtual bridges, secure overlays, and local DNS discovery."
                    icon={Globe}
                    actions={
                        <>
                            <Button
                                onClick={() => setCreateNetOpen(true)}
                                disabled={!systemRunning}
                                icon={Plus}
                            >
                                Create Network
                                {actionLoading && <RefreshCw size={16} className="ml-2 animate-spin" />}
                            </Button>
                            <Button
                                onClick={() => setAddDnsOpen(true)}
                                disabled={!systemRunning}
                                variant="secondary"
                                icon={Globe}
                                className="ml-2"
                            >
                                Add DNS
                            </Button>
                        </>
                    }
                />

                {!systemRunning ? (
                    <Card className="text-center p-12">
                        <Network size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                        <p className="text-slate-900 dark:text-white font-medium">The container daemon is offline.</p>
                        <p className="text-text-secondary mt-1">Start the system from the dashboard to manage networks.</p>
                    </Card>
                ) : (
                    <>
                        {networks.length === 0 ? (
                            <Card className="text-center p-12 mb-8">
                                <Network size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                                <p className="text-slate-900 dark:text-white font-medium">No networks found.</p>
                                <p className="text-text-secondary mt-1">Create one to isolate container traffic.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                                {networks.map(net => {
                                    const isSystem = net.config?.labels?.["com.apple.container.resource.role"] === "builtin";
                                    const driver = net.config?.pluginInfo?.plugin || "unknown";
                                    const netTheme = getNetworkIconInfos(net.id, driver);
                                    const Icon = netTheme.icon;
                                    const connectedCount = countContainersForNetwork(net.id);

                                    return (
                                        <Card key={net.id} className={`p-0 transition-colors ${netTheme.borderHover} flex flex-col`}>
                                            <div className="p-6 border-b border-slate-600 dark:border-surface-border flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`${netTheme.bg} ${netTheme.text} p-3 rounded-xl shadow-inner`}>
                                                            <Icon size={24} strokeWidth={2.5} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                {net.id}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] uppercase font-black tracking-widest text-text-secondary">
                                                                    {driver}
                                                                </span>
                                                                {isSystem && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                                                                        SYSTEM
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <IconButton
                                                        variant="ghost"
                                                        icon={Trash2}
                                                        size="sm"
                                                        disabled={isSystem}
                                                        onClick={() => handleDelete(net.id, net.id)}
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-600 dark:border-surface-border">
                                                        <span className="text-xs text-text-secondary font-medium">Subnet Range</span>
                                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {net.status?.ipv4Subnet || "Not mapped"}
                                                        </span>
                                                    </div>

                                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-600 dark:border-surface-border">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs text-text-secondary font-medium uppercase tracking-tighter">Container Connectivity</span>
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                <span className="text-[10px] font-black">{connectedCount} ACTIVE</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {connectedCount === 0 ? (
                                                                <span className="text-[10px] text-text-secondary italic">No endpoints attached</span>
                                                            ) : (
                                                                getContainersForNetwork(net.id).slice(0, 5).map(c => (
                                                                    <div key={c.ID} className="group relative">
                                                                        <div className="px-2 py-1 rounded bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border text-[10px] font-medium text-slate-600 dark:text-slate-400">
                                                                            {c.Names.replace("/", "")}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                            {connectedCount > 5 && (
                                                                <div className="px-2 py-1 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-black text-text-secondary">
                                                                    +{connectedCount - 5} MORE
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#181818]/50 flex items-center justify-between border-t border-slate-600 dark:border-surface-border group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Bridged</span>
                                                </div>
                                                <span className="text-[10px] text-text-secondary font-mono">{net.id.substring(0, 12)}</span>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <Card className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-600 dark:border-surface-border flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">DNS Discovery Domains</h2>
                                    <p className="text-xs text-text-secondary mt-1 tracking-tight">Standard local hostname resolution paths</p>
                                </div>
                                <Button
                                    onClick={loadDnsDomains}
                                    variant="ghost"
                                    size="sm"
                                    icon={RefreshCw}
                                    loading={isLoadingDns}
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-600 dark:border-surface-border">
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Hostname Domain</th>
                                            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                        {dnsDomains.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="py-8 text-center text-sm text-text-secondary italic">No custom search domains configured</td>
                                            </tr>
                                        ) : (
                                            dnsDomains.map(domain => (
                                                <tr key={domain} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{domain}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <IconButton
                                                            variant="ghost"
                                                            icon={Trash2}
                                                            size="sm"
                                                            onClick={() => handleDeleteDns(domain)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </main>

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
                        loadDnsDomains();
                    }}
                />
            )}
        </div>
    );
}
