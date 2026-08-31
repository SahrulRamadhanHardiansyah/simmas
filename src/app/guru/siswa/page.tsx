"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Users, Search, Loader2, AlertCircle, Award, MapPin, X,
    Edit3, CheckCircle, Briefcase
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

export default function GuruSiswaPage() {
    const alertApi = useAlert();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [nilai, setNilai] = useState<string>("");
    const [saving, setSaving] = useState(false);

    const fetchSiswa = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guru/SiswaBimbingan`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data || []);
            } else {
                alertApi.error(result.message || "Gagal memuat data siswa bimbingan.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSiswa(); }, []);

    const filtered = data.filter((s: any) => {
        const q = search.toLowerCase();
        return !q || s.name?.toLowerCase().includes(q) || s.nis?.toLowerCase().includes(q)
            || s.kelas?.toLowerCase().includes(q) || s.tempatMagang?.namaPerusahaan?.toLowerCase().includes(q);
    });

    const openModal = (row: any) => {
        setSelected(row);
        setNilai(row.nilaiAkhir != null ? String(row.nilaiAkhir) : "");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelected(null);
        setNilai("");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        const val = parseFloat(nilai);
        if (Number.isNaN(val) || val < 0 || val > 100) {
            alertApi.error("Nilai akhir harus berada pada rentang 0–100.");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guru/SiswaBimbingan/${selected.penempatanId}/nilai`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ NilaiAkhir: val }),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Nilai akhir berhasil disimpan.");
                closeModal();
                fetchSiswa();
            } else {
                alertApi.error(result.message || "Gagal menyimpan nilai.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menyimpan nilai.");
        } finally {
            setSaving(false);
        }
    };

    const getNilaiBadge = (n: any) => {
        if (n == null) return null;
        const num = Number(n);
        const cls = num >= 85 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
            num >= 70 ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                num >= 60 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                    "text-rose-500 bg-rose-500/10 border-rose-500/20";
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cls}`}>
                <Award className="w-3 h-3" /> {num}
            </span>
        );
    };

    return (
        <div className="space-y-6 w-full">

            {/* Header */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Siswa Bimbingan</h1>
                    <p className="text-sm text-muted-foreground mt-1">Kelola siswa magang yang menjadi bimbingan Anda.</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIS, kelas, DUDI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{filtered.length} Siswa</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Siswa</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kelas</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tempat Magang</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Nilai Akhir</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Memuat data...</p></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center">
                                    <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-foreground">Tidak ada siswa bimbingan ditemukan.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Coba ubah kata kunci pencarian Anda.</p>
                                </td></tr>
                            ) : filtered.map((row: any) => (
                                <tr key={row.penempatanId} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                {row.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{row.name}</p>
                                                <p className="text-xs text-muted-foreground">{row.nis}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{row.kelas}</td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                                {row.tempatMagang?.namaPerusahaan || "-"}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-start gap-1 max-w-xs">
                                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />{row.tempatMagang?.alamat || "-"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase text-blue-500 bg-blue-500/10 border-blue-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            {row.statusMagang}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.nilaiAkhir != null ? getNilaiBadge(row.nilaiAkhir) :
                                            <span className="text-xs text-muted-foreground italic">Belum dinilai</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => openModal(row)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                                        >
                                            {row.nilaiAkhir != null ? <><Edit3 className="w-3.5 h-3.5" /> Revisi Nilai</> : <><Award className="w-3.5 h-3.5" /> Beri Nilai</>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Penilaian */}
            {modalOpen && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                {selected.nilaiAkhir != null ? "Revisi Nilai Akhir" : "Beri Nilai Akhir"}
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    {selected.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{selected.name}</p>
                                    <p className="text-xs text-muted-foreground">{selected.nis} • {selected.kelas}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                    Nilai Akhir (0–100)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    value={nilai}
                                    onChange={(e) => setNilai(e.target.value)}
                                    placeholder="Contoh: 85.50"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Masukkan nilai dengan rentang 0 sampai 100.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60"
                                >
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><CheckCircle className="w-4 h-4" /> Simpan Nilai</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
