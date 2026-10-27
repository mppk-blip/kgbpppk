/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { KGBRecord, SKTemplateConfig } from './types/kgb';
import { DEFAULT_KGB_DATA, DEFAULT_TEMPLATE, fetchSpreadsheetData, INDONESIAN_MONTHS, ALL_KGB_YEARS, hasValueCForYear } from './services/googleSheets';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from './services/firebase';
import { generateSingleEmployeePdf, triggerDownload } from './services/pdfGenerator';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { KGBTable } from './components/KGBTable';
import { SKPreviewModal } from './components/SKPreviewModal';
import { SheetsConfigModal } from './components/SheetsConfigModal';
import { UnitKerjaPrintModal } from './components/UnitKerjaPrintModal';
import { DriveExportModal } from './components/DriveExportModal';
import { TemplateEditorModal } from './components/TemplateEditorModal';
import { Check, CheckCircle2, AlertCircle, FileSpreadsheet, HardDrive, Printer, RotateCcw, FileText, Settings2 } from 'lucide-react';
import { getGajiPokok, parseMkYears } from './services/salaryTable';

const STORAGE_KEY_DATA = 'kgb_app_records_v10_mulai_tanggal_auto';
const STORAGE_KEY_TEMPLATE = 'kgb_app_template_v5_gdocs_master';
const STORAGE_KEY_SHEET_ID = 'kgb_app_sheet_id_v1';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data state
  const [records, setRecords] = useState<KGBRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize any corrupt/unreasonable salaries from earlier versions
          return parsed.map((r: KGBRecord) => {
            const gol = r.kolomF || r.pangkatGol || 'V';
            const mkSblmYears = parseMkYears(r.mkSebelum);
            const mkSsdhYears = parseMkYears(r.mkSesudah);
            const correctGajiLama = (!r.gajiLama || r.gajiLama > 20000000 || r.gajiLama < 1800000 || mkSblmYears === 0)
              ? getGajiPokok(gol, mkSblmYears)
              : r.gajiLama;
            const correctGajiBaru = (!r.gajiBaru || r.gajiBaru > 20000000 || r.gajiBaru < 1800000)
              ? getGajiPokok(gol, mkSsdhYears)
              : r.gajiBaru;
            return {
              ...r,
              gajiLama: correctGajiLama,
              gajiBaru: correctGajiBaru
            };
          });
        }
      } catch (e) {
        console.error('Failed to parse cached records', e);
      }
    }
    return DEFAULT_KGB_DATA;
  });

  // Template state
  const [template, setTemplate] = useState<SKTemplateConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_TEMPLATE,
          ...parsed,
          templateMode: 'google_docs',
          templateText: parsed.templateText || DEFAULT_TEMPLATE.templateText
        };
      } catch (e) {
        console.error('Failed to parse cached template', e);
      }
    }
    return DEFAULT_TEMPLATE;
  });

  // Spreadsheet config state
  const [spreadsheetInput, setSpreadsheetInput] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_ID) || '';
  });
  const [kgbSheetName, setKgbSheetName] = useState('DB KGB');
  const [templateSheetName, setTemplateSheetName] = useState('TEMPLATE');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Dynamic filter state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals state
  const [previewRecord, setPreviewRecord] = useState<KGBRecord | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showUnitKerjaPrintModal, setShowUnitKerjaPrintModal] = useState(false);
  const [showDriveExportModal, setShowDriveExportModal] = useState(false);
  const [driveExportSingleRecord, setDriveExportSingleRecord] = useState<KGBRecord | null>(null);
  const [driveExportSingleUnit, setDriveExportSingleUnit] = useState<{ name: string; items: KGBRecord[] } | null>(null);

  // Show toast notification
  const showToast = (title: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (usr, token) => {
        setUser(usr);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast('Berhasil login dengan akun Google! Google Sheets & Drive terhubung.');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal login dengan Google', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    showToast('Telah keluar dari akun Google', 'info');
  };

  // 2. Compute dynamic years from data (acuan kolom T:AD: 2022 s/d 2032)
  const availableYears = useMemo(() => {
    const fromData = records
      .flatMap(r => [r.tahunKgb, ...(r.activeYears || [])])
      .filter((y): y is number => typeof y === 'number' && !isNaN(y));

    // Guarantee full range 2022 - 2032 based on columns T : AD
    const combined = Array.from(new Set([...ALL_KGB_YEARS, ...fromData]));
    combined.sort((a, b) => a - b);
    return combined;
  }, [records]);

  // Ensure selected year is in availableYears
  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // 3. Compute dynamic months for selected year:
  // "untuk filter bulan, bulan diambil dari kolom K(hanya bulannya saja) dengan kolom T:AD value "C" sebagai dasar untuk mengelompokkan bulan dan data pegawai."
  const availableMonthsForSelectedYear = useMemo(() => {
    // Saring pegawai yang secara mutlak memiliki value "C" pada tahun terpilih
    const matchingRecords = records.filter(r => hasValueCForYear(r, selectedYear));

    // Ambil bulan dari Kolom K (hanya bulannya saja: 1 - 12)
    const months = matchingRecords
      .map(r => r.bulanKgb)
      .filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12);

    const uniqueMonths = Array.from(new Set(months));
    uniqueMonths.sort((a, b) => a - b);
    return uniqueMonths;
  }, [records, selectedYear]);

  // Dynamic dropdown validation for month:
  // If user changed year and selectedMonth is not present in the new availableMonths, adjust gracefully
  useEffect(() => {
    if (selectedMonth !== 'all' && !availableMonthsForSelectedYear.includes(selectedMonth)) {
      if (availableMonthsForSelectedYear.length > 0) {
        setSelectedMonth(availableMonthsForSelectedYear[0]);
      } else {
        setSelectedMonth('all');
      }
    }
  }, [selectedYear, availableMonthsForSelectedYear, selectedMonth]);

  // 4. Compute available Unit Kerja for selected year (hanya pegawai dengan value "C")
  const availableUnitKerja = useMemo(() => {
    const matchingRecords = records.filter(r => hasValueCForYear(r, selectedYear));
    const units = Array.from(
      new Set(matchingRecords.map(r => r.unitKerja.trim()).filter(Boolean))
    );
    units.sort();
    return units;
  }, [records, selectedYear]);

  // 5. Filter records for selected year and month
  // "data yang tampil pada daftar pegawai sesuai dengan bulan yang ada pada kolom K dengan value "C" di kolom T:AD"
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => {
        // Syarat 1: Mutlak harus memiliki value "C" di kolom tahun terpilih (Kolom T:AD)
        if (!hasValueCForYear(r, selectedYear)) return false;

        // Syarat 2: Filter Bulan dari Kolom K (hanya bulannya saja)
        if (selectedMonth !== 'all' && r.bulanKgb !== selectedMonth) {
          return false;
        }

        // Syarat 3: Filter Unit Kerja (Kolom S)
        if (
          selectedUnitKerja !== 'all' &&
          r.unitKerja.trim().toLowerCase() !== selectedUnitKerja.trim().toLowerCase()
        ) {
          return false;
        }

        // Syarat 4: Filter Status SK
        const currentNomorSk = r.yearDetails?.[selectedYear]?.nomorSk || r.nomorSk;
        if (statusFilter === 'pending' && Boolean(currentNomorSk && currentNomorSk.trim())) return false;
        if (statusFilter === 'completed' && (!currentNomorSk || !currentNomorSk.trim())) return false;

        // Syarat 5: Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = r.nama.toLowerCase().includes(q);
          const matchNip = r.nip.toLowerCase().includes(q);
          const matchJab = r.jabatan.toLowerCase().includes(q);
          const matchUnit = r.unitKerja.toLowerCase().includes(q);
          const matchSk = (currentNomorSk || '').toLowerCase().includes(q);
          if (!matchName && !matchNip && !matchJab && !matchUnit && !matchSk) {
            return false;
          }
        }

        return true;
      })
      .map(r => {
        const yearDetail = r.yearDetails?.[selectedYear];
        return {
          ...r,
          tahunKgb: selectedYear,
          tmtKgb: `${selectedYear}-${String(r.bulanKgb).padStart(2, '0')}-01`,
          nomorSk: yearDetail?.nomorSk || r.nomorSk,
          tanggalPenetapan: yearDetail?.tanggalPenetapan || r.tanggalPenetapan
        };
      });
  }, [records, selectedYear, selectedMonth, selectedUnitKerja, statusFilter, searchQuery]);

  // 6. Update single record (persisting per-year fields)
  const handleUpdateRecord = (id: string, updates: Partial<KGBRecord>) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updatedYearDetails = { ...(r.yearDetails || {}) };
          if (updates.nomorSk !== undefined || updates.tanggalPenetapan !== undefined) {
            updatedYearDetails[selectedYear] = {
              ...(updatedYearDetails[selectedYear] || {}),
              ...(updates.nomorSk !== undefined ? { nomorSk: updates.nomorSk } : {}),
              ...(updates.tanggalPenetapan !== undefined ? { tanggalPenetapan: updates.tanggalPenetapan } : {})
            };
          }
          return { ...r, ...updates, yearDetails: updatedYearDetails };
        }
        return r;
      })
    );
    setHasUnsavedChanges(true);
  };

  // 7. Save single record
  const handleSaveRecord = (id: string) => {
    setRecords(prev => {
      const updated = prev.map(r => (r.id === id ? { ...r, isSaved: true } : r));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updated));
      return updated;
    });
    setHasUnsavedChanges(false);
    showToast('Data baris berhasil disimpan!');
  };

  // 8. Save all changes
  const handleSaveAll = () => {
    setRecords(prev => {
      const updated = prev.map(r => ({ ...r, isSaved: true }));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updated));
      return updated;
    });
    setHasUnsavedChanges(false);
    showToast('Seluruh perubahan data KGB berhasil disimpan ke penyimpanan lokal!');
  };

  // 9. Save template
  const handleSaveTemplate = (newTemplate: SKTemplateConfig) => {
    setTemplate(newTemplate);
    localStorage.setItem(STORAGE_KEY_TEMPLATE, JSON.stringify(newTemplate));
    showToast('Format Template SK berhasil diperbarui!');
  };

  // 10. Load from Google Sheets
  const handleLoadFromSheets = async () => {
    if (!accessToken) {
      handleLogin();
      return;
    }

    // Extract spreadsheet ID if user pasted full URL
    let cleanId = spreadsheetInput.trim();
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      cleanId = urlMatch[1];
    }

    if (!cleanId) {
      setSyncError('Masukkan Spreadsheet ID atau URL Google Sheets yang valid');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    const { records: fetchedRecords, template: fetchedTemplate, error } = await fetchSpreadsheetData(
      cleanId,
      accessToken,
      kgbSheetName,
      templateSheetName
    );

    setIsSyncing(false);

    if (error) {
      setSyncError(error);
      showToast(error, 'error');
      return;
    }

    if (fetchedRecords.length === 0) {
      setSyncError('Tidak ada baris data pegawai yang dapat dibaca dari sheet tersebut.');
      return;
    }

    setRecords(fetchedRecords);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(fetchedRecords));
    localStorage.setItem(STORAGE_KEY_SHEET_ID, spreadsheetInput);

    if (fetchedTemplate) {
      setTemplate(fetchedTemplate);
      localStorage.setItem(STORAGE_KEY_TEMPLATE, JSON.stringify(fetchedTemplate));
    }

    setShowSheetsModal(false);
    showToast(`Berhasil memuat ${fetchedRecords.length} data pegawai dari Google Sheets!`);
  };

  // 11. Load Demo Data
  const handleLoadDemoData = () => {
    setRecords(DEFAULT_KGB_DATA);
    setTemplate(DEFAULT_TEMPLATE);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_KGB_DATA));
    localStorage.setItem(STORAGE_KEY_TEMPLATE, JSON.stringify(DEFAULT_TEMPLATE));
    setHasUnsavedChanges(false);
    showToast('Data demo KGB dan Template standar berhasil dimuat!');
  };

  // 12. Single Print SK
  const handlePrintSingleSK = async (record: KGBRecord) => {
    if (template.templateMode === 'google_docs' && template.googleDocsTemplateId && accessToken) {
      showToast('Sedang membuat PDF dari Google Docs Template...', 'info');
      try {
        const { generateSKFromGoogleDocsTemplate } = await import('./services/googleDocs');
        const { pdfBlob, filename } = await generateSKFromGoogleDocsTemplate(
          template.googleDocsTemplateId,
          record,
          accessToken
        );
        triggerDownload(pdfBlob, filename);
        showToast(`Berhasil mengunduh ${filename} (Output Resmi Google Docs)!`);
        return;
      } catch (err: any) {
        console.warn('Google Docs generation fallback to local PDF:', err);
        showToast(`Google Docs template: ${err.message || 'Menggunakan template bawaan'}.`, 'info');
      }
    }

    const { blob, filename } = generateSingleEmployeePdf(record, template, selectedYear);
    triggerDownload(blob, filename);
    showToast(`Mengunduh dokumen: ${filename}`);
  };

  // 13. Drive Upload Single
  const handleUploadSingleToDrive = (record: KGBRecord) => {
    setDriveExportSingleRecord(record);
    setDriveExportSingleUnit(null);
    setShowDriveExportModal(true);
  };

  // 14. Drive Upload Unit Kerja
  const handleUploadUnitKerjaToDrive = (unitKerjaName: string, items: KGBRecord[]) => {
    setDriveExportSingleRecord(null);
    setDriveExportSingleUnit({ name: unitKerjaName, items });
    setShowDriveExportModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border bg-slate-900 text-white text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-medium">{toastMessage.title}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        onOpenSheetsConfig={() => setShowSheetsModal(true)}
        onOpenTemplateEditor={() => setShowTemplateModal(true)}
        isSyncing={isSyncing}
        onSync={handleLoadFromSheets}
        spreadsheetTitle={spreadsheetInput ? 'Google Sheets Terhubung' : undefined}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveAll={handleSaveAll}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        
        {/* Info Banner when not connected to custom sheet */}
        {!spreadsheetInput && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl shadow-xs border border-blue-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Filter Value &quot;C&quot; Kolom T:AD & Kolom K Aktif:</span>
                <span className="text-blue-200 ml-1">
                  Tahun 2026 memuat tepat 8 bulan sesuai value &quot;C&quot; (Januari, Februari, Maret, April, Juni, Juli, Oktober, November).
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLoadDemoData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium rounded-lg transition flex items-center gap-1.5"
                title="Muat ulang data contoh resmi"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Data Contoh</span>
              </button>
              <button
                onClick={() => setShowSheetsModal(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition"
              >
                Koneksi Google Sheets
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Statistics */}
        <DashboardStats
          records={filteredRecords}
          allRecords={records}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />

        {/* Banner Menu Format SK & Integrasi Google Docs */}
        <div className="mb-4 p-3 sm:p-4 bg-white border border-amber-200/90 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
              template.templateMode === 'google_docs' 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Menu Format SK: {template.templateMode === 'google_docs' ? 'Template Google Docs' : 'Template SK Resmi PPU (DB KGB & TEMPLATE)'}
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  template.templateMode === 'google_docs'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {template.templateMode === 'google_docs' ? 'Mode Google Docs Aktif' : 'Mode Template Bawaan'}
                </span>
                {template.googleDocsTemplateId && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    Google Docs ID Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {template.templateMode === 'google_docs'
                  ? 'Output PDF dihasilkan langsung dari Google Docs Anda dengan mempertahankan layout, font, dan format asli 100% presisi.'
                  : 'Tata letak otomatis sesuai sheet TEMPLATE & DB KGB (A10, C24, I34–I50, C51, I55) & Tanda Tangan SRIKANDI.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xs flex items-center gap-1.5 transition active:scale-95"
              title="Buka Pengaturan Menu Format SK"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Menu Format SK</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <FilterBar
          years={availableYears}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          availableMonths={availableMonthsForSelectedYear}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedUnitKerja={selectedUnitKerja}
          onSelectUnitKerja={setSelectedUnitKerja}
          availableUnitKerja={availableUnitKerja}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenUnitKerjaPrintModal={() => setShowUnitKerjaPrintModal(true)}
          onOpenDriveExportModal={() => {
            setDriveExportSingleRecord(null);
            setDriveExportSingleUnit(null);
            setShowDriveExportModal(true);
          }}
          isDriveReady={Boolean(user && accessToken)}
          onOpenTemplateEditor={() => setShowTemplateModal(true)}
          templateMode={template.templateMode}
          hasGoogleDoc={Boolean(template.googleDocsTemplateId)}
        />

        {/* KGB Records Table (Below Filter as requested) */}
        <KGBTable
          records={filteredRecords}
          onUpdateRecord={handleUpdateRecord}
          onPreviewSK={rec => setPreviewRecord(rec)}
          onPrintSingleSK={handlePrintSingleSK}
          onUploadSingleToDrive={handleUploadSingleToDrive}
          onSaveRecord={handleSaveRecord}
          selectedYear={selectedYear}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sistem Informasi Kenaikan Gaji Berkala &bull; Terintegrasi Google Sheets & Google Drive
          </div>
          <div className="text-[11px] text-slate-400">
            KGB Perpres No. 11/2024 &bull; Format Standar Surat Pemberitahuan BKN
          </div>
        </div>
      </footer>

      {/* Modals */}
      {previewRecord && (
        <SKPreviewModal
          record={previewRecord}
          template={template}
          onClose={() => setPreviewRecord(null)}
          onUploadToDrive={handleUploadSingleToDrive}
          isDriveReady={Boolean(user && accessToken)}
          accessToken={accessToken}
          onUpdateTemplate={handleSaveTemplate}
          selectedYear={selectedYear}
        />
      )}

      {showSheetsModal && (
        <SheetsConfigModal
          spreadsheetInput={spreadsheetInput}
          onSpreadsheetInputChange={setSpreadsheetInput}
          kgbSheetName={kgbSheetName}
          onKgbSheetNameChange={setKgbSheetName}
          templateSheetName={templateSheetName}
          onTemplateSheetNameChange={setTemplateSheetName}
          onLoadFromSheets={handleLoadFromSheets}
          onLoadDemoData={handleLoadDemoData}
          isLoading={isSyncing}
          error={syncError}
          onClose={() => setShowSheetsModal(false)}
          accessToken={accessToken}
          onNeedLogin={handleLogin}
        />
      )}

      {showTemplateModal && (
        <TemplateEditorModal
          template={template}
          onSaveTemplate={handleSaveTemplate}
          onClose={() => setShowTemplateModal(false)}
          accessToken={accessToken}
          sampleRecord={filteredRecords[0] || records[0]}
        />
      )}

      {showUnitKerjaPrintModal && (
        <UnitKerjaPrintModal
          records={filteredRecords}
          template={template}
          onClose={() => setShowUnitKerjaPrintModal(false)}
          onUploadUnitKerjaToDrive={handleUploadUnitKerjaToDrive}
          isDriveReady={Boolean(user && accessToken)}
          selectedYear={selectedYear}
        />
      )}

      {showDriveExportModal && (
        <DriveExportModal
          records={filteredRecords}
          template={template}
          accessToken={accessToken}
          onClose={() => {
            setShowDriveExportModal(false);
            setDriveExportSingleRecord(null);
            setDriveExportSingleUnit(null);
          }}
          singleRecord={driveExportSingleRecord}
          singleUnitKerja={driveExportSingleUnit}
          onNeedLogin={handleLogin}
        />
      )}

    </div>
  );
}
