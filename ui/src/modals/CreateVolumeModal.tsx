import { Button } from "../components/Button";
import { useState } from "react";
import { HardDrive } from "lucide-react";
import { Input } from "../components/Input";
import { Modal } from "./Modal";
import "../Dashboard.css";

interface Props {
    onClose: () => void;
    onCreated: (name: string) => void;
    isLoading: boolean;
}

export function CreateVolumeModal({ onClose, onCreated, isLoading }: Props) {
    const [name, setName] = useState("");

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreated(name.trim());
    };

    return (
        <Modal
            open={true}
            onOpenChange={(open) => !open && onClose()}
            title="Create New Volume"
        >
            <div className="mb-6">
                <Input
                    label="Volume Name (Optional)"
                    icon={HardDrive}
                    placeholder="e.g., redis-data"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    autoFocus
                />
            </div>

            <div className="flex-right pb-2" style={{ gap: "12px", display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleCreate}
                    loading={isLoading}
                >
                    Create Volume
                </Button>
            </div>
        </Modal>
    );
}
