import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useCommandLog } from "../contexts/CommandLogContext";
import { Trash2, Terminal, ChevronRight } from "lucide-react";
import TerminalView from "../components/TerminalView";
import { IconButton } from "../components/Button";
import { Text } from "../components/Typography";

export default function CommandLogOverlay() {
    const { logs, clearLogs } = useCommandLog();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "`") {
                e.preventDefault();
                setOpen((prev: boolean) => !prev);
            }
            if (e.key === "Escape" && open) {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <Modal
            open={open}
            onOpenChange={setOpen}
            title="Command Console"
            maxWidth="600px"
        >
            <div className="flex flex-col h-[400px]">
                <div
                    className="custom-scrollbar bg-background-light/50 dark:bg-background-dark/50 flex-1 overflow-y-auto p-5"
                >
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-70">
                            <Terminal size={48} className="mb-4" />
                            <Text color="secondary">No commands executed yet.</Text>
                        </div>
                    ) : (
                        <div className="flex flex-col-reverse gap-2">
                            {logs.map((log) => (
                                <div key={log.id} className={`p-3 rounded-lg border-l-4 ${log.isError ? 'bg-red-500/10 border-red-500' : log.isPartial ? 'bg-yellow-500/10 border-yellow-500' : 'bg-green-500/10 border-green-500'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2 font-medium" style={{ color: log.isError ? '#ef4444' : 'var(--accent-primary)' }}>
                                            <ChevronRight size={14} />
                                            <Text variant="xs" weight="medium" style={{ color: 'inherit' }}>{log.command}</Text>
                                        </div>
                                        <Text variant="xs" color="secondary" className="text-[10px]">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </div>
                                    <div className="text-text-primary opacity-90 text-xs leading-relaxed">
                                        <TerminalView
                                            data={log.output || (log.isPartial ? "Running..." : "No output")}
                                            height={log.isPartial ? "auto" : "max-content"}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-light dark:border-border-dark text-[10px] text-text-secondary">
                    <Text variant="xs" color="secondary">Press ` to toggle</Text>
                    <IconButton
                        variant="ghost"
                        onClick={clearLogs}
                        title="Clear Logs"
                        icon={Trash2}
                        size="sm"
                    />
                </div>
            </div>
        </Modal>
    );
}
