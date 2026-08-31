"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertItem {
    id: number;
    type: AlertType;
    title?: string;
    message: string;
}

interface AlertContextValue {
    show: (type: AlertType, message: string, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const STYLES: Record<AlertType, { ring: string; iconBg: string; icon: string; Icon: typeof CheckCircle2 }> = {
    success: { ring: "border-emerald-500", iconBg: "bg-emerald-500/15", icon: "text-emerald-600", Icon: CheckCircle2 },
    error: { ring: "border-rose-500", iconBg: "bg-rose-500/15", icon: "text-rose-600", Icon: XCircle },
    warning: { ring: "border-amber-500", iconBg: "bg-amber-500/15", icon: "text-amber-600", Icon: AlertTriangle },
    info: { ring: "border-blue-500", iconBg: "bg-blue-500/15", icon: "text-blue-600", Icon: Info },
};

const DEFAULT_TITLES: Record<AlertType, string> = {
    success: "Berhasil",
    error: "Terjadi Kesalahan",
    warning: "Perhatian",
    info: "Informasi",
};

export function AlertProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<AlertItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const show = useCallback((type: AlertType, message: string, title?: string) => {
        const id = Date.now() + Math.random();
        setItems(prev => [...prev, { id, type, message, title }]);
        setTimeout(() => dismiss(id), 4500);
    }, [dismiss]);

    const value: AlertContextValue = {
        show,
        success: (m, t) => show("success", m, t),
        error: (m, t) => show("error", m, t),
        warning: (m, t) => show("warning", m, t),
        info: (m, t) => show("info", m, t),
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
            <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 max-w-sm w-[calc(100vw-3rem)] sm:w-auto">
                {items.map(item => {
                    const s = STYLES[item.type];
                    return (
                        <div
                            key={item.id}
                            role="alert"
                            className={`flex items-start gap-3 p-4 pr-3 rounded-2xl shadow-xl border-2 bg-background min-w-[300px] animate-in fade-in slide-in-from-top-4 duration-200 ${s.ring}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg} ${s.icon}`}>
                                <s.Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-foreground leading-tight">
                                    {item.title || DEFAULT_TITLES[item.type]}
                                </p>
                                <p className="text-sm text-muted-foreground mt-0.5 break-words">{item.message}</p>
                            </div>
                            <button
                                onClick={() => dismiss(item.id)}
                                className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-muted-foreground shrink-0"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </AlertContext.Provider>
    );
}

export function useAlert(): AlertContextValue {
    const ctx = useContext(AlertContext);
    if (!ctx) {
        // ponytail: outside-provider fallback so calls don't throw during dev hot-reload
        return {
            show: () => {},
            success: () => {},
            error: () => {},
            warning: () => {},
            info: () => {},
        };
    }
    return ctx;
}
