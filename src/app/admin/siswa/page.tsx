"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
    Users, UserCheck, UserX, GraduationCap, Search, Filter,
    Edit3, Trash2, RefreshCcw, Loader2, UserPlus, Key, CheckCircle,
    X, ChevronLeft, ChevronRight, AlertTriangle, Copy, Check, MapPin
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

export default function AdminSiswaPage() {
    const alertApi = useAlert();
    const [stats, setStats] = useState({ totalSiswa: 0, sedangMagang: 0, belumMagang: 0, lulusMagang: 0 });
    const [data, setData] = useState<any[]>([]);
    const [kelasList, setKelasList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [filterKelas, setFilterKelas] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeModal, setActiveModal] = useState<"add" | "edit" | "status" | "delete" | "creds" | "plotting" | null>(null);
    const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
    const [newCreds, setNewCreds] = useState<{ email: string; passwordSementara: string } | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", nis: "", kelasId: "", isActive: true });
    const [guruList, setGuruList] = useState<any[]>([]);
    const [dudiList, setDudiList] = useState<any[]>([]);
    const [loadingPlotting, setLoadingPlotting] = useState(false);
    const [plottingData, setPlottingData] = useState({ guruId: "", tempatMagangId: "" });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchSiswa = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append("search", debouncedSearch);
            if (filterKelas) queryParams.append("kelas", filterKelas);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data);
                setStats(result.stats);
                setPage(1);
            }
        } catch (err) {
            console.error("Gagal mengambil data siswa", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSiswa();
    }, [debouncedSearch, filterKelas]);

    const fetchKelas = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Kelas`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) setKelasList(result.data);
        } catch (err) {
            console.error("Gagal mengambil data kelas", err);
        }
    };

    useEffect(() => { fetchKelas(); }, []);

    // Client-side status filter
    const filteredData = filterStatus
        ? data.filter(s => s.penempatan?.statusMagang === filterStatus)
        : data;

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

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
        if (!confirm(`Yakin ingin menghapus ${selectedIds.size} siswa terpilih?`)) return;
        setFormLoading(true);
        const token = localStorage.getItem("token");
        let failed = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa/${id}`, {
                    method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) failed++;
            } catch { failed++; }
        }
        if (failed > 0) alertApi.error(`${failed} data gagal dihapus.`);
        setSelectedIds(new Set());
        fetchSiswa();
        setFormLoading(false);
    };

    const openModal = (type: typeof activeModal, siswa?: any) => {
        setSelectedSiswa(siswa || null);
        if (type === "add") {
            setFormData({ name: "", nis: "", kelasId: "", isActive: true });
        } else if (type === "edit" && siswa) {
            setFormData({ name: siswa.name, nis: siswa.nis, kelasId: String(siswa.kelasId ?? ""), isActive: siswa.isActive });
        } else if (type === "status" && siswa) {
            setFormData({ ...formData, isActive: siswa.isActive });
        } else if (type === "plotting" && siswa) {
            setPlottingData({ guruId: "", tempatMagangId: "" });
            fetchPlottingOptions();
        }
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedSiswa(null);
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const fetchPlottingOptions = async () => {
        setLoadingPlotting(true);
        try {
            const token = localStorage.getItem("token");
            const [guruRes, dudiRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru?isActive=true`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi?isValidated=true`, { headers: { "Authorization": `Bearer ${token}` } })
            ]);
            const guruResult = await guruRes.json();
            const dudiResult = await dudiRes.json();

            if (guruRes.ok && guruResult.status) setGuruList(guruResult.data);
            if (dudiRes.ok && dudiResult.status) setDudiList(dudiResult.data);
        } catch (err) {
            console.error("Gagal mengambil data plotting", err);
        } finally {
            setLoadingPlotting(false);
        }
    };

    // --- HANDLERS ---

    const handleSubmitAdd = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: formData.name, nis: formData.nis, kelasId: parseInt(formData.kelasId) })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            if (result.status) {
                setNewCreds(result.data);
                fetchSiswa();
                setActiveModal("creds");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menambah siswa.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa/${selectedSiswa.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: formData.name, kelasId: parseInt(formData.kelasId) })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchSiswa();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengedit data siswa.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitStatus = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa/${selectedSiswa.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ isActive: formData.isActive })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchSiswa();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengubah status.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitPlotting = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa/${selectedSiswa.id}/plotting`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ guruId: plottingData.guruId, tempatMagangId: plottingData.tempatMagangId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchSiswa();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal melakukan plotting.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa/${selectedSiswa.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchSiswa();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menghapus data siswa.");
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Lulus Magang": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
            case "Pengajuan": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
            case "Sedang Magang": return "text-blue-600 bg-blue-500/10 border-blue-500/20";
            default: return "text-muted-foreground bg-muted border-border";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "Lulus Magang": return "bg-emerald-500";
            case "Pengajuan": return "bg-amber-500";
            case "Sedang Magang": return "bg-blue-500";
            default: return "bg-muted-foreground";
        }
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "TOTAL SISWA", val: stats.totalSiswa, sub: "Siswa terdaftar", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "SEDANG MAGANG", val: stats.sedangMagang, sub: "Aktif di industri", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "BELUM MAGANG", val: stats.belumMagang, sub: "Perlu ditempatkan", icon: UserX, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { title: "LULUS MAGANG", val: stats.lulusMagang, sub: "Selesai program", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
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
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIS, atau kelas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Filter Kelas */}
                    <div className="relative w-full sm:w-44">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterKelas}
                            onChange={(e) => { setFilterKelas(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="">Semua Kelas</option>
                            {kelasList.map((k: any) => <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>)}
                        </select>
                    </div>

                    {/* Filter Status */}
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="w-full sm:w-44 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="">Semua Status</option>
                        <option value="Belum Magang">Belum Magang</option>
                        <option value="Pengajuan">Pengajuan</option>
                        <option value="Sedang Magang">Sedang Magang</option>
                        <option value="Lulus">Lulus</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-sm font-medium text-muted-foreground">{filteredData.length} Siswa</span>
                    <button
                        onClick={() => openModal("add")}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" /> Tambah Siswa
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
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">NIS</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Nama Lengkap</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Kelas</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Status Magang</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Industri</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Guru Pembimbing</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan filter atau kata kunci pencarian.</p>
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
                                            {row.nis}
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
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                                {row.kelas}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${getStatusBadge(row.penempatan?.statusMagang)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(row.penempatan?.statusMagang)}`}></span>
                                                {row.penempatan?.statusMagang || "Belum Magang"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-foreground">{row.penempatan?.perusahaan || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-foreground">{row.penempatan?.guruPembimbing || "-"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Data">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("plotting", row)} className="p-1.5 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors" title="Plot Guru & DUDI">
                                                    <MapPin className="w-4 h-4" />
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

                {/* Pagination */}
                <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Menampilkan {filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredData.length)} dari {filteredData.length} data</span>
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
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => activeModal !== "creds" && closeModal()} />

                    <div className="relative bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* 1. MODAL TAMBAH SISWA */}
                        {activeModal === "add" && (
                            <form onSubmit={handleSubmitAdd}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Tambah Siswa Baru</h2>
                                        <p className="text-xs text-muted-foreground">Akun login siswa akan dibuat otomatis dengan password default.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Lengkap</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Bagus Hidayat"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">NIS</label>
                                        <input type="text" required value={formData.nis}
                                            onChange={e => setFormData({ ...formData, nis: e.target.value.replace(/\D/g, "") })}
                                            placeholder="2205336041388"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kelas</label>
                                        <select required value={formData.kelasId} onChange={e => setFormData({ ...formData, kelasId: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="">Pilih Kelas</option>
                                            {kelasList.map((k: any) => <option key={k.id} value={k.id}>{k.namaKelas}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Buat Akun Siswa
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
                                    <h2 className="text-xl font-extrabold text-foreground mb-2">Akun Siswa Berhasil Dibuat</h2>
                                    <p className="text-sm text-muted-foreground mb-6">Berikan kredensial ini kepada siswa untuk login portal magang.</p>

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
                                    <button onClick={() => { closeModal(); setNewCreds(null); }} className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-colors">
                                        Selesai
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. MODAL EDIT SISWA */}
                        {activeModal === "edit" && (
                            <form onSubmit={handleSubmitEdit}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Edit Data Siswa</h2>
                                        <p className="text-xs text-muted-foreground">Ubah informasi identitas dan kelas siswa.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Nama Lengkap Siswa</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">NIS (Nomor Induk Siswa)</label>
                                        <input type="text" readOnly value={formData.nis}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Kelas</label>
                                        <select required value={formData.kelasId} onChange={e => setFormData({ ...formData, kelasId: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="">Pilih Kelas</option>
                                            {kelasList.map((k: any) => <option key={k.id} value={k.id}>{k.namaKelas}</option>)}
                                        </select>
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

                        {/* 4. MODAL PLOTTING GURU & DUDI */}
                        {activeModal === "plotting" && (
                            <form onSubmit={handleSubmitPlotting}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Plot Guru Pembimbing</h2>
                                        <p className="text-xs text-muted-foreground">Tetapkan guru pembimbing dan DUDI untuk siswa terpilih.</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {loadingPlotting ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                            <p className="text-sm text-muted-foreground">Memuat data guru & DUDI...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Guru Pembimbing</label>
                                                <select required value={plottingData.guruId} onChange={e => setPlottingData({ ...plottingData, guruId: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                                    <option value="">— Pilih Guru Pembimbing —</option>
                                                    {guruList.map((g: any) => (
                                                        <option key={g.id} value={g.id}>{g.name} (NIP: {g.nip})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Tempat Magang (Industri)</label>
                                                <select required value={plottingData.tempatMagangId} onChange={e => setPlottingData({ ...plottingData, tempatMagangId: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                                    <option value="">— Pilih Mitra DUDI —</option>
                                                    {dudiList.map((d: any) => (
                                                        <option key={d.id} value={d.id}>{d.namaPerusahaan} (Sisa Kuota: {d.kuota - d.siswaAktif})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading || loadingPlotting} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Simpan Plotting
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 5. MODAL UBAH STATUS */}
                        {activeModal === "status" && (
                            <form onSubmit={handleSubmitStatus}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Ubah Status Siswa</h2>
                                        <p className="text-xs text-muted-foreground">Perbarui status akun untuk akses login siswa.</p>
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
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-foreground text-background rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 6. MODAL HAPUS (ALERT DIALOG) */}
                        {activeModal === "delete" && (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-extrabold text-foreground mb-2">Hapus Data Siswa?</h2>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Apakah Anda yakin ingin menghapus data <span className="font-bold text-foreground">{selectedSiswa?.name}</span>? Tindakan ini akan menghapus akun login dan seluruh data terkait siswa secara permanen.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button onClick={handleDelete} disabled={formLoading} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ya, Hapus Siswa
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
