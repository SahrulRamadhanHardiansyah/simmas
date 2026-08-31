"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Building2, CheckCircle, Clock, Users, Search, Filter,
    Edit3, Trash2, RefreshCcw, Loader2, Plus, Phone, MapPin,
    X, ChevronLeft, ChevronRight, AlertTriangle
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

export default function AdminDudiPage() {
    const alertApi = useAlert();
    const [stats, setStats] = useState({ totalMitraDudi: 0, terverifikasi: 0, menungguValidasi: 0, siswaDitempatkan: 0 });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeModal, setActiveModal] = useState<"add" | "edit" | "status" | "delete" | null>(null);
    const [selectedDudi, setSelectedDudi] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        namaPerusahaan: "",
        bidangUsaha: "",
        penanggungJawab: "",
        kontak: "",
        kuota: 0,
        isValidated: true,
        alamat: ""
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchDudi = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append("search", debouncedSearch);
            if (filterStatus !== "") queryParams.append("isValidated", filterStatus);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data);
                setStats(result.stats);
                setPage(1);
            }
        } catch (err) {
            console.error("Gagal mengambil data DUDI", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDudi();
    }, [debouncedSearch, filterStatus]);

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
        if (!confirm(`Yakin ingin menghapus ${selectedIds.size} mitra DUDI terpilih?`)) return;
        setFormLoading(true);
        const token = localStorage.getItem("token");
        let failed = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi/${id}`, {
                    method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) failed++;
            } catch { failed++; }
        }
        if (failed > 0) alertApi.error(`${failed} data gagal dihapus (mungkin masih memiliki siswa aktif).`);
        setSelectedIds(new Set());
        fetchDudi();
        setFormLoading(false);
    };

    const openModal = (type: typeof activeModal, dudi?: any) => {
        setSelectedDudi(dudi || null);
        if (type === "add") {
            setFormData({ namaPerusahaan: "", bidangUsaha: "", penanggungJawab: "", kontak: "", kuota: 0, isValidated: true, alamat: "" });
        } else if (dudi) {
            setFormData({
                namaPerusahaan: dudi.namaPerusahaan,
                bidangUsaha: dudi.bidangUsaha,
                penanggungJawab: dudi.penanggungJawab,
                kontak: dudi.kontak,
                kuota: dudi.kuota,
                isValidated: dudi.isValidated,
                alamat: dudi.alamat
            });
        }
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedDudi(null);
    };

    const handleSubmitAdd = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchDudi();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menambah mitra DUDI.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi/${selectedDudi.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchDudi();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengedit mitra DUDI.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitStatus = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi/${selectedDudi.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ isValidated: formData.isValidated })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchDudi();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengubah status verifikasi.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi/${selectedDudi.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchDudi();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus mitra DUDI. Pastikan tidak ada siswa aktif magang di perusahaan ini.");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "TOTAL MITRA DUDI", val: stats.totalMitraDudi, sub: "Perusahaan terdaftar", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "TERVERIFIKASI", val: stats.terverifikasi, sub: "Siap menerima siswa", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "MENUNGGU VALIDASI", val: stats.menungguValidasi, sub: "Perlu ditinjau", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { title: "SISWA DITEMPATKAN", val: stats.siswaDitempatkan, sub: "Magang aktif", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
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
                    {/* Search Box */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari perusahaan, alamat, atau PIC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Filter Status */}
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            <option value="true">Terverifikasi</option>
                            <option value="false">Belum Diverifikasi</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-sm font-medium text-muted-foreground">{data.length} DUDI</span>
                    <button
                        onClick={() => openModal("add")}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Tambah DUDI
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
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Perusahaan</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">PIC & Kontak</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Bidang Usaha</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Kuota</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Siswa Aktif</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data mitra DUDI...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
                                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{row.namaPerusahaan}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {row.alamat?.length > 30 ? row.alamat.substring(0, 30) + "..." : row.alamat}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-foreground">{row.penanggungJawab}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {row.kontak}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-foreground">
                                            {row.bidangUsaha}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                                {row.kuota}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${row.siswaAktif > 0 ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                                                <Users className={`w-3.5 h-3.5 ${row.siswaAktif > 0 ? "text-blue-600" : "text-muted-foreground"}`} />
                                                {row.siswaAktif}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${row.isValidated
                                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${row.isValidated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                {row.isValidated ? 'Terverifikasi' : 'Belum Diverifikasi'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Data">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("status", row)} className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Ubah Status Verifikasi">
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
                        <span>Menampilkan {data.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, data.length)} dari {data.length} data</span>
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
                        <button disabled={page === 1} onClick={() => setPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
                        </button>
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-2">{page} <span className="text-muted-foreground">/ {totalPages}</span></span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={closeModal} />

                    <div className="relative bg-background w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* 1. MODAL TAMBAH DUDI */}
                        {activeModal === "add" && (
                            <form onSubmit={handleSubmitAdd}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Tambah Mitra Industri (DUDI)</h2>
                                        <p className="text-xs text-muted-foreground">Daftarkan mitra DUDI baru sebagai tempat magang siswa.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Perusahaan</label>
                                            <input type="text" required value={formData.namaPerusahaan} onChange={e => setFormData({ ...formData, namaPerusahaan: e.target.value })}
                                                placeholder="PT. Universal Big Data"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Bidang Usaha</label>
                                            <input type="text" required value={formData.bidangUsaha} onChange={e => setFormData({ ...formData, bidangUsaha: e.target.value })}
                                                placeholder="Software House / IT"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama PIC</label>
                                            <input type="text" required value={formData.penanggungJawab} onChange={e => setFormData({ ...formData, penanggungJawab: e.target.value })}
                                                placeholder="Budi Hermawan"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kontak PIC (WA/Telp)</label>
                                            <input type="text" required value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })}
                                                placeholder="081234567890"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kuota Magang (Siswa)</label>
                                            <input type="number" required min={0} value={formData.kuota} onChange={e => setFormData({ ...formData, kuota: parseInt(e.target.value) || 0 })}
                                                placeholder="5"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Status Verifikasi</label>
                                            <select value={formData.isValidated ? "true" : "false"} onChange={e => setFormData({ ...formData, isValidated: e.target.value === "true" })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                                <option value="true">Terverifikasi (Aktif)</option>
                                                <option value="false">Belum Diverifikasi</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Alamat Lengkap Perusahaan</label>
                                        <textarea required value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                            placeholder="Jl. Raya Surabaya - Malang No. 45, Sidoarjo, Jawa Timur"
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Simpan Mitra DUDI
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 2. MODAL EDIT DUDI */}
                        {activeModal === "edit" && (
                            <form onSubmit={handleSubmitEdit}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Edit Mitra Industri</h2>
                                        <p className="text-xs text-muted-foreground">Ubah rincian profil perusahaan mitra magang.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Perusahaan</label>
                                        <input type="text" required value={formData.namaPerusahaan} onChange={e => setFormData({ ...formData, namaPerusahaan: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Bidang Usaha</label>
                                            <input type="text" required value={formData.bidangUsaha} onChange={e => setFormData({ ...formData, bidangUsaha: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kuota Magang</label>
                                            <input type="number" required min={0} value={formData.kuota} onChange={e => setFormData({ ...formData, kuota: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Kontak PIC</label>
                                            <input type="text" required value={formData.penanggungJawab} onChange={e => setFormData({ ...formData, penanggungJawab: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">No. Telp / WA PIC</label>
                                            <input type="text" required value={formData.kontak} onChange={e => setFormData({ ...formData, kontak: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Alamat Lengkap</label>
                                        <textarea required value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 3. MODAL UBAH STATUS VERIFIKASI */}
                        {activeModal === "status" && (
                            <form onSubmit={handleSubmitStatus}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Ubah Status Verifikasi</h2>
                                        <p className="text-xs text-muted-foreground">Perbarui status verifikasi mitra <span className="font-semibold text-foreground">{selectedDudi?.namaPerusahaan}</span>.</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <select
                                        value={formData.isValidated ? "true" : "false"}
                                        onChange={e => setFormData({ ...formData, isValidated: e.target.value === "true" })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    >
                                        <option value="true">Terverifikasi</option>
                                        <option value="false">Belum Diverifikasi</option>
                                    </select>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-foreground text-background rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
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
                                <h2 className="text-xl font-extrabold text-foreground mb-2">Hapus Mitra Industri?</h2>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Apakah Anda yakin ingin menghapus data <span className="font-bold text-foreground">{selectedDudi?.namaPerusahaan}</span>? Tindakan ini tidak dapat dibatalkan. Penghapusan akan gagal jika masih terdapat siswa aktif di perusahaan ini.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button onClick={handleDelete} disabled={formLoading} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ya, Hapus DUDI
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
