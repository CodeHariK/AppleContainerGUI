import { useState, useEffect, useMemo } from "react";
import {
    Database,
    Trash2,
    RefreshCw,
    Plus,
    HardDrive,
    Image as ImageIcon,
    Cloud,
    FileText
} from "lucide-react";
import {
    listVolumes,
    createVolume,
    removeVolume,
    checkSystemStatus
} from "../lib/container";
import type {
    VolumeInfo
} from "../lib/container";
import CreateVolumeModal from "../modals/CreateVolumeModal";
import { NavBar } from "../components/NavBar";
import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../modals/Modal";

export default function VolumesPage() {
    const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            if (isRunning) {
                const vols = await listVolumes();
                setVolumes(vols);
            } else {
                setVolumes([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (name: string) => {
        setActionLoading("create");
        try {
            await createVolume(name);
            setIsCreateModalOpen(false);
            refreshData();
        } catch (e: any) {
            alert(e.message || String(e));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (name: string) => {
        setConfirmDeleteName(name);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteName) return;
        const name = confirmDeleteName;
        setActionLoading("delete-" + name);
        try {
            await removeVolume(name);
            refreshData();
        } catch (e: any) {
            alert(e.message || String(e));
        } finally {
            setActionLoading(null);
        }
    };

    const getVolumeIcon = (vol: VolumeInfo) => {
        const name = vol.name.toLowerCase();
        if (name.includes('db') || name.includes('data')) return <HardDrive size={24} />;
        if (name.includes('asset') || name.includes('static') || name.includes('web')) return <ImageIcon size={24} />;
        if (name.includes('cache') || vol.driver === 'nfs') return <Cloud size={24} />;
        if (name.includes('log')) return <FileText size={24} />;
        return <Database size={24} />;
    };

    const totalStorageBytes = useMemo(() => {
        return volumes.reduce((acc, vol) => acc + (vol.sizeInBytes || 0), 0);
    }, [volumes]);

    const activeDriversCount = useMemo(() => {
        const drivers = new Set(volumes.map(v => v.driver));
        return drivers.size;
    }, [volumes]);

    const unusedVolumesCount = useMemo(() => {
        return volumes.filter(v => (v.sizeInBytes || 0) === 0).length;
    }, [volumes]);

    const formatStorageGB = (bytes: number) => {
        return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />

            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                <PageHeader
                    title="Volume Management"
                    description="Persistent storage buckets for stateful container persistence."
                    icon={Database}
                    actions={
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            disabled={!systemRunning}
                            icon={Plus}
                        >
                            Create Volume
                        </Button>
                    }
                />

                {!systemRunning ? (
                    <Card className="flex flex-col items-center justify-center py-20">
                        <Database size={64} className="text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
                        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Daemon Offline</h2>
                        <p className="text-text-secondary font-medium">Please start the system to manage volumes.</p>
                        <Button
                            onClick={refreshData}
                            loading={isLoading}
                            icon={RefreshCw}
                            className="mt-6"
                        >
                            Retry Connection
                        </Button>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <Card className="flex items-center gap-5 p-6 group">
                                <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                    <HardDrive size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-1">Total Allocated</p>
                                    <div className="flex items-end gap-1.5">
                                        <h4 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                            {formatStorageGB(totalStorageBytes)}
                                        </h4>
                                        <span className="text-sm font-bold text-text-secondary pb-0.5">GB</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="flex items-center gap-5 p-6 group">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                                    <RefreshCw size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-1">Active Drivers</p>
                                    <h4 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                        {activeDriversCount}
                                    </h4>
                                </div>
                            </Card>

                            <Card className="flex items-center gap-5 p-6 group">
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                                    <Trash2 size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-1">Unused Volumes</p>
                                    <h4 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                        {unusedVolumesCount}
                                    </h4>
                                </div>
                            </Card>
                        </div>

                        <Card className="p-0 overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-600 dark:border-surface-border">
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Volume Identity</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Driver</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Mount Source</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                        {volumes.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-text-secondary italic">No storage volumes detected</td>
                                            </tr>
                                        ) : (
                                            volumes.map((vol) => (
                                                <tr key={vol.name} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-white/10 rounded text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                                                                {getVolumeIcon(vol)}
                                                            </div>
                                                            <span className="font-bold text-slate-900 dark:text-white">{vol.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-[10px] uppercase font-black text-text-secondary tracking-widest">
                                                            {vol.driver}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-mono text-text-secondary truncate max-w-[300px]" title={vol.source}>
                                                                {vol.source}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <IconButton
                                                            variant="ghost"
                                                            icon={Trash2}
                                                            title="Delete Volume"
                                                            loading={actionLoading === "delete-" + vol.name}
                                                            onClick={() => handleDelete(vol.name)}
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

            {isCreateModalOpen && (
                <CreateVolumeModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreate}
                    isCreating={actionLoading === "create"}
                />
            )}

            <ConfirmDialog
                open={!!confirmDeleteName}
                onOpenChange={(open) => !open && setConfirmDeleteName(null)}
                title="Delete Volume"
                description={`Are you sure you want to delete volume '${confirmDeleteName}'? This action cannot be undone.`}
                confirmLabel="Delete Volume"
                onConfirm={confirmDelete}
                variant="danger"
                isLoading={actionLoading?.startsWith("delete-")}
            />
        </div>
    );
}
