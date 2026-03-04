import { Rocket, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Text } from "../components/Typography";

interface BuildImageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dockerfileToBuild: { path: string; tag: string } | null;
    setDockerfileToBuild: (val: { path: string; tag: string } | null) => void;
    onBuild: (path: string, tag: string) => Promise<void>;
    isBuilding: boolean;
}

export default function BuildImageModal({
    open,
    onOpenChange,
    dockerfileToBuild,
    setDockerfileToBuild,
    onBuild,
    isBuilding
}: BuildImageModalProps) {
    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Build New Image"
        >
            <div className="flex flex-col gap-6">
                <Input
                    label="Target Tag"
                    icon={Rocket}
                    placeholder="e.g. my-app:v1.0"
                    value={dockerfileToBuild?.tag || ""}
                    onChange={(e) => setDockerfileToBuild(dockerfileToBuild ? { ...dockerfileToBuild, tag: e.target.value } : null)}
                    className="font-mono text-sm"
                />
                <Text variant="xs" color="secondary" className="px-1 mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} /> The tag must be lowercase and follow docker naming conventions.
                </Text>
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => onOpenChange(false)} disabled={isBuilding}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        fullWidth
                        icon={Rocket}
                        loading={isBuilding}
                        onClick={async () => {
                            if (dockerfileToBuild) {
                                await onBuild(dockerfileToBuild.path, dockerfileToBuild.tag);
                                onOpenChange(false);
                            }
                        }}
                    >
                        Start Build
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
