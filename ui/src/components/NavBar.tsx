import { Link, useLocation } from "react-router-dom";
import { IconButton } from "./Button";
import { Play, StopCircle, Settings } from "lucide-react";
import { useSystem } from "../contexts/SystemContext";
import { H2, Small } from "./Typography";

export function NavBar() {
    const { systemRunning, start, stop } = useSystem();
    const location = useLocation();

    const handleStart = async () => {
        try {
            await start();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStop = async () => {
        try {
            await stop();
        } catch (e) {
            console.error(e);
        }
    };

    interface NavLink {
        path: string;
        label: string;
        matchPaths?: string[];
    }

    const navLinks: NavLink[] = [
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
                <Link to="/" className="flex items-center gap-4 hover:text-primary transition-colors group">
                    <div className="size-8 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl transition-transform group-hover:scale-110">deployed_code</span>
                    </div>

                    <H2 weight="semibold" className="text-lg leading-tight tracking-[-0.015em] hidden sm:block">Apple Cider</H2>
                </Link>

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
                                    to={link.path}
                                >
                                    <Small weight={active ? 'bold' : 'normal'} color={active ? 'primary' : 'secondary'} className="leading-normal">
                                        {link.label}
                                    </Small>
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
