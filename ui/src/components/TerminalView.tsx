import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
    data: string;
    height?: string;
}

export default function TerminalView({ data, height = "200px" }: TerminalViewProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            theme: {
                background: "transparent",
                foreground: "var(--text-primary)",
                cursor: "transparent",
            },
            fontSize: 12,
            fontFamily: '"Fira Code", monospace',
            scrollback: 1000,
            convertEol: true,
            disableStdin: true,
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        return () => {
            term.dispose();
        };
    }, []);

    useEffect(() => {
        if (xtermRef.current) {
            xtermRef.current.clear();
            xtermRef.current.write(data);
        }
    }, [data]);

    return (
        <div
            ref={terminalRef}
            className="terminal-container"
            style={{
                height,
                width: "100%",
                overflow: "hidden"
            }}
        />
    );
}
