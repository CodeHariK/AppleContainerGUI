import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import "../Dashboard.css";
import { createDnsDomain } from "../lib/container";

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
        <div className="modal-backdrop flex-center animate-fade-in">
            <div className="modal-content premium-card" style={{ maxWidth: "500px", width: "100%" }}>
                <div className="modal-header flex-between mb-4">
                    <h2 style={{ fontSize: "20px" }} className="text-slate-900 dark:text-white font-medium">Add Local DNS</h2>
                    <button className="btn-icon" onClick={onClose} disabled={isCreating}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body mb-6">
                    <div className="input-group">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Domain Name</label>
                        <input
                            placeholder="e.g., mysite.local"
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            disabled={isCreating}
                            autoFocus
                            className="w-full text-base px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-surface-dark border-slate-300 dark:border-surface-border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="modal-footer flex-right" style={{ gap: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary px-4 py-2 rounded-lg" onClick={onClose} disabled={isCreating}>Cancel</button>
                    <button className="btn btn-primary flex-center px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={handleAdd} disabled={isCreating} style={{ gap: "8px", display: "flex", alignItems: "center" }}>
                        {isCreating ? <><RefreshCw size={16} className="spin" /> Adding...</> : "Add Domain"}
                    </button>
                </div>
            </div>
        </div>
    );
}
