import { RefreshCw } from "lucide-react";
import { Modal } from "./Modal";
import { Button, IconButton } from "../components/Button";
import { Text } from "../components/Typography";

interface DnsSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName: string;
}

export default function DnsSetupModal({
    open,
    onOpenChange,
    projectName
}: DnsSetupModalProps) {
    return (
        <Modal open={open} onOpenChange={onOpenChange} title="Local DNS Configuration">
            <div className="flex flex-col gap-4">
                <Text variant="small" color="secondary" className="leading-relaxed">
                    To enable direct service access via <b>*.{projectName}.local</b>, run the following command in your terminal:
                </Text>
                <div className="bg-black/90 p-4 rounded-xl font-mono text-sm text-primary border border-primary/20 flex items-center justify-between group">
                    <code>sudo container system dns create {projectName}</code>
                    <IconButton
                        icon={RefreshCw}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => {
                            navigator.clipboard.writeText(`sudo container system dns create ${projectName}`);
                        }}
                        title="Copy to clipboard"
                    />
                </div>
                <Button
                    variant="primary"
                    fullWidth
                    className="mt-2"
                    onClick={() => onOpenChange(false)}
                >
                    I've configured it
                </Button>
            </div>
        </Modal>
    );
}
