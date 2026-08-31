"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Loader2, AlertCircle, FileText, Calendar, CheckCircle, X, XCircle,
    RefreshCw, ClipboardCheck, Search, Image as ImageIcon
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

type Tab = "jurnal" | "absensi";

export default function GuruJurnalPage() {
    const alertApi = useAlert();
    const [tab, setTab] = useState<Tab>("jurnal");

    // Jurnal state
    const [jurnalData, setJurnalData] = useState<any[]>([]);
    const [jurnalStats, setJurnalStats] = useState({ menungguValidasi: 0, disetujui: 0, perluRevisi: 0 });
    const [jurnalLoading, setJurnalLoading] = useState(true);
    const [jurnalSearch, setJurnalSearch] = useState("");
    const [jurnalFilter, setJurnalFilter] = useState<string>("");
    const [jurnalModal, setJurnalModal] = useState<any | null>(null);
    const [jurnalAction, setJurnalAction] = useState<"setujui" | "revisi">("setujui");
    const [jurnalCatatan, setJurnalCatatan] = useState("");
    const [jurnalSaving, setJurnalSaving] = useState(false);

    // Absensi state
    const [absensiData, setAbsensiData] = useState<any[]>([]);
    const [absensiStats, setAbsensiStats] = useState({ menungguValidasi: 0, disetujui: 0, ditolak: 0 });
    const [absensiLoading, setAbsensiLoading] = useState(true);
    const [absensiSearch, setAbsensiSearch] = useState("");
    const [absensiFilter, setAbsensiFilter] = useState<string>("");
    const [absensiModal, setAbsensiModal] = useState<any | null>(null);
    const [absensiAction, setAbsensiAction] = useState<"approved" | "rejected">("approved");
    const [absensiCatatan, setAbsensiCatatan] = useState("");
    const [absensiSaving, setAbsensiSaving] = useState(false);

    const fetchJurnal = async () => {
        setJurnalLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/guru?page=1&pageSize=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setJurnalData(result.data || []);
                setJurnalStats(result.stats || { menungguValidasi: 0, disetujui: 0, perluRevisi: 0 });
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat jurnal.");
        } finally {
            setJurnalLoading(false);
        }
    };

    const fetchAbsensi = async () => {
        setAbsensiLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Absensi/guru?page=1&pageSize=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setAbsensiData(result.data || []);
                setAbsensiStats(result.stats || { menungguValidasi: 0, disetujui: 0, ditolak: 0 });
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat absensi.");
        } finally {
            setAbsensiLoading(false);
        }
    };

    useEffect(() => { fetchJurnal(); fetchAbsensi(); }, []);

    const openJurnalModal = (row: any) => {
        setJurnalModal(row);
        setJurnalAction("setujui");
        setJurnalCatatan("");
    };
    const closeJurnalModal = () => { setJurnalModal(null); setJurnalCatatan(""); };

    const submitJurnal = async (e: FormEvent) => {
        e.preventDefault();
        if (!jurnalModal) return;
        if (jurnalAction === "revisi" && !jurnalCatatan.trim()) {
            alertApi.error("Catatan wajib diisi saat meminta revisi.");
            return;
        }
        setJurnalSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/guru/${jurnalModal.id}/validasi`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: jurnalAction === "setujui" ? "disetujui" : "revisi", catatan: jurnalCatatan || null }),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Jurnal berhasil divalidasi.");
                closeJurnalModal();
                fetchJurnal();
            } else {
                alertApi.error(result.message || "Gagal memvalidasi jurnal.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memvalidasi jurnal.");
        } finally {
            setJurnalSaving(false);
        }
    };

    const openAbsensiModal = (row: any) => {
        setAbsensiModal(row);
        setAbsensiAction("approved");
        setAbsensiCatatan("");
    };
    const closeAbsensiModal = () => { setAbsensiModal(null); setAbsensiCatatan(""); };

    const submitAbsensi = async (e: FormEvent) => {
        e.preventDefault();
        if (!absensiModal) return;
        if (absensiAction === "rejected" && !absensiCatatan.trim()) {
            alertApi.error("Catatan wajib diisi saat menolak absensi.");
            return;
        }
        setAbsensiSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Absensi/guru/${absensiModal.id}/validasi`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: absensiAction, catatan: absensiCatatan || null }),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Absensi berhasil divalidasi.");
                closeAbsensiModal();
                fetchAbsensi();
            } else {
                alertApi.error(result.message || "Gagal memvalidasi absensi.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memvalidasi absensi.");
        } finally {
            setAbsensiSaving(false);
        }
    };

    const jurnalFiltered = jurnalData.filter((j: any) => {
        const q = jurnalSearch.toLowerCase();
        const matchQ = !q || j.siswaName?.toLowerCase().includes(q) || j.kegiatan?.toLowerCase().includes(q);
        const matchF = !jurnalFilter || j.statusVerifikasi === jurnalFilter;
        return matchQ && matchF;
    });

    const absensiFiltered = absensiData.filter((a: any) => {
        const q = absensiSearch.toLowerCase();
        const matchQ = !q || a.siswaName?.toLowerCase().includes(q) || a.dudiName?.toLowerCase().includes(q);
        const matchF = !absensiFilter || a.validasiStatus === absensiFilter;
        return matchQ && matchF;
    });

    const getJurnalBadge = (s: string) => {
        if (s === "pending") return { label: "Menunggu", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (s === "disetujui") return { label: "Disetujui", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
        if (s === "revisi") return { label: "Perlu Revisi", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
        return { label: s, cls: "text-muted-foreground bg-muted border-border" };
    };

    const getAbsensiBadge = (s: string) => {
        if (s === "pending") return { label: "Menunggu", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (s === "disetujui") return { label: "Disetujui", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
        if (s === "ditolak") return { label: "Ditolak", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
        return { label: s, cls: "text-muted-foreground bg-muted border-border" };
    };

    const getStatusAbsen = (s: string) => {
        if (s === "hadir") return { label: "Hadir", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
        if (s === "sakit") return { label: "Sakit", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (s === "izin") return { label: "Izin", cls: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
        return { label: s, cls: "text-muted-foreground bg-muted border-border" };
    };

    return (
        <div className="space-y-6 w-full">

            {/* Header + Tabs */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Validasi Jurnal & Absensi</h1>
                    <p className="text-sm text-muted-foreground mt-1">Tinjau dan validasi jurnal kegiatan serta kehadiran siswa bimbingan Anda.</p>
                </div>
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setTab("jurnal")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === "jurnal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <FileText className="w-4 h-4" /> Jurnal Kegiatan
                    </button>
                    <button
                        onClick={() => setTab("absensi")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === "absensi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <ClipboardCheck className="w-4 h-4" /> Absensi Siswa
                    </button>
                </div>
            </div>

            {/* === TAB JURNAL === */}
            {tab === "jurnal" && (
                <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { title: "MENUNGGU", val: jurnalStats.menungguValidasi, icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10" },
                            { title: "DISETUJUI", val: jurnalStats.disetujui, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { title: "PERLU REVISI", val: jurnalStats.perluRevisi, icon: RefreshCw, color: "text-rose-500", bg: "bg-rose-500/10" },
                        ].map((s, i) => (
                            <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{s.title}</p>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                                        <s.icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-extrabold text-foreground">{s.val}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari siswa / kegiatan..."
                                    value={jurnalSearch}
                                    onChange={(e) => setJurnalSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <select
                                value={jurnalFilter}
                                onChange={(e) => setJurnalFilter(e.target.value)}
                                className="w-full sm:w-48 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="disetujui">Disetujui</option>
                                <option value="revisi">Perlu Revisi</option>
                            </select>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{jurnalFiltered.length} Jurnal</span>
                    </div>

                    {/* Tabel */}
                    <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/20">
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Siswa</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">DUDI</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kegiatan</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {jurnalLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Memuat jurnal...</p></td></tr>
                                    ) : jurnalFiltered.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center">
                                            <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                            <p className="text-sm font-semibold text-foreground">Tidak ada jurnal ditemukan.</p>
                                        </td></tr>
                                    ) : jurnalFiltered.map((j: any) => {
                                        const badge = getJurnalBadge(j.statusVerifikasi);
                                        return (
                                            <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-foreground">{j.siswaName}</p>
                                                    <p className="text-xs text-muted-foreground">{j.kelas}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-foreground">{j.dudiName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />{j.tanggal}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs"><p className="text-sm text-foreground line-clamp-2">{j.kegiatan}</p></td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {j.statusVerifikasi === "pending" ? (
                                                        <button
                                                            onClick={() => openJurnalModal(j)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                                                        >
                                                            <ClipboardCheck className="w-3.5 h-3.5" /> Validasi
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Selesai</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* === TAB ABSENSI === */}
            {tab === "absensi" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { title: "MENUNGGU", val: absensiStats.menungguValidasi, icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10" },
                            { title: "DISETUJUI", val: absensiStats.disetujui, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { title: "DITOLAK", val: absensiStats.ditolak, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
                        ].map((s, i) => (
                            <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{s.title}</p>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                                        <s.icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-extrabold text-foreground">{s.val}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari siswa / DUDI..."
                                    value={absensiSearch}
                                    onChange={(e) => setAbsensiSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <select
                                value={absensiFilter}
                                onChange={(e) => setAbsensiFilter(e.target.value)}
                                className="w-full sm:w-48 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="disetujui">Disetujui</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{absensiFiltered.length} Absensi</span>
                    </div>

                    <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-muted/20">
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Siswa</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">DUDI</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Validasi</th>
                                        <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {absensiLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Memuat absensi...</p></td></tr>
                                    ) : absensiFiltered.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center">
                                            <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                            <p className="text-sm font-semibold text-foreground">Tidak ada data absensi ditemukan.</p>
                                        </td></tr>
                                    ) : absensiFiltered.map((a: any) => {
                                        const badge = getAbsensiBadge(a.validasiStatus);
                                        const st = getStatusAbsen(a.status);
                                        return (
                                            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-foreground">{a.siswaName}</td>
                                                <td className="px-6 py-4 text-sm text-foreground">{a.dudiName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />{a.tanggal}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${st.cls}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{st.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {a.validasiStatus === "pending" ? (
                                                        <button
                                                            onClick={() => openAbsensiModal(a)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                                                        >
                                                            <ClipboardCheck className="w-3.5 h-3.5" /> Validasi
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Selesai</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL VALIDASI JURNAL === */}
            {jurnalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
                            <h3 className="font-bold text-foreground flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /> Validasi Jurnal</h3>
                            <button onClick={closeJurnalModal} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submitJurnal} className="p-5 space-y-4">
                            <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-foreground">{jurnalModal.siswaName}</p>
                                    <span className="text-xs text-muted-foreground">{jurnalModal.tanggal}</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Kegiatan</span><p className="text-foreground mt-0.5">{jurnalModal.kegiatan}</p></div>
                                    {jurnalModal.kendala && <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Kendala</span><p className="text-foreground mt-0.5">{jurnalModal.kendala}</p></div>}
                                    {jurnalModal.tindakLanjut && <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tindak Lanjut</span><p className="text-foreground mt-0.5">{jurnalModal.tindakLanjut}</p></div>}
                                    {jurnalModal.photoUrl && <div className="flex items-center gap-2 text-xs text-muted-foreground"><ImageIcon className="w-4 h-4" /><a href={jurnalModal.photoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Lihat foto kegiatan</a></div>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Tindakan</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setJurnalAction("setujui")}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${jurnalAction === "setujui" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground hover:border-emerald-500/30"}`}>
                                        <CheckCircle className="w-4 h-4" /> Setujui
                                    </button>
                                    <button type="button" onClick={() => setJurnalAction("revisi")}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${jurnalAction === "revisi" ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-border text-muted-foreground hover:border-rose-500/30"}`}>
                                        <RefreshCw className="w-4 h-4" /> Minta Revisi
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Catatan Guru {jurnalAction === "revisi" && <span className="text-rose-500">*</span>}</label>
                                <textarea
                                    value={jurnalCatatan}
                                    onChange={(e) => setJurnalCatatan(e.target.value)}
                                    rows={3}
                                    placeholder={jurnalAction === "revisi" ? "Jelaskan apa yang perlu direvisi..." : "Opsional"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeJurnalModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={jurnalSaving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {jurnalSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><CheckCircle className="w-4 h-4" /> Simpan Validasi</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL VALIDASI ABSENSI === */}
            {absensiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-bold text-foreground flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /> Validasi Absensi</h3>
                            <button onClick={closeAbsensiModal} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={submitAbsensi} className="p-5 space-y-4">
                            <div className="space-y-3 p-4 rounded-xl bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-foreground">{absensiModal.siswaName}</p>
                                    <span className="text-xs text-muted-foreground">{absensiModal.tanggal}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">DUDI</span><p className="text-foreground mt-0.5">{absensiModal.dudiName}</p></div>
                                    <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</span><p className="text-foreground mt-0.5 capitalize">{absensiModal.status}</p></div>
                                    {absensiModal.jamMasuk && <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Jam Masuk</span><p className="text-foreground mt-0.5">{absensiModal.jamMasuk}</p></div>}
                                    {absensiModal.jamPulang && <div><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Jam Pulang</span><p className="text-foreground mt-0.5">{absensiModal.jamPulang}</p></div>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Tindakan</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setAbsensiAction("approved")}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${absensiAction === "approved" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground hover:border-emerald-500/30"}`}>
                                        <CheckCircle className="w-4 h-4" /> Setujui
                                    </button>
                                    <button type="button" onClick={() => setAbsensiAction("rejected")}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${absensiAction === "rejected" ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-border text-muted-foreground hover:border-rose-500/30"}`}>
                                        <XCircle className="w-4 h-4" /> Tolak
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Catatan Guru {absensiAction === "rejected" && <span className="text-rose-500">*</span>}</label>
                                <textarea
                                    value={absensiCatatan}
                                    onChange={(e) => setAbsensiCatatan(e.target.value)}
                                    rows={3}
                                    placeholder={absensiAction === "rejected" ? "Alasan penolakan..." : "Opsional"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeAbsensiModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={absensiSaving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {absensiSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><CheckCircle className="w-4 h-4" /> Simpan Validasi</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
