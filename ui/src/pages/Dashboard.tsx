"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { ContainerInfo } from "../lib/container";
import {
    listContainers,
    startContainer,
    stopContainer,
    removeContainer,
    getContainerStats
} from "../lib/container";
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
import { useSystem } from "../contexts/SystemContext";
import { PageMain } from "../components/PageMain";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/Table";
import { Tag } from "../components/Tag";
import { Body, Caption, Code } from "../components/Typography";


export default function Dashboard() {
    return (
        <DashboardContent />
    );
}

function DashboardContent() {
    const { systemRunning } = useSystem();
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [confirmAction, setConfirmAction] = useState<{ id: string, name: string } | null>(null);

    const refreshData = async () => {
        try {
            if (systemRunning) {
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
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, [systemRunning]);

    const filteredContainers = useMemo(() => {
        return containers.filter(c => {
            const matchesSearch = (c.Names || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.ID || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.Image || "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === "All" ||
                (statusFilter === "Running" && c.State === "running") ||
                (statusFilter === "Exited" && (c.State === "exited" || c.State === "stopped")) ||
                (statusFilter === "Healthy" && c.State === "running");

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
            if (action === "start") await startContainer(`container start ${id} `);
            if (action === "stop") await stopContainer(id);
            await refreshData();
        } catch (e) {
            // Handled globally via CommandLogContext event dispatch
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
            // Handled by global listener
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusCounters = () => {
        return {
            All: containers.length,
            Running: containers.filter(c => c.State === "running").length,
            Exited: containers.filter(c => c.State === "exited" || c.State === "stopped").length,
            Healthy: containers.filter(c => c.State === "running").length
        };
    };

    const counters = getStatusCounters();

    return (
        <PageMain
            header={
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
            }
        >

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
                            {filter} <Caption
                                color={statusFilter === filter ? 'primary' : 'secondary'}
                                weight="medium"
                                background={statusFilter === filter ? 'glass' : 'subtle'}
                                className="ml-2"
                            >
                                {counters[filter as keyof typeof counters] || 0}
                            </Caption>
                        </Button>
                    ))}
                </div>
            </div>

            <Card padding="none">
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="w-16 text-center">Status</Th>
                            <Th>Name</Th>
                            <Th className="table-hide-sm">Image ID</Th>
                            <Th className="table-hide-md">Ports</Th>
                            <Th className="w-48 table-hide-lg">CPU</Th>
                            <Th className="w-48 table-hide-lg">Memory</Th>
                            <Th className="text-right">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {isLoading ? (
                            <Tr hoverable={false}>
                                <Td colSpan={7} className="py-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-3">
                                        <RefreshCw size={24} className="spin" />
                                        <Body color="secondary">Loading containers...</Body>
                                    </div>
                                </Td>
                            </Tr>
                        ) : filteredContainers.length === 0 ? (
                            <Tr hoverable={false}>
                                <Td colSpan={7} className="py-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-3">
                                        <Box size={32} opacity={0.5} />
                                        <Body color="secondary">No containers found matching your search.</Body>
                                    </div>
                                </Td>
                            </Tr>
                        ) : (
                            filteredContainers.map((container) => {
                                const cStats = stats[container.ID];
                                const cpuUsage = cStats ? Math.min(Math.round(cStats.cpuUsageUsec / 10000), 100) : 0;
                                const memUsageBytes = cStats?.memoryUsageBytes || 0;
                                const memLimitBytes = cStats?.memoryLimitBytes || 1024 * 1024 * 1024;
                                const memPercent = Math.min(Math.round((memUsageBytes / memLimitBytes) * 100), 100);

                                return (
                                    <Tr key={container.ID}>
                                        <Td className="whitespace-nowrap">
                                            <div className="relative flex items-center justify-center">
                                                <div className={`h - 3 w - 3 rounded - full ${container.State === "running" ? "bg-green-500 status-pulse-green" :
                                                    (container.State === "exited" || container.State === "stopped") ? "bg-slate-500" :
                                                        "bg-red-500 status-pulse-red"
                                                    } `}></div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="flex flex-col">
                                                <Link to={`/container/${container.ID}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">
                                                    {container.Names || container.ID.substring(0, 12)}
                                                </Link>
                                                <Caption color="secondary">
                                                    {container.State === "running" ? `Up ${container.Status}` : container.Status}
                                                </Caption>
                                            </div>
                                        </Td>
                                        <Td className="table-hide-sm">
                                            <div className="flex items-center gap-2">
                                                <Code variant="xs" weight="bold" color="accent" background="subtle">
                                                    {container.ID.substring(0, 12)}
                                                </Code>
                                                <Caption color="muted" className="truncate max-w-[150px]" title={container.Image}>
                                                    {container.Image}
                                                </Caption>
                                            </div>
                                        </Td>
                                        <Td className="table-hide-md">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(container.Ports) && container.Ports.length > 0 ? (
                                                    container.Ports.map((p: any, idx) => (
                                                        <Tag key={idx}>
                                                            {p.hostPort}:{p.containerPort}
                                                        </Tag>
                                                    ))
                                                ) : (
                                                    <Caption color="muted">-</Caption>
                                                )}
                                            </div>
                                        </Td>
                                        <Td className="table-hide-lg">
                                            {container.State === "running" ? (
                                                <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                    <div className="flex justify-between">
                                                        <Caption color="secondary">Usage</Caption>
                                                        <Caption weight="medium" className={cpuUsage > 80 ? "text-red-500" : cpuUsage > 50 ? "text-orange-400" : "text-green-400"}>
                                                            {cpuUsage}%
                                                        </Caption>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-surface-border rounded-full overflow-hidden">
                                                        <div className={`h - full rounded - full transition - all duration - 500 ${cpuUsage > 80 ? "bg-red-500" : cpuUsage > 50 ? "bg-orange-400" : "bg-green-500"} `} style={{ width: `${cpuUsage}% ` }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 dark:text-slate-600 italic">No usage data</div>
                                            )}
                                        </Td>
                                        <Td className="table-hide-lg">
                                            {container.State === "running" ? (
                                                <div className="flex flex-col gap-1 w-full max-w-[120px]">
                                                    <div className="flex justify-between">
                                                        <Caption color="secondary">{(memUsageBytes / 1024 / 1024).toFixed(0)}MB</Caption>
                                                        <Caption weight="medium" color="primary">{memPercent}%</Caption>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-surface-border rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${memPercent}% ` }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 dark:text-slate-600 italic">No usage data</div>
                                            )}
                                        </Td>
                                        <Td className="text-right">
                                            <div className="flex items-center justify-end gap-1">
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
                                        </Td>
                                    </Tr>
                                );
                            })
                        )}
                    </Tbody>
                </Table>
            </Card>

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

        </PageMain>
    );
}
