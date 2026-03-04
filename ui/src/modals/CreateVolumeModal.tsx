import { Button } from "../components/Button";
import { useState } from "react";
import { HardDrive } from "lucide-react";
import { Input } from "../components/Input";
import { Modal } from "./Modal";
import "../Dashboard.css";

interface Props {
    onClose: () => void;
    onCreate: (name: string) => void;
    isCreating: boolean;
}

export default function CreateVolumeModal({ onClose, onCreate, isCreating }: Props) {
    const [name, setName] = useState("");

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim());
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
                <Button variant="secondary" onClick={onClose} disabled={isCreating}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleCreate}
                    loading={isCreating}
                >
                    Create Volume
                </Button>
            </div>
        </Modal>
    );
}
