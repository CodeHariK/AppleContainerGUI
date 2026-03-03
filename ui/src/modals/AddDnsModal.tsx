import { Button, IconButton } from "../components/Button";
import { useState } from "react";
import { X, Globe } from "lucide-react";
import { Input } from "../components/Input";
import "../Dashboard.css";
import { createDnsDomain } from "../lib/container";
import { Dialog } from "@base-ui/react/dialog";

interface Props {
    onClose: () => void;
    onAdded: () => void;
}

export function AddDnsModal({ onClose, onAdded }: Props) {
    const [domain, setDomain] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleAdd = async () => {
        if (!domain.trim()) return;
        setIsCreating(true);
        try {
            await createDnsDomain(domain.trim());
            onAdded();
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
                        <Dialog.Title className="text-slate-900 dark:text-white font-medium text-xl">Add DNS Entry</Dialog.Title>
                        <IconButton
                            icon={X}
                            onClick={onClose}
                            disabled={isCreating}
                            title="Close"
                        />
                    </div>

                    <div className="mb-6">
                        <Input
                            label="Domain Name"
                            icon={Globe}
                            placeholder="e.g., mysite.local"
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            disabled={isCreating}
                            autoFocus
                        />
                    </div>

                    <div className="flex-right pb-2" style={{ gap: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <Button variant="secondary" onClick={onClose} disabled={isCreating}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleAdd}
                            loading={isCreating}
                            icon={Globe}
                        >
                            Add Entry
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
