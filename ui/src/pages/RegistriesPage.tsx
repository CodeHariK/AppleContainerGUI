import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Server,
    Key,
    RefreshCw
} from "lucide-react";
import {
    listRegistries,
    registryLogin,
    registryLogout,
    checkSystemStatus
} from "../lib/container";
import { NavBar } from "../components/NavBar";
import "../Dashboard.css";

export default function RegistriesPage() {
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);

    // Form states
    const [server, setServer] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            if (isRunning) {
                const regs = await listRegistries();
                setRegistries(regs);
            } else {
                setRegistries([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const executeAction = async (actionId: string, func: () => Promise<any>) => {
        setActionLoading(actionId);
        try {
            const res = await func();
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Action failed");
            }
            await refreshData();
        } catch (e: any) {
            alert(e.message || "An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!server || !username || !password) return;
        executeAction("login", () => registryLogin(server, username, password));
        setServer("");
        setUsername("");
        setPassword("");
    }

    const handleLogout = (regServer: string) => {
        if (!confirm(`Are you sure you want to log out of ${regServer}?`)) return;
        executeAction("logout-" + regServer, () => registryLogout(regServer));
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />
            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                        <Link to="/" className="text-text-secondary hover:text-white transition-colors">Home</Link>
                        <span className="text-text-secondary">/</span>
                        <span className="text-white font-medium">Registries</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Registry Management</h1>
                            <p className="text-slate-500 dark:text-text-secondary">Connect to private Docker registries and manage authentication.</p>
                        </div>
                    </div>
                </div>

                {!systemRunning ? (
                    <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden text-center p-8">
                        <Server size={48} color="var(--text-secondary)" opacity={0.5} className="mx-auto mb-4" />
                        <p className="text-slate-900 dark:text-white font-medium mb-1">The container daemon is offline.</p>
                        <p className="text-sm text-text-secondary">Start the system from the dashboard to manage registry credentials.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                        {/* Connect New Registry */}
                        <div className="xl:col-span-1">
                            <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">add_link</span>
                                    Connect New Registry
                                </h3>
                                <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="registry-url">Registry URL</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                                                <span className="material-symbols-outlined text-[18px]">dns</span>
                                            </div>
                                            <input
                                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-600 dark:border-surface-border rounded-lg leading-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all font-mono"
                                                id="registry-url"
                                                placeholder="https://index.docker.io/v1/"
                                                type="text"
                                                value={server}
                                                onChange={e => setServer(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="username">Username</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                            </div>
                                            <input
                                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-600 dark:border-surface-border rounded-lg leading-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                                                id="username"
                                                placeholder="docker_user"
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">Password / Token</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                                                <span className="material-symbols-outlined text-[18px]">key</span>
                                            </div>
                                            <input
                                                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-600 dark:border-surface-border rounded-lg leading-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all font-mono"
                                                id="password"
                                                placeholder="••••••••••••••••"
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!server || !username || !password || !!actionLoading}
                                        className="flex items-center justify-center gap-2 w-full mt-2 h-10 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-violet-900/20"
                                    >
                                        {actionLoading === "login" ? <RefreshCw size={20} className="spin" /> : <span className="material-symbols-outlined text-[20px]">login</span>}
                                        Login
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="xl:col-span-2">
                            <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                                <div className="p-6 pb-4 border-b border-slate-600 dark:border-surface-border flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">cloud_done</span>
                                        Active Sessions
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <button onClick={refreshData} className="text-text-secondary hover:text-white transition-colors outline-none" disabled={isLoading} title="Refresh">
                                            <RefreshCw size={14} className={isLoading ? "spin" : ""} />
                                        </button>
                                        <span className="flex h-2 w-2 rounded-full bg-green-500 status-pulse-green"></span>
                                        {registries.length} Connected
                                    </div>
                                </div>

                                <div className="flex-1 overflow-x-auto custom-scrollbar">
                                    {registries.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-secondary">
                                            <Key size={48} className="opacity-20 mb-4" />
                                            <p>No active registry sessions found.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-600 dark:border-surface-border bg-slate-50 dark:bg-[#181818]">
                                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Registry</th>
                                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Status</th>
                                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                                {registries.map((reg, i) => {
                                                    const isDockerHub = reg.includes("docker.io");
                                                    const isGhcr = reg.includes("ghcr.io");

                                                    let displayServer = reg;
                                                    let displayTitle = "Private Registry";
                                                    let iconSource = <span className="material-symbols-outlined text-slate-600">dns</span>;

                                                    if (isDockerHub) {
                                                        displayTitle = "Docker Hub";
                                                        iconSource = <img alt="Docker Hub" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAene0Xxy23op5Ugclyd-fTMqaZevZVyyrGSW65Oe2RyOOVjzeSdl5ckGVL1kYtibmBiA9hXEeoh4GfFNlBnNShE3AaVcbmLKGQYGWQpigW9XmnnFd7mdSpBTuhCTVpaTRPNOi7yblJwS0rzeSYyzn86Fj7CQME8HId2-05m3SoBAvRhjRTn8cNK65K9Daq6yYQViu4e2Z3n_qoX6U0UwzaxMpjXHvj4oJH5Y7oBZ0Noym1K_ls6iEockuoRHGoQ60DjL6D3pcQjc4" />;
                                                    } else if (isGhcr) {
                                                        displayTitle = "GitHub CR";
                                                        iconSource = <img alt="GitHub Container Registry" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnkDvtflmzKA5xpvDOmGWNwLOculLIuguEwjJnxSB4dCOauC_3XFSIJdTPUOkWr09dBsMoqfj9KXvzqXAI7ZnGhluHkWRw3OR_0EczGUihmTWvgtXjzlGEdnotPRI8jQXAEy59OvnNkVnmlBx0VxlevFLoJlxiA9Yb_sLHa2ey2v9mydKGOwb8QMs2FOWFD_NJEqfFLh-o89UfWjNuXGHUw31MTm7_vlexe7DxvZMfnntYZ3hzUWHU0XRfVZ9S4sM4KHYoZzb5Bs8" />;
                                                    }

                                                    return (
                                                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-8 rounded bg-white p-1 flex items-center justify-center shrink-0">
                                                                        {iconSource}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{displayTitle}</span>
                                                                        <span className="text-xs font-mono text-slate-500 dark:text-text-secondary">{displayServer}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                                                    <span className="text-xs text-slate-500 dark:text-text-secondary">Connected</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <button
                                                                    disabled={!!actionLoading}
                                                                    onClick={() => handleLogout(reg)}
                                                                    className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                                                                >
                                                                    {actionLoading === "logout-" + reg ? <RefreshCw size={14} className="spin inline-block mr-1" /> : null}
                                                                    Logout
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
