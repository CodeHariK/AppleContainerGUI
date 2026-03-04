"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { ContainerInfo } from "../lib/container";
import {
    checkSystemStatus,
    listContainers,
    startContainer,
    stopContainer,
    removeContainer,
    getContainerStats
} from "../lib/container";
import { Toast } from "@base-ui/react/toast";
import { NavBar } from "../components/NavBar";
import { ConfirmDialog } from "../modals/Modal";

import {
    RefreshCw,
    Search,
    Play,
    Square,
    Trash2,
    FileText,
    Terminal as TerminalIcon,
    RotateCcw,
    Rocket,
    Box
} from 'lucide-react';

import "../Dashboard.css";
import { Input } from "../components/Input";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import Offline from "./Offline";

const toastManager = Toast.createToastManager();

export default function Dashboard() {
    return (
        <Toast.Provider toastManager={toastManager}>
            <DashboardContent />
        </Toast.Provider>
    );
}

function DashboardContent() {
    const { toasts } = Toast.useToastManager();
    const [systemRunning, setSystemRunning] = useState<boolean>(false);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null);

    const refreshData = async () => {
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);

            if (isRunning) {
                const [cList, sList] = await Promise.all([
                    listContainers(),
                    getContainerStats()
                ]);
                setContainers(cList);

                const sMap: Record<string, any> = {};
                if (sList && Array.isArray(sList)) {
                    sList.forEach(s => sMap[s.id] = s);
                }
                setStats(sMap);
            } else {
                setContainers([]);
                setStats({});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Poll every 5 seconds for real-time feel
        return () => clearInterval(interval);
    }, []);

    const filteredContainers = useMemo(() => {
        return containers.filter(c => {
            const matchesSearch = (c.Names || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.ID || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.Image || "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === "All" ||
                (statusFilter === "Running" && c.State === "running") ||
                (statusFilter === "Exited" && (c.State === "exited" || c.State === "stopped")) ||
                (statusFilter === "Healthy" && c.State === "running"); // Simplified healthy check

            return matchesSearch && matchesStatus;
        });
    }, [containers, searchQuery, statusFilter]);

    const handleContainerAction = async (id: string, action: "start" | "stop" | "remove") => {
        if (action === "remove") {
            const c = containers.find(item => item.ID === id);
            setConfirmAction({ id, name: c?.Names || id });
            return;
        }

        setActionLoading(id + action);
        try {
            if (action === "start") await startContainer(`container start ${id}`);
            if (action === "stop") await stopContainer(id);
            await refreshData();
        } catch (e) {
            toastManager.add({ title: "Action Failed", description: String(e), type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const confirmDelete = async () => {
        if (!confirmAction) return;
        setActionLoading(confirmAction.id + "remove");
        try {
            await removeContainer(confirmAction.id);
            setConfirmAction(null);
            await refreshData();
        } catch (e) {
            toastManager.add({ title: "Removal Failed", description: String(e), type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusCounters = () => {
        return {
            All: containers.length,
            Running: containers.filter(c => c.State === "running").length,
            Exited: containers.filter(c => c.State === "exited" || c.State === "stopped").length,
            Healthy: containers.filter(c => c.State === "running").length // Placeholder
        };
    };

    const counters = getStatusCounters();

    if (!systemRunning) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
                <NavBar systemRunning={systemRunning} onSystemStart={refreshData} />
                <Offline />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />

            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
                <PageHeader
                    title="Containers"
                    description="Manage your running containers and view real-time resource usage."
                    icon={Box}
                    actions={
                        <Button variant="glass" icon={Rocket} onClick={() => { }}>
                            Compose Up
                        </Button>
                    }
                />


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
                    <div className="lg:col-span-5">
                        <Input
                            icon={Search}
                            placeholder="Search containers by name, id, or image..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                        {["All", "Running", "Exited", "Healthy"].map((filter) => (
                            <Button
                                key={filter}
                                variant={statusFilter === filter ? "primary" : "glass"}
                                size="sm"
                                onClick={() => setStatusFilter(filter)}
                                className="whitespace-nowrap"
                            >
                                {filter} <span className={`ml-2 text-[10px] px-1.5 rounded-md py-0.5 ${statusFilter === filter ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-surface-border text-slate-500 dark:text-text-secondary"}`}>
                                    {(counters as any)[filter]}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                <Card padding="none">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-600 dark:border-surface-border bg-slate-50 dark:bg-[#181818]">
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary w-16 text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Name</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary hidden sm:table-cell">Image ID</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary hidden md:table-cell">Ports</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary w-48 hidden lg:table-cell">CPU</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary w-48 hidden lg:table-cell">Memory</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-text-secondary">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw size={24} className="spin" />
                                                <span>Loading containers...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredContainers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-text-secondary">
                                            <div className="flex flex-col items-center gap-3">
                                                <Box size={32} opacity={0.5} />
                                                <span>No containers found matching your search.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredContainers.map((container) => {
                                        const cStats = stats[container.ID];
                                        const cpuUsage = cStats ? Math.min(Math.round(cStats.cpuUsageUsec / 10000), 100) : 0;
                                        const memUsageBytes = cStats?.memoryUsageBytes || 0;
                                        const memLimitBytes = cStats?.memoryLimitBytes || 1024 * 1024 * 1024; // Default 1GB
                                        const memPercent = Math.min(Math.round((memUsageBytes / memLimitBytes) * 100), 100);

                                        return (
                                            <tr key={container.ID} className="group hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <div className={`h-3 w-3 rounded-full ${container.State === "running" ? "bg-green-500 status-pulse-green" :
                                                            (container.State === "exited" || container.State === "stopped") ? "bg-slate-500" :
                                                                "bg-red-500 status-pulse-red"
                                                            }`}></div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <Link to={`/container/${container.ID}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                                                            {container.Names || container.ID.substring(0, 12)}
                                                        </Link>
                                                        <span className="text-xs text-slate-500 dark:text-text-secondary">
                                                            {container.State === "running" ? `Up ${container.Status}` : container.Status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 hidden sm:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                                            {container.ID.substring(0, 12)}
                                                        </span>
                                                        <span className="text-xs text-slate-400 truncate max-w-[150px]" title={container.Image}>
                                                            {container.Image}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.isArray(container.Ports) && container.Ports.length > 0 ? (
                                                            container.Ports.map((p: any, idx) => (
                                                                <span key={idx} className="text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-surface-border px-1.5 py-0.5 rounded border border-slate-600 dark:border-neutral-700">
                                                                    {p.hostPort}:{p.containerPort}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 hidden lg:table-cell">
                                                    {container.State === "running" ? (
                                                        <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Usage</span>
                                                                <span className={`font-medium ${cpuUsage > 80 ? "text-red-500" : cpuUsage > 50 ? "text-orange-400" : "text-green-400"}`}>
                                                                    {cpuUsage}%
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-surface-border rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${cpuUsage > 80 ? "bg-red-500" : cpuUsage > 50 ? "bg-orange-400" : "bg-green-500"}`} style={{ width: `${cpuUsage}%` }}></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 dark:text-slate-600 italic">No usage data</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 hidden lg:table-cell">
                                                    {container.State === "running" ? (
                                                        <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">{(memUsageBytes / 1024 / 1024).toFixed(0)}MB</span>
                                                                <span className="font-medium text-primary">{memPercent}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-surface-border rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${memPercent}%` }}></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 dark:text-slate-600 italic">No usage data</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <IconButton as={Link} to={`/container/${container.ID}`} icon={FileText} variant="ghost" title="Logs" />
                                                        <IconButton as={Link} to={`/container/${container.ID}`} icon={TerminalIcon} variant="ghost" title="Terminal" />
                                                        <IconButton icon={RotateCcw} variant="ghost" title="Restart" onClick={() => handleContainerAction(container.ID, "start")} />
                                                        {container.State === "running" ? (
                                                            <IconButton icon={Square} variant="danger" title="Stop" onClick={() => handleContainerAction(container.ID, "stop")} />
                                                        ) : (
                                                            <IconButton icon={Play} variant="primary" title="Start" onClick={() => handleContainerAction(container.ID, "start")} />
                                                        )}
                                                        <IconButton icon={Trash2} variant="danger" title="Remove" onClick={() => handleContainerAction(container.ID, "remove")} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>


            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title="Remove Container"
                description={<>Are you sure you want to remove <strong>{confirmAction?.name}</strong>? This action cannot be undone.</>}
                confirmLabel="Remove"
                onConfirm={confirmDelete}
                variant="danger"
                isLoading={actionLoading?.includes("remove")}
            />

            <Toast.Portal>
                <Toast.Viewport className="toast-viewport">
                    {toasts.map((toast: any) => (
                        <Toast.Root key={toast.id} toast={toast} className={`toast-root toast-${toast.type || 'info'}`}>
                            <div className="toast-content">
                                <Toast.Title className="toast-title">{toast.title}</Toast.Title>
                                <Toast.Description className="toast-description">{toast.description}</Toast.Description>
                            </div>
                            <Toast.Close className="toast-close">×</Toast.Close>
                        </Toast.Root>
                    ))}
                </Toast.Viewport>
            </Toast.Portal>
        </div>
    );
}
