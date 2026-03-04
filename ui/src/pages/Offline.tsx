import { Power } from "lucide-react";
import { Body } from "../components/Typography";

export default function Offline() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-surface-border flex items-center justify-center text-slate-400 mb-6">
                <Power size={32} />
            </div>
            <Body weight="medium">The container daemon is offline.</Body>
            <Body color="secondary" className="mt-1">Start the system to manage containers.</Body>
        </div>
    );
}