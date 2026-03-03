import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
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
        <div className="modal-backdrop flex-center animate-fade-in">
            <div className="modal-content premium-card" style={{ maxWidth: "500px" }}>
                <div className="modal-header flex-between mb-4">
                    <h2 style={{ fontSize: "20px" }}>Create New Volume</h2>
                    <button className="btn-icon" onClick={onClose} disabled={isCreating}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body mb-6">
                    <div className="input-group">
                        <label>Volume Name (Optional)</label>
                        <input
                            placeholder="e.g., redis-data"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="modal-footer flex-right" style={{ gap: "12px" }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={isCreating}>Cancel</button>
                    <button className="btn btn-primary flex-center" onClick={handleCreate} disabled={isCreating} style={{ gap: "8px" }}>
                        {isCreating ? <><RefreshCw size={16} className="spin" /> Creating...</> : "Create Volume"}
                    </button>
                </div>
            </div>
        </div>
    );
}
