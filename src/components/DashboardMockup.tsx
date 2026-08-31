const rows = [
  { name: "Nana Siswa", cls: "AK1", mitra: "Perusahaan Mitra", status: "Aktif" },
  { name: "Amelia Putri", cls: "AK2", mitra: "Perusahaan Mitra", status: "Aktif" },
  { name: "Asrif Nagib", cls: "AK3", mitra: "Perusahaan Mitra", status: "Menunggu" },
  { name: "Yura Elita", cls: "AK1", mitra: "Makar Mitra", status: "Aktif" },
  { name: "Nana Dwigat", cls: "AK2", mitra: "Perusahaan Mitra", status: "Aktif" },
];

const sidebarItems = [
  { label: "Browse", active: true },
  { label: "Data Siswa", active: false },
  { label: "Permohonan Magang", active: false },
  { label: "Kehadiran", active: false },
];

const statCards = [
  { label: "Total Siswa", val: "324" },
  { label: "Total Guru", val: "45" },
  { label: "Mitra DUDI", val: "112" },
];

export default function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto animate-float">
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/8 overflow-hidden border border-gray-200/50">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
          <span className="w-2.5 h-2.5 rounded-full bg-dot-red" />
          <span className="w-2.5 h-2.5 rounded-full bg-dot-yellow" />
          <span className="w-2.5 h-2.5 rounded-full bg-dot-green" />
        </div>

        <div className="flex">
          <div className="w-36 border-r border-gray-100 p-3 hidden sm:flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white text-[8px] font-black">S</span>
              </div>
              <span className="text-[10px] font-bold text-gray-800">SIMMAS</span>
            </div>
            <nav className="space-y-0.5">
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] ${
                    item.active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-sm ${
                      item.active ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-800">Dashboard</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Live
                </span>
                <span className="text-[10px] font-bold text-gray-800">324 Siswa</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {statCards.map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[8px] text-gray-400 mb-0.5">{s.label}</p>
                  <p className="text-xs font-bold text-gray-800">{s.val}</p>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-bold text-gray-800 mb-1.5">
              Daftar Permohonan Magang Siswa
            </p>
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="text-left py-1 font-medium">Nama Siswa</th>
                  <th className="text-left py-1 font-medium">Kelas</th>
                  <th className="text-left py-1 font-medium hidden sm:table-cell">Perusahaan Mitra</th>
                  <th className="text-left py-1 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 font-medium text-gray-700">{r.name}</td>
                    <td className="py-1.5 text-gray-400">{r.cls}</td>
                    <td className="py-1.5 text-gray-400 hidden sm:table-cell">{r.mitra}</td>
                    <td className="py-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[7px] font-semibold ${
                          r.status === "Aktif"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-100 px-3 py-1.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-gray-700">Profil →</span>
      </div>
    </div>
  );
}
