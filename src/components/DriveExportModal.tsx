import React, { useState } from 'react';
import { KGBRecord, SKTemplateConfig } from '../types/kgb';
import { generateSingleEmployeePdf, generateUnitKerjaPdf } from '../services/pdfGenerator';
import { getOrCreateKgbFolder, uploadPdfToDrive, DriveUploadResult } from '../services/googleDrive';
import { HardDrive, AlertTriangle, CheckCircle, ExternalLink, Loader2, X, FileText, FolderPlus } from 'lucide-react';

interface DriveExportModalProps {
  records: KGBRecord[];
  template: SKTemplateConfig;
  accessToken: string | null;
  onClose: () => void;
  singleRecord?: KGBRecord | null;
  singleUnitKerja?: { name: string; items: KGBRecord[] } | null;
  onNeedLogin: () => void;
}

export const DriveExportModal: React.FC<DriveExportModalProps> = ({
  records,
  template,
  accessToken,
  onClose,
  singleRecord,
  singleUnitKerja,
  onNeedLogin
}) => {
  const [exportMode, setExportMode] = useState<'per-pegawai' | 'per-unit-kerja'>('per-pegawai');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; filename: string }>({
    current: 0,
    total: 0,
    filename: ''
  });
  const [results, setResults] = useState<DriveUploadResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine items to upload
  const effectiveRecords = singleRecord ? [singleRecord] : records;

  const handleStartUpload = async () => {
    if (!accessToken) {
      onNeedLogin();
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setResults([]);

    try {
      // 1. Get or create target folder in Google Drive
      const folderId = await getOrCreateKgbFolder(accessToken, 'KGB - SK Kenaikan Gaji Berkala');
      const uploadedResults: DriveUploadResult[] = [];

      if (singleUnitKerja) {
        // Upload single unit kerja multi-page PDF
        setProgress({ current: 1, total: 1, filename: `SK_KGB_${singleUnitKerja.name}.pdf` });
        const { blob, filename } = generateUnitKerjaPdf(singleUnitKerja.name, singleUnitKerja.items, template);
        const res = await uploadPdfToDrive(blob, filename, accessToken, folderId);
        uploadedResults.push(res);
      } else if (singleRecord) {
        // Upload single employee PDF
        setProgress({ current: 1, total: 1, filename: `SK_KGB_${singleRecord.nama}.pdf` });
        if (template.templateMode === 'google_docs' && template.googleDocsTemplateId) {
          try {
            const { generateSKFromGoogleDocsTemplate } = await import('../services/googleDocs');
            const resDocs = await generateSKFromGoogleDocsTemplate(
              template.googleDocsTemplateId,
              singleRecord,
              accessToken,
              folderId
            );
            const res = await uploadPdfToDrive(resDocs.pdfBlob, resDocs.filename, accessToken, folderId);
            uploadedResults.push(res);
          } catch (errDocs) {
            console.warn('Fallback to built-in single upload:', errDocs);
            const { blob, filename } = generateSingleEmployeePdf(singleRecord, template);
            const res = await uploadPdfToDrive(blob, filename, accessToken, folderId);
            uploadedResults.push(res);
          }
        } else {
          const { blob, filename } = generateSingleEmployeePdf(singleRecord, template);
          const res = await uploadPdfToDrive(blob, filename, accessToken, folderId);
          uploadedResults.push(res);
        }
      } else if (exportMode === 'per-pegawai') {
        // Upload all individual PDFs
        const total = effectiveRecords.length;
        const useDocs = template.templateMode === 'google_docs' && Boolean(template.googleDocsTemplateId);
        let docsService: any = null;
        if (useDocs) {
          docsService = await import('../services/googleDocs');
        }

        for (let i = 0; i < total; i++) {
          const rec = effectiveRecords[i];
          setProgress({ current: i + 1, total, filename: `SK_KGB_${rec.nama}.pdf` });
          if (useDocs && docsService) {
            try {
              const resDocs = await docsService.generateSKFromGoogleDocsTemplate(
                template.googleDocsTemplateId,
                rec,
                accessToken,
                folderId
              );
              const res = await uploadPdfToDrive(resDocs.pdfBlob, resDocs.filename, accessToken, folderId);
              uploadedResults.push(res);
              continue;
            } catch (errDocs) {
              console.warn('Fallback per-pegawai to built-in:', errDocs);
            }
          }
          const { blob, filename } = generateSingleEmployeePdf(rec, template);
          const res = await uploadPdfToDrive(blob, filename, accessToken, folderId);
          uploadedResults.push(res);
        }
      } else {
        // Group by Unit Kerja and upload 1 PDF per unit kerja
        const unitMap = new Map<string, KGBRecord[]>();
        effectiveRecords.forEach(r => {
          const key = r.unitKerja.trim() || 'Unit Kerja';
          const list = unitMap.get(key) || [];
          list.push(r);
          unitMap.set(key, list);
        });

        const units = Array.from(unitMap.entries());
        const total = units.length;
        for (let i = 0; i < total; i++) {
          const [uName, uItems] = units[i];
          const { blob, filename } = generateUnitKerjaPdf(uName, uItems, template);
          setProgress({ current: i + 1, total, filename });
          const res = await uploadPdfToDrive(blob, filename, accessToken, folderId);
          uploadedResults.push(res);
        }
      }

      setResults(uploadedResults);
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan dokumen ke Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Simpan Otomatis ke Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Penyimpanan cloud dokumen SK Kenaikan Gaji Berkala
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
        <div className="p-6">
          {!accessToken ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Perlu Login Akun Google
              </h4>
              <p className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">
                Untuk menyimpan dokumen SK otomatis ke Google Drive Anda, silakan hubungkan akun Google terlebih dahulu dengan izin Drive.
              </p>
              <button
                onClick={onNeedLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                Login dengan Google
              </button>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="flex items-center gap-2.5 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Berhasil!</span> {results.length} file SK telah tersimpan di folder Google Drive Anda: <b>&quot;KGB - SK Kenaikan Gaji Berkala&quot;</b>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{r.name}</span>
                    </div>
                    {r.webViewLink && (
                      <a
                        href={r.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium shrink-0 ml-2"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
              >
                Selesai
              </button>
            </div>
          ) : isUploading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-900">
                Menyimpan ke Google Drive...
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Memproses file {progress.current} dari {progress.total}
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-xs mx-auto mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-500 truncate block max-w-xs mx-auto">
                {progress.filename}
              </span>
            </div>
          ) : (
            <div>
              {/* Mandatory User Confirmation Notice */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 mb-4 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                  <FolderPlus className="w-4 h-4" />
                  <span>Konfirmasi Penyimpanan Otomatis</span>
                </div>
                Aplikasi akan membuat/menggunakan folder <b>&quot;KGB - SK Kenaikan Gaji Berkala&quot;</b> di Google Drive Anda dan menyimpan dokumen SK resmi dalam format PDF berstandar A4.
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs mb-4">
                  {errorMsg}
                </div>
              )}

              {/* Single employee mode info */}
              {singleRecord ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-4">
                  <div className="font-semibold text-slate-900">{singleRecord.nama}</div>
                  <div className="text-slate-500">NIP: {singleRecord.nip} &bull; {singleRecord.unitKerja}</div>
                  <div className="text-slate-500 mt-1 font-mono text-[11px]">
                    Nama file di Drive: SK_KGB_{singleRecord.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                  </div>
                </div>
              ) : singleUnitKerja ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-4">
                  <div className="font-semibold text-slate-900">{singleUnitKerja.name}</div>
                  <div className="text-slate-500">{singleUnitKerja.items.length} Pegawai dalam 1 file PDF</div>
                  <div className="text-slate-500 mt-1 font-mono text-[11px]">
                    Nama file di Drive: SK_KGB_{singleUnitKerja.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Skema Penyimpanan:
                  </label>
                  
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="driveMode"
                      value="per-pegawai"
                      checked={exportMode === 'per-pegawai'}
                      onChange={() => setExportMode('per-pegawai')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Per Pegawai ({effectiveRecords.length} file terpisah)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Setiap pegawai memiliki 1 file PDF tersendiri dengan nama file sesuai nama pegawai.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="driveMode"
                      value="per-unit-kerja"
                      checked={exportMode === 'per-unit-kerja'}
                      onChange={() => setExportMode('per-unit-kerja')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Per Unit Kerja (1 file gabungan per OPD)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Seluruh pegawai dari unit kerja yang sama digabung ke dalam 1 file PDF sesuai nama unit kerja.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleStartUpload}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Konfirmasi & Simpan ke Drive</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
