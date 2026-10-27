import React, { useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, HelpCircle, ExternalLink, RefreshCw, X, Database } from 'lucide-react';

interface SheetsConfigModalProps {
  spreadsheetInput: string;
  onSpreadsheetInputChange: (val: string) => void;
  kgbSheetName: string;
  onKgbSheetNameChange: (val: string) => void;
  templateSheetName: string;
  onTemplateSheetNameChange: (val: string) => void;
  onLoadFromSheets: () => void;
  onLoadDemoData: () => void;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  accessToken: string | null;
  onNeedLogin: () => void;
}

export const SheetsConfigModal: React.FC<SheetsConfigModalProps> = ({
  spreadsheetInput,
  onSpreadsheetInputChange,
  kgbSheetName,
  onKgbSheetNameChange,
  templateSheetName,
  onTemplateSheetNameChange,
  onLoadFromSheets,
  onLoadDemoData,
  isLoading,
  error,
  onClose,
  accessToken,
  onNeedLogin
}) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Koneksi Google Sheets (DB KGB & TEMPLATE)
              </h3>
              <p className="text-xs text-slate-400">
                Input data langsung dari Google Sheets untuk visualisasi real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal memuat spreadsheet:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Input Spreadsheet ID or URL */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Spreadsheet URL atau ID:
            </label>
            <input
              type="text"
              value={spreadsheetInput}
              onChange={e => onSpreadsheetInputChange(e.target.value)}
              placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tempel tautan lengkap dari browser atau Spreadsheet ID dokumen Google Sheets Anda.
            </p>
          </div>

          {/* Sheet Names */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sheet Data KGB:
              </label>
              <input
                type="text"
                value={kgbSheetName}
                onChange={e => onKgbSheetNameChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                placeholder="DB KGB"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Default: DB KGB</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sheet Template SK:
              </label>
              <input
                type="text"
                value={templateSheetName}
                onChange={e => onTemplateSheetNameChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                placeholder="TEMPLATE"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Default: TEMPLATE</span>
            </div>
          </div>

          {/* Collapsible Column Structure Guide */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Sembunyikan' : 'Lihat'} Struktur Acuan Kolom Google Sheets</span>
            </button>

            {showGuide && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-slate-900 border-b pb-1">
                  Format Kolom Sheet &quot;DB KGB&quot;:
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <div><b>Kolom B</b>: Nama Lengkap Pegawai</div>
                  <div><b>Kolom C</b>: NIP / NIPPPK Pegawai</div>
                  <div><b>Kolom K</b>: Tanggal TMT / Bulan Acuan (diambil bulannya)</div>
                  <div><b>Kolom R</b>: Jabatan Pegawai</div>
                  <div><b>Kolom S</b>: Unit Kerja / OPD</div>
                  <div><b>Kolom T : AD</b>: Acuan Filter Tahun (2024, 2025, 2026, dst)</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Data alternative */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-semibold">Mode Simulasi Cepat:</span>
                <span className="text-emerald-700 ml-1">Gunakan data contoh PNS & PPPK 2025-2027</span>
              </div>
            </div>
            <button
              onClick={() => {
                onLoadDemoData();
                onClose();
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition"
            >
              Muat Demo
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {!accessToken && (
              <button
                onClick={onNeedLogin}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Login Google Terlebih Dahulu
              </button>
            )}

            <button
              onClick={() => {
                if (!accessToken) {
                  onNeedLogin();
                } else {
                  onLoadFromSheets();
                }
              }}
              disabled={isLoading || !spreadsheetInput.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Memuat...' : 'Hubungkan & Tarik Data'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
