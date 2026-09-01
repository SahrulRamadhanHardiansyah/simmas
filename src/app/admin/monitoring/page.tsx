"use client";

import { useEffect, useState } from "react";
import {
    Users, Activity, BookOpen, AlertTriangle, Search, Filter,
    Eye, X, ChevronLeft, ChevronRight, Loader2, Building, MapPin,
    Clock
} from "lucide-react";

// Hook custom untuk Debounce (menunda eksekusi pencarian selama user mengetik)
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function MonitoringGlobalPage() {
    const [stats, setStats] = useState({
        totalSiswaAktif: 0,
        tingkatKehadiran: "0%",
        jurnalTerkumpul: 0,
        perluPerhatian: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [tableData, setTableData] = useState<any[]>([]);
    const [loadingTable, setLoadingTable] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [kelas, setKelas] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [loadingModal, setLoadingModal] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/Monitoring/stats`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok && result.status) {
                    setStats(result.data);
                }
            } catch (err) {
                console.error("Gagal mengambil statistik", err);
            } finally {
                setLoadingStats(false);
            }
        }
        fetchStats();
    }, []);

    useEffect(() => {
        async function fetchTable() {
            setLoadingTable(true);
            try {
                const token = localStorage.getItem("token");

                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    pageSize: pageSize.toString()
                });
                if (debouncedSearch) queryParams.append("search", debouncedSearch);
                if (kelas) queryParams.append("kelas", kelas);

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/Monitoring?${queryParams}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const result = await res.json();
                if (res.ok && result.status) {
                    setTableData(result.data);
                    setTotalPages(result.pagination.totalPages);
                    setTotalData(result.pagination.totalData);
                }
            } catch (err) {
                console.error("Gagal mengambil data tabel", err);
            } finally {
                setLoadingTable(false);
            }
        }
        fetchTable();
    }, [page, pageSize, debouncedSearch, kelas]);

    useEffect(() => {
        if (!isModalOpen || !selectedId) return;

        async function fetchDetail() {
            setLoadingModal(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/Monitoring/${selectedId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok && result.status) {
                    setModalData(result.data);
                }
            } catch (err) {
                console.error("Gagal mengambil detail", err);
            } finally {
                setLoadingModal(false);
            }
        }
        fetchDetail();
    }, [selectedId, isModalOpen]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Aktif": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "Perlu Perhatian": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "Bermasalah": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
            default: return "text-muted-foreground bg-muted border-border";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "Aktif": return "bg-emerald-500";
            case "Perlu Perhatian": return "bg-amber-500";
            case "Bermasalah": return "bg-rose-500";
            default: return "bg-muted-foreground";
        }
    };

    return (
        <div className="space-y-6 w-full relative">

            {/* 1. SECTION STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {[
                    { title: "TOTAL SISWA AKTIF", val: stats.totalSiswaAktif, sub: "Siswa sedang magang", icon: Users, color: "text-blue-500", bg: "bg-red", bgCard: "bg-red-600" },
                    { title: "TINGKAT KEHADIRAN", val: stats.tingkatKehadiran, sub: "Rata-rata kehadiran harian", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", bgCard: "bg-yellow-500" },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bgCard} rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between`}>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{stat.title}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loadingStats ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
                            ) : (
                                <h3 className="text-3xl font-extrabold text-foreground mb-1">{stat.val}</h3>
                            )}
                            <p className="text-xs font-medium text-muted-foreground">{stat.sub}</p>
                        </div>
                    </div>
                ))}
                {[
                    { title: "JURNAL TERKUMPUL", val: stats.jurnalTerkumpul, sub: "Total jurnal minggu ini", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10", bgCard: "bg-blue-600" },
                    { title: "PERLU PERHATIAN", val: stats.perluPerhatian, sub: "Siswa bermasalah/alfa", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", bgCard: "bg-green-600" },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bgCard} rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between`}>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{stat.title}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loadingStats ? (
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
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    {/* Search Box */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={kelas}
                            onChange={(e) => { setKelas(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-8 py-2.5 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="">Semua Kelas</option>
                            <option value="XI RPL 1">XI RPL 1</option>
                            <option value="XI RPL 2">XI RPL 2</option>
                            <option value="XII RPL A">XII RPL A</option>
                            <option value="XII TKJ 1">XII TKJ 1</option>
                        </select>
                    </div>
                </div>

                <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {totalData} Data
                </div>
            </div>

            {/* 3. SECTION TABEL */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Siswa & Kelas</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">DUDI & Pembimbing</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Kehadiran (H/S/I/A)</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Jurnal</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loadingTable ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat data monitoring...</p>
                                    </td>
                                </tr>
                            ) : tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada data ditemukan</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas Anda.</p>
                                    </td>
                                </tr>
                            ) : (
                                tableData.map((row) => {
                                    const [siswaName, siswaKelas] = row.siswa.split('\n');
                                    const [dudiName, guruName] = row.dudi.split('\n');
                                    const kehadiranParts = row.kehadiran.split(' / ');

                                    return (
                                        <tr key={row.siswaId} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-foreground">{siswaName}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{siswaKelas}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-foreground">{dudiName}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{guruName}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {kehadiranParts.length === 4 ? (
                                                    <div className="text-sm font-semibold flex items-center justify-center gap-1.5">
                                                        <span className="text-emerald-500">{kehadiranParts[0]}</span>
                                                        <span className="text-muted-foreground/30">/</span>
                                                        <span className="text-amber-500">{kehadiranParts[1]}</span>
                                                        <span className="text-muted-foreground/30">/</span>
                                                        <span className="text-blue-500">{kehadiranParts[2]}</span>
                                                        <span className="text-muted-foreground/30">/</span>
                                                        <span className={kehadiranParts[3] > 0 ? `text-rose-500` : `text-muted-foreground`}>{kehadiranParts[3]}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-semibold tracking-widest text-muted-foreground">{row.kehadiran}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                                    {row.jurnal}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex flex-col items-center justify-center gap-1.5">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${getStatusColor(row.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(row.status)}`}></span>
                                                    {row.status}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {row.terakhirAktif}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => { setSelectedId(row.siswaId); setIsModalOpen(true); }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" /> Detail
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Menampilkan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalData)} dari {totalData} data</span>
                        <span className="hidden sm:inline-block w-px h-4 bg-border"></span>
                        <div className="flex items-center gap-2">
                            <label htmlFor="pageSize">Baris per halaman:</label>
                            <select
                                id="pageSize"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
                        </button>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-2">
                            {page} <span className="text-muted-foreground">/ {totalPages}</span>
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(totalPages)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2.5" />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="relative bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
                            <div>
                                <h2 className="text-xl font-extrabold text-foreground">Detail Monitoring Siswa</h2>
                                <p className="text-sm text-muted-foreground mt-1">Rekapitulasi aktivitas magang harian.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {loadingModal || !modalData ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                                    <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Profil & Penempatan */}
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{modalData.namaSiswa}</h3>
                                            <p className="text-sm font-medium text-muted-foreground mt-0.5">{modalData.identitas}</p>
                                        </div>
                                        <div className="space-y-1 sm:text-right text-sm">
                                            <p className="flex items-center sm:justify-end gap-1.5 text-foreground font-medium">
                                                <Building className="w-4 h-4 text-muted-foreground" />
                                                {modalData.tempatMagang}
                                            </p>
                                            <p className="flex items-center sm:justify-end gap-1.5 text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                {modalData.guruPembimbing}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 4 Kartu Rekap Kehadiran */}
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-widest">Rekapitulasi Kehadiran</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-extrabold text-emerald-600">{modalData.rekapKehadiran.hadir}</p>
                                                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-1">Hadir</p>
                                            </div>
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-extrabold text-blue-600">{modalData.rekapKehadiran.sakit}</p>
                                                <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mt-1">Sakit</p>
                                            </div>
                                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-extrabold text-purple-600">{modalData.rekapKehadiran.izin}</p>
                                                <p className="text-[10px] font-bold text-purple-600/70 uppercase tracking-widest mt-1">Izin</p>
                                            </div>
                                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                                                <p className="text-2xl font-extrabold text-rose-600">{modalData.rekapKehadiran.alfa}</p>
                                                <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mt-1">Alfa</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Jurnal Terakhir */}
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-widest">Jurnal Terakhir</h4>
                                        <blockquote className="border-l-4 border-primary pl-4 py-1">
                                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                "{modalData.jurnalTerakhir}"
                                            </p>
                                        </blockquote>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 bg-foreground text-background font-semibold text-sm rounded-xl hover:bg-foreground/90 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}