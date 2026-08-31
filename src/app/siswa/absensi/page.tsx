"use client";

import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import {
    Loader2, AlertCircle, ClipboardCheck, Calendar, Clock,
    Image as ImageIcon, X, CheckCircle, Plus, XCircle, Camera, Upload, SwitchCamera, RotateCcw
} from "lucide-react";
import { useAlert } from "@/components/ui/Alert";

type PresensiType = "hadir" | "sakit" | "izin";

export default function SiswaAbsensiPage() {
    const alertApi = useAlert();
    const [data, setData] = useState<any[]>([]);
    const [absensiHariIni, setAbsensiHariIni] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [clockOutLoading, setClockOutLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ponytail: camera state — getUserMedia popup, no library needed
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraOpen(false);
        setCameraReady(false);
    }, []);

    const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
        stopCamera();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
                audio: false,
            });
            streamRef.current = stream;
            setCameraOpen(true);
            setFacingMode(facing);
            // Attach stream after state renders the <video>
            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            });
        } catch {
            alertApi.error("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        }
    }, [facingMode, stopCamera, alertApi]);

    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            if (!blob) return;
            const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            stopCamera();
        }, "image/jpeg", 0.85);
    }, [stopCamera]);

    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        status: "hadir" as PresensiType,
        jam: new Date().toTimeString().slice(0, 8),
        photoUrl: "",
    });

    const resolvePhotoUrl = (url: string | null, folder: string = "absensi") => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        if (url.startsWith("/")) return url;
        return `/uploads/${folder}/${url}`;
    };

    const fetchAbsensi = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Absensi/siswa/saya?page=1&pageSize=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (res.ok && result.status) {
                setData(result.data || []);
                setAbsensiHariIni(result.absensiHariIni || null);
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal memuat data absensi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAbsensi(); }, []);

    const openModal = (status: PresensiType = "hadir") => {
        setFormData({
            tanggal: new Date().toISOString().slice(0, 10),
            status,
            jam: new Date().toTimeString().slice(0, 8),
            photoUrl: "",
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        stopCamera();
        setModalOpen(false);
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.tanggal) { alertApi.error("Tanggal wajib diisi."); return; }
        if (!formData.jam) { alertApi.error("Jam wajib diisi."); return; }

        setSaving(true);
        let uploadedPhotoUrl = formData.photoUrl;

        if (photoFile) {
            setUploading(true);
            const uploadForm = new FormData();
            uploadForm.append("file", photoFile);
            uploadForm.append("folder", "absensi");

            try {
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
                const uploadResult = await uploadRes.json();
                if (!uploadRes.ok || !uploadResult.status) {
                    alertApi.error(uploadResult.message || "Gagal mengupload foto.");
                    setUploading(false);
                    setSaving(false);
                    return;
                }
                uploadedPhotoUrl = uploadResult.data.url;
            } catch (err: any) {
                alertApi.error("Terjadi kesalahan saat upload foto.");
                setUploading(false);
                setSaving(false);
                return;
            }
            setUploading(false);
        }

        try {
            const token = localStorage.getItem("token");
            const payload = {
                tanggal: formData.tanggal,
                jam: formData.jam.length === 5 ? `${formData.jam}:00` : formData.jam, // ponytail: TimeOnly needs HH:mm:ss
                status: formData.status,
                photoUrl: uploadedPhotoUrl || null,
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Absensi/siswa/clock-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Presensi berhasil dicatat.");
                closeModal();
                fetchAbsensi();
            } else {
                alertApi.error(result.message || "Gagal mencatat presensi.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal mencatat presensi.");
        } finally {
            setSaving(false);
        }
    };

    const handleClockOut = async () => {
        if (!absensiHariIni) return;
        setClockOutLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Absensi/siswa/${absensiHariIni.id}/clock-out`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    jam: new Date().toTimeString().slice(0, 8),
                    photoUrl: absensiHariIni.photoPulangUrl || null,
                }),
            });
            const result = await res.json();
            if (res.ok && result.status) {
                alertApi.success(result.message || "Clock out berhasil.");
                fetchAbsensi();
            } else {
                alertApi.error(result.message || "Gagal clock out.");
            }
        } catch (err: any) {
            alertApi.error(err.message || "Gagal clock out.");
        } finally {
            setClockOutLoading(false);
        }
    };

    const statusBadge = (s: string, v: string) => {
        const sMap: Record<string, { label: string; cls: string }> = {
            hadir: { label: "Hadir", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            sakit: { label: "Sakit", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
            izin: { label: "Izin", cls: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
            alfa: { label: "Alfa", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
        };
        const vMap: Record<string, { label: string; cls: string }> = {
            pending: { label: "Menunggu", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
            disetujui: { label: "Disetujui", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            ditolak: { label: "Ditolak", cls: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
        };
        const sb = sMap[s] || { label: s, cls: "text-muted-foreground bg-muted border-border" };
        const vb = vMap[v] || { label: v, cls: "text-muted-foreground bg-muted border-border" };
        return { sb, vb };
    };

    return (
        <div className="space-y-6 w-full">

            {/* Header + Aksi Cepat */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Absensi Harian</h1>
                    <p className="text-sm text-muted-foreground mt-1">Catat kehadiran harian dan pantau riwayat presensimu.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!absensiHariIni ? (
                        <>
                            <button onClick={() => openModal("hadir")} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm">
                                <CheckCircle className="w-4 h-4" /> Clock In
                            </button>
                            <button onClick={() => openModal("sakit")} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm">
                                <Plus className="w-4 h-4" /> Sakit
                            </button>
                            <button onClick={() => openModal("izin")} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm">
                                <Plus className="w-4 h-4" /> Izin
                            </button>
                        </>
                    ) : absensiHariIni.status === "hadir" && !absensiHariIni.jamPulang ? (
                        <button onClick={handleClockOut} disabled={clockOutLoading} className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors active:scale-95 shadow-sm disabled:opacity-60">
                            {clockOutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <><Clock className="w-4 h-4" /> Clock Out</>}
                        </button>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Presensi hari ini sudah tercatat.</span>
                    )}
                </div>
            </div>

            {/* Presensi Hari Ini Card */}
            {absensiHariIni && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-emerald-700 tracking-widest uppercase">Presensi Hari Ini</p>
                        <p className="text-sm text-foreground font-semibold mt-0.5">
                            Status: <span className="capitalize">{absensiHariIni.status}</span>
                            {absensiHariIni.jamMasuk && <span className="text-muted-foreground"> • Masuk {absensiHariIni.jamMasuk}</span>}
                            {absensiHariIni.jamPulang && <span className="text-muted-foreground"> • Pulang {absensiHariIni.jamPulang}</span>}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabel Riwayat */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h3 className="font-bold text-foreground">Riwayat Presensi</h3>
                    <p className="text-xs text-muted-foreground mt-1">Daftar presensi magang yang pernah Anda lakukan.</p>
                </div>
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Jam Masuk</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Jam Pulang</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Foto</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">Validasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Memuat data...</p></td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center">
                                    <ClipboardCheck className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-foreground">Belum ada riwayat presensi.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Mulai catat presensi harian Anda.</p>
                                </td></tr>
                            ) : data.map((a: any) => {
                                const b = statusBadge(a.status, a.validasiStatus);
                                return (
                                    <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold text-foreground">{new Date(a.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${b.sb.cls}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{b.sb.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-foreground">{a.jamMasuk || "-"}</td>
                                        <td className="px-6 py-4 text-center text-sm text-foreground">{a.jamPulang || "-"}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {a.photoMasukUrl && (
                                                    <a href={resolvePhotoUrl(a.photoMasukUrl) as string} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors" title="Foto Masuk">
                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {a.photoPulangUrl && (
                                                    <a href={resolvePhotoUrl(a.photoPulangUrl) as string} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors" title="Foto Pulang">
                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {!a.photoMasukUrl && !a.photoPulangUrl && <span className="text-xs text-muted-foreground">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${b.vb.cls}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{b.vb.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Presensi */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" /> Form Presensi Harian
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status Kehadiran <span className="text-rose-500">*</span></label>
                                <div className="grid grid-cols-3 gap-2">
                                    {([
                                        { v: "hadir", label: "Hadir", cls: "border-emerald-500 bg-emerald-500/10 text-emerald-600" },
                                        { v: "sakit", label: "Sakit", cls: "border-amber-500 bg-amber-500/10 text-amber-600" },
                                        { v: "izin", label: "Izin", cls: "border-blue-500 bg-blue-500/10 text-blue-600" },
                                    ] as { v: PresensiType; label: string; cls: string }[]).map((s) => (
                                        <button
                                            type="button"
                                            key={s.v}
                                            onClick={() => setFormData({ ...formData, status: s.v })}
                                            className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${formData.status === s.v ? s.cls : "border-border text-muted-foreground hover:border-foreground/30"}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tanggal <span className="text-rose-500">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.tanggal}
                                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Jam <span className="text-rose-500">*</span></label>
                                    <input
                                        type="time"
                                        value={formData.jam}
                                        onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                                    {formData.status === "hadir" ? "Foto Selfie" : formData.status === "sakit" ? "Surat Keterangan Dokter" : "Bukti Pendukung"} <span className="text-muted-foreground/60 normal-case">(Opsional)</span>
                                </label>

                                {/* Camera live viewfinder — hadir only */}
                                {cameraOpen && (
                                    <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            onLoadedMetadata={() => setCameraReady(true)}
                                            className="w-full rounded-xl"
                                            style={{ transform: facingMode === "user" ? "scaleX(-1)" : undefined }}
                                        />
                                        {!cameraReady && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                                            <button type="button" onClick={() => startCamera(facingMode === "user" ? "environment" : "user")} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors" title="Ganti kamera">
                                                <SwitchCamera className="w-5 h-5" />
                                            </button>
                                            <button type="button" onClick={capturePhoto} disabled={!cameraReady} className="w-16 h-16 rounded-full bg-white border-4 border-white/50 flex items-center justify-center hover:scale-95 active:scale-90 transition-transform disabled:opacity-40" title="Ambil foto">
                                                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
                                            </button>
                                            <button type="button" onClick={stopCamera} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors" title="Tutup kamera">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Preview / trigger area */}
                                {!cameraOpen && (
                                    <div
                                        className={`relative w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                                            photoPreview ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        }`}
                                        onClick={() => {
                                            if (formData.status === "hadir") {
                                                startCamera();
                                            } else {
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                const file = e.dataTransfer.files[0];
                                                setPhotoFile(file);
                                                setPhotoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    >
                                        {/* Hidden file input — only for sakit/izin */}
                                        <input
                                            key={formData.status}
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    setPhotoFile(file);
                                                    setPhotoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        {photoPreview ? (
                                            <div className="relative inline-block">
                                                <img src={photoPreview} alt="Preview" className="max-h-32 rounded-lg object-contain mx-auto shadow-sm" style={formData.status === "hadir" ? { transform: "scaleX(-1)" } : undefined} />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPhotoFile(null);
                                                        setPhotoPreview(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                {formData.status === "hadir" && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPhotoFile(null);
                                                            setPhotoPreview(null);
                                                            startCamera();
                                                        }}
                                                        className="mt-2 text-xs text-primary font-semibold flex items-center gap-1 mx-auto hover:underline"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Ambil ulang
                                                    </button>
                                                )}
                                            </div>
                                        ) : formData.photoUrl ? (
                                            <div className="relative inline-block">
                                                <img src={resolvePhotoUrl(formData.photoUrl) as string} alt="Tersimpan" className="max-h-32 rounded-lg object-contain mx-auto shadow-sm" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, photoUrl: "" });
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <p className="text-[10px] text-muted-foreground mt-2">Foto saat ini</p>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                                                    {formData.status === "hadir" ? <Camera className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {formData.status === "hadir" ? "Klik untuk buka kamera" : "Klik atau tarik foto ke sini"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">Maks. 5MB (JPG, PNG, WebP)</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Batal</button>
                                <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-60">
                                    {(saving || uploading) ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? "Mengupload..." : "Menyimpan..."}</> : <><CheckCircle className="w-4 h-4" /> Simpan Presensi</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
