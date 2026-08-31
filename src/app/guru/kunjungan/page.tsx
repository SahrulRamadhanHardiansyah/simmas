"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import {
    Loader2, AlertCircle, MapPin, Calendar, Plus, Edit3, Trash2,
    Building2, FileText, Image as ImageIcon, X, CheckCircle, Clock, Search, Upload
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

export default function GuruKunjunganPage() {
    const alertApi = useAlert();

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalKunjungan: 0, bulanIni: 0, dudiDikunjungi: 0 });
    const [loading, setLoading] = useState(true);
    const [dudiOptions, setDudiOptions] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState<"add" | "edit" | "delete" | null>(null);
    const [selected, setSelected] = useState<any>(null);
    const [formData, setFormData] = useState({ tempatMagangId: "", tanggal: "", catatan: "", photoUrl: "" });
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resolvePhotoUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
        return `/uploads/kunjungan/${url}`;
    };

    const fetchKunjungan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guru/Kunjungan?page=1&pageSize=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data || []);
                setStats(result.stats || { totalKunjungan: 0, bulanIni: 0, dudiDikunjungi: 0 });
            } else {
                alertApi.error(result.message || "Gagal memuat kunjungan.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat kunjungan.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDudi = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guru/Kunjungan/dudi`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) setDudiOptions(result.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchKunjungan();
        fetchDudi();
    }, []);

    const filtered = data.filter((k: any) => {
        const q = search.toLowerCase();
        return !q || k.tempatMagang?.namaPerusahaan?.toLowerCase().includes(q) || k.catatan?.toLowerCase().includes(q);
    });

    const openAdd = () => {
        setSelected(null);
        setFormData({ tempatMagangId: "", tanggal: new Date().toISOString().slice(0, 10), catatan: "", photoUrl: "" });
        setModalOpen("add");
    };

    const openEdit = async (row: any) => {
        setSelected(row);
        setFormData({
            tempatMagangId: row.tempatMagang?.tempatMagangId || "",
            tanggal: row.tanggal || "",
            catatan: row.catatan || "",
            photoUrl: row.photoUrl || "",
        });
        setModalOpen("edit");
    };

    const openDelete = (row: any) => {
        setSelected(row);
        setModalOpen("delete");
    };

    const closeModal = () => { setModalOpen(null); setSelected(null); setPhotoFile(null); setPhotoPreview(null); };

    const handleFileSelect = (file: File) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
            alertApi.error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alertApi.error("Ukuran file maksimal 5MB.");
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const removePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormData({ ...formData, photoUrl: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.tempatMagangId) { alertApi.error("Mitra DUDI wajib dipilih."); return; }
        if (!formData.tanggal) { alertApi.error("Tanggal kunjungan wajib diisi."); return; }
        if (!formData.catatan.trim()) { alertApi.error("Catatan evaluasi tidak boleh kosong."); return; }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");

            // Upload photo file first if present
            let uploadedPhotoUrl = formData.photoUrl || null;
            if (photoFile && modalOpen === "add") {
                setUploading(true);
                const uploadForm = new FormData();
                uploadForm.append("file", photoFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
                const uploadResult = await uploadRes.json();
                setUploading(false);
                if (!uploadRes.ok || !uploadResult.status) {
                    alertApi.error(uploadResult.message || "Gagal mengupload foto.");
                    setSaving(false);
                    return;
                }
                uploadedPhotoUrl = uploadResult.data.url;
            }

            const payload = {
                tempatMagangId: formData.tempatMagangId,
                tanggal: formData.tanggal,
                catatan: formData.catatan,
                photoUrl: uploadedPhotoUrl,
            };
            const url = modalOpen === "add"
                ? `${process.env.NEXT_PUBLIC_API_URL}/guru/Kunjungan`
                : `${process.env.NEXT_PUBLIC_API_URL}/guru/Kunjungan/${selected.id}`;
            const method = modalOpen === "add" ? "POST" : "PUT";
            // Update DTO di backend tidak include photoUrl; hapus saat edit
            if (modalOpen === "edit") delete (payload as any).photoUrl;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Kunjungan berhasil disimpan.");
                closeModal();
                fetchKunjungan();
            } else {
                alertApi.error(result.message || "Gagal menyimpan kunjungan.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menyimpan kunjungan.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guru/Kunjungan/${selected.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Kunjungan berhasil dihapus.");
                closeModal();
                fetchKunjungan();
            } else {
                alertApi.error(result.message || "Gagal menghapus kunjungan.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus kunjungan.");
        } finally {
            setSaving(false);
        }
    };

    const grouped = filtered.reduce((acc: any, k: any) => {
        const tgl = k.tanggal;
        if (!acc[tgl]) acc[tgl] = [];
        acc[tgl].push(k);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-6 w-full">

            {/* Header */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Kunjungan Lapangan</h1>
                    <p className="text-sm text-muted-foreground mt-1">Catat hasil kunjungan Anda ke mitra DUDI tempat siswa magang.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Tambah Kunjungan
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { title: "TOTAL KUNJUNGAN", val: stats.totalKunjungan, sub: "Semua catatan", icon: MapPin, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "KUNJUNGAN BULAN INI", val: stats.bulanIni, sub: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }), icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "DUDI DIKUNJUNGI", val: stats.dudiDikunjungi, sub: "Mitra dikunjungi", icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((s, i) => (
                    <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{s.title}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                                <s.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-foreground mb-1">{s.val}</h3>
                            <p className="text-[11px] font-medium text-muted-foreground">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari DUDI / catatan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="bg-background rounded-2xl border border-border p-12 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground mb-1">Belum ada catatan kunjungan</h3>
                    <p className="text-sm text-muted-foreground">Mulai catat kunjungan pertama Anda ke mitra DUDI.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map((tgl) => (
                        <div key={tgl}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">
                                        {new Date(tgl).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{grouped[tgl].length} kunjungan</p>
                                </div>
                            </div>
                            <div className="ml-4 border-l-2 border-dashed border-border pl-6 space-y-4">
                                {grouped[tgl].map((k: any) => (
                                    <div key={k.id} className="relative bg-background rounded-2xl border border-border p-5 shadow-sm hover:border-primary/30 transition-all group">
                                        <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-primary ring-4 ring-background"></div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{k.tempatMagang?.namaPerusahaan || "DUDI"}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(k.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(k)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Edit">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openDelete(k)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors" title="Hapus">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-foreground bg-muted/30 p-3 rounded-xl">
                                            <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                            <p className="leading-relaxed">{k.catatan}</p>
                                        </div>
                                        {k.photoUrl && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxUrl(resolvePhotoUrl(k.photoUrl))}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                    Dokumentasi Kunjungan
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form (Add/Edit) */}
            {(modalOpen === "add" || modalOpen === "edit") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                {modalOpen === "add" ? <><Plus className="w-5 h-5 text-primary" /> Tambah Kunjungan</> : <><Edit3 className="w-5 h-5 text-primary" /> Edit Kunjungan</>}
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
                                    <option value="">-- Pilih DUDI --</option>
                                    {dudiOptions.map((d) => (
                                        <option key={d.id} value={d.id}>{d.namaPerusahaan}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal Kunjungan <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    value={formData.tanggal}
                                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Catatan Evaluasi <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={formData.catatan}
                                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                                    rows={4}
                                    placeholder="Hasil observasi, evaluasi, dan catatan penting..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    required
                                />
                            </div>
                            {modalOpen === "add" && (
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Foto Dokumentasi (opsional)</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                                        className="hidden"
                                    />
                                    {photoPreview ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-border">
                                            <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    className="bg-white/90 text-rose-500 p-2 rounded-full hover:bg-white transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> {photoFile?.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Upload className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-foreground">Klik atau seret foto ke sini</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, atau WebP • Maks. 5MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><CheckCircle className="w-4 h-4" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {modalOpen === "delete" && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                                <Trash2 className="w-7 h-7 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Hapus Catatan Kunjungan?</h3>
                                <p className="text-sm text-muted-foreground mt-1.5">Catatan kunjungan ke <span className="font-semibold text-foreground">{selected.tempatMagang?.namaPerusahaan}</span> pada <span className="font-semibold text-foreground">{selected.tanggal}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button onClick={handleDelete} disabled={saving} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-60">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghapus...</> : <><Trash2 className="w-4 h-4" /> Ya, Hapus</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setLightboxUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-foreground flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={lightboxUrl}
                            alt="Dokumentasi Kunjungan"
                            className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
