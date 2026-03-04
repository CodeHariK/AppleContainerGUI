import { useState, useEffect } from "react";
import {
    RefreshCw,
    Edit2,
    Settings
} from "lucide-react";
import {
    listSystemProperties,
    clearSystemProperty,
    checkSystemStatus
} from "../lib/container";
import type { SystemProperty } from "../lib/container";
import "../Dashboard.css";
import { NavBar } from "../components/NavBar";
import { EditPropertyModal } from "../modals/EditPropertyModal.tsx";
import { IconButton } from "../components/Button";
import { RadioGroup, Radio } from "../components/RadioGroup";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { ConfirmDialog } from "../modals/Modal";

export default function SettingsPage() {
    const [theme, setTheme] = useState<string>("dark");

    // System Properties State
    const [properties, setProperties] = useState<SystemProperty[]>([]);
    const [isLoadingProps, setIsLoadingProps] = useState(false);
    const [systemRunning, setSystemRunning] = useState(false);

    // Modal State
    const [editingProp, setEditingProp] = useState<SystemProperty | null>(null);
    const [confirmClearPropId, setConfirmClearPropId] = useState<string | null>(null);

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

    const handleThemeChange = (newTheme: any) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const handleClearProp = async (id: string) => {
        setConfirmClearPropId(id);
    };

    const confirmClearProp = async () => {
        if (!confirmClearPropId) return;
        const id = confirmClearPropId;
        setIsLoadingProps(true);
        try {
            await clearSystemProperty(id);
            setConfirmClearPropId(null);
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
                <PageHeader
                    title="Settings"
                    description="Configure your environment, themes, and system properties."
                    icon={Settings}
                />

                <Card className="mb-8">
                    <SectionHeader title="General" description="Personalize your user interface experience" />
                    <div className="mb-2">
                        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Interface Theme</label>
                        <RadioGroup
                            value={theme}
                            onValueChange={handleThemeChange}
                            className="flex flex-row gap-4 max-w-2xl w-full"
                        >
                            <Radio
                                value="light"
                                label="Light"
                                description="Standard light mode"
                            />
                            <Radio
                                value="dark"
                                label="Dark"
                                description="Midnight Charcoal"
                            />
                        </RadioGroup>
                    </div>
                </Card>

                <section className="mt-12">
                    <SectionHeader
                        title="Global System Properties"
                        description="Fine-tune the internal behavior of the container engine."
                        actions={
                            isLoadingProps ? <RefreshCw size={16} className="animate-spin text-text-secondary" /> : null
                        }
                    />
                    <Card className="p-0 overflow-hidden">
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
                                            <tr key={p.ID} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-6 font-mono text-xs text-primary font-bold">{p.ID}</td>
                                                <td className="py-4 px-6">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{p.Description}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="bg-slate-100 dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded px-2 py-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                        {p.Value || <span className="text-slate-400 dark:text-slate-500 italic">Default</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] uppercase font-bold text-slate-500 dark:text-text-secondary">
                                                        {p.Type}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <IconButton
                                                            variant="ghost"
                                                            icon={Edit2}
                                                            title="Edit"
                                                            onClick={() => setEditingProp(p)}
                                                        />
                                                        {p.Value && (
                                                            <IconButton
                                                                variant="ghost"
                                                                icon={RefreshCw}
                                                                title="Reset to default"
                                                                onClick={() => handleClearProp(p.ID)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </section>
            </main>

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

            <ConfirmDialog
                open={!!confirmClearPropId}
                onOpenChange={(open) => !open && setConfirmClearPropId(null)}
                title="Reset Property"
                description={`Are you sure you want to clear the custom value for '${confirmClearPropId}'? It will revert to its system default.`}
                confirmLabel="Reset to Default"
                onConfirm={confirmClearProp}
                variant="danger"
                isLoading={isLoadingProps}
            />
        </div>
    );
}
