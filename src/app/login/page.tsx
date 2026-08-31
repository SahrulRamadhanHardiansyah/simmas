"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Loader2, Layers } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "admin@simmas.sch.id", role: "ADMIN" },
  { email: "guru@simmas.sch.id", role: "GURU" },
  { email: "2024003@siswa.smk.sch.id", role: "SISWA" },
];

const benefits = [
  "Penempatan magang terpusat & transparan",
  "Monitoring kehadiran & jurnal real-time",
  "Koordinasi sekolah, guru, dan industri",
];

const brandStats = [
  { val: "50+", label: "SMK Aktif" },
  { val: "10k+", label: "Siswa Terdaftar" },
  { val: "200+", label: "Mitra DUDI" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ root?: string }>({});

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginResult.message || "Gagal masuk. Periksa kembali email dan password Anda.");
      }

      const token = loginResult.data?.token;

      if (!token) {
        throw new Error("Token tidak ditemukan dalam respons server.");
      }

      localStorage.setItem("token", token);

      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/Me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const meResult = await meResponse.json();

      if (!meResponse.ok || !meResult.success) {
        localStorage.removeItem("token");
        throw new Error(meResult.message || "Gagal memuat profil pengguna.");
      }

      const userData = meResult.data;

      if (!userData || !userData.role) {
        throw new Error("Data role tidak ditemukan pada profil Anda.");
      }

      const userRole = userData.role.toLowerCase();

      localStorage.setItem("role", userRole);
      localStorage.setItem("user", JSON.stringify(userData));

      router.push(`/${userRole}/dashboard`);

    } catch (err: any) {
      setErrors({ root: err.message });
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword("password");
    setErrors({});
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 relative bg-primary overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/6" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-white/6" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-white/6" />
        <div className="absolute top-2/3 left-1/3 w-36 h-36 rounded-full bg-white/4" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          <Link className="flex items-center gap-2.5" href="/">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SIMMAS</span>
          </Link>

          <div className="space-y-6 -mt-8">
            <p className="text-[11px] font-bold tracking-widest uppercase text-white/50">
              Sistem Informasi Manajemen Magang Siswa
            </p>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              Magang<br />
              <span className="text-white/70">lebih</span><br />
              <span className="text-white/70">teratur.</span>
            </h1>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Platform manajemen magang siswa SMK yang menghubungkan sekolah, guru pembimbing, dan dunia usaha dalam satu sistem terpadu.
            </p>
            <ul className="space-y-3 pt-2">
              {benefits.map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
                  <span className="text-sm text-white/70">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-10 pt-8">
            {brandStats.map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">SIMMAS</span>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary mb-2">Portal Masuk</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-foreground">
              Masuk ke<br />
              <span className="text-primary">akun Anda.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Gunakan email sekolah dan password yang diberikan oleh admin sekolah Anda.
            </p>
          </div>

          {errors.root && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <p className="text-sm text-red-600 font-medium">{errors.root}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold tracking-wider uppercase text-muted-foreground mb-1.5">
                Email Sekolah
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                placeholder="nama@sekolah.sch.id"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Password</label>
                <button type="button" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors tracking-wider">LUPA?</button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                  placeholder="Password akun Anda"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground hover:bg-foreground/90 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-95 shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-3">Akun Demo</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary-light transition-all text-sm group cursor-pointer"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">{acc.email}</span>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground/60 group-hover:text-primary transition-colors">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}