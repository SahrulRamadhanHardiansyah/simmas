"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, FileText, CheckCircle, AlertCircle, Loader2,
    Calendar, Briefcase, ArrowRight
} from "lucide-react";

export default function GuruDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const currentDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const jamSekarang = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit",
    });

    function getSapaan() {
        const h = new Date().getHours();
        if (h < 11) return "Selamat pagi";
        if (h < 15) return "Selamat siang";
        if (h < 18) return "Selamat sore";
        return "Selamat malam";
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { setError("Akses ditolak."); setLoading(false); return; }

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Dashboard/guru`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => { if (j?.status) setData(j.data); else setError(j?.message || "Gagal memuat data."); })
            .catch((e) => setError(e.message || "Gagal memuat data."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
                <h3 className="font-bold">Terjadi Kesalahan</h3>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const { guruName, statCards, jurnalPerluEvaluasi, daftarSiswa } = data;
    const firstName = (guruName || "Bapak/Ibu Guru").split(" ")[0];
    const rasio = statCards.kehadiranHariIni.total > 0
        ? Math.round((statCards.kehadiranHariIni.hadir / statCards.kehadiranHariIni.total) * 100)
        : 0;

    return (
        <div className="space-y-6 w-full">

            {/* 1. Hero Banner */}
            <div className="bg-gradient-to-r from-primary to-[#8b5cf6] rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 space-y-2">
                    <p className="text-sm font-semibold tracking-wider text-white/80 uppercase">{currentDate} • {jamSekarang}</p>
                    <h1 className="text-3xl font-extrabold tracking-tight">{getSapaan()}, {firstName} 👋</h1>
                    <p className="text-white/80 text-sm">
                        {statCards.jurnalBelumDinilai > 0
                            ? `Ada ${statCards.jurnalBelumDinilai} jurnal siswa yang menunggu untuk dievaluasi hari ini.`
                            : "Tidak ada jurnal yang menunggu evaluasi. Hari Anda produktif!"}
                    </p>
                </div>
                {statCards.jurnalBelumDinilai > 0 && (
                    <button
                        onClick={() => router.push("/guru/jurnal")}
                        className="relative z-10 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-sm active:scale-95"
                    >
                        <FileText className="w-4 h-4" />
                        Lihat Jurnal
                    </button>
                )}
            </div>

            {/* 2. Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: "TOTAL SISWA BIMBINGAN", val: statCards.totalSiswaBimbingan, sub: "Siswa aktif", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "JURNAL BELUM DINILAI", val: statCards.jurnalBelumDinilai, sub: "Menunggu validasi", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { title: "RASIO KEHADIRAN HARI INI", val: `${rasio}%`, sub: `${statCards.kehadiranHariIni.hadir} dari ${statCards.kehadiranHariIni.total} siswa`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="bg-background rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">{stat.title}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-foreground mb-1">{stat.val}</h3>
                            <p className="text-[11px] font-medium text-muted-foreground">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Widget Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Widget: Jurnal Perlu Evaluasi */}
                <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Jurnal Perlu Evaluasi</h3>
                            <p className="text-xs text-muted-foreground mt-1">5 jurnal terbaru yang menunggu validasi</p>
                        </div>
                        <button
                            onClick={() => router.push("/guru/jurnal")}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            Lihat semua <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {jurnalPerluEvaluasi.length === 0 ? (
                        <div className="text-center py-10">
                            <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Semua jurnal sudah dievaluasi.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 flex-1">
                            {jurnalPerluEvaluasi.map((j: any) => (
                                <div key={j.id} className="p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <p className="text-sm font-bold text-foreground truncate">{j.siswaName}</p>
                                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {j.tanggal}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{j.kegiatan}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Widget: Daftar Siswa Bimbingan */}
                <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground">Daftar Siswa Bimbingan</h3>
                            <p className="text-xs text-muted-foreground mt-1">Status kehadiran hari ini</p>
                        </div>
                        <button
                            onClick={() => router.push("/guru/siswa")}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            Lihat semua <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {daftarSiswa.length === 0 ? (
                        <div className="text-center py-10">
                            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Belum ada siswa bimbingan.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 flex-1">
                            {daftarSiswa.map((s: any) => {
                                const status = (s.statusKehadiran || "belum_absen").toLowerCase();
                                const badge =
                                    status === "hadir" ? { label: "Hadir", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" } :
                                        status === "sakit" ? { label: "Sakit", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" } :
                                            status === "izin" ? { label: "Izin", cls: "text-blue-500 bg-blue-500/10 border-blue-500/20" } :
                                                { label: "Belum Absen", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
                                return (
                                    <div key={`${s.nama}-${s.dudi}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            {s.nama.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{s.nama}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" />{s.dudi}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {badge.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
