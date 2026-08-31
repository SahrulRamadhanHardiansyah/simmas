"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu, Layers, LogOut } from "lucide-react";
import { NavbarData } from "./Sidebar";

interface HeaderProps {
    title: string;
    onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState<string>("Admin");
    const wrapRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Search state
    const [query, setQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const role = (typeof window !== "undefined" ? localStorage.getItem("role") : null) as "admin" | "guru" | "siswa" | null;

    // Flatten menu items for current role
    const menuItems = role && NavbarData[role]
        ? NavbarData[role].flatMap(s => s.items.map(i => ({ ...i, section: s.title })))
        : [];

    const filtered = query.trim()
        ? menuItems.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
        : [];

    const handleSelect = useCallback((href: string) => {
        setQuery("");
        setSearchFocused(false);
        inputRef.current?.blur();
        router.push(href);
    }, [router]);

    // ⌘K / Ctrl+K shortcut
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setQuery("");
                setSearchFocused(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    // Close search dropdown on outside click
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/Me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => {
                if (j?.success && j.data?.name) setName(j.data.name);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.push("/login");
    };

    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "AD";

    return (
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <Layers className="w-3 h-3" />
                    </div>
                    <span className="text-foreground font-semibold">{title}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search with dropdown */}
                <div ref={searchRef} className="hidden lg:block relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        placeholder="Cari menu..."
                        className="pl-9 pr-12 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground font-sans">⌘K</kbd>
                    </div>

                    {/* Search results dropdown */}
                    {searchFocused && query.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                            {filtered.length > 0 ? (
                                filtered.map((item) => (
                                    <button
                                        key={item.href}
                                        onClick={() => handleSelect(item.href)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                                    >
                                        <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate">{item.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{item.section}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                    Tidak ditemukan
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-background"></span>
                </button>

                <div ref={wrapRef} className="relative pl-4 border-l border-border">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="flex items-center gap-2 cursor-pointer py-1"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                            {initials}
                        </div>
                        <span className="text-sm font-semibold text-foreground hidden sm:block">
                            {name}
                        </span>
                    </button>

                    {open && (
                        <button
                            onClick={handleLogout}
                            className="absolute right-0 top-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background shadow-lg text-sm font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
