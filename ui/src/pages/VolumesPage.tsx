import { useState, useEffect, useMemo } from "react";
import {
    Database,
    Plus,
    HardDrive,
    RefreshCw,
    FileText,
    Image as ImageIcon,
    Cloud,
    Trash2
} from "lucide-react";
import {
    listVolumes,
    createVolume,
    removeVolume
} from "../lib/container";
import type { VolumeInfo } from "../lib/container";
import { CreateVolumeModal } from "../modals/CreateVolumeModal";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../modals/Modal";
import { useSystem } from "../contexts/SystemContext";
import { PageMain } from "../components/PageMain";
import { Tag } from "../components/Tag";
import { H3, H4, Body, Small, Caption } from "../components/Typography";

export default function VolumesPage() {
    const { systemRunning } = useSystem();
    const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

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
        <PageMain
            header={
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
            }
        >

            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="flex items-center gap-5 p-6 group">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                            <HardDrive size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <Caption as="p" weight="black" color="secondary" uppercase tracking="widest" className="mb-1">Total Allocated</Caption>
                            <div className="flex items-end gap-1.5">
                                <H4 weight="black" tracking="tight" className="text-3xl leading-none">
                                    {formatStorageGB(totalStorageBytes)}
                                </H4>
                                <Small weight="bold" color="secondary" className="pb-0.5">GB</Small>
                            </div>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-5 p-6 group">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <RefreshCw size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <Caption as="p" weight="black" color="secondary" uppercase tracking="widest" className="mb-1">Active Drivers</Caption>
                            <Body as="span" weight="black" background="primary" className="text-3xl leading-none">
                                {activeDriversCount}
                            </Body>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-5 p-6 group">
                        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                            <Plus size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <Caption as="p" weight="black" color="secondary" uppercase tracking="widest" className="mb-1">Unused Volumes</Caption>
                            <H4 weight="black" tracking="tight" className="text-3xl leading-none">
                                {unusedVolumesCount}
                            </H4>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-text-secondary font-display italic animate-pulse">
                            Enumerating logical volumes...
                        </div>
                    ) : volumes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-text-secondary font-display italic">
                            No volumes initialized.
                        </div>
                    ) : (
                        volumes.map((vol) => (
                            <Card key={vol.name} className="p-0 overflow-hidden hover:border-primary/40 transition-colors">
                                <div className="p-6 flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-slate-100 dark:bg-surface-border text-slate-600 dark:text-slate-400 rounded-xl shadow-inner group-hover:text-primary transition-colors">
                                            {getVolumeIcon(vol)}
                                        </div>
                                        <div>
                                            <H3 weight="bold" className="text-lg group-hover:text-primary transition-colors">
                                                {vol.name}
                                            </H3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Tag variant="standard" className="uppercase tracking-widest">
                                                    {vol.driver}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconButton
                                            variant="ghost"
                                            icon={Trash2}
                                            size="sm"
                                            onClick={() => handleDelete(vol.name)}
                                            loading={actionLoading === "delete-" + vol.name}
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#181818]/50 flex items-center justify-between border-t border-slate-600 dark:border-surface-border">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <Tag variant="success" className="uppercase tracking-widest border-transparent bg-transparent">Read / Write</Tag>
                                    </div>
                                    <Caption weight="black" color="accent" mono>
                                        {formatStorageGB(vol.sizeInBytes || 0)} GB
                                    </Caption>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </>

            {isCreateModalOpen && (
                <CreateVolumeModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={(name) => handleCreate(name)}
                    isLoading={actionLoading === "create"}
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
