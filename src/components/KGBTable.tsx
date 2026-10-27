import React, { useState } from 'react';
import { KGBRecord, SKTemplateConfig, calculateMulaiTanggal } from '../types/kgb';
import { formatMasaKerja, parseMkYears, getGajiPokok, formatRupiah } from '../services/salaryTable';
import { Eye, Printer, HardDrive, Check, Save, Wand2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface KGBTableProps {
  records: KGBRecord[];
  onUpdateRecord: (id: string, updates: Partial<KGBRecord>) => void;
  onPreviewSK: (record: KGBRecord) => void;
  onPrintSingleSK: (record: KGBRecord) => void;
  onUploadSingleToDrive: (record: KGBRecord) => void;
  onSaveRecord: (id: string) => void;
  selectedYear: number;
}

export const KGBTable: React.FC<KGBTableProps> = ({
  records,
  onUpdateRecord,
  onPreviewSK,
  onPrintSingleSK,
  onUploadSingleToDrive,
  onSaveRecord,
  selectedYear
}) => {
  const [batchNomorPrefix, setBatchNomorPrefix] = useState(`800.1.11.1/`);
  const [batchStartNum, setBatchStartNum] = useState(1);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Apply batch numbering
  const handleApplyBatchNumbers = () => {
    let current = batchStartNum;
    records.forEach(r => {
      const padded = String(current).padStart(3, '0');
      const generatedNo = `${batchNomorPrefix}${padded}/${selectedYear}`;
      onUpdateRecord(r.id, {
        nomorSk: generatedNo,
        tanggalPenetapan: batchDate,
        isSaved: false
      });
      current++;
    });
    setShowBatchModal(false);
  };

  // Handle MK Sebelum blur
  const handleMkSebelumBlur = (record: KGBRecord, val: string) => {
    const formatted = formatMasaKerja(val);
    const years = parseMkYears(formatted);
    const newGajiLama = getGajiPokok(record.pangkatGol, years);
    onUpdateRecord(record.id, {
      mkSebelum: formatted,
      gajiLama: newGajiLama,
      isSaved: false
    });
  };

  // Handle MK Sesudah blur
  const handleMkSesudahBlur = (record: KGBRecord, val: string) => {
    const formatted = formatMasaKerja(val);
    const years = parseMkYears(formatted);
    const newGajiBaru = getGajiPokok(record.pangkatGol, years);
    onUpdateRecord(record.id, {
      mkSesudah: formatted,
      gajiBaru: newGajiBaru,
      isSaved: false
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      
      {/* Table Action Bar */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Daftar Pegawai KGB ({records.length} data ditemukan)
          </span>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            Tahun {selectedYear} &bull; Filter Value &quot;C&quot; di Kolom T:AD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(!showBatchModal)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition"
            title="Isi otomatis Nomor SK & Tanggal Penetapan secara berurutan"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Penomoran Cepat SK</span>
          </button>
        </div>
      </div>

      {/* Batch Numbering Dropdown Panel */}
      {showBatchModal && (
        <div className="p-4 bg-blue-50/70 border-b border-blue-200 flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Format Awalan Nomor SK
            </label>
            <input
              type="text"
              value={batchNomorPrefix}
              onChange={e => setBatchNomorPrefix(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono w-44"
              placeholder="800.1.11.1/"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nomor Awal
            </label>
            <input
              type="number"
              value={batchStartNum}
              onChange={e => setBatchStartNum(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs w-20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tanggal Penetapan Serentak
            </label>
            <input
              type="date"
              value={batchDate}
              onChange={e => setBatchDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs"
            />
          </div>
          <button
            onClick={handleApplyBatchNumbers}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-xs transition"
          >
            Terapkan ke {records.length} Pegawai
          </button>
          <button
            onClick={() => setShowBatchModal(false)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded"
          >
            Batal
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-3 w-10 text-center">No</th>
              <th className="py-3 px-3 min-w-[190px]">
                Nomor SK <span className="text-amber-600 font-normal lowercase">(diisi manual)</span>
              </th>
              <th className="py-3 px-3 min-w-[180px]">
                Nama Pegawai <span className="text-slate-400 font-normal">(Kolom B)</span>
              </th>
              <th className="py-3 px-3 min-w-[150px]">
                NIP <span className="text-slate-400 font-normal">(Kolom C)</span>
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                Jabatan <span className="text-slate-400 font-normal">(Kolom R)</span>
              </th>
              <th className="py-3 px-3 min-w-[160px]">
                Unit Kerja <span className="text-slate-400 font-normal">(Kolom S)</span>
              </th>
              <th className="py-3 px-3 min-w-[155px]">
                Mulai Tanggal <span className="text-emerald-700 font-normal lowercase">(Kolom P)</span>
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                MK Sebelum
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                MK Sesudah
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                Tgl Penetapan <span className="text-amber-600 font-normal lowercase">(diisi manual)</span>
              </th>
              <th className="py-3 px-3 min-w-[130px] text-center">
                Aksi Cetak & Drive
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-sm text-slate-600">Tidak ada data pegawai untuk filter ini</p>
                  <p className="text-xs text-slate-400">Silakan pilih Tahun atau Bulan lain pada dropdown filter di atas.</p>
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`hover:bg-blue-50/40 transition group ${
                    !r.nomorSk ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* No */}
                  <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>

                  {/* 1. Nomor SK (diisi manual) */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={r.nomorSk || ''}
                      onChange={e =>
                        onUpdateRecord(r.id, { nomorSk: e.target.value, isSaved: false })
                      }
                      placeholder="Contoh: 800.1.11.1/042/2026"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* 2. Nama (Kolom B) */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 leading-tight">
                      {r.nama}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Golongan {r.pangkatGol} &bull; TMT: {r.tmtKgb}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] border border-emerald-300">
                        {selectedYear}: [C]
                      </span>
                    </div>
                  </td>

                  {/* 3. NIP (Kolom C) */}
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {r.nip}
                  </td>

                  {/* 4. Jabatan (Kolom R) */}
                  <td className="py-2.5 px-3 text-slate-700">
                    {r.jabatan}
                  </td>

                  {/* 5. Unit Kerja (Kolom S) */}
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]">
                      {r.unitKerja}
                    </span>
                  </td>

                  {/* Mulai Tanggal (Kolom P otomatis dari Kolom K + Tahun Dashboard) */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{calculateMulaiTanggal(r.kolomK || r.tanggalAcuanK, selectedYear, r.tmtKgb)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Acuan Kolom K: {r.kolomK || r.tanggalAcuanK || '1 Juni 2025'}
                    </div>
                  </td>

                  {/* 6. MK Sebelum (auto-format 3 -> 03 tahun 00 bulan) */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={r.mkSebelum || ''}
                      onChange={e =>
                        onUpdateRecord(r.id, { mkSebelum: e.target.value, isSaved: false })
                      }
                      onBlur={e => handleMkSebelumBlur(r, e.target.value)}
                      placeholder="e.g. 3 atau 03 tahun 00 bln"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                      title="Ketik angka 3 otomatis jadi 03 tahun 00 bulan"
                    />
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block truncate">
                      Gaji: {formatRupiah((r.gajiLama && r.gajiLama >= 1800000 && r.gajiLama <= 15000000) ? r.gajiLama : getGajiPokok(r.kolomF || r.pangkatGol, parseMkYears(r.mkSebelum)))}
                    </span>
                  </td>

                  {/* 7. MK Sesudah (auto-format 5 -> 05 tahun 00 bulan) */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={r.mkSesudah || ''}
                      onChange={e =>
                        onUpdateRecord(r.id, { mkSesudah: e.target.value, isSaved: false })
                      }
                      onBlur={e => handleMkSesudahBlur(r, e.target.value)}
                      placeholder="e.g. 5 atau 05 tahun 00 bln"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                      title="Ketik angka otomatis jadi XX tahun 00 bulan"
                    />
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block truncate">
                      Gaji Baru: {formatRupiah((r.gajiBaru && r.gajiBaru >= 1800000 && r.gajiBaru <= 15000000) ? r.gajiBaru : getGajiPokok(r.kolomF || r.pangkatGol, parseMkYears(r.mkSesudah)))}
                    </span>
                  </td>

                  {/* 8. Tanggal Penetapan (diisi manual) */}
                  <td className="py-2.5 px-3">
                    <input
                      type="date"
                      value={r.tanggalPenetapan || ''}
                      onChange={e =>
                        onUpdateRecord(r.id, {
                          tanggalPenetapan: e.target.value,
                          isSaved: false
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* 9. Aksi: Preview SK, Cetak Perpegawai, Drive, Save */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Pratinjau SK */}
                      <button
                        onClick={() => onPreviewSK(r)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-blue-700 hover:bg-blue-100 transition"
                        title="Pratinjau SK berdasarkan TEMPLATE"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Cetak SK Perpegawai */}
                      <button
                        onClick={() => onPrintSingleSK(r)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 transition"
                        title={`Cetak SK ${r.nama} (PDF Otomatis Nama Pegawai)`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Simpan Otomatis ke Drive */}
                      <button
                        onClick={() => onUploadSingleToDrive(r)}
                        className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-100 transition"
                        title="Simpan Otomatis SK ini ke Google Drive"
                      >
                        <HardDrive className="w-4 h-4" />
                      </button>

                      {/* Simpan Baris */}
                      <button
                        onClick={() => onSaveRecord(r.id)}
                        className={`p-1.5 rounded-md transition ${
                          r.isSaved
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100 animate-pulse'
                        }`}
                        title={r.isSaved ? 'Data tersimpan' : 'Klik untuk simpan baris ini'}
                      >
                        {r.isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Aturan otomatis MK: Ketik angka misal <b>3</b> &rarr; otomatis terformat <b>03 tahun 00 bulan</b></span>
        </div>
        <div className="text-slate-400">
          Tabel Gaji Pokok Aktif: Perpres No. 11 Tahun 2024 (Golongan I s/d XVII)
        </div>
      </div>

    </div>
  );
};
