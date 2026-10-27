import React from 'react';
import { INDONESIAN_MONTHS } from '../services/googleSheets';
import { Calendar, Filter, Search, Printer, HardDrive, Check, Building, FileText } from 'lucide-react';

interface FilterBarProps {
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;

  availableMonths: number[]; // Dynamic months available for selectedYear
  selectedMonth: number | 'all';
  onSelectMonth: (month: number | 'all') => void;

  searchQuery: string;
  onSearchChange: (q: string) => void;

  selectedUnitKerja: string;
  onSelectUnitKerja: (u: string) => void;
  availableUnitKerja: string[];

  statusFilter: 'all' | 'pending' | 'completed';
  onStatusFilterChange: (s: 'all' | 'pending' | 'completed') => void;

  onOpenUnitKerjaPrintModal: () => void;
  onOpenDriveExportModal: () => void;
  isDriveReady: boolean;

  onOpenTemplateEditor: () => void;
  templateMode?: 'google_docs' | 'built_in';
  hasGoogleDoc?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  years,
  selectedYear,
  onSelectYear,
  availableMonths,
  selectedMonth,
  onSelectMonth,
  searchQuery,
  onSearchChange,
  selectedUnitKerja,
  onSelectUnitKerja,
  availableUnitKerja,
  statusFilter,
  onStatusFilterChange,
  onOpenUnitKerjaPrintModal,
  onOpenDriveExportModal,
  isDriveReady,
  onOpenTemplateEditor,
  templateMode,
  hasGoogleDoc
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 mb-6 shadow-xs">
      
      {/* Top Row: Year & Dynamic Month Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
        
        {/* Filter Tahun (Acuan Kolom T:AD 2022 - 2032) */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Tahun (2022 - 2032)</span>
          </label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => onSelectYear(Number(e.target.value))}
              className="w-full text-sm font-semibold bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>
          <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
            Acuan Kolom T:AD (2022 s/d 2032)
          </span>
        </div>

        {/* Filter Bulan Dinamis (Kolom K dengan Value "C" di Kolom T:AD) */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter Bulan (Kolom K & Value &quot;C&quot;)</span>
          </label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => onSelectMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-sm font-semibold bg-emerald-50/60 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="all">
                Semua Bulan ({availableMonths.length} bulan terdaftar value &quot;C&quot;)
              </option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {INDONESIAN_MONTHS[m - 1]} (Bulan {String(m).padStart(2, '0')})
                </option>
              ))}
            </select>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            Bulan Kolom K dengan value &quot;C&quot; pada Tahun {selectedYear}
          </span>
        </div>

        {/* Filter Unit Kerja */}
        <div className="md:col-span-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-purple-600" />
            <span>Unit Kerja (Kolom S)</span>
          </label>
          <select
            value={selectedUnitKerja}
            onChange={e => onSelectUnitKerja(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer"
          >
            <option value="all">Semua Unit Kerja ({availableUnitKerja.length} instansi)</option>
            {availableUnitKerja.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Filter cepat per OPD / Instansi
          </span>
        </div>

      </div>

      {/* Bottom Row: Search, Status Tabs & Batch Print/Drive Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Cari Nama Pegawai, NIP, Jabatan..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => onStatusFilterChange('pending')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum SK
          </button>
          <button
            onClick={() => onStatusFilterChange('completed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sudah SK
          </button>
        </div>

        {/* Batch Print, Drive & Format SK Actions */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Menu Format SK (Google Docs / Bawaan) */}
          <button
            onClick={onOpenTemplateEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 transition shadow-xs"
            title="Buka Menu Format SK & Pengaturan Template Google Docs"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Format SK</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              templateMode === 'google_docs' ? 'bg-blue-100 text-blue-800' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {templateMode === 'google_docs' ? 'Google Docs' : 'Template Bawaan'}
            </span>
          </button>

          {/* Cetak Per Unit Kerja */}
          <button
            onClick={onOpenUnitKerjaPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
            title="Cetak SATU PDF berisi semua pegawai yang memiliki Unit Kerja yang sama"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak SK per Unit Kerja</span>
          </button>

          {/* Integrasi Simpan ke Drive */}
          <button
            onClick={onOpenDriveExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition"
            title="Simpan otomatis dokumen SK ke Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-200" />
            <span>Simpan ke Drive</span>
          </button>

        </div>

      </div>

    </div>
  );
};
