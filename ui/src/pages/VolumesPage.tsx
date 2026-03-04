import { useState, useEffect, useMemo } from "react";
import {
    Database,
    Plus,
    HardDrive,
    FileText,
    Image as ImageIcon,
    Cloud,
    Trash2,
    Eye
} from "lucide-react";
import {
    listVolumes,
    createVolume,
    removeVolume
} from "../lib/container";
import type { VolumeInfo } from "../lib/container";
import { CreateVolumeModal } from "../modals/CreateVolumeModal";
import { BrowseVolumeModal } from "../modals/BrowseVolumeModal";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../modals/Modal";
import { useSystem } from "../contexts/SystemContext";
import { PageMain } from "../components/PageMain";
import { Tag } from "../components/Tag";
import { H3, H4, Small, Caption } from "../components/Typography";
import { Input } from "../components/Input";

export default function VolumesPage() {
    const { systemRunning } = useSystem();
    const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
    const [browseVolumeName, setBrowseVolumeName] = useState<string | null>(null);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            if (systemRunning) {
                const data = await listVolumes();
                setVolumes(data);
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
    }, [systemRunning]);

    const handleCreate = async (name: string, size?: string) => {
        setActionLoading("create");
        try {
            await createVolume(name, size);
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
            setConfirmDeleteName(null);
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
        return volumes.reduce((acc: number, vol: VolumeInfo) => acc + (vol.sizeInBytes || 0), 0);
    }, [volumes]);

    const activeDriversCount = useMemo(() => {
        const drivers = new Set(volumes.map((v: VolumeInfo) => v.driver));
        return drivers.size;
    }, [volumes]);

    const unusedVolumesCount = useMemo(() => {
        return volumes.filter((v: VolumeInfo) => (v.sizeInBytes || 0) === 0).length;
    }, [volumes]);

    const formatStorageGB = (bytes: number) => {
        return parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));
    };

    return (
        <PageMain
            header={
                <PageHeader
                    title="Volume Management"
                    description={`${volumes.length} active volumes across ${activeDriversCount} storage drivers`}
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
            }
        >

            <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <Card className="rounded-xl border border-transparent shadow-sm hover:border-primary/40 transition-all">
                        <Caption weight="black" color="secondary" uppercase tracking="widest" className="mb-2">Total Storage</Caption>
                        <div className="flex items-end gap-1.5">
                            <H4 weight="black" tracking="tight" className="text-3xl leading-none">
                                {formatStorageGB(totalStorageBytes)}
                            </H4>
                            <Small weight="bold" color="secondary" className="pb-0.5">GB</Small>
                        </div>
                    </Card>

                    <Card className="rounded-xl border border-transparent shadow-sm hover:border-primary/40 transition-all">
                        <Caption weight="black" color="secondary" uppercase tracking="widest" className="mb-2">Active Drivers</Caption>
                        <H4 weight="black" tracking="tight" className="text-3xl leading-none">
                            {activeDriversCount}
                        </H4>
                    </Card>

                    <Card className="rounded-xl border border-transparent shadow-sm hover:border-primary/40 transition-all">
                        <Caption weight="black" color="secondary" uppercase tracking="widest" className="mb-2">Unused Volumes</Caption>
                        <H4 weight="black" tracking="tight" className="text-3xl leading-none text-amber-500">
                            {unusedVolumesCount}
                        </H4>
                    </Card>

                    <Card className="rounded-xl border border-transparent shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
                        <div className="absolute top-0 right-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                        <Caption weight="black" color="secondary" uppercase tracking="widest" className="mb-2">Health Status</Caption>
                        <H4 weight="black" tracking="tight" className="text-3xl leading-none text-emerald-500">
                            Optimal
                        </H4>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-text-secondary font-display italic animate-pulse">
                            Enumerating logical volumes...
                        </div>
                    ) : volumes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-text-secondary font-display italic">
                            No volumes initialized.
                        </div>
                    ) : (
                        volumes.map((vol: VolumeInfo) => (
                            <Card
                                key={vol.name}
                                padding="none"
                                className="flex flex-col overflow-hidden border border-transparent hover:border-primary/40 transition-all group"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                {getVolumeIcon(vol)}
                                            </div>
                                            <div>
                                                <H3 weight="bold" className="text-lg text-slate-900 dark:text-white tracking-tight">
                                                    {vol.name}
                                                </H3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`size-1.5 rounded-full ${vol.sizeInBytes > 0 ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                                    <Caption weight="bold" color="secondary" uppercase tracking="widest" className="text-[10px]">
                                                        {vol.driver} Driver
                                                    </Caption>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setBrowseVolumeName(vol.name)}
                                                className="text-slate-400 hover:text-primary transition-colors p-1"
                                                title="Browse Volume"
                                            >
                                                <Eye size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vol.name)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                disabled={actionLoading === "delete-" + vol.name}
                                                title="Delete Volume"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-1">
                                            <Caption weight="bold" color="secondary" uppercase tracking="widest" className="text-[10px]">
                                                Mount Point
                                            </Caption>
                                            <Input value={vol.source} />
                                        </div>
                                        {Object.keys(vol.labels).length > 0 && (
                                            <div className="space-y-1">
                                                <Caption weight="bold" color="secondary" uppercase tracking="widest" className="text-[10px]">
                                                    Labels
                                                </Caption>
                                                <div className="flex gap-2 flex-wrap">
                                                    {Object.entries(vol.labels).map(([k, v]) => (
                                                        <Tag key={k} variant="standard" className="text-[10px]">
                                                            {k}: {v}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                            <Database size={18} />
                                            {formatStorageGB(vol.sizeInBytes || 0)} GB
                                        </div>
                                        <Caption weight="bold" color="secondary" className="text-xs italic">
                                            Format: {vol.format}
                                        </Caption>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </>

            {isCreateModalOpen && (
                <CreateVolumeModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={(name, size) => handleCreate(name, size)}
                    isLoading={actionLoading === "create"}
                />
            )}

            {browseVolumeName && (
                <BrowseVolumeModal
                    volumeName={browseVolumeName}
                    onClose={() => setBrowseVolumeName(null)}
                />
            )}

            <ConfirmDialog
                open={!!confirmDeleteName}
                onOpenChange={(open) => !open && setConfirmDeleteName(null)}
                title="Remove Volume"
                description={`Are you sure you want to remove the volume '${confirmDeleteName}'? All persistent data within this volume will be permanently lost.`}
                confirmLabel="Destroy Volume"
                onConfirm={confirmDelete}
                variant="danger"
                isLoading={actionLoading === ("delete-" + confirmDeleteName)}
            />
        </PageMain>
    );
}
