"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
import {
    Loader2, AlertCircle, FileText, Calendar, Plus, Edit3, Trash2,
    Image as ImageIcon, X, CheckCircle, MessageSquareWarning, RefreshCw, Upload
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

export default function SiswaJurnalPage() {
    const alertApi = useAlert();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<any | null>(null);
    const [selected, setSelected] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        kegiatan: "",
        kendala: "",
        tindakLanjut: "",
        photoUrl: "",
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resolvePhotoUrl = (url: string | null, folder: string = "jurnal") => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        if (url.startsWith("/")) return url;
        return `/uploads/${folder}/${url}`;
    };

    const fetchJurnal = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/siswa/saya?page=1&pageSize=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) setData(result.data || []);
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat jurnal.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJurnal(); }, []);

    const filtered = data.filter((j: any) => {
        const q = search.toLowerCase();
        return !q || j.kegiatan?.toLowerCase().includes(q) || j.kendala?.toLowerCase().includes(q) || j.tindakLanjut?.toLowerCase().includes(q);
    });

    const openTambah = () => {
        setSelected(null);
        setFormData({ tanggal: new Date().toISOString().slice(0, 10), kegiatan: "", kendala: "", tindakLanjut: "", photoUrl: "" });
        setPhotoFile(null);
        setPhotoPreview(null);
        setModalOpen(true);
    };

    const openEdit = (row: any) => {
        if (row.statusVerifikasi === "disetujui") {
            alertApi.warning("Jurnal yang sudah disetujui tidak dapat diedit.");
            return;
        }
        setSelected(row);
        setFormData({
            tanggal: row.tanggal,
            kegiatan: row.kegiatan || "",
            kendala: row.kendala || "",
            tindakLanjut: row.tindakLanjut || "",
            photoUrl: row.photoUrl || "",
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.kegiatan.trim().length < 15) {
            alertApi.error("Uraian kegiatan minimal 15 karakter.");
            return;
        }
        if (!formData.tanggal) { alertApi.error("Tanggal wajib diisi."); return; }

        setSaving(true);
        let uploadedPhotoUrl = formData.photoUrl;

        if (photoFile) {
            setUploading(true);
            const uploadForm = new FormData();
            uploadForm.append("file", photoFile);
            uploadForm.append("folder", "jurnal");

            try {
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
                const uploadResult = await uploadRes.json();
                if (!uploadRes.ok || !uploadResult.status) {
                    alertApi.error(uploadResult.message || "Gagal mengupload foto.");
                    setUploading(false);
                    setSaving(false);
                    return;
                }
                uploadedPhotoUrl = uploadResult.data.url;
            } catch (err: any) {
                alertApi.error("Terjadi kesalahan saat upload foto.");
                setUploading(false);
                setSaving(false);
                return;
            }
            setUploading(false);
        }

        try {
            const token = localStorage.getItem("token");
            const payload = { ...formData, photoUrl: uploadedPhotoUrl || null };
            const url = selected
                ? `${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/siswa/${selected.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/siswa`;
            const method = selected ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Jurnal berhasil disimpan.");
                closeModal();
                fetchJurnal();
            } else {
                alertApi.error(result.message || "Gagal menyimpan jurnal.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menyimpan jurnal.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/JurnalHarian/siswa/${deleteModal.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Jurnal berhasil dihapus.");
                setDeleteModal(null);
                fetchJurnal();
            } else {
                alertApi.error(result.message || "Gagal menghapus jurnal.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus jurnal.");
        } finally {
            setSaving(false);
        }
    };

    const statusBadge = (s: string) => {
        if (s === "pending") return { label: "Menunggu", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: Loader2 };
        if (s === "disetujui") return { label: "Disetujui", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle };
        if (s === "revisi") return { label: "Perlu Revisi", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: RefreshCw };
        return { label: s, cls: "text-muted-foreground bg-muted border-border", icon: AlertCircle };
    };

    return (
        <div className="space-y-6 w-full">

            {/* Header */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Jurnal Kegiatan</h1>
                    <p className="text-sm text-muted-foreground mt-1">Catat aktivitas harianmu selama magang. Jurnal akan divalidasi oleh guru pembimbing.</p>
                </div>
                <button
                    onClick={openTambah}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Tulis Jurnal
                </button>
            </div>

            {/* Search */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari kegiatan / kendala / solusi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Tabel */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kegiatan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kendala & Solusi</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Foto</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Catatan Guru</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Memuat jurnal...</p></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center">
                                    <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-foreground">Belum ada jurnal.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Mulai tulis jurnal kegiatan harianmu.</p>
                                </td></tr>
                            ) : filtered.map((j: any) => {
                                const b = statusBadge(j.statusVerifikasi);
                                return (
                                    <tr key={j.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold text-foreground">{new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-foreground line-clamp-3">{j.kegiatan}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs space-y-1">
                                            {j.kendala && <p className="text-xs text-rose-500/80 line-clamp-2">⚠ {j.kendala}</p>}
                                            {j.tindakLanjut && <p className="text-xs text-emerald-500/80 line-clamp-2">✓ {j.tindakLanjut}</p>}
                                            {!j.kendala && !j.tindakLanjut && <span className="text-xs text-muted-foreground">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {j.photoUrl ? (
                                                <a href={resolvePhotoUrl(j.photoUrl) as string} target="_blank" rel="noreferrer" className="inline-flex w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 items-center justify-center hover:bg-blue-500 hover:text-white transition-colors" title="Lihat foto">
                                                    <ImageIcon className="w-4 h-4" />
                                                </a>
                                            ) : <span className="text-xs text-muted-foreground">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${b.cls}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{b.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {j.komentarGuru ? (
                                                <p className="text-xs text-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 line-clamp-3 flex gap-1.5">
                                                    <MessageSquareWarning className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    {j.komentarGuru}
                                                </p>
                                            ) : <span className="text-xs text-muted-foreground italic">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {j.statusVerifikasi !== "disetujui" && (
                                                    <>
                                                        <button onClick={() => openEdit(j)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="Edit">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setDeleteModal(j)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors" title="Hapus">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {j.statusVerifikasi === "disetujui" && <span className="text-xs text-muted-foreground italic">Terkunci</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tulis/Edit Jurnal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                {selected ? <><Edit3 className="w-5 h-5 text-primary" /> Edit Jurnal</> : <><Plus className="w-5 h-5 text-primary" /> Tulis Jurnal</>}
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    value={formData.tanggal}
                                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Uraian Kegiatan <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={formData.kegiatan}
                                    onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                                    rows={4}
                                    placeholder="Jelaskan secara detail kegiatan yang Anda lakukan hari ini (min. 15 karakter)..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground mt-1.5">{formData.kegiatan.length} karakter (min. 15)</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Kendala / Masalah</label>
                                <textarea
                                    value={formData.kendala}
                                    onChange={(e) => setFormData({ ...formData, kendala: e.target.value })}
                                    rows={2}
                                    placeholder="Kendala yang Anda hadapi (opsional)..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tindak Lanjut / Solusi</label>
                                <textarea
                                    value={formData.tindakLanjut}
                                    onChange={(e) => setFormData({ ...formData, tindakLanjut: e.target.value })}
                                    rows={2}
                                    placeholder="Bagaimana Anda menyelesaikan masalah tersebut (opsional)..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Foto Bukti Pekerjaan <span className="text-muted-foreground/60 normal-case">(Opsional)</span></label>
                                <div
                                    className={`relative w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                                        photoPreview ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                    }`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            const file = e.dataTransfer.files[0];
                                            setPhotoFile(file);
                                            setPhotoPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setPhotoFile(file);
                                                setPhotoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    {photoPreview ? (
                                        <div className="relative inline-block">
                                            <img src={photoPreview} alt="Preview" className="max-h-32 rounded-lg object-contain mx-auto shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPhotoFile(null);
                                                    setPhotoPreview(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : formData.photoUrl ? (
                                        <div className="relative inline-block">
                                            <img src={resolvePhotoUrl(formData.photoUrl) as string} alt="Tersimpan" className="max-h-32 rounded-lg object-contain mx-auto shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, photoUrl: "" });
                                                }}
                                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <p className="text-[10px] text-muted-foreground mt-2">Foto saat ini</p>
                                        </div>
                                    ) : (
                                        <div className="py-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">Klik atau tarik foto ke sini</p>
                                            <p className="text-xs text-muted-foreground mt-1">Maks. 5MB (JPG, PNG, WebP)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selected?.komentarGuru && (
                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <MessageSquareWarning className="w-3.5 h-3.5" /> Catatan Guru (Revisi)
                                    </p>
                                    <p className="text-sm text-foreground">{selected.komentarGuru}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {(saving || uploading) ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? "Mengupload..." : "Menyimpan..."}</> : <><CheckCircle className="w-4 h-4" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Alert Konfirmasi Hapus */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
                                <Trash2 className="w-7 h-7 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Hapus Laporan Jurnal?</h3>
                                <p className="text-sm text-muted-foreground mt-1.5">Laporan kegiatan tanggal <span className="font-semibold text-foreground">{new Date(deleteModal.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button onClick={handleDelete} disabled={saving} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold flex items-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-60">
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghapus...</> : <><Trash2 className="w-4 h-4" /> Ya, Hapus</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
