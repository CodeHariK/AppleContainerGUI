import { Button } from "../components/Button";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Input } from "../components/Input";
import { Switch } from "../components/Switch";
import { Modal } from "./Modal";
import "../Dashboard.css";
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
        <Modal
            open={true}
            onOpenChange={(open) => !open && onClose()}
            title="Edit Property"
        >
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 leading-relaxed">
                {property.Description}
            </div>

            <div className="mb-8">
                <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                    {property.ID} <span className="text-text-secondary-light dark:text-text-secondary-dark font-normal">({property.Type})</span>
                </label>

                {property.Type === "Bool" ? (
                    <Switch
                        checked={value === "true"}
                        onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
                        disabled={isSaving}
                        label={value === "true" ? "Enabled (true)" : "Disabled (false)"}
                    />
                ) : (
                    <Input
                        label={property.ID}
                        icon={RotateCcw}
                        placeholder={`Enter ${property.Type.toLowerCase()} value`}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        disabled={isSaving}
                        autoFocus
                        className="font-mono text-sm"
                    />
                )}
            </div>

            <div className="flex-right pb-2" style={{ gap: "12px", display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={isSaving}
                    icon={Save}
                >
                    Save Changes
                </Button>
            </div>
        </Modal>
    );
}
