"use client";

import { useEffect, useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    Link, Briefcase, CheckCircle, Clock, AlertCircle, Search,
    Filter, Edit3, Trash2, RefreshCcw, Loader2, X, ChevronLeft,
    ChevronRight, Plus
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

export default function AdminPenempatanPage() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get("status") || "";
    const alertApi = useAlert();

    const [stats, setStats] = useState({ totalPenempatan: 0, sedangBerlangsung: 0, selesaiMagang: 0, dudiTerlibat: 0 });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [siswaOptions, setSiswaOptions] = useState<any[]>([]);
    const [dudiOptions, setDudiOptions] = useState<any[]>([]);
    const [guruOptions, setGuruOptions] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [activeModal, setActiveModal] = useState<"add" | "edit" | "status" | "cancel" | null>(null);
    const [selectedData, setSelectedData] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        siswaId: "",
        tempatMagangId: "",
        guruId: "",
        tanggalMulai: "",
        tanggalSelesai: "",
        statusPengajuan: "approved"
    });

    const fetchPenempatan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append("search", debouncedSearch);
            if (statusFilter) queryParams.append("status", statusFilter);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Penempatan?${queryParams}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data);
                setStats(result.stats);
                setPage(1);
            }
        } catch (err) {
            console.error("Gagal mengambil data penempatan", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownOptions = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { "Authorization": `Bearer ${token}` };

            const [resSiswa, resDudi, resGuru] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Siswa?isActive=true&statusMagang=belum`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Dudi`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Guru?isActive=true`, { headers })
            ]);

            if (resSiswa.ok) { const data = await resSiswa.json(); setSiswaOptions(data.data || []); }
            if (resDudi.ok) { const data = await resDudi.json(); setDudiOptions(data.data || []); }
            if (resGuru.ok) { const data = await resGuru.json(); setGuruOptions(data.data || []); }
        } catch (err) {
            console.error("Gagal mengambil opsi form", err);
        }
    };

    useEffect(() => {
        fetchPenempatan();
    }, [debouncedSearch, statusFilter]);

    const totalPages = Math.ceil(data.length / pageSize) || 1;
    const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

    const openModal = (type: typeof activeModal, row?: any) => {
        if (type === "add" || type === "edit") fetchDropdownOptions();

        setSelectedData(row || null);
        if (type === "add") {
            setFormData({
                siswaId: "",
                tempatMagangId: "",
                guruId: "",
                tanggalMulai: "",
                tanggalSelesai: "",
                statusPengajuan: "approved"
            });
        } else if (row) {
            setFormData({
                siswaId: row.siswa.id,
                tempatMagangId: row.dudi.id,
                guruId: row.guru.id,
                tanggalMulai: row.tanggalMulai,
                tanggalSelesai: row.tanggalSelesai,
                statusPengajuan: row.statusPengajuan
            });
        }
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedData(null);
    };

    // parseResponse: hanya parse JSON kalau server mengirim JSON.
    // Kalau server mengirim HTML (halaman error ASP.NET dev mode), kembalikan null
    // dan tampilkan pesan generic — supaya `JSON.parse` tidak throw ke console.
    async function parseResponse(res: Response): Promise<{ ok: boolean; data: any | null; raw: string; contentType: string }> {
        const raw = await res.text();
        const contentType = res.headers.get("content-type") || "";
        if (!raw) return { ok: res.ok, data: null, raw: "", contentType };
        if (contentType.includes("application/json")) {
            try { return { ok: res.ok, data: JSON.parse(raw), raw, contentType }; }
            catch { return { ok: res.ok, data: null, raw, contentType }; }
        }
        return { ok: res.ok, data: null, raw, contentType };
    }

    const handleSubmitAdd = async (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation — cegah request dengan field kosong sampai ke backend.
        if (!formData.siswaId) { alertApi.error("Siswa wajib dipilih."); return; }
        if (!formData.tempatMagangId) { alertApi.error("Mitra DUDI wajib dipilih."); return; }
        if (!formData.guruId) { alertApi.error("Guru pembimbing wajib dipilih."); return; }
        if (!formData.tanggalMulai) { alertApi.error("Tanggal mulai wajib diisi."); return; }
        if (!formData.tanggalSelesai) { alertApi.error("Tanggal selesai wajib diisi."); return; }
        if (formData.tanggalSelesai < formData.tanggalMulai) { alertApi.error("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }

        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                siswaId: formData.siswaId,
                tempatMagangId: formData.tempatMagangId,
                guruId: formData.guruId,
                tanggalMulai: formData.tanggalMulai,
                tanggalSelesai: formData.tanggalSelesai,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Penempatan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const { ok, data, contentType } = await parseResponse(res);
            if (!ok) {
                if (!contentType.includes("application/json")) {
                    throw new Error("Backend mengembalikan HTML (kemungkinan error 500). Periksa payload & log server.");
                }
                throw new Error(data?.message || `Gagal menambah penempatan (${res.status}).`);
            }

            alertApi.success(data?.message || "Penempatan berhasil ditambahkan.");
            fetchPenempatan();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal menambah penempatan.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.tempatMagangId) { alertApi.error("Mitra DUDI wajib dipilih."); return; }
        if (!formData.guruId) { alertApi.error("Guru pembimbing wajib dipilih."); return; }
        if (!formData.tanggalMulai) { alertApi.error("Tanggal mulai wajib diisi."); return; }
        if (!formData.tanggalSelesai) { alertApi.error("Tanggal selesai wajib diisi."); return; }
        if (formData.tanggalSelesai < formData.tanggalMulai) { alertApi.error("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }

        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                tempatMagangId: formData.tempatMagangId,
                guruId: formData.guruId,
                tanggalMulai: formData.tanggalMulai,
                tanggalSelesai: formData.tanggalSelesai,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Penempatan/${selectedData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const { ok, data, contentType } = await parseResponse(res);
            if (!ok) {
                if (!contentType.includes("application/json")) {
                    throw new Error("Backend mengembalikan HTML (kemungkinan error 500). Periksa payload & log server.");
                }
                throw new Error(data?.message || `Gagal mengubah penempatan (${res.status}).`);
            }

            alertApi.success(data?.message || "Penempatan berhasil diperbarui.");
            fetchPenempatan();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengubah penempatan.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitStatus = async (e: FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Penempatan/${selectedData.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ statusPengajuan: formData.statusPengajuan })
            });
            const { ok, data, contentType } = await parseResponse(res);
            if (!ok) {
                if (!contentType.includes("application/json")) {
                    throw new Error("Backend mengembalikan HTML (kemungkinan error 500). Periksa payload & log server.");
                }
                throw new Error(data?.message || `Gagal mengesahkan status (${res.status}).`);
            }

            alertApi.success(data?.message || "Status penempatan berhasil diperbarui.");
            fetchPenempatan();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mengesahkan status.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleCancelPenempatan = async () => {
        setFormLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Admin/Penempatan/${selectedData.id}/batalkan`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const { ok, data, contentType } = await parseResponse(res);
            if (!ok) {
                if (!contentType.includes("application/json")) {
                    throw new Error("Backend mengembalikan HTML (kemungkinan error 500). Periksa payload & log server.");
                }
                throw new Error(data?.message || `Gagal membatalkan penempatan (${res.status}).`);
            }

            alertApi.success(data?.message || "Penempatan berhasil dibatalkan.");
            fetchPenempatan();
            closeModal();
        } catch (err: any) {
            alertApi.error(err.message || "Gagal membatalkan penempatan.");
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: string, endDate: string) => {
        if (status === "rejected") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase text-rose-500 bg-rose-500/10 border-rose-500/20"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Dibatalkan</span>;
        if (status === "pending") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase text-amber-500 bg-amber-500/10 border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pending</span>;
        if (status === "completed") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase text-emerald-500 bg-emerald-500/10 border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Lulus Magang</span>;

        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase text-blue-500 bg-blue-500/10 border-blue-500/20"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Berlangsung</span>;
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "TOTAL PENEMPATAN", val: stats.totalPenempatan, sub: "Siswa diproses", icon: Link, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "SEDANG BERLANGSUNG", val: stats.sedangBerlangsung, sub: "Siswa magang aktif", icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { title: "SELESAI MAGANG", val: stats.selesaiMagang, sub: "Program selesai", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "DUDI TERLIBAT", val: stats.dudiTerlibat, sub: "Mitra aktif", icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{stat.title}</p>
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
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari siswa, NIS, DUDI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                        <option value="">Semua Status</option>
                        <option value="pending">Menunggu Disahkan</option>
                        <option value="approved">Disahkan / Berlangsung</option>
                        <option value="completed">Lulus Magang</option>
                        <option value="rejected">Dibatalkan</option>
                    </select>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-sm font-medium text-muted-foreground">{data.length} Penempatan</span>
                    <button
                        onClick={() => openModal("add")}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Tambah Penempatan
                    </button>
                </div>
            </div>

            {/* 3. SECTION TABEL */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Siswa</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Kelas</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Tempat Magang</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Guru Pembimbing</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Periode</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data penempatan...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data penempatan ditemukan.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {row.siswa.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{row.siswa.name}</p>
                                                    <p className="text-xs text-muted-foreground">{row.siswa.nis}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.siswa.kelas}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Briefcase className="w-3.5 h-3.5" /></div>
                                                <span className="text-sm font-semibold text-foreground">{row.dudi.namaPerusahaan}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{row.guru.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-foreground">{new Date(row.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">s.d. {new Date(row.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(row.statusPengajuan, row.tanggalSelesai)}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal("edit", row)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("status", row)} className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Sahkan Penempatan">
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openModal("cancel", row)} className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Batalkan">
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

            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={closeModal} />

                    <div className="relative bg-background w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* 1. MODAL TAMBAH & EDIT */}
                        {(activeModal === "add" || activeModal === "edit") && (
                            <form onSubmit={activeModal === "add" ? handleSubmitAdd : handleSubmitEdit}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Link className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">{activeModal === "add" ? "Tambah Penempatan Magang" : "Edit Penempatan Magang"}</h2>
                                        <p className="text-xs text-muted-foreground">{activeModal === "add" ? "Alokasikan siswa ke perusahaan mitra dan tentukan guru pembimbing." : "Ubah lokasi magang, pembimbing, atau jadwal."}</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">{activeModal === "add" ? "Pilih Siswa" : "Siswa"}</label>
                                        {activeModal === "add" ? (
                                            <select required value={formData.siswaId} onChange={e => setFormData({ ...formData, siswaId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                                                <option value="" disabled>Pilih siswa belum magang...</option>
                                                {siswaOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name} (NIS: {opt.nis} - {opt.kelas})</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" readOnly value={`${selectedData?.siswa.name} - ${selectedData?.siswa.nis}`} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Tempat Magang (DUDI)</label>
                                        <select required value={formData.tempatMagangId} onChange={e => setFormData({ ...formData, tempatMagangId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="" disabled>Pilih DUDI...</option>
                                            {dudiOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.namaPerusahaan} (Sisa Kuota: {opt.kuota - (opt.terpakai || 0)})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Guru Pembimbing</label>
                                        <select required value={formData.guruId} onChange={e => setFormData({ ...formData, guruId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                                            <option value="" disabled>Pilih guru pembimbing...</option>
                                            {guruOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Tanggal Mulai</label>
                                            <input type="date" required value={formData.tanggalMulai} onChange={e => setFormData({ ...formData, tanggalMulai: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-1.5">Tanggal Selesai</label>
                                            <input type="date" required value={formData.tanggalSelesai} onChange={e => setFormData({ ...formData, tanggalSelesai: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground">Batal</button>
                                    <button type="submit" disabled={formLoading} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold flex items-center gap-2">
                                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} {activeModal === "add" ? "Simpan Penempatan" : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 2. MODAL STATUS */}
                        {activeModal === "status" && (
                            <form onSubmit={handleSubmitStatus}>
                                <div className="p-6 border-b border-border flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground">Sahkan Penempatan</h2>
                                        <p className="text-xs text-muted-foreground">Ubah status persetujuan penempatan magang siswa.</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <select
                                        value={formData.statusPengajuan}
                                        onChange={e => setFormData({ ...formData, statusPengajuan: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
                                        <option value="approved">Disahkan (Sedang Magang)</option>
                                        <option value="completed">Lulus Magang</option>
                                        <option value="pending">Menunggu Disahkan</option>
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

                        {/* 3. MODAL BATALKAN (ALERT) */}
                        {activeModal === "cancel" && (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-extrabold text-foreground mb-2">Batalkan Penempatan Magang?</h2>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Apakah Anda yakin ingin membatalkan alokasi penempatan untuk <span className="font-bold text-foreground">{selectedData?.siswa.name}</span> di <span className="font-bold text-foreground">{selectedData?.dudi.namaPerusahaan}</span>? Status siswa akan kembali menjadi 'Belum Magang'.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button onClick={handleCancelPenempatan} disabled={formLoading} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Ya, Batalkan Penempatan
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