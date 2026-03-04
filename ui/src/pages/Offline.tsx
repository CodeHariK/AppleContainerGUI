import { Card } from "../components/Card";
import { CloudOff } from "lucide-react";

export default function Offline() {
    return (
        <Card className="text-center p-12">
            <CloudOff size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-slate-900 dark:text-white font-medium">The container daemon is offline.</p>
            <p className="text-text-secondary mt-1">Start the system to manage containers.</p>
        </Card>
    );
}