import { Button } from "../components/Button";
import { useState } from "react";
import { Globe } from "lucide-react";
import { Input } from "../components/Input";
import BaseSelect from "../components/BaseSelect";
import { Modal } from "./Modal";
import "../Dashboard.css";
import { createNetwork } from "../lib/container";

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
        <Modal
            open={true}
            onOpenChange={(open) => !open && onClose()}
            title="Create New Network"
        >
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
        </Modal>
    );
}
