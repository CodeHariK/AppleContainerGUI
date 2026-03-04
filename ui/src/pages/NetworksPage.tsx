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
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../modals/Modal";
import { useSystem } from "../contexts/SystemContext";
import { PageMain } from "../components/PageMain";
import { Tag } from "../components/Tag";
import { H2, H3, P, Small, Caption } from "../components/Typography";

export default function NetworksPage() {
    const { systemRunning } = useSystem();
    const [networks, setNetworks] = useState<NetworkInfo[]>([]);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal States
    const [createNetOpen, setCreateNetOpen] = useState(false);
    const [addDnsOpen, setAddDnsOpen] = useState(false);

    // DNS Domains State
    const [dnsDomains, setDnsDomains] = useState<string[]>([]);
    const [isLoadingDns, setIsLoadingDns] = useState(false);

    // Confirmation States
    const [confirmDeleteNet, setConfirmDeleteNet] = useState<{ id: string, name: string } | null>(null);
    const [confirmDeleteDns, setConfirmDeleteDns] = useState<string | null>(null);

    const refreshData = async () => {
        try {
            if (systemRunning) {
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
    }, [systemRunning]);

    const handleDelete = async (id: string, name: string) => {
        setConfirmDeleteNet({ id, name });
    };

    const confirmDeleteNetwork = async () => {
        if (!confirmDeleteNetwork) return;
        if (!confirmDeleteNet) return;
        const { id } = confirmDeleteNet;
        setActionLoading(id);
        try {
            await removeNetwork(id);
            setConfirmDeleteNet(null);
            refreshData();
        } catch (e: any) {
            alert(e.message || "Failed to delete network");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteDns = async (domain: string) => {
        setConfirmDeleteDns(domain);
    };

    const confirmDeleteDnsEntry = async () => {
        if (!confirmDeleteDns) return;
        setActionLoading("delete-dns-" + confirmDeleteDns);
        try {
            await deleteDnsDomain(confirmDeleteDns);
            setConfirmDeleteDns(null);
            loadDnsDomains();
        } catch (e: any) {
            alert(e.message || "Failed to delete DNS entry");
        } finally {
            setActionLoading(null);
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
        <PageMain
            header={
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
            }
        >

            <>
                {networks.length === 0 ? (
                    <Card className="text-center p-12 mb-8">
                        <Network size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                        <H3 weight="medium" color="primary" className="text-center">No networks found.</H3>
                        <P color="secondary" className="mt-1 text-center">Create one to isolate container traffic.</P>
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
                                <Card key={net.id} className={`p-0 transition-colors ${netTheme.borderHover} flex flex-col group`}>
                                    <div className="p-6 border-b border-slate-600 dark:border-surface-border flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`${netTheme.bg} ${netTheme.text} p-3 rounded-xl shadow-inner`}>
                                                    <Icon size={24} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <H3 weight="bold" className="text-lg group-hover:text-primary transition-colors">
                                                        {net.id}
                                                    </H3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Tag variant="standard" className="uppercase tracking-widest">
                                                            {driver}
                                                        </Tag>
                                                        {isSystem && (
                                                            <Tag variant="warning" className="font-bold">
                                                                SYSTEM
                                                            </Tag>
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
                                                <Caption color="secondary" weight="medium">Subnet Range</Caption>
                                                <Caption mono weight="bold" color="secondary">
                                                    {net.status?.ipv4Subnet || "Not mapped"}
                                                </Caption>
                                            </div>

                                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-600 dark:border-surface-border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <Caption color="secondary" weight="medium" uppercase tracking="tight">Container Connectivity</Caption>
                                                    <Tag variant="primary" className="gap-1.5 py-1 px-2 border-transparent bg-transparent">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        <Caption weight="black" uppercase>{connectedCount} ACTIVE</Caption>
                                                    </Tag>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {connectedCount === 0 ? (
                                                        <Caption color="secondary" className="italic">No endpoints attached</Caption>
                                                    ) : (
                                                        getContainersForNetwork(net.id).slice(0, 5).map(c => (
                                                            <div key={c.ID} className="group relative">
                                                                <Tag variant="standard">
                                                                    {c.Names.replace("/", "")}
                                                                </Tag>
                                                            </div>
                                                        ))
                                                    )}
                                                    {connectedCount > 5 && (
                                                        <Caption weight="black" color="secondary" background="subtle">
                                                            +{connectedCount - 5} MORE
                                                        </Caption>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#181818]/50 flex items-center justify-between border-t border-slate-600 dark:border-surface-border group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <Tag variant="success" className="uppercase tracking-widest border-transparent bg-transparent">Bridged</Tag>
                                        </div>
                                        <Caption color="secondary" mono className="text-[10px]">{net.id.substring(0, 12)}</Caption>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-600 dark:border-surface-border flex justify-between items-center">
                        <div>
                            <H2 weight="black" uppercase tracking="tight" className="text-xl">DNS Discovery Domains</H2>
                            <Caption color="secondary" className="mt-1 tracking-tight">Standard local hostname resolution paths</Caption>
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
                                    <th className="py-4 px-6"><Caption weight="black" uppercase tracking="widest" color="secondary">Hostname Domain</Caption></th>
                                    <th className="py-4 px-6 text-right"><Caption weight="black" uppercase tracking="widest" color="secondary">Operations</Caption></th>
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
                                                    <Small weight="bold" mono color="primary">{domain}</Small>
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

            <ConfirmDialog
                open={!!confirmDeleteNet}
                onOpenChange={(open) => !open && setConfirmDeleteNet(null)}
                title="Delete Network"
                description={`Are you sure you want to delete network '${confirmDeleteNet?.name}'? This may affect connected containers.`}
                confirmLabel="Delete Network"
                onConfirm={confirmDeleteNetwork}
                variant="danger"
                isLoading={actionLoading === confirmDeleteNet?.id}
            />

            <ConfirmDialog
                open={!!confirmDeleteDns}
                onOpenChange={(open) => !open && setConfirmDeleteDns(null)}
                title="Remove DNS Entry"
                description={`Are you sure you want to remove the DNS entry for '${confirmDeleteDns}'?`}
                confirmLabel="Remove Entry"
                onConfirm={confirmDeleteDnsEntry}
                variant="danger"
                isLoading={actionLoading === ("delete-dns-" + confirmDeleteDns)}
            />
        </PageMain>
    );
}
