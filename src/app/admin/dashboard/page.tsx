"use client";

import { useEffect, useState } from "react";
import { Users, UserSquare, Building2, Clock, FileText, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from "recharts";
import { useRouter } from "next/navigation";

function getRelativeTime(timestamp: string) {
  const diff = new Date().getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID");
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Dashboard/admin`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "Gagal mengambil data dashboard.");

        if (result.status) {
          setData(result.data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
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

  const { statCards, trendPengajuan, distribusiDudi, logTerbaru } = data;

  return (
    <div className="space-y-6 w-full">

      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-r from-primary to-[#8b5cf6] rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-2">
          <p className="text-sm font-semibold tracking-wider text-white/80 uppercase">{currentDate}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Selamat datang kembali, Admin</h1>
          <p className="text-white/80 text-sm">
            {statCards.menungguValidasi > 0
              ? `Ada ${statCards.menungguValidasi} pengajuan magang yang perlu divalidasi.`
              : "Belum ada pengajuan magang baru yang perlu divalidasi hari ini."}
          </p>
        </div>
        {statCards.menungguValidasi > 0 && (
          <button
            onClick={() => router.push("/admin/penempatan?status=pending")}
            className="relative z-10 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-sm active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Tinjau Pengajuan
          </button>
        )}
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "TOTAL SISWA", val: statCards.totalSiswa, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "GURU PEMBIMBING", val: statCards.guruAktif, icon: UserSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "MITRA DUDI", val: statCards.dudiTerverifikasi, icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "MENUNGGU VALIDASI", val: statCards.menungguValidasi, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
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
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <span className="w-2 h-0.5 bg-muted-foreground/30 rounded"></span> Data real-time
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Middle Section: Chart & DUDI Distribution Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-foreground">Tren Pengajuan Magang</h3>
            <p className="text-xs text-muted-foreground mt-1">Jumlah pengajuan siswa 6 bulan terakhir</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPengajuan} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="jumlah" name="Total Pengajuan" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Distribusi DUDI */}
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground">Distribusi DUDI</h3>
              <p className="text-xs text-muted-foreground mt-1">5 Mitra dengan siswa terbanyak</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {distribusiDudi.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center pt-10">Belum ada data DUDI tervalidasi.</p>
            ) : (
              distribusiDudi.map((item: any, i: number) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground truncate pr-4">{item.namaPerusahaan}</span>
                    <span className="font-bold text-primary flex-shrink-0">{item.siswaAktif} <span className="text-muted-foreground text-xs font-normal">/ {item.kuota}</span></span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(item.siswaAktif / item.kuota) >= 1 ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min((item.siswaAktif / item.kuota) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Log Aktivitas */}
      <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Aktivitas Sistem Terakhir</h3>
        <div className="space-y-1">
          {logTerbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
          ) : (
            logTerbaru.map((log: any, i: number) => (
              <div key={i} className="flex gap-4 items-start p-3 hover:bg-muted/50 rounded-xl transition-colors">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold capitalize">{log.actorRole}</span> ({log.actorIdentifier}) melakukan aksi <span className="font-semibold">{log.actionType}</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{getRelativeTime(log.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}