import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Switch } from "@base-ui/react/switch";
import { X, RefreshCw } from "lucide-react";
import { setSystemProperty } from "../lib/container";
import type { SystemProperty } from "../lib/container";

interface Props {
    property: SystemProperty;
    onClose: () => void;
    onSaved: () => void;
}

export function EditPropertyModal({ property, onClose, onSaved }: Props) {
    const [value, setValue] = useState(property.Value);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setSystemProperty(property.ID, value);
            onSaved();
        } catch (e: any) {
            alert(e.message || "Failed to save property");
            setIsSaving(false);
        }
    };

    return (
        <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
                <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl p-6 z-50 animate-slide-up outline-none">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark m-0">
                            Edit System Property
                        </Dialog.Title>
                        <Dialog.Close disabled={isSaving} className="p-1 rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <X size={20} />
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 leading-relaxed">
                        {property.Description}
                    </Dialog.Description>

                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                            {property.ID} <span className="text-text-secondary-light dark:text-text-secondary-dark font-normal">({property.Type})</span>
                        </label>

                        {property.Type === "Bool" ? (
                            <label className="flex items-center gap-3 p-4 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                <Switch.Root
                                    checked={value === "true"}
                                    onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
                                    disabled={isSaving}
                                    className="relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark data-[checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Switch.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 data-[checked]:translate-x-5 data-[unchecked]:translate-x-0.5" />
                                </Switch.Root>
                                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark select-none">
                                    {value === "true" ? "Enabled (true)" : "Disabled (false)"}
                                </span>
                            </label>
                        ) : (
                            <input
                                type="text"
                                placeholder={`Enter ${property.Type.toLowerCase()} value`}
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                disabled={isSaving}
                                autoFocus
                                className="w-full text-base px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono transition-all disabled:opacity-50"
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Dialog.Close
                            disabled={isSaving}
                            className="px-4 py-2 font-semibold text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </Dialog.Close>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
                        </button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
