import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button, IconButton } from "../components/Button";
import { Body, Caption } from "../components/Typography";

interface DnsSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetName: string;
    type?: "project" | "container";
}

export default function DnsSetupModal({
    open,
    onOpenChange,
    targetName,
    type = "project"
}: DnsSetupModalProps) {
    const [copied, setCopied] = useState(false);

    // For projects (compose), it's usually `projectName`
    // For containers, it's the specific container name
    const command = `sudo container system dns create ${targetName}`;
    const domain = type === "project" ? `*.${targetName}.local` : `${targetName}.local`;

    const handleCopy = () => {
        if (!targetName) return;
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal open={open} onOpenChange={onOpenChange} title="Local DNS Configuration">
            <div className="flex flex-col gap-5 p-1">
                <Body color="secondary" className="leading-relaxed">
                    To enable direct service access via <b className="text-[var(--text-primary)]">{domain}</b>, run the following command in your terminal:
                </Body>

                <div className="bg-black p-4 rounded-xl font-mono text-sm border border-[var(--border-color)] flex items-center justify-between group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent pointer-events-none"></div>
                    <code className="text-[var(--accent-primary)] relative z-10">{command}</code>
                    <IconButton
                        icon={copied ? Check : Copy}
                        variant="glass"
                        size="sm"
                        className="relative z-10"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    />
                </div>

                <div className="bg-[var(--glass-bg)] border border-[var(--border-color)] rounded-lg p-4">
                    <Caption color="secondary" className="flex items-center gap-2 mb-2">
                        <span className="size-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                        How it works
                    </Caption>
                    <Caption color="secondary" className="leading-relaxed text-xs">
                        This command creates a local DNS mapping on your host machine. Once configured, you can use the domain name above to connect directly to your services without complex port mapping.
                    </Caption>
                </div>

                <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onOpenChange(false)}
                >
                    Close
                </Button>
            </div>
        </Modal>
    );
}
