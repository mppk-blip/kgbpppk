import React from 'react';
import { KGBRecord } from '../types/kgb';
import { formatRupiah } from '../services/salaryTable';
import { Users, FileCheck, AlertCircle, Building2, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  records: KGBRecord[];
  allRecords: KGBRecord[];
  selectedYear: number;
  selectedMonth: number | 'all';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  records,
  allRecords,
  selectedYear,
  selectedMonth
}) => {
  const totalInFilter = records.length;
  const sudahSk = records.filter(r => Boolean(r.nomorSk && r.nomorSk.trim())).length;
  const belumSk = totalInFilter - sudahSk;
  const percentage = totalInFilter > 0 ? Math.round((sudahSk / totalInFilter) * 100) : 0;

  // Unique unit kerja count in current filter
  const uniqueUnits = new Set(records.map(r => r.unitKerja.trim()).filter(Boolean)).size;

  // Total kenaikan gaji (Selisih Gaji Pokok Baru - Gaji Pokok Lama)
  const totalSelisih = records.reduce((acc, r) => {
    const diff = (r.gajiBaru || 0) - (r.gajiLama || 0);
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      
      {/* 1. Total Pegawai */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Target KGB
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900">{totalInFilter}</div>
          <span className="text-xs text-slate-400">Pegawai</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Tahun {selectedYear} {selectedMonth !== 'all' ? `(Bulan ${selectedMonth})` : 'Semua Bulan'}
        </p>
      </div>

      {/* 2. SK Lengkap */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            SK Ditetapkan
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-emerald-700">{sudahSk}</div>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 3. Belum Ditetapkan */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Belum Ada SK
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-amber-600">{belumSk}</div>
          <span className="text-xs text-slate-400">Perlu Nomor SK</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {belumSk > 0 ? 'Dapat diisi manual / bulk di tabel' : 'Semua nomor SK lengkap!'}
        </p>
      </div>

      {/* 4. Unit Kerja */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Unit Kerja
          </span>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900">{uniqueUnits}</div>
          <span className="text-xs text-slate-400">Instansi / OPD</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Tersedia unduh 1 PDF gabungan
        </p>
      </div>

      {/* 5. Estimasi Kenaikan Anggaran */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Kenaikan Gaji/Bln
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-lg font-bold text-indigo-900 truncate">
            {formatRupiah(totalSelisih)}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Selisih per bulan dalam filter
        </p>
      </div>

    </div>
  );
};
