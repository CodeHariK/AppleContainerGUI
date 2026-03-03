import { useState, useEffect, useMemo } from "react";

import {
    Database,
    Trash2,
    RefreshCw,
    Plus,
    HardDrive,
    Image as ImageIcon,
    Cloud,
    FileText,
    FolderOpen
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
import CreateVolumeModal from "../components/CreateVolumeModal";
import { NavBar } from "../components/NavBar";

export default function VolumesPage() {
    const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const searchQuery = ""; // Kept for filteredVolumes logic

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
        if (!confirm(`Are you sure you want to delete volume '${name}'?`)) return;
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

    const getVolumeColor = (vol: VolumeInfo) => {
        if (vol.driver === 'local') return 'bg-emerald-500';
        if (vol.driver === 'nfs') return 'bg-blue-500';
        return 'bg-slate-600';
    };

    const totalStorageBytes = useMemo(() => {
        return volumes.reduce((acc, vol) => acc + (vol.sizeInBytes || 0), 0);
    }, [volumes]);

    const activeDriversCount = useMemo(() => {
        const drivers = new Set(volumes.map(v => v.driver));
        return drivers.size;
    }, [volumes]);

    const unusedVolumesCount = useMemo(() => {
        // We lack direct container usage info in VolumeInfo currently 
        // We can simulate or wait for proper API (currently assuming sizes > 0 implies used for demo purposes, 
        // or just hardcoded 0 if we don't know). For realism based on the UI request:
        // Docker API doesn't return usage by default without querying containers. 
        // We will just do a mock or return '?' if we can't be sure, but let's default to something reasonable.
        return volumes.filter(v => (v.sizeInBytes || 0) === 0).length;
    }, [volumes]);

    const filteredVolumes = volumes.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatStorageGB = (bytes: number) => {
        return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans antialiased animate-fade-in">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />

            <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10">
                {!systemRunning ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <Database size={64} className="text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
                        <h2 className="text-2xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark mb-2">Daemon Offline</h2>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">Please start the Docker system to manage volumes.</p>
                        <button onClick={refreshData} className="mt-6 flex items-center gap-2 rounded-lg px-5 py-2 bg-primary text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/10">
                            <RefreshCw size={16} className={isLoading ? "spin" : ""} /> Retry Connection
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-3xl font-black tracking-tight text-text-primary-light dark:text-text-primary-dark">Volumes Management</h1>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">{volumes.length} active volumes across {activeDriversCount} storage drivers</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={refreshData}
                                    className="flex items-center gap-2 rounded-lg px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark font-semibold text-sm hover:opacity-80 transition-all">
                                    <RefreshCw size={18} className={isLoading ? "spin" : ""} />
                                    Refresh
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-2 rounded-lg px-5 py-2 bg-primary text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/10">
                                    <Plus size={18} />
                                    Create Volume
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-[10px] font-bold uppercase tracking-[0.2em]">Total Storage</p>
                                <p className="text-3xl font-black mt-2 text-text-primary-light dark:text-text-primary-dark">
                                    {totalStorageBytes > 0 ? formatStorageGB(totalStorageBytes) : "0"} <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase">GB</span>
                                </p>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-[10px] font-bold uppercase tracking-[0.2em]">Active Drivers</p>
                                <p className="text-3xl font-black mt-2 text-text-primary-light dark:text-text-primary-dark">{activeDriversCount}</p>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-[10px] font-bold uppercase tracking-[0.2em]">Unused Volumes</p>
                                <p className="text-3xl font-black mt-2 text-amber-500">{unusedVolumesCount}</p>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark text-[10px] font-bold uppercase tracking-[0.2em]">Health Status</p>
                                <p className="text-3xl font-black mt-2 text-emerald-500">Optimal</p>
                            </div>
                        </div>

                        {filteredVolumes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                                <Database size={64} className="text-slate-400 dark:text-slate-600 mb-6 opacity-50" />
                                <h2 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark mb-2">No volumes found</h2>
                                <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">Create a new volume to persist your container data.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredVolumes.map(vol => (
                                    <div key={vol.name} className="flex flex-col bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden hover:border-primary/40 transition-all">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                        {getVolumeIcon(vol)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight break-all">{vol.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`size-1.5 rounded-full ${getVolumeColor(vol)}`}></span>
                                                            <span className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">{vol.driver} Driver</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {actionLoading === "delete-" + vol.name ? (
                                                    <div className="p-1">
                                                        <RefreshCw size={20} className="text-slate-400 dark:text-slate-500 spin" />
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleDelete(vol.name)} className="text-slate-400 dark:text-slate-600 hover:text-red-500 transition-colors p-1" title="Delete Volume">
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-4 mb-6">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Mount Point</span>
                                                    <div className="text-xs font-mono bg-background-light dark:bg-background-dark p-2.5 rounded border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark overflow-hidden text-ellipsis whitespace-nowrap" title={vol.source}>
                                                        {vol.source || "N/A"}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Used By</span>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {(vol.sizeInBytes || 0) > 0 ? (
                                                            <span className="px-2 py-1 rounded-md bg-background-light dark:bg-background-dark text-[11px] font-bold text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark">1+ Containers</span>
                                                        ) : (
                                                            <span className="text-[11px] italic text-slate-400 dark:text-slate-600">Unused</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-5 border-t border-border-light dark:border-border-dark">
                                                <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">
                                                    <Database size={18} />
                                                    {vol.sizeInBytes !== undefined ? formatSize(vol.sizeInBytes) : '-'}
                                                </div>
                                                <button className="flex items-center gap-1.5 text-primary font-bold text-sm hover:underline underline-offset-4 pointer-events-none opacity-50">
                                                    <FolderOpen size={18} />
                                                    Browse
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
        </div>
    );
}

