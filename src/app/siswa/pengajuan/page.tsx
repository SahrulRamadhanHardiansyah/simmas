"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Loader2, AlertCircle, FileText, Building2, MapPin, X,
    CheckCircle, XCircle, Clock, Plus, Briefcase, Calendar, Send, Search
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

export default function SiswaPengajuanPage() {
    const alertApi = useAlert();
    const [pengajuan, setPengajuan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dudiOptions, setDudiOptions] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        tempatMagangId: "",
        posisi: "",
        tanggalMulai: "",
        tanggalSelesai: "",
    });

    const fetchPengajuan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/PengajuanMagang/siswa/saya`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok) setPengajuan(result.data || null);
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat data pengajuan.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDudi = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/PengajuanMagang/dudi/tersedia`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) setDudiOptions(result.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => { fetchPengajuan(); fetchDudi(); }, []);

    const openModal = () => {
        setFormData({ tempatMagangId: "", posisi: "", tanggalMulai: "", tanggalSelesai: "" });
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.tempatMagangId) { alertApi.error("Mitra DUDI wajib dipilih."); return; }
        if (!formData.posisi.trim()) { alertApi.error("Posisi yang diminati wajib diisi."); return; }
        if (!formData.tanggalMulai || !formData.tanggalSelesai) { alertApi.error("Tanggal mulai & selesai wajib diisi."); return; }
        if (formData.tanggalSelesai < formData.tanggalMulai) { alertApi.error("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/PengajuanMagang/siswa`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Pengajuan berhasil dikirim.");
                closeModal();
                fetchPengajuan();
            } else {
                alertApi.error(result.message || "Gagal mengirim pengajuan.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengirim pengajuan.");
        } finally {
            setSaving(false);
        }
    };

    const statusBadge = (status: string) => {
        if (status === "pending") return { label: "Menunggu Validasi", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Clock };
        if (status === "disetujui" || status === "approved") return { label: "Disetujui", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle };
        if (status === "ditolak" || status === "rejected") return { label: "Ditolak", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: XCircle };
        return { label: status, cls: "text-muted-foreground bg-muted border-border", icon: AlertCircle };
    };

    return (
        <div className="space-y-6 w-full">

            {/* Header */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Pengajuan Magang</h1>
                    <p className="text-sm text-muted-foreground mt-1">Ajukan permohonan magang mandiri ke mitra DUDI pilihan Anda.</p>
                </div>
                {!pengajuan && (
                    <button
                        onClick={openModal}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Ajukan Magang
                    </button>
                )}
            </div>

            {/* Status Tracking Card */}
            <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-foreground mb-1">Status Pengajuan</h3>
                <p className="text-xs text-muted-foreground mb-5">Pantau status pengajuan magang Anda secara real-time.</p>

                {loading ? (
                    <div className="py-10 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : !pengajuan ? (
                    <div className="text-center py-10">
                        <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <h4 className="font-bold text-foreground">Belum Ada Pengajuan</h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Anda belum pernah mengajukan permohonan magang. Klik tombol "Ajukan Magang" untuk memulai.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Timeline / Stepper */}
                        {(() => {
                            const s = pengajuan.status;
                            const isDitolak = s === "ditolak" || s === "rejected";
                            const isDisetujui = s === "disetujui" || s === "approved";
                            const isPending = s === "pending";

                            const steps = [
                                { label: "Pengajuan Diajukan", icon: Send, done: true },
                                { label: "Ditinjau Sekolah", icon: Search, done: isDisetujui || isDitolak },
                                {
                                    label: isDitolak ? "Ditolak" : "Disetujui",
                                    icon: isDitolak ? XCircle : CheckCircle,
                                    done: isDisetujui || isDitolak,
                                },
                            ];
                            // Active step: 0 = submitted (always done), 1 = reviewing (pending), 2 = final
                            const activeIdx = isPending ? 1 : 2;

                            return (
                                <div className="flex items-center justify-between gap-0 px-2">
                                    {steps.map((step, i) => {
                                        const isActive = i === activeIdx && !step.done;
                                        const isDone = step.done;
                                        const isFail = i === 2 && isDitolak;

                                        const circleClass = isFail
                                            ? "bg-rose-500 text-white border-rose-500"
                                            : isDone
                                                ? "bg-emerald-500 text-white border-emerald-500"
                                                : isActive
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500 animate-pulse"
                                                    : "bg-muted text-muted-foreground border-border";

                                        const lineClass = i < steps.length - 1
                                            ? steps[i + 1].done
                                                ? isDitolak && i === 1 ? "bg-rose-500/40" : "bg-emerald-500/40"
                                                : isActive || isDone ? "bg-amber-500/30" : "bg-border"
                                            : "";

                                        return (
                                            <div key={i} className="flex items-center flex-1 last:flex-none">
                                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${circleClass}`}>
                                                        <step.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className={`text-[10px] font-bold tracking-wide text-center leading-tight ${isDone || isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                                {i < steps.length - 1 && (
                                                    <div className={`h-0.5 flex-1 mx-2 rounded-full mb-5 ${lineClass}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Detail info */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-muted/30">
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Perusahaan</p>
                                <p className="text-base font-bold text-foreground mt-0.5">{pengajuan.tempatMagang}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{pengajuan.alamat}</p>
                            </div>
                            {(() => {
                                const badge = statusBadge(pengajuan.status);
                                return (
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.cls}`}>
                                        <badge.icon className="w-4 h-4" />
                                        {badge.label}
                                    </span>
                                );
                            })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-muted/20">
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Posisi</p>
                                <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{pengajuan.posisi || "-"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/20">
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Tanggal Pengajuan</p>
                                <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{new Date(pengajuan.tanggalPengajuan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/20">
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">ID Pengajuan</p>
                                <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{pengajuan.id}</p>
                            </div>
                        </div>

                        {(pengajuan.status === "ditolak" || pengajuan.status === "rejected") && pengajuan.catatanPenilaian && (
                            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" /> Alasan Penolakan
                                </p>
                                <p className="text-sm text-foreground">{pengajuan.catatanPenilaian}</p>
                            </div>
                        )}

                        {(pengajuan.status === "disetujui" || pengajuan.status === "approved") && (
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                <p className="text-sm text-foreground flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    Selamat! Pengajuan Anda telah disetujui. Silakan cek dashboard untuk melihat detail penempatan.
                                </p>
                            </div>
                        )}

                        {pengajuan.status === "pending" && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <p className="text-sm text-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                    Pengajuan Anda sedang dalam antrian validasi admin. Mohon menunggu 1-3 hari kerja.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Form Pengajuan */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> Form Pengajuan Magang
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mitra DUDI <span className="text-rose-500">*</span></label>
                                <select
                                    value={formData.tempatMagangId}
                                    onChange={(e) => setFormData({ ...formData, tempatMagangId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                >
                                    <option value="">-- Pilih Mitra DUDI --</option>
                                    {dudiOptions.map((d) => (
                                        <option key={d.id} value={d.id} disabled={d.sisaKuota <= 0}>
                                            {d.namaPerusahaan} — Sisa Kuota: {d.sisaKuota}/{d.kuota}
                                            {d.sisaKuota <= 0 ? " (Penuh)" : ""}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-muted-foreground mt-1.5">Pilih perusahaan tempat Anda ingin melaksanakan magang.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Posisi yang Diminati <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.posisi}
                                    onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                                    placeholder="Contoh: Web Developer, Admin Gudang, dll."
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal Mulai <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.tanggalMulai}
                                        onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal Selesai <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.tanggalSelesai}
                                        onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-foreground flex gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span>Pengajuan akan divalidasi oleh admin sekolah. Setelah disetujui, Anda akan ditempatkan di perusahaan tersebut dan tidak dapat mengajukan ulang.</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : <><FileText className="w-4 h-4" /> Kirim Pengajuan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
