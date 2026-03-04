import { HardDrive } from "lucide-react";
import { Modal } from "./Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

interface SaveImageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageToSave: { repository: string; path: string } | null;
    setImageToSave: (val: { repository: string; path: string } | null) => void;
    onSave: (repository: string, path: string) => Promise<void>;
    isSaving: boolean;
}

export default function SaveImageModal({
    open,
    onOpenChange,
    imageToSave,
    setImageToSave,
    onSave,
    isSaving
}: SaveImageModalProps) {
    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Save Image to Tarball"
        >
            <div className="flex flex-col gap-4">
                <Input
                    label="Destination Path"
                    icon={HardDrive}
                    placeholder="/tmp/myapp.tar"
                    value={imageToSave?.path || ""}
                    onChange={(e) => setImageToSave(imageToSave ? { ...imageToSave, path: e.target.value } : null)}
                />
                <div className="flex gap-3 mt-2">
                    <Button variant="secondary" fullWidth onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        fullWidth
                        loading={isSaving}
                        onClick={async () => {
                            if (imageToSave) {
                                await onSave(imageToSave.repository, imageToSave.path);
                                onOpenChange(false);
                            }
                        }}
                    >
                        Save Image
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
