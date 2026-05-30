import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Search, Plus, Trash2, Download, RefreshCw, 
  Copy, Check, Save, Columns, X, ExternalLink, AlertCircle, Maximize2 
} from 'lucide-react';
import { GoogleSheetEntry, VaultEntry } from '../types';

interface SpreadsheetWorkspaceModalProps {
  entry: GoogleSheetEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntry: GoogleSheetEntry) => void;
}

export default function SpreadsheetWorkspaceModal({ 
  entry, 
  isOpen, 
  onClose, 
  onSave 
}: SpreadsheetWorkspaceModalProps) {
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // check if there are unsaved manual edits
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>(undefined);

  // Load entry data when it is opened or changed
  useEffect(() => {
    if (isOpen && entry) {
      setHeaders(entry.headers || ['Cột 1', 'Cột 2', 'Cột 3']);
      setRows(entry.rows || [['', '', ''], ['', '', '']]);
      setLastSyncTime(entry.lastSyncTime);
      setSyncError('');
      setSyncSuccess(false);
      setIsDirty(false);
    }
  }, [isOpen, entry]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const sq = searchQuery.toLowerCase().trim();
    return rows.filter(row => 
      row.some(cell => (cell || '').toLowerCase().includes(sq))
    );
  }, [rows, searchQuery]);

  if (!isOpen || !entry) return null;

  // Handle value change for manual edits
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updatedRows = rows.map((r, rIdx) => 
      rIdx === rowIndex 
        ? r.map((c, cIdx) => cIdx === colIndex ? value : c)
        : r
    );
    setRows(updatedRows);
    setIsDirty(true);
  };

  // Handle header name change
  const handleHeaderChange = (colIndex: number, value: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[colIndex] = value;
    setHeaders(updatedHeaders);
    setIsDirty(true);
  };

  // Add Row
  const handleAddRow = () => {
    const newRow = Array(headers.length).fill('');
    setRows([...rows, newRow]);
    setIsDirty(true);
  };

  // Delete Row
  const handleDeleteRow = (rowIndex: number) => {
    const updatedRows = rows.filter((_, rIdx) => rIdx !== rowIndex);
    setRows(updatedRows);
    setIsDirty(true);
  };

  // Add Column
  const handleAddColumn = () => {
    const newColName = `Cột ${headers.length + 1}`;
    setHeaders([...headers, newColName]);
    setRows(rows.map(row => [...row, '']));
    setIsDirty(true);
  };

  // Delete Column
  const handleDeleteColumn = (colIndex: number) => {
    if (headers.length <= 1) {
      alert('Không thể xóa cột cuối cùng. Bảng tính cần có ít nhất 1 cột.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa cột "${headers[colIndex]}" không?`)) {
      const updatedHeaders = headers.filter((_, idx) => idx !== colIndex);
      const updatedRows = rows.map(r => r.filter((_, idx) => idx !== colIndex));
      setHeaders(updatedHeaders);
      setRows(updatedRows);
      setIsDirty(true);
    }
  };

  // Handle Google Sheet Online Synchronization directly in workspace view
  const handleSyncOnline = async () => {
    if (!entry.spreadsheetUrl) return;
    setIsSyncing(true);
    setSyncError('');
    setSyncSuccess(false);

    // Extract Spreadsheet ID
    let spreadsheetId = '';
    const urlMatch = entry.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      spreadsheetId = urlMatch[1];
    } else {
      spreadsheetId = entry.spreadsheetUrl.trim();
    }

    if (!spreadsheetId) {
      setSyncError('URL hoặc ID của Google Sheet không hợp lệ.');
      setIsSyncing(false);
      return;
    }

    try {
      if (entry.syncMode === 'public' || !entry.syncMode) {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error('Không thể fetch dữ liệu. Vui lòng kiểm tra lại quyền chia sẻ "Bất kỳ ai có liên kết đều xem được" trên Google Sheets của tài khoản bên kia.');
        }
        const text = await response.text();
        
        // CSV parser supporting multi-line quotes and commas code copy
        const lines: string[][] = [];
        let row = [""];
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i+1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              row[row.length - 1] += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            row.push("");
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            lines.push(row);
            row = [""];
          } else {
            row[row.length - 1] += char;
          }
        }
        if (row.length > 1 || row[0] !== "") {
          lines.push(row);
        }

        const filteredLines = lines.filter(r => r.some(c => c.trim() !== ""));
        if (filteredLines.length === 0) {
          throw new Error('Biểu mẫu trống.');
        }

        const pulledHeaders = filteredLines[0];
        const pulledRows = filteredLines.slice(1);

        setHeaders(pulledHeaders);
        setRows(pulledRows);
        setLastSyncTime(Date.now());
        setSyncSuccess(true);
        setIsDirty(true); // marked dirty so changes are ready to be saved locally
      } else {
        // Private google sheet mode integration
        const token = window.prompt("Nhập Google OAuth Access Token để thao tác bảng tính an toàn:");
        if (!token || !token.trim()) {
          setIsSyncing(false);
          return;
        }

        const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z100`;
        const response = await fetch(fetchUrl, {
          headers: { 'Authorization': `Bearer ${token.trim()}` }
        });
        
        if (!response.ok) {
          throw new Error('Kết nối thất bại. Token lỗi hoặc hết hạn truy cập.');
        }

        const data = await response.json();
        if (!data.values || data.values.length === 0) {
          throw new Error('Dữ liệu trống.');
        }

        setHeaders(data.values[0]);
        setRows(data.values.slice(1));
        setLastSyncTime(Date.now());
        setSyncSuccess(true);
        setIsDirty(true);
      }
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || 'Lỗi chưa rõ khi đồng bộ.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export current workspace state as CSV text downloaded
  const handleExportCSV = () => {
    try {
      const csvContent = [
        headers.map(h => `"${(h || '').replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entry.title || 'bảng-tính'}_xuất_kho_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Lỗi khi xuất tệp', err);
    }
  };

  // Copy entire row array or single cell safely
  const handleTriggerCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Sao chép lỗi', err);
    }
  };

  // Save changes locally to encrypted vault database
  const handleSaveChanges = () => {
    const updatedEntry: GoogleSheetEntry = {
      ...entry,
      headers,
      rows,
      lastSyncTime,
      updatedAt: Date.now()
    };
    onSave(updatedEntry);
    setIsDirty(false);
  };

  // Handle close action with dirty verification
  const handleCloseAttempt = () => {
    if (isDirty) {
      if (confirm('Bảng tính có thay đổi thủ công hoặc đồng bộ chưa được lưu vào Kho Mã Hóa. Bạn có thực sự muốn đóng và hủy bỏ những thay đổi này?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="w-full h-full md:max-w-7xl md:h-[90vh] bg-slate-950 border-0 md:border md:border-slate-800 rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Workspace Top Bar Header */}
        <div className="px-5 py-4 border-b border-slate-900 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Table className="h-5 w-5 fill-emerald-500/5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10">
                  {entry.isIntegrated ? 'Liên kết trực tuyến' : 'Bảng tính nội bộ'}
                </span>
                {isDirty && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                    Có dữ liệu mới chưa lưu
                  </span>
                )}
              </div>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1.5 uppercase mt-1">
                {entry.title} - Chế độ màn hình lớn
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {entry.isIntegrated && (
              <button
                type="button"
                onClick={handleSyncOnline}
                disabled={isSyncing}
                className="px-3.5 py-2 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 disabled:opacity-40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Đồng bộ cập nhật nội dung từ tài khoản Google"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ Trang tính</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Xuất bảng dữ liệu hiện tại làm file CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất CSV tệp</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!isDirty}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Lưu vào Kho an toàn</span>
            </button>

            <button
              type="button"
              onClick={handleCloseAttempt}
              className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer ml-1"
              title="Thoát chế độ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sync information details banner */}
        {entry.isIntegrated && (
          <div className="bg-slate-900/40 border-b border-slate-900 px-5 py-2 text-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-slate-500">Nguồn liên kết:</span>
              <span className="truncate max-w-md font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                {entry.spreadsheetUrl}
              </span>
              {entry.spreadsheetUrl && (
                <a
                  href={entry.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1 hover:bg-slate-800 text-emerald-450 hover:text-emerald-400 rounded flex items-center justify-center"
                  title="Mở tệp Google Sheets gốc ở thẻ trình duyệt mới"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {lastSyncTime && (
              <div className="text-slate-400 flex items-center gap-2 font-medium">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                <span>Đã nạp qua CSV: <strong className="text-slate-200">{new Date(lastSyncTime).toLocaleString('vi-VN')}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Alerts & Errors center display */}
        {(syncError || syncSuccess) && (
          <div className="shrink-0 p-4">
            {syncError && (
              <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-900/35 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Đồng bộ thất bại:</strong> {syncError}
                </div>
              </div>
            )}
            {syncSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-450 bg-emerald-950/20 border border-emerald-900/35 p-3 rounded-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>✓ Đồng bộ hóa trực tiếp thành công! Dữ liệu mới đã hiển thị trong bảng. Nhấn <strong className="text-emerald-400">Lưu vào Kho an toàn</strong> ở trên để hoàn tất bảo mật ngoại tuyến.</span>
              </div>
            )}
          </div>
        )}

        {/* Dashboard workspace body controller toolbar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              id="ws-search-input"
              type="text"
              placeholder="Tìm kiếm dòng, dữ liệu bất kỳ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-slate-900"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium mr-2">
              Bộ lọc: <strong className="text-slate-300 font-bold">{filteredRows.length}</strong> / {rows.length} hàng
            </span>
            
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm dòng dữ liệu mới</span>
            </button>

            <button
              type="button"
              onClick={handleAddColumn}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Thêm cột cột</span>
            </button>
          </div>
        </div>

        {/* Main interactive grid editor viewport */}
        <div className="flex-1 overflow-auto bg-slate-950 select-none border-b border-slate-900 scrollbar-thin">
          <table className="w-full border-collapse text-xs text-slate-300 min-w-max relative table-fixed">
            <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-850">
              <tr className="bg-slate-900/60 font-bold">
                <th className="p-2 border-r border-slate-850 text-center text-[10px] text-slate-500 select-none bg-slate-950 w-12 sticky left-0 z-20">#</th>
                {headers.map((hdr, colIdx) => (
                  <th key={colIdx} className="p-1 px-1 border-r border-slate-850 text-emerald-400 font-bold bg-slate-950 min-w-[150px]">
                    <div className="flex items-center justify-between group px-1">
                      <input
                        type="text"
                        value={hdr || ''}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-emerald-400 px-1 py-1 outline-none text-left rounded border-b border-transparent focus:bg-slate-900 border-dashed focus:border-emerald-500/50"
                        placeholder={`Cột ${colIdx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(colIdx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity rounded cursor-pointer duration-100 shrink-0"
                        title="Xóa cột này"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-14 border-r border-slate-850">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 2} className="p-12 text-center text-slate-500 italic font-medium bg-slate-950/10">
                    {searchQuery ? 'Không tìm thấy kết quả phù hợp với bộ lọc tìm kiếm.' : 'Bảng tính trống hoặc chưa có dữ liệu.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, relativeIdx) => {
                  // Find the absolute index in original rows state array
                  const absoluteIdx = rows.findIndex(originalRow => originalRow === row);
                  const activeRowIdx = absoluteIdx !== -1 ? absoluteIdx : relativeIdx;

                  return (
                    <tr 
                      key={activeRowIdx} 
                      className="border-b border-slate-900/40 hover:bg-slate-900/10 group/row"
                    >
                      <td className="p-2 text-center text-[10px] text-slate-500 bg-slate-950 border-r border-slate-850 sticky left-0 z-10 w-12 font-mono">
                        {activeRowIdx + 1}
                      </td>

                      {headers.map((_, colIdx) => {
                        const cellValue = row[colIdx] || '';
                        const cellId = `ws-cell-${activeRowIdx}-${colIdx}`;
                        return (
                          <td 
                            key={colIdx} 
                            className="p-0 border-r border-slate-900/45 focus-within:bg-slate-900/30 transition-colors"
                          >
                            <div className="relative w-full flex items-center group/cell">
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => handleCellChange(activeRowIdx, colIdx, e.target.value)}
                                className="w-full bg-transparent text-slate-200 px-3 py-2 text-xs outline-none select-text focus:bg-slate-900/60 leading-normal"
                                placeholder="..."
                              />
                              {cellValue && (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerCopy(cellValue, cellId)}
                                  className="absolute right-1.5 opacity-0 group-hover/cell:opacity-100 p-1 bg-slate-800 hover:bg-slate-705 text-slate-400 rounded transition-opacity cursor-pointer z-10"
                                  title="Sao chép nội dung ô này"
                                >
                                  {copiedField === cellId ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Line/row control options */}
                      <td className="p-1 border-r border-slate-900/40 text-center w-14">
                        <div className="flex justify-center items-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(activeRowIdx)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/15 rounded-lg transition-all cursor-pointer opacity-30 group-hover/row:opacity-100 duration-100"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dashboard Modal Bottom instructions line footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-900 text-slate-550 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500">
            <AlertCircle className="h-3.5 w-3.5 text-emerald-500/80" />
            <span>Mẹo: Bạn có thể nhập trực tiếp vào bất kỳ ô nào ở bảng trên để sửa giá trị, bấm tiêu đề cột để sửa tên cột.</span>
          </div>
          <div className="text-slate-500 font-mono">
            Mã hóa AES-256 an toàn tại chỗ • Không tải thông tin của bạn lên máy chủ ngoài
          </div>
        </div>

      </div>
    </div>
  );
}
