"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface AppSettings {
    appName: string;
    appFullName: string;
    appDescription: string;
    heroTitle: string;
    heroDescription: string;
    schoolName: string;
    schoolWebsite: string;
    headmasterName: string;
    headmasterNip: string;
    schoolAddress: string;
    schoolPhone: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    appName: "SIMMAS",
    appFullName: "Sistem Informasi Manajemen Magang Siswa",
    appDescription: "Platform digital untuk mengelola program magang siswa di dunia industri.",
    heroTitle: "Selamat Datang di SIMMAS",
    heroDescription: "Kelola dan pantau aktivitas magang siswa secara real-time, terstruktur, dan modern.",
    schoolName: "SMK Negeri 1 Contoh",
    schoolWebsite: "https://smkn1contoh.sch.id",
    headmasterName: "Drs. H. Kepala Sekolah, M.Pd.",
    headmasterNip: "196801011990031001",
    schoolAddress: "Jl. Pendidikan No. 1, Kota Contoh, Provinsi, 12345",
    schoolPhone: "(021) 1234567",
};

interface SettingsContextValue {
    settings: AppSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
    settings: DEFAULT_SETTINGS,
    loading: true,
    refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/Admin/Settings`);

            if (!res.ok) return;

            const text = await res.text();
            if (!text) return;

            const result = JSON.parse(text);

            if (result.status && result.data) {
                const d = result.data;
                const identitas = d.IdentitasAplikasi || d.identitasAplikasi || {};
                const hero = d.HalamanDepan || d.halamanDepan || {};
                const sekolah = d.DataSekolah || d.dataSekolah || {};

                setSettings({
                    appName: identitas.appName ?? identitas.AppName ?? DEFAULT_SETTINGS.appName,
                    appFullName: identitas.appFullName ?? identitas.AppFullName ?? DEFAULT_SETTINGS.appFullName,
                    appDescription: identitas.appDescription ?? identitas.AppDescription ?? DEFAULT_SETTINGS.appDescription,
                    heroTitle: hero.heroTitle ?? hero.HeroTitle ?? DEFAULT_SETTINGS.heroTitle,
                    heroDescription: hero.heroDescription ?? hero.HeroDescription ?? DEFAULT_SETTINGS.heroDescription,
                    schoolName: sekolah.schoolName ?? sekolah.SchoolName ?? DEFAULT_SETTINGS.schoolName,
                    schoolWebsite: sekolah.schoolWebsite ?? sekolah.SchoolWebsite ?? DEFAULT_SETTINGS.schoolWebsite,
                    headmasterName: sekolah.headmasterName ?? sekolah.HeadmasterName ?? DEFAULT_SETTINGS.headmasterName,
                    headmasterNip: sekolah.headmasterNip ?? sekolah.HeadmasterNip ?? DEFAULT_SETTINGS.headmasterNip,
                    schoolAddress: sekolah.schoolAddress ?? sekolah.SchoolAddress ?? DEFAULT_SETTINGS.schoolAddress,
                    schoolPhone: sekolah.schoolPhone ?? sekolah.SchoolPhone ?? DEFAULT_SETTINGS.schoolPhone,
                });
            }
        } catch (err) {
            console.error("Gagal memuat pengaturan publik:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

export { DEFAULT_SETTINGS };
