import { useState, useEffect } from "react";
import {
    RefreshCw,
    Edit2
} from "lucide-react";
import {
    listSystemProperties,
    clearSystemProperty,
    checkSystemStatus
} from "../lib/container";
import type { SystemProperty } from "../lib/container";
import "../Dashboard.css";
import { NavBar } from "../components/NavBar";
import { EditPropertyModal } from "../components/EditPropertyModal.tsx";

export default function SettingsPage() {
    const [theme, setTheme] = useState<string>("dark");

    // System Properties State
    const [properties, setProperties] = useState<SystemProperty[]>([]);
    const [isLoadingProps, setIsLoadingProps] = useState(false);
    const [systemRunning, setSystemRunning] = useState(false);

    // Modal State
    const [editingProp, setEditingProp] = useState<SystemProperty | null>(null);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") || "dark";
        setTheme(storedTheme);
        loadProperties();
    }, []);

    const loadProperties = async () => {
        setIsLoadingProps(true);
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            if (isRunning) {
                const props = await listSystemProperties();
                setProperties(props);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingProps(false);
        }
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const handleClearProp = async (id: string) => {
        if (!confirm(`Are you sure you want to clear the custom value for ${id}? It will revert to default.`)) return;
        setIsLoadingProps(true);
        try {
            await clearSystemProperty(id);
            await loadProperties();
        } catch (e: any) {
            alert(e.message || "Failed to clear property");
        } finally {
            setIsLoadingProps(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar systemRunning={systemRunning} onSystemStop={loadProperties} />
            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                {editingProp && (
                    <EditPropertyModal
                        property={editingProp}
                        onClose={() => setEditingProp(null)}
                        onSaved={() => {
                            setEditingProp(null);
                            loadProperties();
                        }}
                    />
                )}


                <section className="mb-10">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">General</h3>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6">
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Interface Theme</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                                {/* Light Mode */}
                                <label className={`relative flex cursor-pointer rounded-xl border ${theme === 'light' ? 'border-primary' : 'border-slate-600 dark:border-surface-border'} bg-slate-50 dark:bg-[#262626] p-4 shadow-sm focus:outline-none hover:border-primary/50 transition-colors group`} onClick={() => handleThemeChange("light")}>
                                    <input className="peer sr-only" type="radio" value="light" checked={theme === 'light'} readOnly />
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="block text-sm font-bold text-slate-900 dark:text-white">Light</span>
                                            <span className="mt-1 flex items-center text-xs text-slate-500 dark:text-text-secondary">Standard light mode</span>
                                        </span>
                                    </span>
                                    <span aria-hidden="true" className={`pointer-events-none absolute -inset-px rounded-xl border-2 ${theme === 'light' ? 'border-primary' : 'border-transparent'}`}></span>
                                    <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${theme === 'light' ? 'border-transparent bg-primary mt-0.5' : 'border-slate-300 bg-white mt-0.5'}`}>
                                        <span className={`size-2 rounded-full opacity-${theme === 'light' ? '100' : '0'} bg-white`}></span>
                                    </span>
                                </label>

                                {/* Dark Mode */}
                                <label className={`relative flex cursor-pointer rounded-xl border ${theme === 'dark' ? 'border-primary' : 'border-slate-600 dark:border-surface-border'} bg-slate-50 dark:bg-[#262626] p-4 shadow-sm focus:outline-none hover:border-primary/50 transition-colors group`} onClick={() => handleThemeChange("dark")}>
                                    <input className="peer sr-only" type="radio" value="dark" checked={theme === 'dark'} readOnly />
                                    <span className="flex flex-1">
                                        <span className="flex flex-col">
                                            <span className="block text-sm font-bold text-slate-900 dark:text-white">Dark</span>
                                            <span className="mt-1 flex items-center text-xs text-slate-500 dark:text-text-secondary">Midnight Charcoal</span>
                                        </span>
                                    </span>
                                    <span aria-hidden="true" className={`pointer-events-none absolute -inset-px rounded-xl border-2 ${theme === 'dark' ? 'border-primary' : 'border-transparent'}`}></span>
                                    <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${theme === 'dark' ? 'border-transparent bg-primary mt-0.5' : 'border-slate-300 bg-white mt-0.5'}`}>
                                        <span className={`size-2 rounded-full opacity-${theme === 'dark' ? '100' : '0'} bg-white`}></span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Global System Properties {isLoadingProps && <RefreshCw size={16} className="spin text-text-secondary" />}</h3>
                    </div>

                    {!systemRunning ? (
                        <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden text-center p-8">
                            <p className="text-slate-900 dark:text-white font-medium mb-1">The container daemon is offline</p>
                            <p className="text-sm text-text-secondary">Start the system to view properties.</p>
                        </div>
                    ) : properties.length === 0 && !isLoadingProps ? (
                        <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden text-center p-8">
                            <p className="text-text-secondary">No system properties found.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-600 dark:border-surface-border bg-slate-50 dark:bg-[#181818]">
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary w-32">ID</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Property Description</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary">Value</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary w-32">Type</th>
                                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-text-secondary text-right w-32">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                        {properties.map((p) => (
                                            <tr key={p.ID} className="group hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.ID}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">{p.Description}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {p.Type === 'Bool' ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.Value === 'true' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                            {p.Value || 'false'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                            {p.Value || <span className="italic text-slate-400">default</span>}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs text-slate-500 dark:text-white bg-slate-100 dark:bg-purple-800 px-2 py-1 rounded">{p.Type}</span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="text-slate-400 hover:text-primary transition-colors p-1" title="Edit" onClick={() => setEditingProp(p)}>
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {p.Value && (
                                                            <button className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Reset to default" onClick={() => handleClearProp(p.ID)}>
                                                                <RefreshCw size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
