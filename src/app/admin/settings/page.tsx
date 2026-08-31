"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Settings, Save, Loader2, CheckCircle2, AlertTriangle,
    AppWindow, Globe, Building2, RefreshCcw, X
} from "lucide-react";

type TabKey = "identitas" | "halaman-depan" | "sekolah";

interface AppSettings {
    appName: string;
    appFullName: string;
    appDescription: string;
    heroTitle: string;
    heroDescription: string;
    schoolName: string;
    schoolWebsite: string;
    headmasterName: string;
    headmasterNip: string;
    schoolAddress: string;
    schoolPhone: string;
    updatedAt?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    appName: "SIMMAS",
    appFullName: "Sistem Informasi Manajemen Magang Siswa",
    appDescription: "Platform digital untuk mengelola program magang siswa di dunia industri.",
    heroTitle: "Selamat Datang di SIMMAS",
    heroDescription: "Kelola dan pantau aktivitas magang siswa secara real-time, terstruktur, dan modern.",
    schoolName: "SMK Negeri 1 Contoh",
    schoolWebsite: "https://smkn1contoh.sch.id",
    headmasterName: "Drs. H. Kepala Sekolah, M.Pd.",
    headmasterNip: "196801011990031001",
    schoolAddress: "Jl. Pendidikan No. 1, Kota Contoh, Provinsi, 12345",
    schoolPhone: "(021) 1234567",
};

const TABS: { key: TabKey; label: string; icon: typeof AppWindow; desc: string }[] = [
    { key: "identitas", label: "Identitas Aplikasi", icon: AppWindow, desc: "Nama, kepanjangan, dan deskripsi sistem." },
    { key: "halaman-depan", label: "Halaman Depan", icon: Globe, desc: "Konten hero pada landing page publik." },
    { key: "sekolah", label: "Data Sekolah", icon: Building2, desc: "Informasi instansi untuk kop & footer." },
];

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("identitas");
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [original, setOriginal] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [savingTab, setSavingTab] = useState<TabKey | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${apiUrl}/Admin/Settings`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok && result.status && result.data) {
                    const d = result.data;
                    const identitas = d.IdentitasAplikasi || d.identitasAplikasi || d.identitas || {};
                    const hero = d.HalamanDepan || d.halamanDepan || d.hero || {};
                    const sekolah = d.DataSekolah || d.dataSekolah || d.sekolah || {};
                    const next: AppSettings = {
                        ...DEFAULT_SETTINGS,
                        appName: identitas.appName ?? DEFAULT_SETTINGS.appName,
                        appFullName: identitas.appFullName ?? DEFAULT_SETTINGS.appFullName,
                        appDescription: identitas.appDescription ?? DEFAULT_SETTINGS.appDescription,
                        heroTitle: hero.heroTitle ?? DEFAULT_SETTINGS.heroTitle,
                        heroDescription: hero.heroDescription ?? DEFAULT_SETTINGS.heroDescription,
                        schoolName: sekolah.schoolName ?? DEFAULT_SETTINGS.schoolName,
                        schoolWebsite: sekolah.schoolWebsite ?? DEFAULT_SETTINGS.schoolWebsite,
                        headmasterName: sekolah.headmasterName ?? DEFAULT_SETTINGS.headmasterName,
                        headmasterNip: sekolah.headmasterNip ?? DEFAULT_SETTINGS.headmasterNip,
                        schoolAddress: sekolah.schoolAddress ?? DEFAULT_SETTINGS.schoolAddress,
                        schoolPhone: sekolah.schoolPhone ?? DEFAULT_SETTINGS.schoolPhone,
                        updatedAt: d.updatedAt ?? d.UpdatedAt,
                    };
                    setSettings(next);
                    setOriginal(next);
                }
            } catch (err) {
                console.error("Gagal memuat pengaturan", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [apiUrl]);

    function showToast(type: "success" | "error", message: string) {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    }

    async function handleSave(tab: TabKey, e: FormEvent) {
        e.preventDefault();
        setSavingTab(tab);
        try {
            const token = localStorage.getItem("token");
            const payload =
                tab === "identitas"
                    ? { appName: settings.appName, appFullName: settings.appFullName, appDescription: settings.appDescription }
                    : tab === "halaman-depan"
                        ? { heroTitle: settings.heroTitle, heroDescription: settings.heroDescription }
                        : {
                            schoolName: settings.schoolName,
                            schoolWebsite: settings.schoolWebsite,
                            headmasterName: settings.headmasterName,
                            headmasterNip: settings.headmasterNip,
                            schoolAddress: settings.schoolAddress,
                            schoolPhone: settings.schoolPhone,
                        };

            const res = await fetch(`${apiUrl}/Admin/Settings/${tab}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const text = await res.text();
            const result = text ? JSON.parse(text) : null;
            if (!res.ok || !result?.status) throw new Error(result?.message || `Gagal menyimpan pengaturan (${res.status}).`);
            showToast("success", `Pengaturan ${TABS.find(t => t.key === tab)?.label} berhasil disimpan.`);
        } catch (err: any) {
            showToast("error", err.message || "Terjadi kesalahan saat menyimpan.");
        } finally {
            setSavingTab(null);
        }
    }

    function update(field: keyof AppSettings, value: string) {
        setSettings(prev => ({ ...prev, [field]: value }));
    }

    const updatedLabel = settings.updatedAt
        ? new Date(settings.updatedAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })
        : null;

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full relative">
            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border-2 bg-background min-w-[320px] max-w-md ${toast.type === "success"
                        ? "border-emerald-500 text-emerald-700"
                        : "border-rose-500 text-rose-700"}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
                            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <p className="text-sm font-bold flex-1">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-[#8b5cf6] rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-white/80 text-sm font-semibold tracking-wider uppercase">
                        <Settings className="w-4 h-4" />
                        Pengaturan Sistem
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Konfigurasi Aplikasi</h1>
                    <p className="text-white/80 text-sm">
                        Atur identitas sistem, tampilan halaman depan, dan data sekolah dari satu tempat.
                    </p>
                </div>
                {updatedLabel && (
                    <div className="relative z-10 text-right text-white/80 text-xs">
                        <p className="font-semibold uppercase tracking-widest text-[10px]">Terakhir Diperbarui</p>
                        <p className="text-sm text-white mt-1">{updatedLabel}</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto border-b border-border">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${isActive
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 md:p-8 space-y-2">
                    <div className="mb-6">
                        <h2 className="text-lg font-extrabold text-foreground">
                            {TABS.find(t => t.key === activeTab)?.label}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {TABS.find(t => t.key === activeTab)?.desc}
                        </p>
                    </div>

                    <form onSubmit={(e) => handleSave(activeTab, e)} className="space-y-5">
                        {activeTab === "identitas" && (
                            <>
                                <Field label="Nama Aplikasi" hint="Ditampilkan pada judul tab, header, dan dokumen cetakan.">
                                    <input
                                        type="text"
                                        value={settings.appName}
                                        onChange={e => update("appName", e.target.value)}
                                        placeholder="SIMMAS"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </Field>
                                <Field label="Kepanjangan" hint="Nama lengkap sistem untuk dokumen resmi & footer.">
                                    <input
                                        type="text"
                                        value={settings.appFullName}
                                        onChange={e => update("appFullName", e.target.value)}
                                        placeholder="Sistem Informasi Manajemen Magang Siswa"
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </Field>
                                <Field label="Deskripsi" hint="Kalimat singkat yang menjelaskan fungsi aplikasi.">
                                    <textarea
                                        rows={4}
                                        value={settings.appDescription}
                                        onChange={e => update("appDescription", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                    />
                                </Field>
                            </>
                        )}

                        {activeTab === "halaman-depan" && (
                            <>
                                <Field label="Judul Hero" hint="Headline utama di landing page publik.">
                                    <input
                                        type="text"
                                        value={settings.heroTitle}
                                        onChange={e => update("heroTitle", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </Field>
                                <Field label="Deskripsi Hero" hint="Sub-headline di bawah judul hero.">
                                    <textarea
                                        rows={5}
                                        value={settings.heroDescription}
                                        onChange={e => update("heroDescription", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                    />
                                </Field>
                            </>
                        )}

                        {activeTab === "sekolah" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Nama Sekolah" required>
                                        <input
                                            type="text"
                                            required
                                            value={settings.schoolName}
                                            onChange={e => update("schoolName", e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </Field>
                                    <Field label="Website">
                                        <input
                                            type="url"
                                            value={settings.schoolWebsite}
                                            onChange={e => update("schoolWebsite", e.target.value)}
                                            placeholder="https://"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Nama Kepala Sekolah">
                                        <input
                                            type="text"
                                            value={settings.headmasterName}
                                            onChange={e => update("headmasterName", e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </Field>
                                    <Field label="NIP Kepala Sekolah">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={settings.headmasterNip}
                                            onChange={e => update("headmasterNip", e.target.value.replace(/\D/g, ""))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </Field>
                                </div>
                                <Field label="Alamat Sekolah">
                                    <textarea
                                        rows={3}
                                        value={settings.schoolAddress}
                                        onChange={e => update("schoolAddress", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                    />
                                </Field>
                                <Field label="Nomor Telepon">
                                    <input
                                        type="text"
                                        value={settings.schoolPhone}
                                        onChange={e => update("schoolPhone", e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </Field>
                            </>
                        )}

                        <div className="pt-4 flex justify-end gap-3 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setSettings(original)}
                                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"
                            >
                                <RefreshCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                type="submit"
                                disabled={savingTab !== null}
                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-70"
                            >
                                {savingTab === activeTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Simpan Pengaturan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground/80 mt-1.5">{hint}</p>}
        </div>
    );
}
