import { useState, useEffect } from "react";
import {
    RefreshCw,
    Edit2,
    Settings
} from "lucide-react";
import {
    listSystemProperties,
    clearSystemProperty
} from "../lib/container";
import type { SystemProperty } from "../lib/container";
import "../Dashboard.css";
import "../Dashboard.css";
import { EditPropertyModal } from "../modals/EditPropertyModal.tsx";
import { IconButton } from "../components/Button";
import { RadioGroup, Radio } from "../components/RadioGroup";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { ConfirmDialog } from "../modals/Modal";
import { useSystem } from "../contexts/SystemContext";
import { PageMain } from "../components/PageMain";
import { Tag } from "../components/Tag";
import { Small, Caption, Label } from "../components/Typography";

export default function SettingsPage() {
    const { systemRunning } = useSystem();
    const [theme, setTheme] = useState<string>("dark");

    // System Properties State
    const [properties, setProperties] = useState<SystemProperty[]>([]);
    const [isLoadingProps, setIsLoadingProps] = useState(false);

    // Modal State
    const [editingProp, setEditingProp] = useState<SystemProperty | null>(null);
    const [confirmClearPropId, setConfirmClearPropId] = useState<string | null>(null);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") || "dark";
        setTheme(storedTheme);
        loadProperties();
    }, [systemRunning]);

    const loadProperties = async () => {
        setIsLoadingProps(true);
        try {
            if (systemRunning) {
                const props = await listSystemProperties();
                setProperties(props);
            } else {
                setProperties([]);
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
        <PageMain
            header={
                <PageHeader
                    title="Settings"
                    description="Configure your environment, themes, and system properties."
                    icon={Settings}
                />
            }
        >
            <Card className="mb-8">
                <SectionHeader title="General" description="Personalize your user interface experience" />
                <div className="mb-2">
                    <Label variant="body" weight="medium" className="block mb-3">Interface Theme</Label>
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
                    {properties.length === 0 && !isLoadingProps ? (
                        <div className="bg-white dark:bg-surface-dark border border-slate-600 dark:border-surface-border rounded-xl shadow-sm overflow-hidden text-center p-8">
                            <Caption color="secondary">No system properties found.</Caption>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-600 dark:border-surface-border bg-slate-50 dark:bg-[#181818]">
                                        <th className="py-4 px-6 w-32"><Label variant="xs" weight="semibold" uppercase tracking="widest" color="secondary">ID</Label></th>
                                        <th className="py-4 px-6"><Label variant="xs" weight="semibold" uppercase tracking="widest" color="secondary">Property Description</Label></th>
                                        <th className="py-4 px-6"><Label variant="xs" weight="semibold" uppercase tracking="widest" color="secondary">Value</Label></th>
                                        <th className="py-4 px-6 w-32"><Label variant="xs" weight="semibold" uppercase tracking="widest" color="secondary">Type</Label></th>
                                        <th className="py-4 px-6 text-right w-32"><Label variant="xs" weight="semibold" uppercase tracking="widest" color="secondary">Actions</Label></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-600 dark:divide-surface-border">
                                    {properties.map((p) => (
                                        <tr key={p.ID} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6"><Small weight="bold" mono color="primary">{p.ID}</Small></td>
                                            <td className="py-4 px-6">
                                                <Small weight="medium">{p.Description}</Small>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Tag variant="standard" className="px-2 py-1 font-mono text-xs">
                                                    {p.Value || <Caption color="secondary" className="opacity-50 italic">Default</Caption>}
                                                </Tag>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Tag variant="standard" className="uppercase font-bold">
                                                    {p.Type}
                                                </Tag>
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
        </PageMain>
    );
}
