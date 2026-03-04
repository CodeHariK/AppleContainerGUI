import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Cpu, MemoryStick as Memory, Terminal, Shield, HardDrive, Package } from "lucide-react";
import { listNetworks, type NetworkInfo, type ContainerConfig } from "../lib/container";
import BaseSelect from "../components/BaseSelect";
import { Input } from "../components/Input";
import { Switch } from "../components/Switch";
import { Button, IconButton } from "../components/Button";
import "../Dashboard.css";
import { buildRunCommand, buildCreateCommand } from "../lib/commandBuilder";
import { Modal } from "./Modal";
import { Heading, Text } from "../components/Typography";

interface Props {
    imageName?: string;
    onClose: () => void;
    onCreate: (config: { image: string, command: string, runImmediately: boolean }) => void;
    isCreating: boolean;
}

interface PortConfig { host: string; container: string; }
interface EnvConfig { key: string; value: string; }
interface VolConfig { host: string; container: string; }

export default function CreateContainerModal({ imageName, onClose, onCreate, isCreating }: Props) {
    const [customImage, setCustomImage] = useState("");
    const [command, setCommand] = useState("");
    const [cpus, setCpus] = useState<number | undefined>(undefined);
    const [memoryMB, setMemoryMB] = useState<number | undefined>(undefined);
    const [network, setNetwork] = useState("");
    const [ports, setPorts] = useState<PortConfig[]>([]);
    const [env, setEnv] = useState<EnvConfig[]>([]);
    const [volumes, setVolumes] = useState<VolConfig[]>([]);
    const [runImmediately, setRunImmediately] = useState(true);
    const [networks, setNetworks] = useState<NetworkInfo[]>([]);

    const effectiveImage = imageName || customImage;

    useEffect(() => {
        listNetworks().then(setNetworks);
    }, []);

    const config: ContainerConfig = {
        image: effectiveImage,
        command: command || undefined,
        cpus: cpus || undefined,
        memory: memoryMB ? `${memoryMB}M` : undefined,
        network: network || undefined,
        ports: ports.filter(p => p.host && p.container).map(p => `${p.host}:${p.container}`),
        env: env.filter(e => e.key && e.value).map(e => `${e.key}=${e.value}`),
        volumes: volumes.filter(v => v.host && v.container).map(v => `${v.host}:${v.container}`),
    };

    const currentCommand = runImmediately
        ? buildRunCommand(config)
        : buildCreateCommand(config);

    const handleCreate = () => {
        onCreate({ image: effectiveImage, command: currentCommand, runImmediately });
    };

    const addPort = () => setPorts([...ports, { host: "", container: "" }]);
    const updatePort = (idx: number, field: keyof PortConfig, val: string) => {
        const next = [...ports];
        next[idx][field] = val;
        setPorts(next);
    }
    const removePort = (idx: number) => setPorts(ports.filter((_, i) => i !== idx));

    const addEnv = () => setEnv([...env, { key: "", value: "" }]);
    const updateEnv = (idx: number, field: keyof EnvConfig, val: string) => {
        const next = [...env];
        next[idx][field] = val;
        setEnv(next);
    }
    const removeEnv = (idx: number) => setEnv(env.filter((_, i) => i !== idx));

    const addVol = () => setVolumes([...volumes, { host: "", container: "" }]);
    const updateVol = (idx: number, field: keyof VolConfig, val: string) => {
        const next = [...volumes];
        next[idx][field] = val;
        setVolumes(next);
    }
    const removeVol = (idx: number) => setVolumes(volumes.filter((_, i) => i !== idx));

    return (
        <Modal
            open={true}
            onOpenChange={(open) => !open && onClose()}
            title={imageName ? `Create Container from ${imageName}` : "Create New Container"}
            maxWidth="800px"
        >
            <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
                {/* Image Selection (if not provided) */}
                {!imageName && (
                    <section className="mb-6">
                        <Heading level={3} weight="semibold" color="primary" className="mb-3 flex items-center gap-2">
                            <Package size={16} /> Image
                        </Heading>
                        <Input
                            label="Image Reference"
                            placeholder="e.g., redis:latest"
                            value={customImage}
                            onChange={e => setCustomImage(e.target.value)}
                        />
                    </section>
                )}

                {/* General */}
                <section className="mb-6">
                    <Heading level={3} weight="semibold" color="primary" className="mb-3 flex items-center gap-2">
                        <Shield size={16} /> General
                    </Heading>
                    <div className="mb-4 pl-1">
                        <Switch
                            label="Run immediately after creation"
                            description="Adds the -d flag to the run command"
                            checked={runImmediately}
                            onCheckedChange={setRunImmediately}
                        />
                    </div>

                    <Input
                        label="Command Override (Optional)"
                        icon={Terminal}
                        placeholder="e.g., tail -f /dev/null"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        containerClassName="mb-4"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="CPU Cores"
                            icon={Cpu}
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="e.g., 2"
                            value={cpus || ""}
                            onChange={e => setCpus(parseFloat(e.target.value) || undefined)}
                        />
                        <Input
                            label="Memory Limit (MB)"
                            icon={Memory}
                            type="number"
                            min="4"
                            placeholder="e.g., 512"
                            value={memoryMB || ""}
                            onChange={e => setMemoryMB(parseInt(e.target.value) || undefined)}
                        />
                        <div>
                            <BaseSelect
                                label="Network"
                                value={network}
                                onChange={setNetwork}
                                options={[
                                    { label: "(Default)", value: "" },
                                    ...networks.map(n => ({ label: n.id, value: n.id }))
                                ]}
                                placeholder="Select Network"
                            />
                        </div>
                    </div>
                </section>

                {/* Ports */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <Heading level={3} weight="semibold" color="primary" className="flex items-center gap-2">
                            <Globe size={16} /> Port Forwards (-p)
                        </Heading>
                        <Button variant="secondary" size="sm" onClick={addPort} icon={Plus}>
                            Add Port
                        </Button>
                    </div>
                    {ports.map((port, idx) => (
                        <div key={idx} className="flex gap-2 items-end mb-3">
                            <Input
                                placeholder="Host Port"
                                value={port.host}
                                onChange={e => updatePort(idx, "host", e.target.value)}
                            />
                            <Text color="secondary" className="pb-3 text-slate-400">:</Text>
                            <Input
                                placeholder="Container"
                                value={port.container}
                                onChange={e => updatePort(idx, "container", e.target.value)}
                            />
                            <IconButton variant="danger" size="md" icon={Trash2} onClick={() => removePort(idx)} title="Remove Port" className="mb-1" />
                        </div>
                    ))}
                    {ports.length === 0 && (
                        <Text variant="small" color="secondary" className="italic pl-1">No ports configured.</Text>
                    )}
                </section>

                {/* Env Vars */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <Heading level={3} weight="semibold" color="primary" className="flex items-center gap-2">
                            <Terminal size={16} /> Environment Variables (-e)
                        </Heading>
                        <Button variant="secondary" size="sm" onClick={addEnv} icon={Plus}>
                            Add Env
                        </Button>
                    </div>
                    {env.map((e, idx) => (
                        <div key={idx} className="flex gap-2 items-end mb-3">
                            <Input
                                placeholder="KEY"
                                value={e.key}
                                onChange={ev => updateEnv(idx, "key", ev.target.value)}
                            />
                            <Text color="secondary" className="pb-3 text-slate-400">=</Text>
                            <Input
                                placeholder="Value"
                                value={e.value}
                                onChange={ev => updateEnv(idx, "value", ev.target.value)}
                            />
                            <IconButton variant="danger" size="md" icon={Trash2} onClick={() => removeEnv(idx)} title="Remove Env" className="mb-1" />
                        </div>
                    ))}
                    {env.length === 0 && (
                        <Text variant="small" color="secondary" className="italic pl-1">No env variables configured.</Text>
                    )}
                </section>

                {/* Volumes */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <Heading level={3} weight="semibold" color="primary" className="flex items-center gap-2">
                            <HardDrive size={16} /> Bind Mounts (-v)
                        </Heading>
                        <Button variant="secondary" size="sm" onClick={addVol} icon={Plus}>
                            Add Mount
                        </Button>
                    </div>
                    {volumes.map((vol, idx) => (
                        <div key={idx} className="flex gap-2 items-end mb-3">
                            <Input
                                placeholder="Host Path (/Users/)"
                                value={vol.host}
                                onChange={e => updateVol(idx, "host", e.target.value)}
                            />
                            <Text color="secondary" className="pb-3 text-slate-400">:</Text>
                            <Input
                                placeholder="Container Path (/app)"
                                value={vol.container}
                                onChange={e => updateVol(idx, "container", e.target.value)}
                            />
                            <IconButton variant="danger" size="md" icon={Trash2} onClick={() => removeVol(idx)} title="Remove Vol" className="mb-1" />
                        </div>
                    ))}
                    {volumes.length === 0 && (
                        <Text variant="small" color="secondary" className="italic pl-1">No bind mounts configured.</Text>
                    )}
                </section>
            </div>

            <div style={{ marginTop: "16px" }}>
                <div className="command-preview mb-4" style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Text variant="xs" color="secondary" uppercase tracking="widest" className="mb-1">Command Preview</Text>
                    <code style={{ fontSize: "12px", color: "var(--accent-primary)", wordBreak: "break-all", fontFamily: "monospace" }}>{currentCommand}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <Button variant="secondary" onClick={onClose} disabled={isCreating}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        loading={isCreating}
                    >
                        {runImmediately ? "Run Container" : "Create Container"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
