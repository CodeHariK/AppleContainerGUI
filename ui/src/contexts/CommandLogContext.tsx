import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { CommandLog } from "../lib/container";
import { getActionLogs, clearActionLogs as apiClearActionLogs } from "../lib/container";

interface CommandLogContextType {
    logs: CommandLog[];
    clearLogs: () => Promise<void>;
    refreshLogs: () => Promise<void>;
}

const CommandLogContext = createContext<CommandLogContextType | undefined>(undefined);

export function CommandLogProvider({ children }: { children: ReactNode }) {
    const [logs, setLogs] = useState<CommandLog[]>([]);

    const refreshLogs = useCallback(async () => {
        try {
            const logList = await getActionLogs();
            setLogs(logList);
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        }
    }, []);

    const clearLogs = useCallback(async () => {
        try {
            await apiClearActionLogs();
            setLogs([]);
        } catch (e) {
            console.error("Failed to clear logs:", e);
        }
    }, []);

    useEffect(() => {
        refreshLogs();

        const eventSource = new EventSource("/api/logs/stream");

        eventSource.onmessage = (event) => {
            try {
                const logEntry: CommandLog = JSON.parse(event.data);

                setLogs(prev => {
                    const existingIndex = prev.findIndex(l => l.exeId === logEntry.exeId);

                    if (existingIndex !== -1) {
                        const newLogs = [...prev];
                        const existing = newLogs[existingIndex];

                        if (logEntry.isPartial) {
                            newLogs[existingIndex] = {
                                ...existing,
                                output: (existing.output || "") + logEntry.output
                            };
                        } else {
                            // Final status - update the whole entry
                            newLogs[existingIndex] = {
                                ...logEntry,
                                // If the final message is just a status string, keep previous output if it had any
                                // but for our CLI commands, we usually want the final status to be visible
                                output: existing.output + "\n" + logEntry.output
                            };
                        }
                        return newLogs;
                    }

                    return [logEntry, ...prev.slice(0, 99)];
                });

                if (!logEntry.isPartial) {
                    // Notify other components that logs or system state might have changed
                    window.dispatchEvent(new CustomEvent('cider:refresh'));
                }
            } catch (e) {
                console.error("Failed to parse SSE message", e);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [refreshLogs]);

    return (
        <CommandLogContext.Provider value={{ logs, clearLogs, refreshLogs }}>
            {children}
        </CommandLogContext.Provider>
    );
}

export function useCommandLog() {
    const context = useContext(CommandLogContext);
    if (context === undefined) {
        throw new Error("useCommandLog must be used within a CommandLogProvider");
    }
    return context;
}
