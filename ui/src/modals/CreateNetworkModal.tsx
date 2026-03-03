import { Button, IconButton } from "../components/Button";
import { useState } from "react";
import { X, Globe } from "lucide-react";
import { Input } from "../components/Input";
import BaseSelect from "../components/BaseSelect";
import "../Dashboard.css";
import { createNetwork } from "../lib/container";
import { Dialog } from "@base-ui/react/dialog";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export function CreateNetworkModal({ onClose, onCreated }: Props) {
    const [name, setName] = useState("");
    const [driver, setDriver] = useState("bridge");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        try {
            await createNetwork(name.trim(), driver);
            onCreated();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Popup className="dialog-popup" style={{ maxWidth: "500px", width: "100%" }}>
                    <div className="flex-between mb-4">
                        <Dialog.Title className="text-slate-900 dark:text-white font-medium text-xl">Create New Network</Dialog.Title>
                        <IconButton
                            icon={X}
                            onClick={onClose}
                            disabled={isCreating}
                            title="Close"
                        />
                    </div>

                    <div className="mb-6">
                        <div className="flex flex-col gap-6">
                            <Input
                                label="Network Name"
                                icon={Globe}
                                placeholder="e.g., app-network"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                disabled={isCreating}
                                autoFocus
                            />

                            <BaseSelect
                                label="Driver"
                                value={driver}
                                onChange={setDriver}
                                options={[
                                    { label: "Bridge (Default)", value: "bridge" },
                                    { label: "Host", value: "host" },
                                    { label: "None", value: "none" }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex-right pb-2" style={{ gap: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <Button variant="secondary" onClick={onClose} disabled={isCreating}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            loading={isCreating}
                        >
                            Create Network
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
