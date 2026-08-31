"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Loader2, AlertCircle, Building2, UserSquare, Calendar, CheckCircle,
    ClipboardCheck, FileText, ArrowRight, BookOpen
} from "lucide-react";

export default function SiswaDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
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

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Dashboard/siswa`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => {
                if (j?.status) setData(j.data);
                else setError(j?.message || "Gagal memuat data.");
            })
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

    const { siswaName, infoMagang, progressMagang, statCards, statusPengajuan } = data || {};
    const firstName = (siswaName || "Siswa").split(" ")[0];
    const progressPct = progressMagang
        ? Math.round((progressMagang.hariKe / Math.max(progressMagang.totalHari, 1)) * 100)
        : 0;

    return (
        <div className="space-y-6 w-full">

            {/* 1. Hero Banner */}
            <div className="bg-gradient-to-r from-primary to-[#8b5cf6] rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 space-y-2">
                    <p className="text-sm font-semibold tracking-wider text-white/80 uppercase">{currentDate}</p>
                    <h1 className="text-3xl font-extrabold tracking-tight">{getSapaan()}, {firstName} 👋</h1>
                    <p className="text-white/80 text-sm">
                        {infoMagang
                            ? "Jangan lupa catat kehadiran dan kegiatan magangmu hari ini."
                            : statusPengajuan === "approved"
                                ? "Pengajuan magang kamu sudah disetujui! Menunggu admin memproses penempatan."
                                : statusPengajuan === "pending"
                                    ? "Pengajuan magang kamu sedang diproses. Tunggu konfirmasi dari sekolah."
                                    : "Anda belum memiliki penempatan magang aktif. Ajukan tempat magang terlebih dahulu."}
                    </p>
                </div>
                {!infoMagang && !statusPengajuan && (
                    <button
                        onClick={() => router.push("/siswa/pengajuan")}
                        className="relative z-10 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-sm active:scale-95"
                    >
                        <FileText className="w-4 h-4" />
                        Ajukan Magang
                    </button>
                )}
            </div>

            {/* 2. Banner Penempatan */}
            {infoMagang ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-3">Tempat Magang</p>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-foreground tracking-tight">{infoMagang.dudi}</h3>
                                <p className="text-xs text-muted-foreground">{infoMagang.alamatDudi}</p>
                            </div>
                        </div>

                        {progressMagang && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Progress Magang</span>
                                    <span className="font-bold text-foreground">Hari ke-{progressMagang.hariKe} dari {progressMagang.totalHari} hari</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                                </div>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                                    <Calendar className="w-3 h-3" />
                                    Berakhir pada {new Date(progressMagang.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-3">Guru Pembimbing</p>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <UserSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground leading-tight">{infoMagang.guruPembimbing}</h3>
                                <p className="text-xs text-muted-foreground">NIP. {infoMagang.nipGuru}</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-auto leading-relaxed">
                            Hubungi guru pembimbing jika memerlukan bimbingan atau perubahan terkait kegiatan magang.
                        </p>
                    </div>
                </div>
            ) : statusPengajuan ? (
                <div className={`rounded-2xl p-8 text-center border ${statusPengajuan === "approved" ? "bg-emerald-500/5 border-emerald-500/20" : statusPengajuan === "pending" ? "bg-amber-500/5 border-amber-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${statusPengajuan === "approved" ? "bg-emerald-500/10 text-emerald-500" : statusPengajuan === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                        {statusPengajuan === "approved" ? <CheckCircle className="w-6 h-6" /> : statusPengajuan === "pending" ? <Calendar className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <h3 className="font-bold text-foreground">
                        {statusPengajuan === "approved" ? "Pengajuan Disetujui" : statusPengajuan === "pending" ? "Pengajuan Sedang Diproses" : "Pengajuan Ditolak"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        {statusPengajuan === "approved"
                            ? "Pengajuan magang kamu sudah disetujui. Admin sedang memproses penempatan, silakan cek kembali nanti."
                            : statusPengajuan === "pending"
                                ? "Pengajuan magang kamu masih menunggu validasi dari admin sekolah."
                                : "Pengajuan magang kamu ditolak. Silakan ajukan kembali atau hubungi admin sekolah."}
                    </p>
                </div>
            ) : (
                <div className="bg-background border border-dashed border-border rounded-2xl p-8 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground">Belum Ada Penempatan Aktif</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Silakan ajukan permohonan magang ke salah satu mitra DUDI yang tersedia. Pengajuan akan divalidasi oleh admin sekolah.</p>
                </div>
            )}

            {/* 3. Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { title: "TOTAL HARI HADIR TERCATAT", val: statCards?.totalKehadiran ?? 0, sub: "Hari presensi hadir", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "JURNAL KEGIATAN TERVERIFIKASI", val: statCards?.jurnalDitulis ?? 0, sub: "Laporan disetujui", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
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

            {/* 4. Pintasan Aksi Cepat */}
            <div>
                <h3 className="font-bold text-foreground mb-3 text-sm tracking-wider uppercase">Aksi Cepat</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => router.push("/siswa/absensi")}
                        className="group bg-background border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-primary/40 hover:shadow-md transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground">Isi Absensi Harian</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Catat kehadiran & presensi masuk/pulang</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                        onClick={() => router.push("/siswa/jurnal")}
                        className="group bg-background border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-primary/40 hover:shadow-md transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground">Tulis Jurnal Kegiatan</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Lapor aktivitas harian selama magang</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>

        </div>
    );
}
