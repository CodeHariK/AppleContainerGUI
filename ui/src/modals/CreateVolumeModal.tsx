import { Button, IconButton } from "../components/Button";
import { useState } from "react";
import { X, HardDrive } from "lucide-react";
import { Input } from "../components/Input";
import { Dialog } from "@base-ui/react/dialog";
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
        <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Popup className="dialog-popup" style={{ maxWidth: "500px", width: "100%" }}>
                    <div className="flex-between mb-4">
                        <Dialog.Title className="text-slate-900 dark:text-white font-medium text-xl">Create New Volume</Dialog.Title>
                        <IconButton
                            icon={X}
                            onClick={onClose}
                            disabled={isCreating}
                            title="Close"
                        />
                    </div>

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
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
