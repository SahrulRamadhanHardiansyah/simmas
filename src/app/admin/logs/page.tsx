"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
    Activity, Search, Filter, Loader2, AlertTriangle, Code2,
    ChevronLeft, ChevronRight, X, Server, Globe, User as UserIcon,
    Info, AlertCircle, AlertOctagon, FileJson
} from "lucide-react";

interface ActivityLog {
    id: string;
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | string;
    actionType: string;
    target?: string | null;
    actorRole?: string | null;
    actorIdentifier?: string | null;
    ipAddress?: string | null;
    metadata?: Record<string, any> | string | null;
}

const LEVEL_STYLES: Record<string, { badge: string; dot: string; icon: ReactNode }> = {
    INFO: { badge: "text-blue-600 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500", icon: <Info className="w-3 h-3" /> },
    WARN: { badge: "text-amber-600 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500", icon: <AlertCircle className="w-3 h-3" /> },
    ERROR: { badge: "text-rose-600 bg-rose-500/10 border-rose-500/20", dot: "bg-rose-500", icon: <AlertOctagon className="w-3 h-3" /> },
};

function formatTimestamp(iso: string) {
    try {
        return new Date(iso).toLocaleString("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    } catch { return iso; }
}

function getRelativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "baru saja";
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [totalData, setTotalData] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [level, setLevel] = useState<string>("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [metaLog, setMetaLog] = useState<ActivityLog | null>(null);
    const [metaLoading, setMetaLoading] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const params = new URLSearchParams();
                if (debouncedSearch) params.append("search", debouncedSearch);
                if (level) params.append("level", level);
                params.append("page", String(page));
                params.append("pageSize", String(pageSize));

                const res = await fetch(`${apiUrl}/Admin/Logs?${params}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const text = await res.text();
                const result = text ? JSON.parse(text) : null;
                if (res.ok && result?.status) {
                    // Backend: { status, data: [...], pagination: { currentPage, pageSize, totalData, totalPages } }
                    setLogs(result.data ?? []);
                    const p = result.pagination ?? {};
                    setTotalData(p.totalData ?? (result.data?.length ?? 0));
                    setTotalPages(p.totalPages ?? 1);
                } else {
                    setLogs([]);
                    setTotalData(0);
                    setTotalPages(1);
                }
            } catch (err) {
                console.error("Gagal memuat log aktivitas", err);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, [debouncedSearch, level, page, pageSize, apiUrl]);

    useEffect(() => { setPage(1); }, [debouncedSearch, level, pageSize]);

    async function openMetadata(log: ActivityLog) {
        setMetaLog({ ...log, metadata: undefined });
        setMetaLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${apiUrl}/Admin/Logs/${log.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const text = await res.text();
            const result = text ? JSON.parse(text) : null;
            if (res.ok && result?.status) {
                setMetaLog({ ...log, ...(result.data ?? {}) });
            } else {
                setMetaLog(log);
            }
        } catch {
            setMetaLog(log);
        } finally {
            setMetaLoading(false);
        }
    }

    const startIndex = totalData === 0 ? 0 : (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, totalData);

    return (
        <div className="space-y-6 w-full relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-[#8b5cf6] rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-white/80 text-sm font-semibold tracking-wider uppercase">
                        <Activity className="w-4 h-4" />
                        Log Aktivitas &amp; Audit
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Jejak Aktivitas Sistem</h1>
                    <p className="text-white/80 text-sm">
                        Rekam jejak seluruh aksi pengguna &amp; sistem. Bersifat <strong>append-only</strong> &amp; hanya-baca.
                    </p>
                </div>
                <div className="relative z-10 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Log Tercatat</p>
                    <p className="text-2xl font-extrabold leading-tight">{totalData.toLocaleString("id-ID")}</p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-background rounded-2xl border border-border p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-wrap">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari aksi, target, atau aktor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="relative w-full sm:w-44">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={level}
                            onChange={e => setLevel(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="">Semua Level</option>
                            <option value="INFO">INFO</option>
                            <option value="WARN">WARN</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>Total</span>
                    <span className="text-foreground font-bold">{totalData.toLocaleString("id-ID")}</span>
                    <span>log</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[420px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Waktu</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Level</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Aksi</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Aktor</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">IP Address</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap text-center">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Memuat log aktivitas...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-foreground">Tidak ada log ditemukan</p>
                                        <p className="text-xs text-muted-foreground mt-1">Coba ubah kata kunci pencarian atau filter level.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const style = LEVEL_STYLES[log.level] ?? {
                                        badge: "text-muted-foreground bg-muted border-border",
                                        dot: "bg-muted-foreground",
                                        icon: <Info className="w-3 h-3" />,
                                    };
                                    return (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-foreground">{formatTimestamp(log.timestamp)}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{getRelativeTime(log.timestamp)}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${style.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                    {style.icon}
                                                    {log.level}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-foreground">{log.actionType}</p>
                                                {log.target && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">→ {log.target}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                        <UserIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground leading-tight">
                                                            {log.actorIdentifier || "—"}
                                                        </p>
                                                        {log.actorRole && (
                                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                                                                {log.actorRole}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {log.ipAddress ? (
                                                    <div className="inline-flex items-center gap-1.5 text-sm font-mono text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg">
                                                        <Globe className="w-3 h-3" />
                                                        {log.ipAddress}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground/60">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => openMetadata(log)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                                >
                                                    <Code2 className="w-3.5 h-3.5" />
                                                    Lihat
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Menampilkan {startIndex}-{endIndex} dari {totalData.toLocaleString("id-ID")} data</span>
                        <span className="hidden sm:inline-block w-px h-4 bg-border" />
                        <div className="flex items-center gap-2">
                            <label>Baris per halaman:</label>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                className="bg-transparent border border-border rounded px-2 py-1 focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2.5" />
                        </button>
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-2">{page} <span className="text-muted-foreground">/ {totalPages || 1}</span></span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Metadata modal */}
            {metaLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => !metaLoading && setMetaLog(null)} />
                    <div className="relative bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-extrabold text-foreground">Detail Log</h2>
                                <p className="text-xs text-muted-foreground truncate">{metaLog.actionType} • {formatTimestamp(metaLog.timestamp)}</p>
                            </div>
                            <button onClick={() => setMetaLog(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {metaLoading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                    <p className="text-sm text-muted-foreground">Memuat metadata...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <InfoRow label="ID" value={metaLog.id} mono />
                                        <InfoRow label="Level" value={metaLog.level} />
                                        <InfoRow label="Aksi" value={metaLog.actionType} />
                                        <InfoRow label="Target" value={metaLog.target || "—"} />
                                        <InfoRow label="Aktor" value={metaLog.actorIdentifier || "—"} />
                                        <InfoRow label="Role" value={metaLog.actorRole || "—"} />
                                        <InfoRow label="IP Address" value={metaLog.ipAddress || "—"} mono />
                                        <InfoRow label="Waktu" value={formatTimestamp(metaLog.timestamp)} />
                                    </div>
                                    <div>
                                        <p className="block text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-2">
                                            Metadata Payload
                                        </p>
                                        <pre className="bg-foreground text-background p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
                                            {metaLog.metadata !== undefined
                                                ? (typeof metaLog.metadata === "string"
                                                    ? metaLog.metadata
                                                    : JSON.stringify(metaLog.metadata, null, 2))
                                                : "(tidak ada metadata)"}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
                            <button onClick={() => setMetaLog(null)} className="px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Server className="w-3.5 h-3.5" />
                Log bersifat <strong className="text-foreground">append-only</strong> dan tidak dapat dihapus dari antarmuka ini.
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{label}</p>
            <p className={`mt-1 text-sm text-foreground break-all ${mono ? "font-mono" : "font-semibold"}`}>{value}</p>
        </div>
    );
}
