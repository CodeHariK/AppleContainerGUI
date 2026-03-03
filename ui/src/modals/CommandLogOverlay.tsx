import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useCommandLog } from "../contexts/CommandLogContext";
import { X, Trash2, Terminal, ChevronRight } from "lucide-react";
import TerminalView from "../components/TerminalView";
import { IconButton } from "../components/Button";

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
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Backdrop className="dialog-backdrop" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'var(--text-primary)', opacity: 0.1 }} />
                <Dialog.Popup className="premium-card animate-slide-up bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark" style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '600px',
                    height: '500px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: 0,
                    zIndex: 1000,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div className="flex-between border-b border-border-light dark:border-border-dark" style={{ padding: '16px 20px' }}>
                        <div className="flex-center" style={{ gap: '10px' }}>
                            <Terminal size={18} className="text-secondary" />
                            <h2 className="text-text-primary-light dark:text-text-primary-dark" style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Command Console</h2>
                            <span className="badge bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark" style={{ fontSize: '10px', padding: '2px 8px' }}>Press ` to toggle</span>
                        </div>
                        <div className="flex-center" style={{ gap: '12px' }}>
                            <IconButton
                                variant="ghost"
                                onClick={clearLogs}
                                title="Clear Logs"
                                icon={Trash2}
                                size="sm"
                            />
                            <IconButton
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                icon={X}
                                size="sm"
                            />
                        </div>
                    </div>

                    <div
                        className="custom-scrollbar bg-background-light/50 dark:bg-background-dark/50"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                        }}
                    >
                        {logs.length === 0 ? (
                            <div className="flex-center text-text-secondary-light dark:text-text-secondary-dark" style={{ height: '100%', flexDirection: 'column', opacity: 0.7 }}>
                                <Terminal size={48} style={{ marginBottom: '16px' }} />
                                <p>No commands executed yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
                                {logs.map((log) => (
                                    <div key={log.id} className={`p-3 rounded-lg border-l-4 ${log.isError ? 'bg-red-500/10 border-red-500' : log.isPartial ? 'bg-yellow-500/10 border-yellow-500' : 'bg-green-500/10 border-green-500'}`}>
                                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                                            <div className="flex-center gap-2 font-medium" style={{ color: log.isError ? '#ef4444' : 'var(--accent-primary)' }}>
                                                <ChevronRight size={14} />
                                                <span style={{ fontSize: '12px' }}>{log.command}</span>
                                            </div>
                                            <span className="text-text-secondary-light dark:text-text-secondary-dark" style={{ fontSize: '10px' }}>
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-text-primary-light dark:text-text-primary-dark opacity-90" style={{
                                            fontSize: '12px',
                                            lineHeight: '1.5'
                                        }}>
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
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
