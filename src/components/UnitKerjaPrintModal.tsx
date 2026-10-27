import React, { useState } from 'react';
import { KGBRecord, SKTemplateConfig } from '../types/kgb';
import { generateUnitKerjaPdf, triggerDownload } from '../services/pdfGenerator';
import { Building2, Download, Printer, X, CheckCircle2, HardDrive } from 'lucide-react';

interface UnitKerjaPrintModalProps {
  records: KGBRecord[];
  template: SKTemplateConfig;
  onClose: () => void;
  onUploadUnitKerjaToDrive: (unitKerja: string, records: KGBRecord[]) => void;
  isDriveReady: boolean;
  selectedYear?: number;
}

export const UnitKerjaPrintModal: React.FC<UnitKerjaPrintModalProps> = ({
  records,
  template,
  onClose,
  onUploadUnitKerjaToDrive,
  isDriveReady,
  selectedYear
}) => {
  // Group records by Unit Kerja
  const unitMap = new Map<string, KGBRecord[]>();
  records.forEach(r => {
    const key = r.unitKerja.trim() || 'Unit Lainnya';
    const list = unitMap.get(key) || [];
    list.push(r);
    unitMap.set(key, list);
  });

  const unitList = Array.from(unitMap.entries()).map(([name, items]) => ({
    name,
    count: items.length,
    items
  }));

  const [downloadingUnit, setDownloadingUnit] = useState<string | null>(null);

  const handleDownloadUnit = (unitName: string, items: KGBRecord[]) => {
    setDownloadingUnit(unitName);
    try {
      const { blob, filename } = generateUnitKerjaPdf(unitName, items, template, selectedYear);
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setDownloadingUnit(null), 600);
    }
  };

  const handleDownloadAllUnits = () => {
    unitList.forEach(({ name, items }) => {
      const { blob, filename } = generateUnitKerjaPdf(name, items, template, selectedYear);
      triggerDownload(blob, filename);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cetak SK per Unit Kerja (1 File PDF)
              </h3>
              <p className="text-xs text-slate-400">
                Setiap file berisi seluruh pegawai dari unit kerja yang sama
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
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-600">
            <span>Ditemukan <b>{unitList.length}</b> Unit Kerja pada filter aktif</span>
            {unitList.length > 1 && (
              <button
                onClick={handleDownloadAllUnits}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Unduh Semua Unit Kerja ({unitList.length} file)
              </button>
            )}
          </div>

          <div className="space-y-3">
            {unitList.map(({ name, count, items }) => (
              <div
                key={name}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{name}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{count} Pegawai</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      Output: SK_KGB_{name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF button */}
                  <button
                    onClick={() => handleDownloadUnit(name, items)}
                    disabled={downloadingUnit === name}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingUnit === name ? 'Membuat...' : 'Unduh PDF'}</span>
                  </button>

                  {/* Upload to Google Drive */}
                  <button
                    onClick={() => onUploadUnitKerjaToDrive(name, items)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg transition"
                    title="Simpan PDF Unit Kerja ini ke Google Drive"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Drive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Format file sesuai standar dinas (A4)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
