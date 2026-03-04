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
    registryLogout
} from "../lib/container";
import { Input } from "../components/Input";
import "../Dashboard.css";
import { Button, IconButton } from "../components/Button";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { ConfirmDialog } from "../modals/Modal";
import { PageMain } from "../components/PageMain";
import { useSystem } from "../contexts/SystemContext";
import { Tag } from "../components/Tag";
import { H3, Body, Small, Caption, Label } from "../components/Typography";

export default function RegistriesPage() {
    const { systemRunning } = useSystem();
    const [registries, setRegistries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form states
    const [server, setServer] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Confirmation State
    const [confirmLogoutServer, setConfirmLogoutServer] = useState<string | null>(null);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            if (systemRunning) {
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
    }, [systemRunning]);

    const executeAction = async (actionId: string, func: () => Promise<any>) => {
        setActionLoading(actionId);
        try {
            await func();
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
        <PageMain
            header={
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
            }
        >

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
                                <H3 weight="black" uppercase tracking="tighter">
                                    Active Sessions
                                </H3>
                            </div>
                            <div className="flex items-center gap-3">
                                <Tag variant="success" className="gap-1.5 px-3 py-1 border-transparent bg-transparent">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <Body weight="black" uppercase>{registries.length} Connected</Body>
                                </Tag>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            {registries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-secondary">
                                    <Key size={48} className="opacity-20 mb-4" />
                                    <Small weight="medium">No active registry sessions found.</Small>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-[#181818] border-b border-slate-600 dark:border-surface-border">
                                            <th className="py-4 px-6"><Label variant="xs" weight="black" uppercase tracking="widest" color="secondary">Registry Server</Label></th>
                                            <th className="py-4 px-6"><Label variant="xs" weight="black" uppercase tracking="widest" color="secondary">Status</Label></th>
                                            <th className="py-4 px-6 text-right"><Label variant="xs" weight="black" uppercase tracking="widest" color="secondary">Actions</Label></th>
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
                                                iconSource = <img alt="Docker Hub" className="w-5 h-5 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAene0Xxy23op5Ugclyd-fTMqaZevZVyyrGSW65Oe2RyOOVjzeSdl5ckGVL1kYtibmBiA9hXEeoh4GfFNlBnNShE3AaVcbmLKGQYGWKpigW9XmnnFd7mdSpBTuhCTVpaTRPNOi7yblJwS0rzeSYyzn86Fj7CQME8HId2-05m3SoBAvRhjRTn8cNK65K9Daq6yYQViu4e2Z3n_qoX6U0UwzaxMpjXHvj4oJH5Y7oBZ0Noym1K_ls6iEockuoRHGoQ60DjL6D3pcQjc4" />;
                                            } else if (isGhcr) {
                                                displayTitle = "GitHub CR";
                                                iconSource = <img alt="GitHub Container Registry" className="w-5 h-5 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnkDvtflmzKA5xpvDOmGWNwLOculLIuguEwjJnxSB4dCOauC_3XFSIJdTPUOkWr09dBsMoqfj9KXvzqXAI7ZnGhluHkWRw3OR_0EczGUihmTWvgtXjzlGEdnotPRI8jQXAEy59OvnNkVnmlBx0VxlevFLoJlxiA9Yb_sLHa2ey2v9mydKGOwb8QMs2FOWFD_NJEqfFLh-o89UfWjNuXGHUw31MTm7_vlexe7DxvZMfnntYZ3hzUWHU0XRfVZ9S4sM4KHYoZzb5Bs5" />;
                                            }

                                            return (
                                                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-10 rounded-xl bg-white dark:bg-white/10 shadow-sm p-2 flex items-center justify-center shrink-0 border border-slate-600 dark:border-surface-border">
                                                                {iconSource}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <Small weight="bold" uppercase tracking="tight">{displayTitle}</Small>
                                                                <Caption mono color="secondary" className="text-[10px]">{displayServer}</Caption>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                            <Tag variant="success" className="uppercase tracking-widest border-transparent bg-transparent">Authorized</Tag>
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
        </PageMain>
    );
}
