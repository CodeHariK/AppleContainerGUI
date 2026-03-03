import { Link, useLocation } from "react-router-dom";
import { startSystem, stopSystem } from "../lib/container";
import { IconButton } from "./Button";
import { Play, StopCircle, Settings } from "lucide-react";

interface NavBarProps {
    systemRunning: boolean;
    onSystemStart?: () => void;
    onSystemStop?: () => void;
}

export function NavBar({ systemRunning, onSystemStart, onSystemStop }: NavBarProps) {
    const location = useLocation();

    const handleStart = async () => {
        try {
            await startSystem();
            if (onSystemStart) onSystemStart();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStop = async () => {
        try {
            await stopSystem();
            if (onSystemStop) onSystemStop();
        } catch (e) {
            console.error(e);
        }
    };

    const navLinks = [
        { path: '/', label: 'Containers', matchPaths: ['/', '/container/'] },
        { path: '/images', label: 'Images' },
        { path: '/volumes', label: 'Volumes' },
        { path: '/networks', label: 'Networks' },
        { path: '/registries', label: 'Registry' },
    ];

    const isPathActive = (path: string, matchPaths?: string[]) => {
        if (matchPaths) {
            return matchPaths.some(p => location.pathname === p || location.pathname.startsWith(p) && p !== '/');
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-surface-border px-6 md:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50 transition-colors">
            <div className="flex items-center gap-4 dark:text-white text-slate-900">
                <div className="size-8 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">deployed_code</span>
                </div>

                <h2 className="text-lg font-semibold leading-tight tracking-[-0.015em] hidden sm:block">Apple Cider</h2>

                {systemRunning ? (
                    <IconButton
                        icon={StopCircle}
                        onClick={handleStop}
                        variant="danger"
                        size="md"
                        title="Stop System"
                        className="text-red-500"
                    />
                ) : (
                    <IconButton
                        icon={Play}
                        onClick={handleStart}
                        variant="primary"
                        size="md"
                        title="Start System"
                        className="text-green-500"
                    />
                )}
            </div>

            {systemRunning && (
                <div className="flex flex-1 justify-end gap-6 md:gap-8">
                    <nav className="flex items-center gap-6">
                        {navLinks.map((link) => {
                            const active = isPathActive(link.path, link.matchPaths);
                            return (
                                <Link
                                    key={link.path}
                                    className={`text-sm leading-normal transition-colors ${active ? 'font-bold text-primary' : 'hover:text-primary text-slate-500'}`}
                                    to={link.path}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        <Link
                            to="/settings"
                            className={`transition-colors hover:text-primary ${location.pathname === '/settings' ? 'text-primary' : 'text-slate-500'}`}
                            title="Settings"
                        >
                            <Settings size={20} />
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
