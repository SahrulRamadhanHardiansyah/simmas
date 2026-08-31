"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { AlertProvider } from "@/components/ui/Alert";

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleMenuClick = useCallback(() => {
        if (window.innerWidth >= 768) {
            setCollapsed(prev => !prev);
        } else {
            setMobileOpen(true);
        }
    }, []);

    return (
        <AlertProvider>
            <div className="flex min-h-screen bg-muted/20">
                <Sidebar
                    role="siswa"
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header title="Portal Siswa" onMenuClick={handleMenuClick} />
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AlertProvider>
    );
}
