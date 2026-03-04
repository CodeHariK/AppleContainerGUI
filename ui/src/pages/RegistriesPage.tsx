import { useState, useEffect } from "react";
import {
    Server,
    Key,
    RefreshCw,
    Globe,
    User,
    LogIn,
    Layers2,
    Cloud,
    Network
} from "lucide-react";
import {
    listRegistries,
    registryLogin,
    registryLogout,
    checkSystemStatus
} from "../lib/container";
import { Input } from "../components/Input";
import { NavBar } from "../components/NavBar";
import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { ConfirmDialog } from "../modals/Modal";

export default function RegistriesPage() {
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [systemRunning, setSystemRunning] = useState(false);

    // Form states
    const [server, setServer] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Confirmation State
    const [confirmLogoutServer, setConfirmLogoutServer] = useState<string | null>(null);

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
            await func();
            // registryLogin might not return a response object with .ok if it's a fetch wrapper
            // checking container.ts, registryLogin does not return anything (void)
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
        setConfirmLogoutServer(regServer);
    }

    const confirmLogout = async () => {
        if (!confirmLogoutServer) return;
        const regServer = confirmLogoutServer;
        executeAction("logout-" + regServer, async () => {
            await registryLogout(regServer);
            setConfirmLogoutServer(null);
        });
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={refreshData} />
            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">

                <PageHeader
                    title="Registry Management"
                    description="Connect to private Docker registries and manage authentication."
                    icon={Layers2}
                    actions={
                        <IconButton
                            onClick={refreshData}
                            icon={RefreshCw}
                            variant="secondary"
                            loading={isLoading}
                            title="Refresh"
                        />
                    }
                />

                {!systemRunning ? (
                    <Card className="text-center p-12">
                        <Server size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                        <p className="text-slate-900 dark:text-white font-medium mb-1 uppercase">Daemon Offline</p>
                        <p className="text-sm text-text-secondary tracking-tight">Start the system from the dashboard to manage registry credentials.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                        {/* Connect New Registry */}
                        <div className="xl:col-span-1">
                            <Card className="p-6">
                                <SectionHeader
                                    title="Connect New Registry"
                                    icon={Server}
                                />
                                <form className="flex flex-col gap-5 mt-4" onSubmit={handleLogin}>
                                    <Input
                                        label="Registry URL"
                                        icon={Globe}
                                        placeholder="https://index.docker.io/v1/"
                                        value={server}
                                        onChange={e => setServer(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <Input
                                        label="Username"
                                        icon={User}
                                        placeholder="docker_user"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                    <Input
                                        label="Password / Token"
                                        icon={Key}
                                        placeholder="••••••••••••••••"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!server || !username || !password}
                                        loading={actionLoading === "login"}
                                        icon={LogIn}
                                        fullWidth
                                        className="mt-2"
                                    >
                                        Login to Registry
                                    </Button>
                                </form>
                            </Card>
                        </div>

                        {/* Active Sessions */}
                        <div className="xl:col-span-2">
                            <Card className="p-0 overflow-hidden h-full flex flex-col">
                                <div className="p-6 border-b border-slate-600 dark:border-surface-border flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Cloud size={20} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            Active Sessions
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {registries.length} Connected
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-x-auto custom-scrollbar">
                                    {registries.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-secondary">
                                            <Key size={48} className="opacity-20 mb-4" />
                                            <p className="text-sm font-medium">No active registry sessions found.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-[#181818] border-b border-slate-600 dark:border-surface-border">
                                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Registry Server</th>
                                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                                {registries.map((reg, i) => {
                                                    const isDockerHub = reg.includes("docker.io");
                                                    const isGhcr = reg.includes("ghcr.io");

                                                    let displayServer = reg;
                                                    let displayTitle = "Private Registry";
                                                    let iconSource = <Network size={20} className="text-slate-600 dark:text-slate-400" />;

                                                    if (isDockerHub) {
                                                        displayTitle = "Docker Hub";
                                                        iconSource = <img alt="Docker Hub" className="w-5 h-5 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAene0Xxy23op5Ugclyd-fTMqaZevZVyyrGSW65Oe2RyOOVjzeSdl5ckGVL1kYtibmBiA9hXEeoh4GfFNlBnNShE3AaVcbmLKGQYGWQpigW9XmnnFd7mdSpBTuhCTVpaTRPNOi7yblJwS0rzeSYyzn86Fj7CQME8HId2-05m3SoBAvRhjRTn8cNK65K9Daq6yYQViu4e2Z3n_qoX6U0UwzaxMpjXHvj4oJH5Y7oBZ0Noym1K_ls6iEockuoRHGoQ60DjL6D3pcQjc4" />;
                                                    } else if (isGhcr) {
                                                        displayTitle = "GitHub CR";
                                                        iconSource = <img alt="GitHub Container Registry" className="w-5 h-5 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnkDvtflmzKA5xpvDOmGWNwLOculLIuguEwjJnxSB4dCOauC_3XFSIJdTPUOkWr09dBsMoqfj9KXvzqXAI7ZnGhluHkWRw3OR_0EczGUihmTWvgtXjzlGEdnotPRI8jQXAEy59OvnNkVnmlBx0VxlevFLoJlxiA9Yb_sLHa2ey2v9mydKGOwb8QMs2FOWFD_NJEqfFLh-o89UfWjNuXGHUw31MTm7_vlexe7DxvZMfnntYZ3hzUWHU0XRfVZ9S4sM4KHYoZzb5Bs8" />;
                                                    }

                                                    return (
                                                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="size-10 rounded-xl bg-white dark:bg-white/10 shadow-sm p-2 flex items-center justify-center shrink-0 border border-slate-600 dark:border-surface-border">
                                                                        {iconSource}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{displayTitle}</span>
                                                                        <span className="text-[10px] font-mono text-text-secondary">{displayServer}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Authorized</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleLogout(reg)}
                                                                    loading={actionLoading === "logout-" + reg}
                                                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                                >
                                                                    Sign Out
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            <ConfirmDialog
                open={!!confirmLogoutServer}
                onOpenChange={(open) => !open && setConfirmLogoutServer(null)}
                title="Sign Out of Registry"
                description={`Are you sure you want to log out of ${confirmLogoutServer}? You may need to sign in again to pull private images.`}
                confirmLabel="Sign Out"
                onConfirm={confirmLogout}
                variant="danger"
                isLoading={actionLoading === ("logout-" + confirmLogoutServer)}
            />
        </div>
    );
}
