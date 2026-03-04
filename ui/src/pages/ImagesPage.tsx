import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";


import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { PageMain } from "../components/PageMain";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/Table";
import { Tag } from "../components/Tag";
import { H2, H3, H4, Body, Small, Caption } from "../components/Typography";

import {
    Search,
    RefreshCw,
    Play,
    Trash2,
    Layers2,
    FileCode,
    FolderOpen,
    Save,
    Rocket,
    Box,
    Download,
    Filter,
    FileText,
    FireExtinguisher
} from "lucide-react";

import {
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
    createContainer,
    pruneImages
} from "../lib/container";
import type { ImageInfo } from "../lib/container";
import { Input } from "../components/Input";
import CreateContainerModal from "../modals/CreateContainerModal";
import BaseSelect from "../components/BaseSelect";
import { ConfirmDialog, Modal } from "../modals/Modal";
import SaveImageModal from "../modals/SaveImageModal";
import BuildImageModal from "../modals/BuildImageModal";
import DnsSetupModal from "../modals/DnsSetupModal";




import { useSystem } from "../contexts/SystemContext";

const MODES = [
    { label: 'Images', value: 'images', icon: <Box size={18} /> },
    { label: 'Dockerfiles', value: 'dockerfiles', icon: <FileCode size={18} /> },
    { label: 'Compose', value: 'compose', icon: <Layers2 size={18} /> },
];

const REGISTRIES = [
    { label: 'Docker Hub', value: 'docker.io' },
    { label: 'GitHub Container Registry', value: 'ghcr.io' },
    { label: 'AWS ECR', value: 'public.ecr.aws' },
    { label: 'Google GCR', value: 'gcr.io' },
    { label: 'Azure ACR', value: 'azurecr.io' },
];

export default function ImagesPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Core state
    const { systemRunning } = useSystem();
    const [images, setImages] = useState<ImageInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // View state
    const mode = (searchParams.get("mode") as "images" | "dockerfiles" | "compose") || "images";
    const [searchQuery, setSearchQuery] = useState("");

    // Form/Modal states
    const [selectedRegistry, setSelectedRegistry] = useState(REGISTRIES[0].value);
    const [pullImageName, setPullImageName] = useState("");
    const [selectedImageForContainer, setSelectedImageForContainer] = useState<string | null>(null);
    const [isCreatingContainer, setIsCreatingContainer] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);
    const [imageToSave, setImageToSave] = useState<{ repository: string; path: string } | null>(null);
    const [dockerfileToBuild, setDockerfileToBuild] = useState<{ path: string; tag: string } | null>(null);
    const [dockerfileSearchDir, setDockerfileSearchDir] = useState("..");
    const [composeRootDir, setComposeRootDir] = useState("..");
    const [showPruneConfirm, setShowPruneConfirm] = useState(false);

    const refreshData = async (background = false) => {
        if (!background) setIsLoading(true);
        try {
            if (systemRunning) {
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
    }, [systemRunning]);

    const executeAction = async (actionId: string, func: () => Promise<any>) => {
        setActionLoading(actionId);
        try {
            await func();
            await refreshData(true);
        } catch (e: any) {
            // Handled globally
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
            // Handled globally
        } catch (e: any) {
            // Handled globally
        } finally {
            setIsCreatingContainer(false);
        }
    };

    return (
        <PageMain
            header={
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
                            <div className="w-[180px]">
                                <BaseSelect
                                    label=""
                                    value={mode}
                                    onChange={(val) => handleModeChange(val)}
                                    options={MODES}
                                />
                            </div>
                            <IconButton onClick={() => refreshData()} icon={RefreshCw} variant="secondary" loading={isLoading} />
                        </>
                    }
                />
            }
        >
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
                                <div className="flex-1 w-full">
                                    <BaseSelect
                                        label="Registry"
                                        value={selectedRegistry}
                                        onChange={(v) => setSelectedRegistry(v)}
                                        options={REGISTRIES}
                                    />
                                </div>
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
                        <H3 weight="bold" className="flex items-center gap-2">
                            {mode === 'images' && <><Box size={22} className="text-primary" /> Local Images</>}
                            {mode === 'dockerfiles' && <><FileCode size={22} className="text-primary" /> Discovered Dockerfiles</>}
                            {mode === 'compose' && <><Layers2 size={22} className="text-primary" /> Compose Projects</>}
                        </H3>
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
                                <IconButton
                                    icon={FireExtinguisher}
                                    variant="secondary"
                                    title="Prune unused images"
                                    onClick={() => setShowPruneConfirm(true)}
                                    loading={actionLoading === 'prune'}
                                />
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
                open={showPruneConfirm}
                onOpenChange={setShowPruneConfirm}
                title="Prune Unused Images"
                description="This will remove all dangling images that are not associated with any container. This action cannot be undone."
                onConfirm={() => executeAction('prune', pruneImages)}
                confirmLabel="Prune Images"
                variant="danger"
            />

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

            <SaveImageModal
                open={!!imageToSave}
                onOpenChange={(open) => !open && setImageToSave(null)}
                imageToSave={imageToSave}
                setImageToSave={setImageToSave}
                isSaving={actionLoading === "save-img"}
                onSave={async (repo, path) => {
                    await executeAction("save-img", () => saveImage(repo, path));
                }}
            />

            <BuildImageModal
                open={!!dockerfileToBuild}
                onOpenChange={(open) => !open && setDockerfileToBuild(null)}
                dockerfileToBuild={dockerfileToBuild}
                setDockerfileToBuild={setDockerfileToBuild}
                isBuilding={actionLoading === "build-df"}
                onBuild={async (path, tag) => {
                    const dir = path.substring(0, path.lastIndexOf('/'));
                    await executeAction("build-df", () => buildImage(`container build -t ${tag} -f ${path} ${dir}`));
                }}
            />

        </PageMain>
    );
}

// --- Sub-components adapted for the new layout ---

function ImagesTable({ images, onPlay, onDelete, onSave }: any) {
    if (images.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                <Box size={48} className="mb-4" />
                <Small weight="medium">No images found matching your search.</Small>
            </div>
        );
    }

    return (
        <Table>
            <Thead>
                <Tr>
                    <Th className="w-10"></Th>
                    <Th>Repository</Th>
                    <Th className="table-hide-md">Tag</Th>
                    <Th className="table-hide-md">Image ID</Th>
                    <Th className="table-hide-md">Size</Th>
                    <Th className="table-hide-md">Created</Th>
                    <Th className="text-right">Actions</Th>
                </Tr>
            </Thead>
            <Tbody>
                {images.map((img: ImageInfo, i: number) => (
                    <Tr key={i}>
                        <Td>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark group-hover:scale-105 transition-transform">
                                <Box size={20} />
                            </div>
                        </Td>
                        <Td>
                            <div className="flex flex-col">
                                <Body weight="semibold" className="capitalize">{img.Repository}</Body>
                                <Caption color="secondary" className="md:hidden">
                                    {img.Tag} • {img.ID.substring(0, 12)}
                                </Caption>
                            </div>
                        </Td>
                        <Td className="table-hide-md">
                            <Tag variant="standard" className="label-mono">
                                {img.Tag}
                            </Tag>
                        </Td>
                        <Td className="table-hide-md">
                            <Caption color="secondary" mono className="truncate block max-w-[120px]" title={img.ID}>
                                {img.ID.substring(0, 12)}
                            </Caption>
                        </Td>
                        <Td className="table-hide-md text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
                            {img.Size}
                        </Td>
                        <Td className="table-hide-md text-sm text-text-secondary-light dark:text-text-secondary-dark opacity-80">
                            {img.CreatedAt || "Unknown"}
                        </Td>
                        <Td className="text-right">
                            <div className="flex justify-end gap-1">
                                <IconButton onClick={() => onPlay(img.Repository + ":" + img.Tag)} icon={Play} variant="ghost" title="Run Container" />
                                <IconButton onClick={() => onSave(img.Repository)} icon={Save} variant="ghost" title="Save Image" />
                                <IconButton onClick={() => onDelete(img.Repository + ":" + img.Tag)} icon={Trash2} variant="dangerGhost" title="Delete Image" />
                            </div>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}

function DockerfilesInput({ onScan, initialValue }: { onScan: (path: string) => void, initialValue: string }) {
    const [path, setPath] = useState(initialValue);
    return (
        <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex flex-col gap-2 flex-grow w-full">
                <div className="flex items-center gap-2 mb-1">
                    <H3 weight="bold" color="primary">Discover Dockerfiles</H3>
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
                <Small weight="medium">No Dockerfiles found in the specified path.</Small>
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
                                    <Body
                                        weight="semibold"
                                        color="primary"
                                        className="cursor-pointer hover:underline"
                                        onClick={async () => {
                                            const content = await readFileContent(df.path);
                                            setPreviewFile({ name: df.name, content });
                                        }}
                                    >
                                        {df.name}
                                    </Body>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Small color="secondary" mono className="truncate block max-w-sm" title={df.path}>
                                    {df.path}
                                </Small>
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
                        <Tag variant="standard" className="text-white/40 border-white/5 bg-white/5 uppercase tracking-widest font-bold">Dockerfile</Tag>
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
                <div className="flex items-center gap-2 mb-1">
                    <Body color="primary"><span className="material-symbols-outlined">search</span></Body>
                    <H3 weight="bold" color="primary">Discover Projects</H3>
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
                <Small weight="medium">No Compose projects discovered.</Small>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-[500px]">
            <aside className="w-full md:w-80 border-r border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-background-dark/20 p-4">
                <H4 variant="xs" weight="black" color="secondary" uppercase tracking="widest" className="mb-4 px-2">Discovered Files</H4>
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
                                <H2 weight="black">{projectName}</H2>
                                <Small color="secondary" mono className="font-mono mt-1 opacity-70 block">{selectedComposeFile}</Small>
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
                                    <Caption color="secondary" className="truncate block">{svc.image || 'Custom Build'}</Caption>
                                </div>
                            ))}
                        </div>

                        <div className="relative group">
                            <div className="absolute top-3 right-3 flex gap-2">
                                <Tag variant="standard" className="text-[#8e8]/50 border-white/5 bg-white/5 uppercase tracking-widest font-bold">YAML</Tag>
                            </div>
                            <pre className="p-6 bg-black rounded-2xl text-[12px] font-mono text-[#8e8] leading-relaxed max-h-[400px] overflow-auto shadow-inner border border-white/5 custom-scrollbar">
                                {rawComposeYaml}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-25 text-center p-12">
                        <H3 weight="bold" className="mb-4">Project Details</H3>
                        <Small>Select a compose file to view services and configuration.</Small>
                    </div>
                )}
            </main>

            <DnsSetupModal
                open={showSudoModal}
                onOpenChange={setShowSudoModal}
                projectName={projectName}
            />

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