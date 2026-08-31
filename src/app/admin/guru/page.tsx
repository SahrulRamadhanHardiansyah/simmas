"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Users, UserCheck, UserPlus, Search, Filter,
    Edit3, Trash2, RefreshCcw, Loader2, Key, CheckCircle,
    X, ChevronLeft, ChevronRight, AlertCircle, Copy, Check
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

const JURUSAN_OPTIONS = [
    "Teknik Elektronika (TE)",
    "Teknik Ketenagalistrikan (TK)",
    "Teknik Jaringan Komputer dan Telekomunikasi (TJKT)",
    "Pengembangan Perangkat Lunak dan Gim (PPLG)",
    "Broadcasting dan Perfilman (BP)",
    "Desain dan Produksi Busana",
    "Ototronika",
    "Mekatronika",
];

export default function AdminGuruPage() {
    const alertApi = useAlert();
    const [stats, setStats] = useState({ totalGuru: 0, guruAktif: 0, rataRataBimbingan: 0 });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [jurusan, setJurusan] = useState("");
    const [isActive, setIsActive] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeModal, setActiveModal] = useState<"add" | "edit" | "status" | "delete" | "creds" | null>(null);
    const [selectedGuru, setSelectedGuru] = useState<any>(null);
    const [newCreds, setNewCreds] = useState<{ email: string, passwordSementara: string } | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", nip: "", jurusan: JURUSAN_OPTIONS[0], isActive: true });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchGuru = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append("search", debouncedSearch);
            if (jurusan) queryParams.append("jurusan", jurusan);
            if (isActive !== "") queryParams.append("isActive", isActive);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data);
                setStats(result.stats);
                setPage(1);
            }
        } catch (err) {
            console.error("Gagal mengambil data guru", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuru();
    }, [debouncedSearch, jurusan, isActive]);

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
        if (!confirm(`Yakin ingin menghapus ${selectedIds.size} guru terpilih?`)) return;
        setFormLoading(true);
        const token = localStorage.getItem("token");
        let failed = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru/${id}`, {
                    method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) failed++;
            } catch { failed++; }
        }
        if (failed > 0) alertApi.error(`${failed} data gagal dihapus (mungkin masih memiliki siswa bimbingan).`);
        setSelectedIds(new Set());
        fetchGuru();
        setFormLoading(false);
    };

    const openModal = (type: typeof activeModal, guru?: any) => {
        setSelectedGuru(guru || null);
        if (type === "add") {
            setFormData({ name: "", nip: "", jurusan: JURUSAN_OPTIONS[0], isActive: true });
        } else if (guru) {
            setFormData({ name: guru.name, nip: guru.nip, jurusan: guru.jurusan, isActive: guru.isActive });
        }
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedGuru(null);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmitAdd = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: formData.name, nip: formData.nip, jurusan: formData.jurusan })
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message);

            if (result.status) {
                setNewCreds(result.data);
                fetchGuru();
                setActiveModal("creds");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menambah guru.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru/${selectedGuru.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: formData.name })
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message);

            fetchGuru();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengedit guru.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitStatus = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru/${selectedGuru.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ isActive: formData.isActive })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchGuru();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengubah status.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru/${selectedGuru.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchGuru();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus guru. Pastikan guru tidak memiliki siswa bimbingan aktif.");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Total Guru Pembimbing</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-foreground mb-1">{stats.totalGuru}</h3>
                        <p className="text-xs font-medium text-muted-foreground">Guru terdaftar</p>
                    </div>
                </div>
                <div className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Guru Aktif</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-foreground mb-1">{stats.guruAktif}</h3>
                        <p className="text-xs font-medium text-muted-foreground">Siap membimbing</p>
                    </div>
                </div>
                <div className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Rata-Rata Bimbingan</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold text-foreground mb-1">{stats.rataRataBimbingan}</h3>
                        <p className="text-xs font-medium text-muted-foreground">Siswa per guru</p>
                    </div>
                </div>
            </div>

            {/* 2. SECTION PENCARIAN & FILTER */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Search Box */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Filter Jurusan */}
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={jurusan}
                            onChange={(e) => setJurusan(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="">Semua Jurusan</option>
                            {JURUSAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    {/* Filter Status */}
                    <select
                        value={isActive}
                        onChange={(e) => setIsActive(e.target.value)}
                        className="w-full sm:w-40 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="">Semua Status</option>
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-sm font-medium text-muted-foreground">{data.length} Guru</span>
                    <button
                        onClick={() => openModal("add")}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" /> Tambah Guru
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
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">NIP</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Nama Lengkap</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Jurusan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Bimbingan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data guru...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">
                                            {row.nip}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {row.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{row.name}</p>
                                                    <p className="text-xs text-muted-foreground">{row.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {row.jurusan.match(/\(([^)]+)\)/)?.[1] || row.jurusan} {/* Tampilkan singkatannya saja jika ada */}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
                                                <Users className="w-3.5 h-3.5" /> {row.jumlahSiswaBimbinganAktif}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${row.isActive ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                {row.isActive ? 'Aktif' : 'Nonaktif'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Data">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("status", row)} className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Ubah Status">
                                                    <RefreshCcw className="w-4 h-4" />
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
                        <span>Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.length)} dari {data.length} data</span>
                        <span className="hidden sm:inline-block w-px h-4 bg-border"></span>
                        <div className="flex items-center gap-2">
                            <label>Baris per halaman:</label>
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none">
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}

            {/* Overlay Universal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => activeModal !== 'creds' && closeModal()} />

                    <div className="relative bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* 1. MODAL TAMBAH & EDIT */}
                        {(activeModal === "add" || activeModal === "edit") && (
                            <form onSubmit={activeModal === "add" ? handleSubmitAdd : handleSubmitEdit}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        {activeModal === "add" ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">{activeModal === "add" ? "Tambah Guru Pembimbing" : "Edit Data Guru Pembimbing"}</h2>
                                        <p className="text-xs text-muted-foreground">{activeModal === "add" ? "Akun login otomatis dibuat dari email sekolah." : "Perbarui informasi dasar akun guru terkait."}</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Lengkap & Gelar</label>
                                        <input
                                            type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Drs. Ahmad Fauzi, M.Kom."
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">NIP (Nomor Induk Pegawai)</label>
                                        <input
                                            type="text" required maxLength={18} pattern="\d{18}" title="NIP harus 18 digit angka"
                                            value={formData.nip}
                                            onChange={e => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })}
                                            readOnly={activeModal === "edit"}
                                            placeholder="18 digit angka"
                                            className={`w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${activeModal === 'edit' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'bg-background'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kompetensi Keahlian / Jurusan</label>
                                        <select
                                            required value={formData.jurusan} onChange={e => setFormData({ ...formData, jurusan: e.target.value })}
                                            disabled={activeModal === "edit"} // Sesuai DTO backend yang hanya nerima Name
                                            className={`w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none ${activeModal === 'edit' ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'bg-background'}`}
                                        >
                                            {JURUSAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        {activeModal === "edit" && <p className="text-[10px] text-muted-foreground mt-1">Jurusan tidak dapat diubah setelah pendaftaran.</p>}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {activeModal === "add" ? "Simpan Guru" : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 2. MODAL KREDENSIAL BARU */}
                        {activeModal === "creds" && newCreds && (
                            <div className="text-center">
                                <div className="p-8 pb-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                                        <Key className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-xl font-extrabold text-foreground mb-2">Akun Guru Berhasil Dibuat</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Catat kredensial ini dan sampaikan ke guru yang bersangkutan secara aman.</p>

                                    <div className="space-y-4 text-left">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Email Akun</label>
                                            <div className="flex items-center gap-2">
                                                <input type="text" readOnly value={newCreds.email} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-medium" />
                                                <button onClick={() => handleCopy(newCreds.email, "email")} className="p-2.5 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                                                    {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Password Sementara</label>
                                            <div className="flex items-center gap-2">
                                                <input type="text" readOnly value={newCreds.passwordSementara} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-medium" />
                                                <button onClick={() => handleCopy(newCreds.passwordSementara, "pass")} className="p-2.5 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors">
                                                    {copiedField === "pass" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <button onClick={() => { closeModal(); setNewCreds(null); }} className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90">
                                        Selesai
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. MODAL UBAH STATUS */}
                        {activeModal === "status" && (
                            <form onSubmit={handleSubmitStatus}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Ubah Status Guru</h2>
                                        <p className="text-xs text-muted-foreground">Perbarui status aktif untuk akses login.</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <select
                                        value={formData.isActive ? "true" : "false"}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.value === "true" })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    >
                                        <option value="true">Aktif</option>
                                        <option value="false">Nonaktif</option>
                                    </select>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-foreground text-background rounded-xl text-sm font-bold flex items-center gap-2">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 4. MODAL HAPUS (ALERT DIALOG) */}
                        {activeModal === "delete" && (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-extrabold text-foreground mb-2">Hapus Data Guru Pembimbing?</h2>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Apakah Anda yakin ingin menghapus data <span className="font-bold text-foreground">{selectedGuru?.name}</span>? Tindakan ini akan menghapus akun login terkait dan tidak dapat dibatalkan.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button onClick={handleDelete} disabled={formLoading} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ya, Hapus Guru
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