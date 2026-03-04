import { Button } from "../components/Button";
import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Input } from "../components/Input";
import { Switch } from "../components/Switch";
import { Modal } from "./Modal";
import { Text, Label } from "../components/Typography";
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
            <Text color="secondary" className="mb-6 leading-relaxed">
                {property.Description}
            </Text>

            <div className="mb-8">
                <Label variant="body" weight="semibold" className="block mb-2">
                    {property.ID} <Text variant="small" color="secondary" weight="normal">({property.Type})</Text>
                </Label>

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
