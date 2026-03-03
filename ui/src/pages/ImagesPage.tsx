import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog } from '@base-ui/react/dialog';
import { Select } from '@base-ui/react/select';

import { Toast } from "@base-ui/react/toast";
import { toastManager } from "../contexts/CommandLogContext";
import { NavBar } from "../components/NavBar";
import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";

import {
    Search,
    RefreshCw,
    Play,
    Trash2,
    Layers2,
    HardDrive,
    FileCode,
    X,
    FolderOpen,
    Save,
    Rocket,
    AlertTriangle,
    Box,
    ChevronDown,
    Download,
    Filter,
    FileText
} from "lucide-react";

import {
    checkSystemStatus,
    findDockerfiles,
    readFileContent,
    listImages,
    pullImage,
    deleteImage,
    buildImage,
    saveImage,
    parseCompose,
    composeUp,
    composeDown,
    discoverComposeFiles,
    createContainer
} from "../lib/container";
import type { ImageInfo } from "../lib/container";
import { Input } from "../components/Input";
import CreateContainerModal from "../modals/CreateContainerModal";


import * as React from 'react';

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ open, onOpenChange, title, children, maxWidth = '500px' }: ModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="modal-backdrop" />
                <Dialog.Popup className="premium-card modal-popup" style={{ maxWidth }}>
                    <div className="flex-between mb-4">
                        <Dialog.Title style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                            {title}
                        </Dialog.Title>
                        <Dialog.Close className="btn-icon">
                            <X size={20} />
                        </Dialog.Close>
                    </div>
                    {children}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    onConfirm,
    variant = 'primary',
    isLoading = false
}: ConfirmDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="modal-backdrop" />
                <Dialog.Popup className="premium-card modal-popup" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center">
                        {variant === 'danger' && (
                            <AlertTriangle size={40} className="text-red-500 mb-4" />
                        )}

                        <Dialog.Title className="text-xl font-semibold mb-2">
                            {title}
                        </Dialog.Title>

                        <Dialog.Description className="text-text-secondary text-sm mb-6 leading-relaxed">
                            {description}
                        </Dialog.Description>

                        <div className="flex gap-3 w-full">
                            <Button
                                variant="secondary"
                                fullWidth
                                disabled={isLoading}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant={variant}
                                fullWidth
                                onClick={async () => {
                                    await onConfirm();
                                    onOpenChange(false);
                                }}
                                loading={isLoading}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

const MODES = [
    { label: 'Images', value: 'images', icon: <Box size={18} /> },
    { label: 'Dockerfiles', value: 'dockerfiles', icon: <FileCode size={18} /> },
    { label: 'Compose', value: 'compose', icon: <Layers2 size={18} /> },
];

export default function ImagesPage() {
    const { toasts } = Toast.useToastManager();
    const [searchParams, setSearchParams] = useSearchParams();

    // Core state
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);

    // View state
    const mode = (searchParams.get("mode") as "images" | "dockerfiles" | "compose") || "images";
    const [searchQuery, setSearchQuery] = useState("");

    // Form/Modal states
    const [pullImageName, setPullImageName] = useState("");
    const [selectedImageForContainer, setSelectedImageForContainer] = useState<string | null>(null);
    const [isCreatingContainer, setIsCreatingContainer] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [imageToSave, setImageToSave] = useState<{ repository: string; path: string } | null>(null);
    const [dockerfileToBuild, setDockerfileToBuild] = useState<{ path: string; tag: string } | null>(null);
    const [dockerfileSearchDir, setDockerfileSearchDir] = useState("..");
    const [composeRootDir, setComposeRootDir] = useState("..");

    const refreshData = async (background = false) => {
        if (!background) setIsLoading(true);
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            if (isRunning) {
                const imgs = await listImages();
                setImages(imgs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!background) setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(() => refreshData(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const executeAction = async (actionId: string, func: () => Promise<any>) => {
        setActionLoading(actionId);
        try {
            await func();
            await refreshData(true);
        } catch (e: any) {
            toastManager.add({
                title: "Error",
                description: e.message || "An error occurred",
                type: "error"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleModeChange = (val: string) => {
        setSearchParams({ mode: val });
    };

    const handleCreateContainer = async (config: { image: string, command: string, runImmediately: boolean }) => {
        setIsCreatingContainer(true);
        try {
            await createContainer(config.command);
            toastManager.add({
                title: config.runImmediately ? "Container Started" : "Container Created",
                description: `Successfully ${config.runImmediately ? 'started' : 'created'} container from ${config.image}`,
                type: "success"
            });
            setSelectedImageForContainer(null);
        } catch (e: any) {
            toastManager.add({
                title: "Creation Failed",
                description: e.message,
                type: "error"
            });
        } finally {
            setIsCreatingContainer(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark overflow-x-hidden min-h-screen flex flex-col">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />
            <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8">
                <PageHeader
                    title="Images Management"
                    description={
                        mode === 'images' ? "Manage your local Docker images, monitor disk usage, and pull new images from registries." :
                            mode === 'dockerfiles' ? "Build new images directly from local Dockerfiles. Search and discover development environments." :
                                "Deploy and manage complex multi-container systems using Docker Compose definitions."
                    }
                    icon={Layers2}
                    actions={
                        <>
                            <Select.Root value={mode} onValueChange={(val) => val && handleModeChange(val)}>
                                <Select.Trigger className="flex h-10 items-center gap-2 px-3 py-2 bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-all hover:border-slate-300">
                                    <Select.Value />
                                    <ChevronDown size={14} className="text-slate-400" />
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Positioner className="z-[100] mt-2 min-w-[160px] bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-xl p-1 animate-in fade-in zoom-in duration-200">
                                        <Select.Popup>
                                            <Select.Group>
                                                {MODES.map((m) => (
                                                    <Select.Item key={m.value} value={m.value} className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none hover:bg-slate-50 dark:hover:bg-background-dark/50 data-[selected]:bg-primary/10 data-[selected]:text-primary transition-colors">
                                                        <Select.ItemText className="flex items-center gap-3">
                                                            {m.icon} {m.label}
                                                        </Select.ItemText>
                                                    </Select.Item>
                                                ))}
                                            </Select.Group>
                                        </Select.Popup>
                                    </Select.Positioner>
                                </Select.Portal>
                            </Select.Root>
                            <IconButton onClick={() => refreshData()} icon={RefreshCw} variant="secondary" loading={isLoading} />
                        </>
                    }
                />

                {!systemRunning ? (
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-16 flex flex-col items-center justify-center text-center shadow-sm">
                        <Box size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Daemon Offline</h3>
                        <p className="text-text-secondary mb-6 max-w-md">Connect to the Docker daemon to manage your images and container infrastructure.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Dynamic Input Section */}
                        <Card className="p-6">
                            {mode === 'images' && (
                                <div className="flex flex-col gap-4">
                                    <SectionHeader
                                        title="Pull New Image"
                                        icon={Download}
                                    />
                                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                                        <label className="flex flex-col gap-2 flex-1 w-full">
                                            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Registry</span>
                                            <div className="relative">
                                                <select className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg h-12 px-4 pr-10 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary-light dark:text-text-primary-dark outline-none transition-all">
                                                    <option>Docker Hub</option>
                                                    <option>GitHub Container Registry (ghcr.io)</option>
                                                    <option>AWS ECR</option>
                                                    <option>Google GCR</option>
                                                    <option>Azure ACR</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">expand_more</span>
                                            </div>
                                        </label>
                                        <div className="flex-[2] w-full">
                                            <Input
                                                label="Image Name & Tag"
                                                icon={Search}
                                                placeholder="e.g. redis:alpine"
                                                value={pullImageName}
                                                onChange={(e) => setPullImageName(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => executeAction("pull-img", () => pullImage(pullImageName))}
                                            disabled={!pullImageName}
                                            loading={actionLoading === "pull-img"}
                                            icon={Download}
                                            fullWidth
                                            className="lg:w-auto"
                                        >
                                            Pull
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {mode === 'dockerfiles' && (
                                <DockerfilesInput
                                    initialValue={dockerfileSearchDir}
                                    onScan={(path) => setDockerfileSearchDir(path)}
                                />
                            )}

                            {mode === 'compose' && (
                                <ComposeInput
                                    initialValue={composeRootDir}
                                    onRefresh={(path) => setComposeRootDir(path)}
                                />
                            )}
                        </Card>

                        {/* Dynamic Info Section */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    {mode === 'images' && <><Box size={22} className="text-primary" /> Local Images</>}
                                    {mode === 'dockerfiles' && <><FileCode size={22} className="text-primary" /> Discovered Dockerfiles</>}
                                    {mode === 'compose' && <><Layers2 size={22} className="text-primary" /> Compose Projects</>}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-64">
                                        <Input
                                            icon={Filter}
                                            placeholder={`Filter ${mode}...`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {mode === 'images' && (
                                        <IconButton icon={Layers2} variant="secondary" title="Prune unused images" />
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                                {mode === 'images' && (
                                    <ImagesTable
                                        images={images.filter(img =>
                                            img.Repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            img.Tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            img.ID.toLowerCase().includes(searchQuery.toLowerCase())
                                        )}
                                        onPlay={(img: string) => setSelectedImageForContainer(img)}
                                        onDelete={(img: string) => setImageToDelete(img)}
                                        onSave={(img: string) => setImageToSave({ repository: img, path: "/tmp/img.tar" })}
                                    />
                                )}
                                {mode === 'dockerfiles' && (
                                    <DockerfilesTable
                                        query={searchQuery}
                                        onBuild={(path: string) => setDockerfileToBuild({ path, tag: "" })}
                                        searchPath={dockerfileSearchDir}
                                    />
                                )}
                                {mode === 'compose' && (
                                    <ComposeProjectsList
                                        query={searchQuery}
                                        rootDir={composeRootDir}
                                    />
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </main>

            {/* Modals & Dialogs */}
            {selectedImageForContainer && (
                <CreateContainerModal
                    imageName={selectedImageForContainer}
                    onClose={() => setSelectedImageForContainer(null)}
                    onCreate={handleCreateContainer}
                    isCreating={isCreatingContainer}
                />
            )}

            <ConfirmDialog
                open={!!imageToDelete}
                onOpenChange={(open) => !open && setImageToDelete(null)}
                variant="danger"
                title="Delete Image?"
                description={`This will permanently remove ${imageToDelete} from your local storage.`}
                confirmLabel="Delete"
                onConfirm={async () => {
                    if (imageToDelete) {
                        await executeAction("del-img", () => deleteImage(imageToDelete));
                        setImageToDelete(null);
                    }
                }}
            />

            <Modal
                open={!!imageToSave}
                onOpenChange={(open) => !open && setImageToSave(null)}
                title="Save Image to Tarball"
            >
                <div className="flex flex-col gap-4">
                    <Input
                        label="Destination Path"
                        icon={HardDrive}
                        placeholder="/tmp/myapp.tar"
                        value={imageToSave?.path || ""}
                        onChange={(e) => setImageToSave(prev => prev ? { ...prev, path: e.target.value } : null)}
                    />
                    <div className="flex gap-3 mt-2">
                        <Button variant="secondary" fullWidth onClick={() => setImageToSave(null)}>Cancel</Button>
                        <Button variant="primary" fullWidth onClick={async () => {
                            if (imageToSave) {
                                await executeAction("save-img", () => saveImage(imageToSave.repository, imageToSave.path));
                                setImageToSave(null);
                            }
                        }}>Save Image</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!dockerfileToBuild}
                onOpenChange={(open) => !open && setDockerfileToBuild(null)}
                title="Build New Image"
            >
                <div className="flex flex-col gap-6">
                    <Input
                        label="Target Tag"
                        icon={Rocket}
                        placeholder="e.g. my-app:v1.0"
                        value={dockerfileToBuild?.tag || ""}
                        onChange={(e) => setDockerfileToBuild(prev => prev ? { ...prev, tag: e.target.value } : null)}
                        className="font-mono text-sm"
                    />
                    <p className="text-[11px] text-text-secondary px-1 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> The tag must be lowercase and follow docker naming conventions.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" fullWidth onClick={() => setDockerfileToBuild(null)}>Cancel</Button>
                        <Button variant="primary" fullWidth icon={Rocket} onClick={async () => {
                            if (dockerfileToBuild) {
                                const dir = dockerfileToBuild.path.substring(0, dockerfileToBuild.path.lastIndexOf('/'));
                                await executeAction("build-df", () => buildImage(`container build -t ${dockerfileToBuild.tag} -f ${dockerfileToBuild.path} ${dir}`));
                                setDockerfileToBuild(null);
                            }
                        }}>
                            Start Build
                        </Button>
                    </div>
                </div>
            </Modal>

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

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div >
    );
}

// --- Sub-components adapted for the new layout ---

function ImagesTable({ images, onPlay, onDelete, onSave }: any) {
    if (images.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                <Box size={48} className="mb-4" />
                <p className="text-sm font-medium">No images found matching your search.</p>
            </div>
        );
    }

    const getLogo = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("redis")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuDBqn6odH27LXf4DEspS5ASs8QwYKz_vgreKu6m2C3GggnyPSHTO43-KglaC8YjUz8MC5ewrQw-WQ9s3vmx_rjNe5M8lmHqP3dIipwrt3ryogLWhpzo-rOe7-LoW8ySWFH50xdTKuaPp1vCPJOcsTS36plVTlG1BqhvYAZP7ZwH1ScP0a8xIGRE1WfdDrS3u-5qD9xay9m6dzGZ0MbOPev_wzTVSjU66VxFx9ht7yYsLuhpxtevRoM9tyBbpqE31SBw29gq4mKq4wQ";
        if (n.includes("nginx")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuD0XktOgbWfgBqr64BTKBYqmqbHnaEpCWnSVIVSxp5lx-DbGVxJNmlXRHAuD3OaKiknLXEPSa1H_mghPcMk_IwuEmSGyq6OI3O9rqhIBaQyc0ARq87oFyNZMEXXaxB3WUOlIMN0uLISLYjsIlamCjtVdlWoW1BP9EM3MvgRAiVlW_j34JyX4lsJQDd8qhb37Gd9d7vf64vyBJ_1MdVxwx4RFJPtP_BXBYkM7HOFxU9Ws58-f-dEkgXxzYVDXO7PXIJvMDSyxVY6AN4";
        if (n.includes("node")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuAs79ahfzO9vsUYpm0r80iOaMEfNTzNsX0PC8KWLRSc13oqSzkJfOnxfEtbjcA_5ov5UTWpGTie9n9Xhklna4FpN0elo4pUhIzsHskSerhltEWkA1pKfSWMyIQPFFH948e6JMrUEbCbQ0iEgCR0q0JY4RQp8KAdLeyvNgB0rPjlJvEQ7_yW8pGOB2750sAzCl8llOSDVDCOqWphs1JAacxcEZwLAKBFql3w_HkVO9g9rJLb4Mvr6IIIZjTGRg2QRFwnVBTgJzJsjnU";
        if (n.includes("postgres")) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBUPidf-H4g6nQrfcc9PeSo5gj0YZsReW_5P-BNlGHR1D80o7EUG5WXT3PBPaiGBLGodVhD4vgdJA6tb6Y4s7rvJ4T3-ii313lKdxNp8cLgahCsAhNhaZ8indULG4o6W_WOD2qmAvklIwhXDFigUiQDPoiypPnkJLBngS3ANQfvTezqwJP2zCw_-V0TIIreVlVZcxrkbmBC9YP9dqO0d9N37xufS0QkbM_7TvfUea7QiKr6hfBCDp-ecrb72htBnhHM_uWtfNtRiuc";
        return null;
    };

    return (
        <div className="flex flex-col">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light/50 dark:bg-surface-dark/50 border-b border-border-light dark:border-border-dark text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark rounded-t-xl">
                <div className="col-span-4">Repository</div>
                <div className="col-span-2">Tag</div>
                <div className="col-span-2">Image ID</div>
                <div className="col-span-1">Size</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="flex flex-col gap-[1px] bg-border-light dark:bg-border-dark rounded-b-xl md:rounded-xl overflow-hidden shadow-sm">
                {images.map((img: ImageInfo, i: number) => {
                    const logo = getLogo(img.Repository);
                    return (
                        <div key={i} className="bg-surface-light dark:bg-surface-dark p-4 md:px-6 md:py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group hover:bg-background-light dark:hover:bg-border-dark/30 transition-colors">
                            <div className="md:col-span-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${logo ? 'bg-white' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                    {logo ? (
                                        <img src={logo} alt="" className="w-6 h-6 object-contain" />
                                    ) : (
                                        <Box size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold text-text-primary-light dark:text-text-primary-dark capitalize">{img.Repository}</div>
                                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark md:hidden">
                                        {img.Tag} • {img.Size}
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 hidden md:block">
                                <span className="px-2 py-1 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                                    {img.Tag}
                                </span>
                            </div>
                            <div className="md:col-span-2 hidden md:block text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark truncate opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-tighter" title={img.ID}>
                                {img.ID.substring(0, 12)}
                            </div>
                            <div className="md:col-span-1 hidden md:block text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {img.Size}
                            </div>
                            <div className="md:col-span-2 hidden md:block text-sm text-text-secondary-light dark:text-text-secondary-dark opacity-80">
                                {img.CreatedAt || "Unknown"}
                            </div>
                            <div className="md:col-span-1 flex justify-end gap-1">
                                <IconButton onClick={() => onPlay(img.Repository + ":" + img.Tag)} icon={Play} variant="ghost" title="Run Container" />
                                <IconButton onClick={() => onSave(img.Repository)} icon={Save} variant="ghost" title="Save Image" />
                                <IconButton onClick={() => onDelete(img.Repository + ":" + img.Tag)} icon={Trash2} variant="dangerGhost" title="Delete Image" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DockerfilesInput({ onScan, initialValue }: { onScan: (path: string) => void, initialValue: string }) {
    const [path, setPath] = useState(initialValue);
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex flex-col gap-2 flex-grow w-full">
                <div className="flex items-center gap-2 mb-1 text-primary">
                    <h3 className="text-lg font-bold">Discover Dockerfiles</h3>
                </div>
                <div className="flex flex-col gap-2 w-full">
                    <Input
                        label="Search Directory"
                        icon={FolderOpen}
                        placeholder="e.g. /home/projects (leave empty for current)"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onScan(path)}
                    />
                </div>
            </div>
            <Button
                onClick={() => onScan(path)}
                icon={RefreshCw}
                fullWidth
                className="lg:w-auto"
            >
                Scan Now
            </Button>
        </div>
    );
}

function DockerfilesTable({ query, onBuild, searchPath }: { query: string, onBuild: any, searchPath: string }) {
    const [dockerfiles, setDockerfiles] = useState<{ path: string; name: string }[]>([]);
    const [previewFile, setPreviewFile] = useState<{ name: string; content: string } | null>(null);

    useEffect(() => {
        const init = async () => {
            const files = await findDockerfiles(searchPath);
            setDockerfiles(files);
        };
        init();
    }, [searchPath]);

    const filtered = dockerfiles.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.path.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                <FileCode size={48} className="mb-4" />
                <p className="text-sm font-medium">No Dockerfiles found in the specified path.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-background-dark/30 border-b border-border-light dark:border-border-dark">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">File Name</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary">Location</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {filtered.map((df, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                        <FileCode size={20} />
                                    </div>
                                    <span
                                        className="font-semibold text-primary cursor-pointer hover:underline"
                                        onClick={async () => {
                                            const content = await readFileContent(df.path);
                                            setPreviewFile({ name: df.name, content });
                                        }}
                                    >
                                        {df.name}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm font-mono text-text-secondary truncate block max-w-sm" title={df.path}>
                                    {df.path}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button
                                    onClick={() => onBuild(df.path)}
                                    size="sm"
                                >
                                    Build Image
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                open={!!previewFile}
                onOpenChange={(open) => !open && setPreviewFile(null)}
                title={previewFile?.name || "File Preview"}
                maxWidth="900px"
            >
                <div className="bg-[#0d1117] rounded-xl overflow-hidden mt-2 relative">
                    <div className="absolute top-3 right-3 flex gap-2">
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 uppercase tracking-widest font-bold">Dockerfile</span>
                    </div>
                    <pre className="p-8 text-sm font-mono text-[#e6edf3] leading-relaxed overflow-x-auto max-h-[60vh] custom-scrollbar">
                        {previewFile?.content}
                    </pre>
                </div>
            </Modal>
        </div>
    );
}

function ComposeInput({ onRefresh, initialValue }: { onRefresh: (path: string) => void, initialValue: string }) {
    const [path, setPath] = useState(initialValue);
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex flex-col gap-2 flex-grow w-full">
                <div className="flex items-center gap-2 mb-1 text-primary">
                    <span className="material-symbols-outlined">search</span>
                    <h3 className="text-lg font-bold">Discover Projects</h3>
                </div>
                <div className="flex flex-col gap-2 w-full">
                    <Input
                        label="Project Root"
                        icon={FolderOpen}
                        placeholder="e.g. /Users/dev/my-stack"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onRefresh(path)}
                    />
                </div>
            </div>
            <Button
                onClick={() => onRefresh(path)}
                variant="secondary"
                icon={RefreshCw}
                fullWidth
                className="lg:w-auto"
            >
                Refresh
            </Button>
        </div>
    );
}

function ComposeProjectsList({ query, rootDir }: { query: string; rootDir: string }) {
    const [composeFiles, setComposeFiles] = useState<{ path: string, name: string }[]>([]);
    const [selectedComposeFile, setSelectedComposeFile] = useState("");
    const [parsedComposeData, setParsedComposeData] = useState<any>(null);
    const [rawComposeYaml, setRawComposeYaml] = useState("");
    const [projectName, setProjectName] = useState("");
    const [showSudoModal, setShowSudoModal] = useState(false);
    const [showTearDownConfirm, setShowTearDownConfirm] = useState(false);

    useEffect(() => {
        const init = async () => {
            const files = await discoverComposeFiles(rootDir || undefined);
            setComposeFiles(files);
        };
        init();
    }, [rootDir]);

    const filtered = composeFiles.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.path.toLowerCase().includes(query.toLowerCase())
    );

    const handleComposeParse = async (path: string) => {
        try {
            const [data, content] = await Promise.all([parseCompose(path), readFileContent(path)]);
            setParsedComposeData(data);
            setRawComposeYaml(content);
            setSelectedComposeFile(path);
            const parts = path.split('/');
            setProjectName((parts[parts.length - 2] || "project").toLowerCase().replace(/[^a-z0-9]/g, '-'));
        } catch (e) {
            console.error(e);
        }
    };

    if (filtered.length === 0 && !selectedComposeFile) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                <Layers2 size={48} className="mb-4" />
                <p className="text-sm font-medium">No Compose projects discovered.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-[500px]">
            <aside className="w-full md:w-80 border-r border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-background-dark/20 p-4">
                <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-[0.15em] mb-4 px-2">Discovered Files</h4>
                <div className="flex flex-col gap-2">
                    {filtered.map(file => (
                        <div
                            key={file.path}
                            onClick={() => handleComposeParse(file.path)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all group ${selectedComposeFile === file.path
                                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                : 'bg-white dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                <FileText size={14} className={selectedComposeFile === file.path ? 'text-primary' : 'text-slate-400'} />
                                {file.name}
                            </div>
                            <div className="text-[10px] opacity-60 truncate font-mono">{file.path}</div>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="flex-grow p-6">
                {selectedComposeFile ? (
                    <div className="flex flex-col gap-6 animate-fade-in text-slate-900 dark:text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h2 className="text-2xl font-black">{projectName}</h2>
                                <p className="text-sm text-text-secondary font-mono mt-1 opacity-70">{selectedComposeFile}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowSudoModal(true)}
                                >
                                    DNS Setup
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setShowTearDownConfirm(true)}
                                >
                                    Tear Down
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Rocket}
                                    onClick={() => composeUp(selectedComposeFile, projectName)}
                                >
                                    Deploy All
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(parsedComposeData?.services || {}).map(([name, svc]: [string, any]) => (
                                <div key={name} className="p-4 bg-white dark:bg-background-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 font-bold text-primary mb-1 text-primary">
                                        <Layers2 size={16} />
                                        {name}
                                    </div>
                                    <p className="text-xs text-text-secondary truncate">{svc.image || 'Custom Build'}</p>
                                </div>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="absolute top-3 right-3 flex gap-2">
                                <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-[#8e8]/50 uppercase tracking-widest font-bold">YAML</span>
                            </div>
                            <pre className="p-6 bg-black rounded-2xl text-[12px] font-mono text-[#8e8] leading-relaxed max-h-[400px] overflow-auto shadow-inner border border-white/5 custom-scrollbar">
                                {rawComposeYaml}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-25 text-center p-12">
                        <Layers2 size={64} className="mb-4" />
                        <h3 className="text-lg font-bold">Project Details</h3>
                        <p className="text-sm">Select a compose file to view services and configuration.</p>
                    </div>
                )}
            </main>

            <Modal open={showSudoModal} onOpenChange={setShowSudoModal} title="Local DNS Configuration">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                        To enable direct service access via <b>*.{projectName}.local</b>, run the following command in your terminal:
                    </p>
                    <div className="bg-black/90 p-4 rounded-xl font-mono text-sm text-primary border border-primary/20 flex items-center justify-between group">
                        <code>sudo container system dns create {projectName}</code>
                        <IconButton
                            icon={RefreshCw}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                        />
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        className="mt-2"
                        onClick={() => setShowSudoModal(false)}
                    >
                        I've configured it
                    </Button>
                </div>
            </Modal>

            <ConfirmDialog
                open={showTearDownConfirm}
                onOpenChange={setShowTearDownConfirm}
                variant="danger"
                title="Tear Down Project?"
                description={`This will permanently stop and remove all services associated with ${projectName}. All non-persistent data will be lost.`}
                confirmLabel="Tear Down"
                onConfirm={async () => {
                    await composeDown(projectName);
                }}
            />
        </div>
    );
}