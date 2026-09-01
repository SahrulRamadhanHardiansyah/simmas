"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    GraduationCap, Users, Search, Filter, Edit3, Trash2,
    Loader2, Plus, AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function AdminKelasPage() {
    const alertApi = useAlert();
    const [data, setData] = useState<any[]>([]);
    const [jurusanList, setJurusanList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [filterJurusan, setFilterJurusan] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeModal, setActiveModal] = useState<"add" | "edit" | "delete" | null>(null);
    const [selected, setSelected] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({ namaKelas: "", tingkat: "", jurusanId: "" });

    const fetchKelas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append("search", debouncedSearch);
            if (filterJurusan) queryParams.append("jurusanId", filterJurusan);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Kelas?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) setData(result.data);
        } catch (err) {
            console.error("Gagal mengambil data kelas", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchJurusan = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Jurusan`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) setJurusanList(result.data);
        } catch (err) {
            console.error("Gagal mengambil data jurusan", err);
        }
    };

    useEffect(() => { fetchKelas(); }, [debouncedSearch, filterJurusan]);
    useEffect(() => { fetchJurusan(); }, []);

    const totalKelas = data.length;
    const totalSiswa = data.reduce((sum: number, k: any) => sum + (k.jumlahSiswa || 0), 0);

    const totalPages = Math.ceil(data.length / pageSize) || 1;
    const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedData.map((r: any) => r.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Yakin ingin menghapus ${selectedIds.size} kelas terpilih?`)) return;
        setFormLoading(true);
        const token = localStorage.getItem("token");
        let failed = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Kelas/${id}`, {
                    method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) failed++;
            } catch { failed++; }
        }
        if (failed > 0) alertApi.error(`${failed} data gagal dihapus (mungkin masih ada siswa).`);
        setSelectedIds(new Set());
        fetchKelas();
        setFormLoading(false);
    };

    const openModal = (type: typeof activeModal, kelas?: any) => {
        setSelected(kelas || null);
        if (type === "add") setFormData({ namaKelas: "", tingkat: "", jurusanId: "" });
        else if (kelas) setFormData({ namaKelas: kelas.namaKelas, tingkat: kelas.tingkat, jurusanId: String(kelas.jurusanId) });
        setActiveModal(type);
    };

    const closeModal = () => { setActiveModal(null); setSelected(null); };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const isEdit = activeModal === "edit";
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Kelas${isEdit ? `/${selected.id}` : ""}`, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    namaKelas: formData.namaKelas,
                    tingkat: formData.tingkat,
                    jurusanId: parseInt(formData.jurusanId)
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchKelas();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menyimpan kelas.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Kelas/${selected.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchKelas();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus kelas.");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: "TOTAL KELAS", val: totalKelas, sub: "Kelas terdaftar", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "TOTAL SISWA", val: totalSiswa, sub: "Siswa dari kelas terfilter", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "TOTAL JURUSAN", val: jurusanList.length, sub: "Jurusan tersedia", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">{stat.title}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold text-foreground mb-1">{stat.val}</h3>
                            )}
                            <p className="text-xs font-medium text-muted-foreground">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. SECTION PENCARIAN & FILTER */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama kelas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterJurusan}
                            onChange={(e) => setFilterJurusan(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="">Semua Jurusan</option>
                            {jurusanList.map((j: any) => (
                                <option key={j.id} value={j.id}>{j.singkatan} — {j.namaJurusan}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-sm font-medium text-muted-foreground">{data.length} Kelas</span>
                    <button
                        onClick={() => openModal("add")}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Tambah Kelas
                    </button>
                </div>
            </div>

            {/* 3. SECTION TABEL */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-4 py-4 text-center">
                                    <input type="checkbox" checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length} onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Nama Kelas</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Tingkat</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Jurusan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Jumlah Siswa</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data kelas...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter jurusan.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <GraduationCap className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-foreground">{row.namaKelas}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                                {row.tingkat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-foreground">{row.jurusan}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{row.jurusanSingkatan}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${row.jumlahSiswa > 0 ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                                                {row.jumlahSiswa}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Data">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("delete", row)} className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Hapus Data">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bulk Delete Bar */}
                {selectedIds.size > 0 && (
                    <div className="border-t border-border p-3 bg-rose-500/5 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-foreground">{selectedIds.size} data dipilih</span>
                        <button onClick={handleBulkDelete} disabled={formLoading}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Hapus Terpilih
                        </button>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Menampilkan {data.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, data.length)} dari {data.length} data</span>
                        <span className="hidden sm:inline-block w-px h-4 bg-border"></span>
                        <div className="flex items-center gap-2">
                            <label>Baris per halaman:</label>
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none">
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-2">{page} <span className="text-muted-foreground">/ {totalPages}</span></span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={closeModal} />

                    <div className="relative bg-background w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* 1. MODAL TAMBAH / EDIT KELAS */}
                        {(activeModal === "add" || activeModal === "edit") && (
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        {activeModal === "add" ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">{activeModal === "add" ? "Tambah Kelas" : "Edit Kelas"}</h2>
                                        <p className="text-xs text-muted-foreground">Kelola data kelas yang tersedia di sekolah.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Kelas</label>
                                        <input type="text" required maxLength={30} value={formData.namaKelas} onChange={e => setFormData({ ...formData, namaKelas: e.target.value })}
                                            placeholder="XII RPL 1"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Tingkat</label>
                                            <select required value={formData.tingkat} onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                                <option value="">Pilih Tingkat</option>
                                                <option value="X">X</option>
                                                <option value="XI">XI</option>
                                                <option value="XII">XII</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Jurusan</label>
                                            <select required value={formData.jurusanId} onChange={e => setFormData({ ...formData, jurusanId: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                                <option value="">Pilih Jurusan</option>
                                                {jurusanList.map((j: any) => (
                                                    <option key={j.id} value={j.id}>{j.singkatan} — {j.namaJurusan}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {activeModal === "add" ? "Simpan Kelas" : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 2. MODAL HAPUS */}
                        {activeModal === "delete" && (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-extrabold text-foreground mb-2">Hapus Kelas?</h2>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Apakah Anda yakin ingin menghapus kelas <span className="font-bold text-foreground">{selected?.namaKelas}</span>? Tindakan ini tidak dapat dibatalkan. Penghapusan akan gagal jika masih ada siswa di kelas ini.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button onClick={handleDelete} disabled={formLoading} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ya, Hapus Kelas
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}
