"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, LayoutDashboard, Globe, Users, UserSquare, Building2, MapPin, Settings, Activity, ChevronsLeft, ChevronsRight, X, FileText } from "lucide-react";

export const NavbarData: Record<"admin" | "guru" | "siswa", { title: string; items: { name: string; href: string; icon: typeof LayoutDashboard }[] }[]> = {
    admin: [
        {
            title: "Overview",
            items: [
                { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
                { name: "Monitoring Global", href: "/admin/monitoring", icon: Globe },
            ],
        },
        {
            title: "Master Data",
            items: [
                { name: "Data Guru", href: "/admin/guru", icon: UserSquare },
                { name: "Data Siswa", href: "/admin/siswa", icon: Users },
                { name: "Data DUDI", href: "/admin/dudi", icon: Building2 },
            ],
        },
        {
            title: "Manajemen",
            items: [
                { name: "Penempatan Magang", href: "/admin/penempatan", icon: MapPin },
            ],
        },
        {
            title: "Sistem",
            items: [
                { name: "Pengaturan Sistem", href: "/admin/settings", icon: Settings },
                { name: "Log Aktivitas", href: "/admin/logs", icon: Activity },
            ],
        }
    ],
    guru: [
        {
            title: "Overview",
            items: [
                { name: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard },
            ],
        },
        {
            title: "Validasi",
            items: [
                { name: "Jurnal & Absensi", href: "/guru/jurnal", icon: Activity },
            ],
        },
        {
            title: "Bimbingan",
            items: [
                { name: "Siswa Bimbingan", href: "/guru/siswa", icon: Users },
                { name: "Kunjungan Lapangan", href: "/guru/kunjungan", icon: MapPin },
            ],
        },
    ],
    siswa: [
        {
            title: "Utama",
            items: [
                { name: "Dashboard", href: "/siswa/dashboard", icon: LayoutDashboard },
                { name: "Pengajuan Magang", href: "/siswa/pengajuan", icon: FileText },
            ],
        },
        {
            title: "Kegiatan Magang",
            items: [
                { name: "Absensi Harian", href: "/siswa/absensi", icon: MapPin },
                { name: "Jurnal Kegiatan", href: "/siswa/jurnal", icon: Activity },
            ],
        },
    ],
};

interface SidebarProps {
    role: "admin" | "guru" | "siswa";
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export default function Sidebar({ role, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const sections = NavbarData[role] || [];

    const roleLabel = role === "admin" ? "Administrator" : role.charAt(0).toUpperCase() + role.slice(1);

    const sidebarContent = (
        <>
            {/* Header */}
            <div className={`h-16 flex items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-3 px-6"}`}>
                {collapsed ? (
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Layers className="w-4 h-4 text-white" />
                    </div>
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-sm tracking-tight text-foreground leading-tight">SIMMAS</span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{roleLabel}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Nav Items */}
            <div className={`flex-1 overflow-y-auto py-6 space-y-8 tracking-tight ${collapsed ? "px-2" : "px-4"}`}>
                {sections.map((section, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <p className="px-3 text-[11px] font-bold tracking-widest text-muted-foreground/60 uppercase mb-3">
                                {section.title}
                            </p>
                        )}
                        <nav className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onMobileClose}
                                        title={collapsed ? item.name : undefined}
                                        className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed
                                            ? "justify-center px-0 py-2.5"
                                            : "gap-3 px-3 py-2.5"
                                            } ${isActive
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                                        {!collapsed && item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`bg-background border-r border-border h-screen sticky top-0 flex-col hidden md:flex transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"}`}>
                {sidebarContent}
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
                    <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r border-border flex flex-col shadow-xl animate-slide-in">
                        <button
                            onClick={onMobileClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}