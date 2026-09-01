"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Layers } from "lucide-react";
import { useSettings } from "@/components/SettingsContext";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Panduan", href: "#panduan" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <header className="fixed top-4 inset-x-4 z-50">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl border border-border/40 shadow-lg shadow-black/3 px-5 lg:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">{settings.appName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary px-4 py-2 rounded-lg transition-colors">
            Masuk
          </Link>
          <Link href="/login" className="text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover px-5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-98">
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-2 max-w-6xl mx-auto bg-white rounded-2xl border border-border shadow-lg px-5 pb-4 pt-3 space-y-1 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
          <hr className="border-border my-2" />
          <Link href="/login" className="block text-center text-sm font-semibold text-foreground py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
            Masuk
          </Link>
          <Link href="/login" className="block text-center text-sm font-semibold text-primary-foreground bg-primary py-2.5 rounded-xl mt-2">
            Mulai Sekarang
          </Link>
        </div>
      )}
    </header>
  );
}
