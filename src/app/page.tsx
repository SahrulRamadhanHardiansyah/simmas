"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap, Users, ShieldCheck, BookCheck, ClipboardList, UserCheck, Building2, FileCheck2, Handshake, Monitor, Mail, Phone, MapPin, Layers } from "lucide-react";
import DashboardMockup from "@/components/DashboardMockup";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: GraduationCap,
    title: "Siswa Magang",
    desc: "Isi jurnal harian, pantau presensi, dan kelola dokumen magang dalam satu platform terintegrasi.",
    items: ["Pengisian jurnal digital", "Presensi otomatis", "Notifikasi real-time"],
  },
  {
    icon: Users,
    title: "Guru Pembimbing",
    desc: "Pantau perkembangan siswa, validasi jurnal, dan koordinasi dengan mitra DUDI secara efisien.",
    items: ["Monitoring siswa bimbingan", "Validasi & approval jurnal", "Laporan perkembangan"],
  },
  {
    icon: ShieldCheck,
    title: "Administrator Sekolah",
    desc: "Kelola data siswa, mitra DUDI, dan seluruh proses magang dari satu dashboard terpusat.",
    items: ["Manajemen data terpusat", "Dashboard analitik", "Pengelolaan mitra DUDI"],
  },
];

const steps = [
  { num: "01", title: "Registrasi DUDI", desc: "Admin mendaftarkan mitra dunia usaha & dunia industri ke dalam sistem.", icon: Building2 },
  { num: "02", title: "Pengajuan", desc: "Siswa mengajukan permohonan magang ke DUDI pilihan mereka.", icon: FileCheck2 },
  { num: "03", title: "Persetujuan", desc: "Guru & admin memvalidasi dan menyetujui pengajuan siswa.", icon: Handshake },
  { num: "04", title: "Monitoring", desc: "Pantau progress magang secara real-time melalui dashboard.", icon: Monitor },
];

const checkpoints = [
  "Penempatan magang terpusat & transparan",
  "Monitoring kehadiran & jurnal real-time",
  "Koordinasi sekolah, guru, dan industri",
];

const footerLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Panduan", href: "#panduan" },
  { label: "Masuk", href: "/login" },
];

export default function LandingPage() {
  const [apiStats, setApiStats] = useState({
    totalJurnalDisetujui: 0,
    totalPresensiTercatat: 0,
    totalSiswaAktif: 0,
    totalMitraDudi: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/stats`);
        const result = await res.json();
        if (result.status) {
          setApiStats(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data statistik:", error);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { val: `${apiStats.totalJurnalDisetujui.toLocaleString()}+`, label: "Jurnal Disetujui", icon: BookCheck },
    { val: `${apiStats.totalPresensiTercatat.toLocaleString()}+`, label: "Presensi Tercatat", icon: ClipboardList },
    { val: `${apiStats.totalSiswaAktif.toLocaleString()}+`, label: "Siswa Aktif", icon: UserCheck },
    { val: `${apiStats.totalMitraDudi.toLocaleString()}+`, label: "Total Mitra DUDI", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[48%] h-full bg-primary rounded-bl-[80px] rounded-tl-[80px] hidden lg:block" />
        <div className="absolute inset-0 bg-linear-to-b from-primary-light via-transparent to-transparent lg:hidden" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-7 animate-fade-in-up">
              <p className="text-[11px] font-bold tracking-ultra-wide uppercase text-muted-foreground">
                Sistem Informasi Manajemen Magang Siswa
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tightest">
                Magang<br />lebih<br />teratur.
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground max-w-md leading-relaxed">
                Platform manajemen magang siswa SMK yang menghubungkan sekolah, guru pembimbing, dan dunia usaha dalam satu sistem terpadu.
              </p>
              <ul className="space-y-3">
                {checkpoints.map((t, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4 pt-1">
                <Link href="/login" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-98">
                  Mulai Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#fitur" className="inline-flex items-center gap-2 border border-border hover:bg-muted font-semibold px-7 py-3.5 rounded-xl transition-colors">
                  Lihat Fitur
                </a>
              </div>
            </div>

            <div className="relative lg:pl-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold tracking-extra-wide uppercase text-primary mb-3">Fitur Unggulan</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Satu platform untuk semua peran</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              SIMMAS dirancang untuk memenuhi kebutuhan setiap stakeholder dalam proses magang siswa SMK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group relative bg-card rounded-2xl border border-border p-7 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 text-center">
            {stats.map((s, i) => (
              <div key={i} className="space-y-2">
                <s.icon className="w-7 h-7 text-white/60 mx-auto mb-1" />
                <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.val}</p>
                <p className="text-sm text-white/70 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="panduan" className="py-20 lg:py-28 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-bold tracking-extra-wide uppercase text-primary mb-3">Panduan Alur</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Empat langkah mudah</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">Proses magang yang terstruktur dari awal hingga selesai.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-13 left-[12.5%] right-[12.5%] h-0.5 bg-border z-0" />
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto mb-5 relative z-10 shadow-lg shadow-primary/20 ring-4 ring-background">
                  {step.num}
                </div>
                <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <step.icon className="w-7 h-7 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">SIMMAS</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                Sistem Informasi Manajemen Magang Siswa — platform terpadu untuk SMK di seluruh Indonesia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/40 uppercase tracking-wider">Navigasi</h4>
              <ul className="space-y-2.5">
                {footerLinks.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/40 uppercase tracking-wider">Kontak</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                  <span>Jl. Pendidikan No. 1, Kota Bandung, Jawa Barat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-white/40" />
                  <span>info@simmas.sch.id</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-white/40" />
                  <span>(022) 1234-5678</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} SIMMAS. Hak cipta dilindungi undang-undang.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}