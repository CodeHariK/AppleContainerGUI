import { useEffect, useState, useRef } from "react";
import { runBrowseContainer, stopContainer, waitContainerRunning } from "../lib/container";
import { Modal } from "./Modal";
import { Body, H4, Small } from "../components/Typography";
import { Box, ExternalLink, XCircle, Loader2 } from "lucide-react";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";

interface Props {
    volumeName: string;
    onClose: () => void;
}

export function BrowseVolumeModal({ volumeName, onClose }: Props) {
    const [containerId, setContainerId] = useState<string | null>(null);
    const [isLaunching, setIsLaunching] = useState(true);
    const [isWaitingReady, setIsWaitingReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const shouldCleanup = useRef(true);

    useEffect(() => {
        let mounted = true;
        let launchedId: string | null = null;

        async function launch() {
            try {
                setIsLaunching(true);
                const name = await runBrowseContainer(volumeName);
                if (!mounted) {
                    stopContainer(name).catch(console.error);
                    return;
                }

                setContainerId(name);
                launchedId = name;
                setIsLaunching(false);
                setIsWaitingReady(true);

                // Now wait for it to be actually running
                // This handles the user's feedback about kernel init taking time
                await waitContainerRunning(name);

                if (mounted) {
                    setIsWaitingReady(false);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || "Failed to launch browse container");
                    setIsLaunching(false);
                    setIsWaitingReady(false);
                }
            }
        }

        launch();

        return () => {
            mounted = false;
            if (shouldCleanup.current && launchedId) {
                stopContainer(launchedId).catch(console.error);
            }
        };
    }, [volumeName]);

    const handleNavigate = () => {
        if (containerId) {
            shouldCleanup.current = false;
            navigate(`/container/${containerId}`);
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            open={true}
            onOpenChange={(open) => !open && handleCancel()}
            title="Browse Volume"
            maxWidth="450px"
        >
            <div className="flex flex-col items-center text-center p-2">
                {isLaunching ? (
                    <div className="py-8 space-y-4">
                        <Loader2 className="size-12 text-primary animate-spin mx-auto" />
                        <Body color="secondary">Launching helper container...</Body>
                    </div>
                ) : isWaitingReady ? (
                    <div className="py-8 space-y-4">
                        <Loader2 className="size-12 text-amber-500 animate-spin mx-auto" />
                        <Body color="secondary">Container started, initializing kernel...</Body>
                        <Small color="secondary" className="block mt-2">Identifier: {containerId}</Small>
                    </div>
                ) : error ? (
                    <div className="py-6 space-y-4">
                        <XCircle size={48} className="text-red-500 mx-auto" />
                        <H4 className="text-red-500 font-bold">Launch Failed</H4>
                        <Body color="secondary" className="max-h-[100px] overflow-y-auto px-4">{error}</Body>
                        <Button variant="secondary" onClick={handleCancel} fullWidth>Close</Button>
                    </div>
                ) : (
                    <div className="py-4 space-y-6 w-full">
                        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                            <Box size={32} className="text-primary" />
                        </div>

                        <div className="space-y-2">
                            <H4 weight="bold">Helper container ready!</H4>
                            <Body color="secondary">
                                An Alpine container has been started with <strong>{volumeName}</strong> mounted at <code>/mnt</code>.
                            </Body>
                        </div>

                        <div className="bg-slate-50 dark:bg-black/20 border border-surface-border rounded-xl p-4 text-left space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Container ID/Name:</span>
                                <span className="font-mono text-primary">{containerId}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Mount Path:</span>
                                <span className="text-slate-400 font-mono">/mnt</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="primary"
                                onClick={handleNavigate}
                                fullWidth
                                icon={ExternalLink}
                                size="lg"
                            >
                                Inspect Container
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleCancel}
                                fullWidth
                            >
                                Discard & Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
