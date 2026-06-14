import { useState, useEffect } from 'react';
import { 
  Star, CreditCard, Globe, Smartphone, FileText, 
  Lock, Eye, EyeOff, Copy, Check, Edit2, Trash2, ExternalLink, Wallet,
  Fingerprint, Table, Maximize2, ChevronDown, ChevronUp, Bell, Calendar, Timer, ShieldAlert,
  History, Receipt, PlusCircle
} from 'lucide-react';
import { VaultEntry, GoogleSheetEntry, CustomCategory, BillEntry, BillPaymentHistory } from '../types';
import { generateTOTPCode } from '../utils/totp';
import { translations } from '../utils/lang';
import { formatDisplayAmount } from '../utils/currency';

function TotpDisplay({ secret }: { secret: string }) {
  const currentLang = (localStorage.getItem('secure_vault_lang') as 'vi' | 'en') || 'vi';
  const t = translations[currentLang];
  const [totp, setTotp] = useState({ code: '------', secondsRemaining: 30 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial call
    setTotp(generateTOTPCode(secret));

    const interval = setInterval(() => {
      setTotp(generateTOTPCode(secret));
    }, 1000);

    return () => clearInterval(interval);
  }, [secret]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(totp.code.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeVal = totp.code;
  const displayCode = codeVal.length === 6 ? `${codeVal.slice(0, 3)} ${codeVal.slice(3)}` : codeVal;

  return (
    <div className="mt-3.5 p-3.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between gap-4 transition-all animate-fade-in group/totp">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover/totp:scale-105 transition-transform shrink-0">
          <Timer className="h-5 w-5" />
        </div>
        <div className="text-left min-w-0">
          <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">{t.totp_codeLabel}</div>
          <div className="text-2xl font-mono font-black text-white tracking-widest mt-0.5">
            {displayCode}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 shrink-0">
        {/* Progress Sector */}
        <div className="relative text-xs text-indigo-400 font-mono font-bold flex items-center justify-center h-8 w-8">
          <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="#13132a"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="#6366f1"
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * totp.secondsRemaining) / 30}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="text-[11px] select-none text-indigo-300 font-sans z-10">{totp.secondsRemaining}</span>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="p-2 bg-slate-950 border border-slate-800/80 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center justify-center group-hover/totp:scale-102"
          title={t.totp_copied}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function BillPaymentHistorySection({
  entry,
  onUpdateEntry,
  currentLang
}: {
  entry: BillEntry;
  onUpdateEntry?: (entry: VaultEntry) => void;
  currentLang: 'vi' | 'en';
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  const formatAmountByLangLocal = (val: string, lang: 'vi' | 'en') => {
    let raw = val.replace(/\D/g, '');
    if (!raw) return '';
    if (lang === 'en') {
      return '$' + Number(raw).toLocaleString('en-US');
    } else {
      return Number(raw).toLocaleString('vi-VN') + ' đ';
    }
  };

  const getRawNumericStringLocal = (val: string) => {
    return val.replace(/\D/g, '');
  };

  const getDefaultPeriod = () => {
    const today = new Date();
    const mm = today.getMonth() + 1;
    const yyyy = today.getFullYear();
    return currentLang === 'vi' ? `Tháng ${mm}/${yyyy}` : `Month ${mm}/${yyyy}`;
  };

  const [period, setPeriod] = useState('');
  const [payDate, setPayDate] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');

  // Sẽ đồng bộ hóa và tải giá trị mặc định của hóa đơn khi form được mở ra
  useEffect(() => {
    if (showAddForm) {
      setPeriod(getDefaultPeriod());
      
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setPayDate(`${year}-${month}-${day}`);
      
      const defaultAmountRaw = entry.amount ? entry.amount.replace(/\D/g, '') : '';
      if (defaultAmountRaw) {
        setAmountInput(formatAmountByLangLocal(defaultAmountRaw, currentLang));
      } else {
        setAmountInput('');
      }
      setNotes('');
    }
  }, [showAddForm, entry.amount, currentLang]);

  const handleAddRecord = () => {
    if (!period.trim()) {
      alert(currentLang === 'vi' ? 'Vui lòng nhập kỳ đóng.' : 'Please enter the billing period.');
      return;
    }
    const rawAmt = getRawNumericStringLocal(amountInput) || '0';
    const formattedAmount = formatAmountByLangLocal(rawAmt, currentLang) || '0';

    const newRecord: BillPaymentHistory = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payDate,
      period: period.trim(),
      amount: formattedAmount,
      status: 'paid',
      notes: notes.trim() || undefined
    };

    const currentHistory = entry.paymentHistory || [];
    const updatedHistory = [newRecord, ...currentHistory];

    onUpdateEntry?.({
      ...entry,
      paymentHistory: updatedHistory
    });

    setShowAddForm(false);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!confirm(currentLang === 'vi' ? 'Bạn có chắc chắn muốn xóa bản ghi thanh toán này?' : 'Are you sure you want to delete this payment record?')) {
      return;
    }
    const currentHistory = entry.paymentHistory || [];
    const updatedHistory = currentHistory.filter(h => h.id !== recordId);

    onUpdateEntry?.({
      ...entry,
      paymentHistory: updatedHistory
    });
  };

  const tr = {
    title: currentLang === 'vi' ? 'LỊCH SỬ ĐÓNG HÓA ĐƠN' : 'PAYMENT HISTORY',
    addBtn: currentLang === 'vi' ? 'Ghi nhận đóng tiền' : 'Record Payment',
    period: currentLang === 'vi' ? 'Kỳ đóng / Kỳ thanh toán' : 'Billing Period',
    payDate: currentLang === 'vi' ? 'Ngày đóng thực tế' : 'Date Paid',
    amount: currentLang === 'vi' ? 'Số tiền thanh toán' : 'Amount Paid',
    notes: currentLang === 'vi' ? 'Ghi chú thêm' : 'Notes / Comments',
    save: currentLang === 'vi' ? 'Lưu lịch sử (Tối ưu)' : 'Save Record',
    cancel: currentLang === 'vi' ? 'Hủy' : 'Cancel',
    noHistory: currentLang === 'vi' ? 'Chưa ghi nhận lịch sử đóng tiền của hóa đơn này.' : 'No payment history recorded for this bill.',
    actions: currentLang === 'vi' ? 'Thao tác' : 'Actions',
  };

  const historyList = entry.paymentHistory || [];

  return (
    <div className="mt-5 pt-4 border-t border-slate-805/60 font-sans" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3.5">
        <label className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
          <History className="h-4 w-4 text-emerald-500" />
          <span>{tr.title}</span>
        </label>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{tr.addBtn}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl mb-4.5 space-y-4 animate-fade-in text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                {tr.period}
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Tháng 06/2026"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-emerald-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                {tr.payDate}
              </label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 outline-none focus:border-emerald-500 h-[38px] cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                {tr.amount}
              </label>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(formatAmountByLangLocal(e.target.value, currentLang))}
                placeholder={currentLang === 'vi' ? "0 đ" : "$0"}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                {tr.notes}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={currentLang === 'vi' ? "Ví dụ: Momo ví điện tử..." : "e.g., Credit card auto pay"}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-1 border-t border-slate-850/40">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-bold rounded-xl border border-slate-800 transition-colors"
            >
              {tr.cancel}
            </button>
            <button
              type="button"
              onClick={handleAddRecord}
              className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black rounded-xl transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {tr.save}
            </button>
          </div>
        </div>
      )}

      {historyList.length === 0 ? (
        <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-800/80 rounded-2xl">
          <p className="text-xs text-slate-500 font-sans">{tr.noHistory}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-sm max-h-[220px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider text-[9px] sticky top-0">
                <th className="p-2.5 px-4">{tr.period}</th>
                <th className="p-2.5 px-4">{tr.payDate}</th>
                <th className="p-2.5 px-4">{tr.amount}</th>
                <th className="p-2.5 px-4">{tr.notes}</th>
                <th className="p-2.5 px-4 text-center w-12">{tr.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/10">
              {historyList.map((h) => (
                <tr key={h.id} className="hover:bg-slate-950/30 transition-colors">
                  <td className="p-2.5 px-4 text-slate-200 font-bold">{h.period}</td>
                  <td className="p-2.5 px-4 text-slate-400 font-mono">
                    {h.payDate.split('-').reverse().join('/')}
                  </td>
                  <td className="p-2.5 px-4 text-emerald-400 font-bold font-mono">{h.amount}</td>
                  <td className="p-2.5 px-4 text-slate-400 max-w-[140px] truncate" title={h.notes}>
                    {h.notes || '-'}
                  </td>
                  <td className="p-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(h.id)}
                      className="p-1.5 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface VaultItemCardProps {
  entry: VaultEntry;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenWorkspace?: (entry: GoogleSheetEntry) => void;
  categories?: CustomCategory[];
  layoutMode?: 'grid' | 'table';
  hideCompactSummaries?: boolean;
  onUpdateEntry?: (entry: VaultEntry) => void;
  isFocused?: boolean;
  onFocusToggle?: () => void;
}

export default function VaultItemCard({ 
  entry, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  onOpenWorkspace,
  categories,
  layoutMode = 'grid',
  hideCompactSummaries = false,
  onUpdateEntry,
  isFocused,
  onFocusToggle
}: VaultItemCardProps) {
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [showHistoryForField, setShowHistoryForField] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExpandedState, setIsExpandedState] = useState(false);
  const isExpanded = isFocused !== undefined ? isFocused : isExpandedState;
  
  const toggleExpand = () => {
    if (onFocusToggle) {
      onFocusToggle();
    } else {
      setIsExpandedState(!isExpandedState);
    }
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [launchInfoMessage, setLaunchInfoMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isPro = localStorage.getItem('secure_vault_pro_active') === 'true';

  // Direct localStorage dynamic language query helper
  const currentLang = (localStorage.getItem('secure_vault_lang') as 'vi' | 'en') || 'vi';
  const t = translations[currentLang];

  const toggleValue = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleCopy = async (text: string | undefined, fieldName: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const renderLaunchButton = (url: string, fieldType: 'url' | 'websiteUrl') => {
    const dropdownKey = `${entry.id}-${fieldType}`;
    const isOpen = activeDropdown === dropdownKey;
    const cleanUrl = formatUrl(url);

    const handleOpenTab = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      setActiveDropdown(null);
    };

    const handleCopyUrl = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(cleanUrl);
      setActiveDropdown(null);
      // Give inline feedback
      setCopiedField(dropdownKey);
      setTimeout(() => setCopiedField(null), 1500);
    };

    const handleOpenIncognito = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(cleanUrl);
      setActiveDropdown(null);
      // Trigger a local info alert
      setLaunchInfoMessage(t.launch_incognitoToast);
      setTimeout(() => setLaunchInfoMessage(null), 8000);
    };

    const handleOpenAndCopyPassword = (e: React.MouseEvent) => {
      e.stopPropagation();
      const pwd = (entry as any).password;
      if (pwd) {
        navigator.clipboard.writeText(pwd);
      }
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      setActiveDropdown(null);
      // Show local info alert
      setLaunchInfoMessage(currentLang === 'vi' 
        ? 'Đã mở liên kết & tự động copy mật khẩu vào khay nhớ tạm!' 
        : 'Opened link & automatically copied password to clipboard!');
      setTimeout(() => setLaunchInfoMessage(null), 4000);
    };

    return (
      <div className="relative shrink-0 select-none">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : dropdownKey);
          }}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
            isOpen 
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400' 
              : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-indigo-400'
          }`}
          title={currentLang === 'vi' ? 'Khởi chạy nâng cao' : 'Advanced Launch Actions'}
        >
          {copiedField === dropdownKey ? (
            <Check className="h-4 w-4 text-emerald-400 animate-scale" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-30 cursor-default" 
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(null);
              }}
            />
            <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-[#090b22]/98 border border-slate-800/90 shadow-2xl z-40 p-1.5 animate-scale overflow-hidden select-none text-left">
              <button
                type="button"
                onClick={handleOpenTab}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left select-none"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>{t.launch_openNewTab}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenIncognito}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left select-none"
              >
                <span className="h-3.5 w-3.5 flex items-center justify-center text-slate-400 font-mono text-[10px] border border-slate-500 rounded font-black select-none shrink-0 bg-slate-900">🕵</span>
                <span>{t.launch_openIncognito}</span>
              </button>

              {(entry as any).password && (
                <button
                  type="button"
                  onClick={handleOpenAndCopyPassword}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer text-left select-none"
                >
                  <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{t.launch_openAndCopyPass}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left select-none"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{t.launch_copyLink}</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const getPrimaryValue = () => {
    if (entry.category === 'bank') return entry.accountNumber;
    if (entry.category === 'social') return entry.password || entry.username;
    if (entry.category === 'web') return entry.password || entry.username;
    if (entry.category === 'wallet') return entry.privateKey || entry.seedPhrase || entry.address;
    if (entry.category === 'ewallet') return entry.pin || entry.phoneNumber;
    if (entry.category === 'phoneapp') return entry.passcode || entry.password || entry.username;
    if (entry.category === 'note') return entry.content;
    if (entry.category === 'bill') {
      const bEntry = entry as any;
      return bEntry.amount ? formatDisplayAmount(bEntry.amount, currentLang) : (bEntry.customerId || bEntry.productName || bEntry.billAppName);
    }
    return undefined;
  };

  const getCompactSummary = () => {
    if (entry.category === 'bank') {
      return `${entry.bankName || (currentLang === 'vi' ? 'Ngân hàng' : 'Bank')} • ${entry.accountNumber || ''}`;
    }
    if (entry.category === 'social') {
      return `${entry.platformName || (currentLang === 'vi' ? 'Mạng xã hội' : 'Social account')} • ${entry.username || ''}`;
    }
    if (entry.category === 'web') {
      return `${entry.username || ''}`;
    }
    if (entry.category === 'wallet') {
      return `${entry.walletName || (currentLang === 'vi' ? 'Ví Crypto' : 'Crypto space')} ${entry.address ? '• ' + entry.address.slice(0, 10) + '...' : ''}`;
    }
    if (entry.category === 'ewallet') {
      return `${entry.ewalletName || (currentLang === 'vi' ? 'Ví điện tử' : 'E-wallet')} • ${entry.phoneNumber || ''}`;
    }
    if (entry.category === 'phoneapp') {
      return `${entry.appName || (currentLang === 'vi' ? 'Ứng dụng' : 'Application')} • ${entry.username || ''}`;
    }
    if (entry.category === 'sheet') {
      return currentLang === 'vi' ? `Bảng tính (${entry.headers?.length || 0} cột, ${entry.rows?.length || 0} hàng)` : `Spreadsheet (${entry.headers?.length || 0} columns, ${entry.rows?.length || 0} rows)`;
    }
    if (entry.category === 'note') {
      return '••••••••••••';
    }
    if (entry.category === 'gdrive') {
      const gEntry = entry as any;
      return `${gEntry.fileName || 'Tệp'} • ${gEntry.fileSize || '1GB+'}`;
    }
    if (entry.category === 'bill') {
      const bEntry = entry as any;
      const amountStr = bEntry.amount ? ` • ${formatDisplayAmount(bEntry.amount, currentLang)}` : '';
      const cycleStr = bEntry.billCycle === 'yearly' ? (currentLang === 'vi' ? 'Hàng năm' : 'Annually') : (currentLang === 'vi' ? 'Hàng tháng' : 'Monthly');
      if (bEntry.billType === 'finance') {
        return `${bEntry.productName || (currentLang === 'vi' ? 'Tài chính' : 'Finance')} (${cycleStr})${amountStr}`;
      }
      if (bEntry.billType === 'utility') {
        let uLabel = '';
        if (bEntry.utilityType === 'electricity') uLabel = currentLang === 'vi' ? 'Điện' : 'Electricity';
        else if (bEntry.utilityType === 'water') uLabel = currentLang === 'vi' ? 'Nước' : 'Water';
        else if (bEntry.utilityType === 'wifi') uLabel = currentLang === 'vi' ? 'Wifi' : 'Wifi';
        else if (bEntry.utilityType === 'rent_house') uLabel = currentLang === 'vi' ? 'Thuê nhà' : 'House Rent';
        else if (bEntry.utilityType === 'rent_car') uLabel = currentLang === 'vi' ? 'Thuê xe' : 'Car Rental';
        else if (bEntry.utilityType === 'parking') uLabel = currentLang === 'vi' ? 'Gửi xe' : 'Parking Fee';
        else uLabel = currentLang === 'vi' ? 'Khác' : 'Other';
        return `${uLabel} • ${bEntry.customerId || ''}${amountStr}`;
      }
      if (bEntry.billType === 'app') {
        return `${bEntry.billAppName || 'App'} (${cycleStr})${amountStr}`;
      }
      return `${currentLang === 'vi' ? 'Hóa đơn' : 'Bill'} (${cycleStr})${amountStr}`;
    }
    return '';
  };

  // Extract domain/name for favicon preview or display letter
  const getDisplayLetter = () => {
    if (entry.category === 'bank') return entry.bankName?.charAt(0) || 'B';
    if (entry.category === 'social') return entry.platformName?.charAt(0) || 'S';
    if (entry.category === 'web') return entry.title?.charAt(0) || 'W';
    if (entry.category === 'wallet') return entry.walletName?.charAt(0) || 'V';
    if (entry.category === 'ewallet') return entry.ewalletName?.charAt(0) || 'M';
    if (entry.category === 'phoneapp') return entry.appName?.charAt(0) || 'A';
    if (entry.category === 'sheet') return entry.title?.charAt(0) || 'T';
    if (entry.category === 'gdrive') return 'D';
    if (entry.category === 'bill') return 'H';
    return 'G';
  };

  // Determine icon & theme color based on category
  const getCategoryStyles = () => {
    const matchedCat = categories?.find(c => c.id === entry.category);
    const catType = matchedCat ? matchedCat.iconType : entry.category;
    let fallbackLabel = null;
    if (matchedCat) {
      fallbackLabel = currentLang === 'en' ? (matchedCat.id === 'bank' ? 'Bank details' : matchedCat.id === 'social' ? 'Social Accounts' : matchedCat.id === 'web' ? 'Regular Web' : matchedCat.id === 'wallet' ? 'Crypto Wallets' : matchedCat.id === 'ewallet' ? 'E-Wallets' : matchedCat.id === 'phoneapp' ? 'Phone Apps' : matchedCat.id === 'note' ? 'Secure Notes' : matchedCat.id === 'sheet' ? 'Spreadsheets' : matchedCat.label) : matchedCat.label;
    }

    switch (catType) {
      case 'bank':
        return {
          icon: <CreditCard className="h-5 w-5 text-blue-400" />,
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Ngân hàng' : 'Bank detail'),
          badgeColor: 'bg-blue-500/20 text-blue-300',
        };
      case 'social':
        return {
          icon: <Smartphone className="h-5 w-5 text-teal-400" />,
          bgColor: 'bg-teal-500/10 border-teal-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Mạng xã hội' : 'Social group'),
          badgeColor: 'bg-teal-500/20 text-teal-300',
        };
      case 'web':
        return {
          icon: <Globe className="h-5 w-5 text-purple-400" />,
          bgColor: 'bg-purple-500/10 border-purple-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Tài khoản Web' : 'Web Account'),
          badgeColor: 'bg-purple-500/20 text-purple-300',
        };
      case 'note':
        return {
          icon: <FileText className="h-5 w-5 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Ghi chú' : 'Secure Note'),
          badgeColor: 'bg-amber-500/20 text-amber-300',
        };
      case 'wallet':
        return {
          icon: <Wallet className="h-5 w-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Ví Crypto' : 'Crypto tokens'),
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'ewallet':
        return {
          icon: <Smartphone className="h-5 w-5 text-pink-400" />,
          bgColor: 'bg-pink-500/10 border-pink-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Ví điện tử' : 'E-wallet'),
          badgeColor: 'bg-pink-500/20 text-pink-300',
        };
      case 'phoneapp':
        return {
          icon: <Fingerprint className="h-5 w-5 text-indigo-400" />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'App Mobile' : 'Mobile Application'),
          badgeColor: 'bg-indigo-500/20 text-indigo-300',
        };
      case 'sheet':
        return {
          icon: <Table className="h-5 w-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Bảng tính' : 'Spreadsheet'),
          badgeColor: 'bg-emerald-500/25 text-emerald-300',
        };
      case 'gdrive':
        return {
          icon: <ExternalLink className="h-5 w-5 text-indigo-400" />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Lưu trữ Drive' : 'Drive Link'),
          badgeColor: 'bg-indigo-500/25 text-indigo-300',
        };
      case 'bill':
        return {
          icon: <Receipt className="h-5 w-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Hóa Đơn' : 'Bill Invoice'),
          badgeColor: 'bg-emerald-500/25 text-emerald-300',
        };
      default:
        return {
          icon: <FileText className="h-5 w-5 text-slate-400" />,
          bgColor: 'bg-slate-500/10 border-slate-500/20',
          badgeText: fallbackLabel || (currentLang === 'vi' ? 'Khác' : 'Miscellaneous'),
          badgeColor: 'bg-slate-500/20 text-slate-300',
        };
    }
  };

  const styles = getCategoryStyles();

  // Field display helper with inline copy and show/hide
  const RenderField = ({ label, value, secretKey, fontMono = false }: { label: string; value: string | undefined; secretKey?: string; fontMono?: boolean }) => {
    if (!value) return null;
    const isSecret = !!secretKey;
    const isShowing = isSecret ? !!showSecrets[secretKey] : true;
    const uniqueKey = `${entry.id}-${secretKey || label}`;

    let translatedLabel = label;
    if (currentLang === 'en') {
      const fieldTranslations: { [key: string]: string } = {
        'Ngân hàng': 'Bank Name',
        'Số tài khoản': 'Account Number',
        'Chủ tài khoản': 'Account Holder',
        'Tên đăng nhập': 'Login Username',
        'Mật khẩu': 'Password',
        'Mã PIN': 'PIN Code',
        'Chi nhánh': 'Branch Office',
        'Nền tảng': 'Platform Platform',
        'Username / Email': 'Username / Email',
        'Tài khoản / Email': 'Account ID / Email',
        'Tên đăng nhập / Số ĐT': 'Login Phone / Username',
        'Nội dung ghi chú': 'Notes Freeform Body',
        'Sàn / Loại Ví': 'Exchange / Wallet Type',
        'Phân loại Ví': 'Wallet Classification',
        'Tài khoản / Email đăng nhập': 'Exchange ID / Email',
        'Mật khẩu / PIN bảo mật': 'Protective PIN',
        'Địa chỉ ví (Address)': 'Wallet Address',
        'Cụm từ khôi phục (12 - 24 từ)': 'Mnemonic Seed Phrase',
        'Khóa riêng tư (Private Key)': 'Private Key',
        'API Key': 'API Key',
        'API Secret / Secret Key': 'API Secret Signature',
        'Ví điện tử': 'E-Wallet Identifier',
        'Số điện thoại / Tài khoản': 'Phone Number / Login Account',
        'Mã PIN bảo mật': 'Security PIN Code',
        'Mật khẩu đăng nhập': 'Sign-in Password',
        'Ngân hàng liên kết': 'Associated Linked Bank',
        'Ứng dụng di động': 'Mobile Phone Application',
        'Số định danh / CCCD': 'National ID Card Number',
        'Mã Passcode bảo mật': 'Entry Passcode',
        'Mật khẩu chính': 'Core Password',
        'Email liên kết': 'Linked Registered Email',
        'Bảng tính lưu trữ': 'Spreadsheet Database'
      };
      translatedLabel = fieldTranslations[label] || label;
    }

    const isAmountLabel = 
      label === 'Số tiền' || 
      label === 'Phí dịch vụ' || 
      label === 'Amount' || 
      label === 'Subscription Cost' ||
      translatedLabel === 'Amount' ||
      translatedLabel === 'Subscription Cost';

    const cleanValue = isAmountLabel ? formatDisplayAmount(value, currentLang) : value;
    const displayValue = isShowing ? cleanValue : '••••••••••••';

    const isPasswordField = secretKey && ['socPass', 'webPass', 'bankPass', 'walletPass', 'ewalletPass', 'phonepass'].includes(secretKey);
    const hasHistory = isPro && isPasswordField && (entry as any).passwordHistory && (entry as any).passwordHistory.length > 0;

    return (
      <div className="flex flex-col gap-1 py-1.5 border-b border-slate-800/40 last:border-0 text-left w-full">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{translatedLabel}</span>
        <div className="flex items-center justify-between gap-2.5">
          <span className={`text-base text-slate-200 select-all ${fontMono ? 'font-mono tracking-wider text-emerald-400' : ''}`}>
            {displayValue}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasHistory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistoryForField(prev => ({ ...prev, [uniqueKey]: !prev[uniqueKey] }));
                }}
                className={`p-1 transition-colors cursor-pointer ${showHistoryForField[uniqueKey] ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                title={currentLang === 'vi' ? 'Lịch sử mật khẩu' : 'Password History'}
              >
                <History className="h-3.5 w-3.5" />
              </button>
            )}
            {isSecret && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleValue(secretKey);
                }}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={isShowing ? (currentLang === 'vi' ? 'Ẩn' : 'Hide') : (currentLang === 'vi' ? 'Hiện' : 'Show')}
              >
                {isShowing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(value, uniqueKey);
              }}
              className="p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
              title={currentLang === 'vi' ? 'Sao chép' : 'Copy'}
            >
              {copiedField === uniqueKey ? (
                <Check className="h-3.5 w-3.5 text-emerald-400 animate-scale" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {hasHistory && showHistoryForField[uniqueKey] && (
          <div className="mt-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs space-y-1.5 animate-fade-in text-left">
            <span className="font-semibold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
              {currentLang === 'vi' ? 'Mật mã trước đây' : 'Previous passwords'}
            </span>
            {(entry as any).passwordHistory.map((item: any, idx: number) => {
              const histStateKey = `hist-${idx}-${uniqueKey}`;
              const isHistShowing = !!showSecrets[histStateKey];
              const displayHistVal = isHistShowing ? item.password : '••••••••••••';
              return (
                <div key={idx} className="flex items-center justify-between gap-1 border-b border-slate-900/60 last:border-0 pb-1.5 last:pb-0 pt-0.5">
                  <span className="font-mono text-slate-300 select-all">{displayHistVal}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSecrets(prev => ({ ...prev, [histStateKey]: !prev[histStateKey] }));
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer p-0.5 font-semibold"
                    >
                      {isHistShowing ? (currentLang === 'vi' ? 'Ẩn' : 'Hide') : (currentLang === 'vi' ? 'Hiện' : 'Show')}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.password, `hist-copy-${idx}-${uniqueKey}`);
                      }}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 cursor-pointer p-0.5 font-semibold"
                    >
                      {copiedField === `hist-copy-${idx}-${uniqueKey}` ? 
                        (currentLang === 'vi' ? 'Đã sao chép' : 'Copied') : 
                        (currentLang === 'vi' ? 'Sao chép' : 'Copy')}
                    </button>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(item.updatedAt).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (layoutMode === 'table') {
    return (
      <div 
        id={`vault-row-${entry.id}`} 
        onClick={toggleExpand}
        className={`bg-slate-900 border ${
          isExpanded ? 'border-emerald-500/40 bg-slate-900 shadow-md ring-1 ring-emerald-500/5' : 'border-slate-800/40 hover:border-slate-705 border-slate-800/80 hover:bg-slate-950/40'
        } rounded-xl p-3 px-4 sm:px-5 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer select-none`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Main Info Side */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Round Category Icon */}
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center border font-bold text-base shrink-0 transition-transform duration-300 ${isExpanded ? 'scale-105' : 'group-hover:scale-105'} ${styles.bgColor}`}>
              {getDisplayLetter()}
            </div>
            
            <div className="text-left min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
              <div className="min-w-0 sm:max-w-xs md:max-w-[200px]">
                <h4 className="text-base font-bold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                  {entry.title}
                </h4>
              </div>

              {entry.reminder && entry.reminder.enabled && (
                <div className="flex items-center gap-1.5 ml-1 select-none shrink-0" title={`Có nhắc nhở: ${entry.reminder.message || 'Lịch'} - Ngày: ${entry.reminder.date}`}>
                  <Bell className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span className="hidden md:inline text-[12px] font-semibold text-indigo-400 font-sans tracking-wide bg-indigo-500/10 px-1.5 py-0.2 rounded">
                    {entry.reminder.date.split('-').reverse().slice(0, 2).join('/')}
                  </span>
                </div>
              )}
              
              {/* Category Badge on Row */}
              <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${styles.badgeColor}`}>
                  {styles.badgeText}
                </span>
              </div>

              {/* Collapsed Compact Summary Text */}
              {!isExpanded && !hideCompactSummaries && (
                <div className="hidden md:block text-sm font-mono text-slate-550 truncate mt-0.5 sm:mt-0 max-w-sm">
                  {getCompactSummary()}
                </div>
              )}
            </div>
          </div>

          {/* Controls Side */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 border-t border-slate-800/40 pt-2 sm:pt-0 sm:border-0">
            {/* Quick copy primary details button to minimize user effort */}
            {!isExpanded && getPrimaryValue() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const val = getPrimaryValue();
                  if (val) handleCopy(val, `row-primary-${entry.id}`);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-850 hover:text-emerald-400 border border-slate-850 text-slate-400 rounded-lg text-xs font-bold cursor-pointer transition-all"
                title={currentLang === 'vi' ? 'Sao chép nhanh thông tin' : 'Quick Copy Info'}
              >
                {copiedField === `row-primary-${entry.id}` ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400 animate-scale" />
                    <span className="text-emerald-400 font-sans font-semibold">{currentLang === 'vi' ? 'Đã chép' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="font-sans font-semibold">{currentLang === 'vi' ? 'Copy nhanh' : 'Quick Copy'}</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(entry.id);
                  }}
                  className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg transition-colors text-slate-500 hover:text-amber-400 cursor-pointer"
                  title={entry.isFavorite ? (currentLang === 'vi' ? 'Bỏ yêu thích' : 'Unstar') : (currentLang === 'vi' ? 'Yêu thích' : 'Star')}
                >
                  <Star className={`h-3.5 w-3.5 ${entry.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(entry);
                }}
                className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title={currentLang === 'vi' ? 'Sửa' : 'Edit'}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>

              <div className="relative shrink-0 select-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(!showDeleteConfirm);
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    showDeleteConfirm
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-450'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-rose-450'
                  }`}
                  title={currentLang === 'vi' ? 'Xóa' : 'Delete'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {showDeleteConfirm && (
                  <>
                    <div 
                      className="fixed inset-0 z-30 cursor-default" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                    />
                    <div 
                      className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-[#090b22]/98 border border-rose-500/40 shadow-[0_10px_30px_rgba(244,63,94,0.15)] z-40 p-3.5 animate-scale text-left select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[12px] font-extrabold text-rose-450 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>{currentLang === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}</span>
                      </p>
                      <p className="text-[11px] text-slate-450 font-medium leading-normal mb-3">
                        {currentLang === 'vi' ? `Bạn muốn xóa "${entry.title}"?` : `Remove "${entry.title}"?`}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                            setShowDeleteConfirm(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-600 active:bg-rose-750 text-white font-bold text-[11px] text-center transition-colors cursor-pointer"
                        >
                          {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-350 hover:text-slate-100 font-bold text-[11px] text-center transition-colors cursor-pointer"
                        >
                          {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-500 group-hover:text-emerald-400 transition-colors flex items-center justify-center">
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories specific field display when expanded */}
        {isExpanded && (
          <div className="space-y-1 mt-3 pt-3 border-t border-slate-850/60 animate-fade-in select-text" onClick={(e) => e.stopPropagation()}>
            {entry.category === 'bank' && (
              <>
                <RenderField label="Ngân hàng" value={entry.bankName} />
                <RenderField label="Số tài khoản" value={entry.accountNumber} secretKey="accNum" fontMono />
                <RenderField label="Chủ tài khoản" value={entry.accountHolder} />
                {entry.username && <RenderField label="Tên đăng nhập" value={entry.username} />}
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="bankPass" />}
                {entry.pin && <RenderField label="Mã PIN" value={entry.pin} secretKey="bankPin" fontMono />}
                {entry.branch && <RenderField label="Chi nhánh" value={entry.branch} />}
              </>
            )}

            {entry.category === 'social' && (
              <>
                <RenderField label="Nền tảng" value={entry.platformName} />
                <RenderField label="Username / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="socPass" />}
                {entry.url && (
                  <div className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Liên kết URL</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm text-slate-300 line-clamp-1">{entry.url}</span>
                      {renderLaunchButton(entry.url, 'url')}
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'web' && (
              <>
                <RenderField label="Tài khoản / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="webPass" />}
                {(entry as any).email && <RenderField label={currentLang === 'vi' ? "Email liên kết riêng" : "Associated Email"} value={(entry as any).email} />}
                {(entry as any).creatorHandle && <RenderField label={currentLang === 'vi' ? "Biệt danh / Handle (@)" : "Creator Handle (@)"} value={(entry as any).creatorHandle} />}
                {(entry as any).payoutEmail && <RenderField label={currentLang === 'vi' ? "Cổng nhận tiền / Payout" : "Payout Receiver"} value={(entry as any).payoutEmail} />}
                {(entry as any).pinCode && <RenderField label={currentLang === 'vi' ? "Mã PIN bảo mật" : "Security PIN Code"} value={(entry as any).pinCode} secretKey="webPin" />}
                {(entry as any).apiKey && <RenderField label={currentLang === 'vi' ? "Mã API / Token" : "API Key / Token"} value={(entry as any).apiKey} secretKey="webApiKey" fontMono />}
                {entry.websiteUrl && (
                  <div className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Website</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm text-slate-300 line-clamp-1">{entry.websiteUrl}</span>
                      {renderLaunchButton(entry.websiteUrl, 'websiteUrl')}
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'wallet' && (
              <>
                <RenderField label="Sàn / Loại Ví" value={entry.walletName} />
                {entry.walletType && (
                  <div className="flex flex-col gap-1 py-1.5 border-b border-slate-850/45 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Phân loại Ví</span>
                    <span className="text-sm text-slate-350">
                      {entry.walletType === 'exchange' ? 'Sàn giao dịch tập trung (Binance...)' :
                       entry.walletType === 'dex_app' ? 'Ví Web3 / Ví cá nhân (MetaMask...)' :
                       'Ví cứng / Ví lạnh (Ledger...)'}
                    </span>
                  </div>
                )}
                {entry.username && <RenderField label="Tài khoản / Email đăng nhập" value={entry.username} />}
                {entry.password && <RenderField label="Mật khẩu / PIN bảo mật" value={entry.password} secretKey="walletPass" />}
                {entry.address && <RenderField label="Địa chỉ ví (Address)" value={entry.address} fontMono />}
                {entry.seedPhrase && <RenderField label="Cụm từ khôi phục (12 - 24 từ)" value={entry.seedPhrase} secretKey="walletSeed" fontMono />}
                {entry.privateKey && <RenderField label="Khóa riêng tư (Private Key)" value={entry.privateKey} secretKey="walletPriv" fontMono />}
                {entry.apiKey && <RenderField label="API Key" value={entry.apiKey} secretKey="walletApiKey" fontMono />}
                {entry.apiSecret && <RenderField label="API Secret / Secret Key" value={entry.apiSecret} secretKey="walletApiSec" fontMono />}
              </>
            )}

            {entry.category === 'ewallet' && (
              <>
                <RenderField label="Ví điện tử" value={entry.ewalletName} />
                <RenderField label="Số điện thoại / Tài khoản" value={entry.phoneNumber} fontMono />
                {entry.accountHolder && <RenderField label="Chủ tài khoản" value={entry.accountHolder} />}
                {entry.pin && <RenderField label="Mã PIN bảo mật" value={entry.pin} secretKey="ewalletPin" fontMono />}
                {entry.password && <RenderField label="Mật khẩu đăng nhập" value={entry.password} secretKey="ewalletPass" />}
                {entry.linkedBank && <RenderField label="Ngân hàng liên kết" value={entry.linkedBank} />}
              </>
            )}

            {entry.category === 'phoneapp' && (
              <>
                <RenderField label="Ứng dụng di động" value={entry.appName} />
                {entry.username && <RenderField label="Tên đăng nhập / Số ĐT" value={entry.username} />}
                {entry.nationalId && <RenderField label="Số định danh / CCCD" value={entry.nationalId} fontMono />}
                {entry.passcode && <RenderField label="Mã Passcode bảo mật" value={entry.passcode} secretKey="phonepasscode" fontMono />}
                {entry.password && <RenderField label="Mật khẩu chính" value={entry.password} secretKey="phonepass" />}
                {(entry as any).email && <RenderField label="Email liên kết" value={(entry as any).email} secretKey="phoneemail" />}
              </>
            )}

            {entry.category === 'sheet' && (
              <div className="py-1 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>{currentLang === 'vi' ? 'Bảng tính lưu trữ' : 'Secure Spreadsheet'}</span>
                  {entry.isIntegrated ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-sans tracking-wide">
                      <span>{currentLang === 'vi' ? '✓ Trực tuyến' : '✓ Online Sync'}</span>
                      {entry.spreadsheetUrl && (
                        <a
                          href={entry.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="p-0.5 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                          title={currentLang === 'vi' ? 'Mở Google Sheets trực tuyến' : 'Open Google Sheets online'}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 font-sans tracking-wide">{currentLang === 'vi' ? 'Nội bộ' : 'Local offline'}</span>
                  )}
                </div>

                {entry.isIntegrated && entry.lastSyncTime && (
                  <div className="text-xs text-slate-400 font-medium bg-emerald-950/10 border border-emerald-900/10 p-1.5 rounded-lg flex items-center justify-between">
                    <span>{currentLang === 'vi' ? 'Đã đồng bộ Google Sheet' : 'Google Sheet Synced'}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{currentLang === 'vi' ? 'Cập nhật: ' : 'Updated: '} {new Date(entry.lastSyncTime).toLocaleTimeString(currentLang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                  </div>
                )}

                {onOpenWorkspace && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWorkspace(entry as GoogleSheetEntry);
                    }}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/20 text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{currentLang === 'vi' ? 'Mở bảng tính màn hình lớn ↗' : 'Large Spreadsheet Workspace ↗'}</span>
                  </button>
                )}

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40 scrollbar-thin max-h-48 overflow-y-auto">
                  <table className="w-full border-collapse text-xs text-slate-300">
                    <thead>
                      <tr className="bg-emerald-500/10 border-b border-slate-800 text-left">
                        {entry.headers && entry.headers.map((hdr, hIdx) => (
                          <th key={hIdx} className="p-1.5 px-2 font-bold text-emerald-450 border-r border-slate-800/85 last:border-0 truncate max-w-[100px]" title={hdr}>
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.rows && entry.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-900/30">
                          {row.map((cell, cIdx) => {
                            const cellId = `cell-${entry.id}-${rIdx}-${cIdx}`;
                            return (
                              <td key={cIdx} className="p-1 px-2 border-r border-slate-800/45 last:border-0 relative font-sans break-all group/cell">
                                <span className="line-clamp-2 pr-4">{cell || '-'}</span>
                                {cell && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(cell, cellId);
                                    }}
                                    className="absolute right-1 top-1.5 opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded cursor-pointer shrink-0"
                                    title={currentLang === 'vi' ? 'Sao chép ô này' : 'Copy this cell'}
                                  >
                                    {copiedField === cellId ? (
                                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-2.5 w-2.5" />
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {entry.category === 'note' && (
              <div className="py-1 text-left animate-fade-in">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{currentLang === 'vi' ? 'Nội dung ghi chú' : 'Note Content'}</span>
                <div 
                  onClick={(e) => {
                    if (!showSecrets[`${entry.id}-noteContent`]) {
                      e.stopPropagation();
                      toggleValue(`${entry.id}-noteContent`);
                    }
                  }}
                  className={`relative bg-slate-950/60 border border-slate-800/60 rounded-xl p-3.5 max-h-36 overflow-y-auto text-base text-slate-300 font-sans whitespace-pre-wrap leading-relaxed select-text scrollbar-thin transition-all duration-200 ${
                    !showSecrets[`${entry.id}-noteContent`] ? 'cursor-pointer hover:border-emerald-500/20 active:bg-slate-950/85' : ''
                  }`}
                >
                  {showSecrets[`${entry.id}-noteContent`] ? (
                    entry.content
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-500 select-none space-y-1 bg-slate-950/10 rounded-lg">
                      <Lock className="h-4.5 w-4.5 text-slate-600 animate-pulse" />
                      <span className="font-mono text-sm tracking-widest text-slate-550">••••••••••••</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 px-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(`${entry.id}-noteContent`);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-305 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title={showSecrets[`${entry.id}-noteContent`] ? (currentLang === 'vi' ? 'Ẩn ghi chú' : 'Hide Notes') : (currentLang === 'vi' ? 'Hiện ghi chú' : 'Show Notes')}
                  >
                    {showSecrets[`${entry.id}-noteContent`] ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span className="font-sans">{currentLang === 'vi' ? 'Ẩn nội dung' : 'Hide notes'}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span className="font-sans">{currentLang === 'vi' ? 'Hiện nội dung' : 'Reveal notes'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(entry.content, `note-${entry.id}`);
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {copiedField === `note-${entry.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans font-semibold">{currentLang === 'vi' ? 'Đã chép' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="font-sans">{currentLang === 'vi' ? 'Sao chép ghi chú' : 'Copy notes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {entry.category === 'gdrive' && (
              <>
                <RenderField label="Tên tệp tin" value={(entry as any).fileName} />
                <RenderField label="Dung lượng tệp" value={(entry as any).fileSize} />
                <RenderField label="Loại phương tiện" value={(entry as any).mediaType === 'video' ? 'Video (MP4, MKV, ...)' : (entry as any).mediaType === 'image' ? 'Hình ảnh' : (entry as any).mediaType === 'archive' ? 'Tệp nén ZIP/RAR' : (entry as any).mediaType === 'audio' ? 'Âm thanh' : (entry as any).mediaType === 'document' ? 'Tài liệu' : 'Đặc biệt / Khác'} />
                
                {(entry as any).driveLink && (
                  <div className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Đường link Google Drive</span>
                    <div className="flex items-center justify-between gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-805 bg-slate-950 border-slate-800">
                      <span className="text-[12px] text-indigo-400 font-mono line-clamp-1 truncate max-w-[220px] select-all mr-2">
                        {(entry as any).driveLink}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy((entry as any).driveLink, `${entry.id}-driveLink`);
                          }}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Sao chép đường liên kết"
                        >
                          {copiedField === `${entry.id}-driveLink` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 animate-scale" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={(entry as any).driveLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all flex items-center justify-center shrink-0 font-bold text-xs gap-1"
                          title="Tải trực tiếp hoặc Xem trực tuyến"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline font-sans text-[11px] uppercase">Mở</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'bill' && (
              <>
                <RenderField 
                  label={currentLang === 'vi' ? 'Chu kỳ thanh toán' : 'Billing Cycle'} 
                  value={(entry as any).billCycle === 'yearly' ? (currentLang === 'vi' ? 'Hàng năm' : 'Yearly') : (currentLang === 'vi' ? 'Hàng tháng' : 'Monthly')} 
                />
                
                {(entry as any).billType === 'finance' && (
                  <>
                    <RenderField label={currentLang === 'vi' ? 'Sản phẩm tài chính' : 'Financial Product'} value={(entry as any).productName} />
                    <RenderField label={currentLang === 'vi' ? 'Số hợp đồng' : 'Contract/Policy Number'} value={(entry as any).contractNumber} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Chủ sở hữu' : 'Contract Owner'} value={(entry as any).name} />
                    <RenderField label={currentLang === 'vi' ? 'Hạn thanh toán' : 'Due Date'} value={(entry as any).dueDate} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Số tiền' : 'Amount'} value={(entry as any).amount} fontMono />
                  </>
                )}

                {(entry as any).billType === 'utility' && (
                  <>
                    <RenderField 
                      label={currentLang === 'vi' ? 'Loại dịch vụ' : 'Service Type'} 
                      value={
                        (entry as any).utilityType === 'electricity' ? (currentLang === 'vi' ? '⚡ Điện lực (EVN)' : 'Electricity') :
                        (entry as any).utilityType === 'water' ? (currentLang === 'vi' ? '💧 Nước sạch' : 'Water Service') :
                        (entry as any).utilityType === 'wifi' ? (currentLang === 'vi' ? '📶 Mạng Wifi / Internet' : 'Wifi / Internet') :
                        (entry as any).utilityType === 'rent_house' ? (currentLang === 'vi' ? '🏠 Thuê nhà / Thuê căn hộ' : 'House Rent') :
                        (entry as any).utilityType === 'rent_car' ? (currentLang === 'vi' ? '🚗 Thuê xe / Thuê xe tự lái' : 'Car Rental') :
                        (entry as any).utilityType === 'parking' ? (currentLang === 'vi' ? '🅿️ Gửi xe / Vé xe tháng' : 'Parking Fee') :
                        (currentLang === 'vi' ? 'Khác' : 'Other')
                      } 
                    />
                    <RenderField label={currentLang === 'vi' ? 'Mã khách hàng' : 'Customer Code/ID'} value={(entry as any).customerId} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Tên khách hàng' : 'Subscriber Name'} value={(entry as any).name} />
                    <RenderField label={currentLang === 'vi' ? 'Kỳ đóng / Kỳ thanh toán' : 'Billing Period'} value={(entry as any).billingPeriod} />
                    <RenderField label={currentLang === 'vi' ? 'Số tiền' : 'Amount'} value={(entry as any).amount} fontMono />
                  </>
                )}

                {(entry as any).billType === 'app' && (
                  <>
                    <RenderField label={currentLang === 'vi' ? 'Tên dịch vụ/App' : 'Application / Service'} value={(entry as any).billAppName} />
                    <RenderField label={currentLang === 'vi' ? 'Liên kết thông tin' : 'Linked Account Details'} value={(entry as any).appContact} />
                    <RenderField 
                      label={currentLang === 'vi' ? 'Thanh toán qua' : 'Payment Method'} 
                      value={(entry as any).appPaymentMethod === 'ewallet' ? (currentLang === 'vi' ? 'Ví điện tử' : 'E-Wallet') : ((entry as any).appPaymentMethod === 'bank_card' ? (currentLang === 'vi' ? 'Thẻ Ngân Hàng' : 'Bank Credit Card') : (currentLang === 'vi' ? 'Chợ Ứng Dụng' : 'App Store Billing'))} 
                    />
                    <RenderField label={currentLang === 'vi' ? 'Ngày gia hạn bảo mật' : 'Renewal Due Date'} value={(entry as any).dueDate} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Phí dịch vụ' : 'Subscription Cost'} value={(entry as any).amount} fontMono />
                  </>
                )}

                <BillPaymentHistorySection entry={entry as BillEntry} onUpdateEntry={onUpdateEntry} currentLang={currentLang} />
              </>
            )}
          </div>
        )}

        {/* 2FA Authenticator (Dynamic countdown) */}
        {isExpanded && entry.totpSecret && (
          <div onClick={(e) => e.stopPropagation()}>
            <TotpDisplay secret={entry.totpSecret} />
          </div>
        )}

        {/* Reminder block */}
        {isExpanded && entry.reminder && entry.reminder.enabled && (
          <div className="mt-3.5 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="p-1.5 bg-indigo-500/15 rounded-lg text-indigo-400 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-indigo-300">{currentLang === 'vi' ? 'Nhắc nhở lịch hẹn:' : 'Calendar Reminder:'}</div>
              <div className="mt-0.5 text-slate-200 font-medium select-text">{entry.reminder.message || (currentLang === 'vi' ? 'Thông báo tự động' : 'System automated alarm')}</div>
              <div className="mt-1 font-mono text-[12px] text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-slate-500" />
                {currentLang === 'vi' ? 'Ngày: ' : 'Date: '}{entry.reminder.date.split('-').reverse().join('/')}{entry.reminder.time ? ` ${currentLang === 'vi' ? 'lúc' : 'at'} ${entry.reminder.time}` : ''} • {entry.reminder.type === 'yearly' ? (currentLang === 'vi' ? 'Lặp lại hàng năm 🎂' : 'Repeats Annually 🎂') : entry.reminder.type === 'monthly' ? (currentLang === 'vi' ? 'Lặp lại hàng tháng 📅' : 'Repeats Monthly 📅') : (currentLang === 'vi' ? 'Lời nhắc 1 lần 📌' : 'One-time notification 📌')}
              </div>
            </div>
          </div>
        )}

        {/* Notes block */}
        {isExpanded && entry.notes && entry.category !== 'note' && (
          <div className="mt-2.5 pt-2 border-t border-slate-850 text-slate-400 text-sm text-left italic select-text whitespace-pre-wrap" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold text-slate-500 not-italic">{currentLang === 'vi' ? 'Lưu ý: ' : 'Observations: '}</span> {entry.notes}
          </div>
        )}

        {/* Local Card Info Banner */}
        {launchInfoMessage && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0b0c2a]/95 border border-indigo-500/30 text-[12px] font-medium text-indigo-300 p-2.5 rounded-xl z-50 flex items-start gap-2 shadow-2xl animate-fade-in select-none" onClick={(e) => e.stopPropagation()}>
            <div className="p-1 bg-indigo-500/10 rounded text-indigo-400 shrink-0">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="text-left flex-1 font-sans leading-relaxed">
              {launchInfoMessage}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id={`vault-card-${entry.id}`} 
      onClick={toggleExpand}
      className={`bg-slate-900 border ${
        isExpanded ? 'border-emerald-500/45 bg-slate-900 shadow-lg ring-1 ring-emerald-500/10' : 'border-slate-800/60 hover:border-slate-700/85'
      } rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-950/20 transition-all duration-300 flex flex-col justify-between group h-full relative cursor-pointer`}
    >
      <div>
        {/* Header section */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center border font-bold text-lg shadow-sm shrink-0 transition-transform duration-300 ${
              isExpanded ? 'scale-105' : 'group-hover:scale-105'
            } ${styles.bgColor}`}>
              {getDisplayLetter()}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors max-w-[124px] sm:max-w-[180px]">
                  {entry.title}
                </h4>
                {entry.reminder && entry.reminder.enabled && (
                  <div className="flex items-center gap-1 text-indigo-400 shrink-0" title={`Có nhắc nhở: ${entry.reminder.message || 'Lịch'}`}>
                    <Bell className="h-3.5 w-3.5 animate-pulse" />
                    <span className="text-[11px] font-bold font-mono bg-indigo-500/10 px-1 rounded">
                      {entry.reminder.date.split('-').reverse().slice(0, 2).join('/')}
                    </span>
                  </div>
                )}
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(entry.id);
                    }}
                    className="text-slate-600 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                    title={entry.isFavorite ? (currentLang === 'vi' ? 'Bỏ yêu thích' : 'Unstar') : (currentLang === 'vi' ? 'Yêu thích' : 'Star')}
                  >
                    <Star 
                      className={`h-4 w-4 ${entry.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} 
                    />
                  </button>
                )}
              </div>
              <span 
                title={styles.badgeText}
                className={`inline-block max-w-[160px] sm:max-w-[220px] truncate text-sm px-3 py-1 mt-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${styles.badgeColor}`}
              >
                {styles.badgeText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={currentLang === 'vi' ? 'Sửa' : 'Edit'}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
              <div className="relative shrink-0 select-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(!showDeleteConfirm);
                  }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    showDeleteConfirm
                      ? 'bg-rose-500/15 text-rose-450 border border-rose-500/40'
                      : 'text-slate-400 hover:text-rose-455 hover:bg-slate-800'
                  }`}
                  title={currentLang === 'vi' ? 'Xóa' : 'Delete'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {showDeleteConfirm && (
                  <>
                    <div 
                      className="fixed inset-0 z-30 cursor-default" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                    />
                    <div 
                      className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-[#090b22]/98 border border-rose-500/40 shadow-[0_10px_30px_rgba(244,63,94,0.15)] z-45 p-3.5 animate-scale text-left select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[12px] font-extrabold text-rose-450 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>{currentLang === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}</span>
                      </p>
                      <p className="text-[11px] text-slate-450 font-medium leading-normal mb-3">
                        {currentLang === 'vi' ? `Bạn muốn xóa "${entry.title}"?` : `Remove "${entry.title}"?`}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                            setShowDeleteConfirm(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-500 hover:bg-rose-600 active:bg-rose-750 text-white font-bold text-[11px] text-center transition-colors cursor-pointer"
                        >
                          {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-350 hover:text-slate-100 font-bold text-[11px] text-center transition-colors cursor-pointer"
                        >
                          {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            <div className="p-1.5 text-slate-500 group-hover:text-emerald-400 rounded-lg transition-colors flex items-center justify-center ml-0.5">
              {isExpanded ? (
                <ChevronUp className="h-4.5 w-4.5 text-emerald-400" />
              ) : (
                <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Categories specific field display */}
        {isExpanded && (
          <div className="space-y-1 mt-4 pt-3 border-t border-slate-850 animate-fade-in select-text" onClick={(e) => e.stopPropagation()}>
            {entry.category === 'bank' && (
              <>
                <RenderField label="Ngân hàng" value={entry.bankName} />
                <RenderField label="Số tài khoản" value={entry.accountNumber} secretKey="accNum" fontMono />
                <RenderField label="Chủ tài khoản" value={entry.accountHolder} />
                {entry.username && <RenderField label="Tên đăng nhập" value={entry.username} />}
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="bankPass" />}
                {entry.pin && <RenderField label="Mã PIN" value={entry.pin} secretKey="bankPin" fontMono />}
                {entry.branch && <RenderField label="Chi nhánh" value={entry.branch} />}
              </>
            )}

            {entry.category === 'social' && (
              <>
                <RenderField label="Nền tảng" value={entry.platformName} />
                <RenderField label="Username / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="socPass" />}
                {entry.url && (
                  <div id="website-link-container" className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên kết URL</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-base text-slate-300 line-clamp-1">{entry.url}</span>
                      {renderLaunchButton(entry.url, 'url')}
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'web' && (
              <>
                <RenderField label="Tài khoản / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="webPass" />}
                {(entry as any).email && <RenderField label={currentLang === 'vi' ? "Email liên kết riêng" : "Associated Email"} value={(entry as any).email} />}
                {(entry as any).creatorHandle && <RenderField label={currentLang === 'vi' ? "Biệt danh / Handle (@)" : "Creator Handle (@)"} value={(entry as any).creatorHandle} />}
                {(entry as any).payoutEmail && <RenderField label={currentLang === 'vi' ? "Cổng nhận tiền / Payout" : "Payout Receiver"} value={(entry as any).payoutEmail} />}
                {(entry as any).pinCode && <RenderField label={currentLang === 'vi' ? "Mã PIN bảo mật" : "Security PIN Code"} value={(entry as any).pinCode} secretKey="webPin" />}
                {(entry as any).apiKey && <RenderField label={currentLang === 'vi' ? "Mã API / Token" : "API Key / Token"} value={(entry as any).apiKey} secretKey="webApiKey" fontMono />}
                {entry.websiteUrl && (
                  <div id="website-link-container" className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Website</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-base text-slate-300 line-clamp-1">{entry.websiteUrl}</span>
                      {renderLaunchButton(entry.websiteUrl, 'websiteUrl')}
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'wallet' && (
              <>
                <RenderField label="Sàn / Loại Ví" value={entry.walletName} />
                {entry.walletType && (
                  <div className="flex flex-col gap-1 py-1.5 border-b border-slate-850/45 text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân loại Ví</span>
                    <span className="text-base text-slate-350">
                      {entry.walletType === 'exchange' ? 'Sàn giao dịch tập trung (Binance...)' :
                       entry.walletType === 'dex_app' ? 'Ví Web3 / Ví cá nhân (MetaMask...)' :
                       'Ví cứng / Ví lạnh (Ledger...)'}
                    </span>
                  </div>
                )}
                {entry.username && <RenderField label="Tài khoản / Email đăng nhập" value={entry.username} />}
                {entry.password && <RenderField label="Mật khẩu / PIN bảo mật" value={entry.password} secretKey="walletPass" />}
                {entry.address && <RenderField label="Địa chỉ ví (Address)" value={entry.address} fontMono />}
                {entry.seedPhrase && <RenderField label="Cụm từ khôi phục (12 - 24 từ)" value={entry.seedPhrase} secretKey="walletSeed" fontMono />}
                {entry.privateKey && <RenderField label="Khóa riêng tư (Private Key)" value={entry.privateKey} secretKey="walletPriv" fontMono />}
                {entry.apiKey && <RenderField label="API Key" value={entry.apiKey} secretKey="walletApiKey" fontMono />}
                {entry.apiSecret && <RenderField label="API Secret / Secret Key" value={entry.apiSecret} secretKey="walletApiSec" fontMono />}
              </>
            )}

            {entry.category === 'ewallet' && (
              <>
                <RenderField label="Ví điện tử" value={entry.ewalletName} />
                <RenderField label="Số điện thoại / Tài khoản" value={entry.phoneNumber} fontMono />
                {entry.accountHolder && <RenderField label="Chủ tài khoản" value={entry.accountHolder} />}
                {entry.pin && <RenderField label="Mã PIN bảo mật" value={entry.pin} secretKey="ewalletPin" fontMono />}
                {entry.password && <RenderField label="Mật khẩu đăng nhập" value={entry.password} secretKey="ewalletPass" />}
                {entry.linkedBank && <RenderField label="Ngân hàng liên kết" value={entry.linkedBank} />}
              </>
            )}

            {entry.category === 'phoneapp' && (
              <>
                <RenderField label="Ứng dụng di động" value={entry.appName} />
                {entry.username && <RenderField label="Tên đăng nhập / Số ĐT" value={entry.username} />}
                {entry.nationalId && <RenderField label="Số định danh / CCCD" value={entry.nationalId} fontMono />}
                {entry.passcode && <RenderField label="Mã Passcode bảo mật" value={entry.passcode} secretKey="phonepasscode" fontMono />}
                {entry.password && <RenderField label="Mật khẩu chính" value={entry.password} secretKey="phonepass" />}
                {(entry as any).email && <RenderField label="Email liên kết" value={(entry as any).email} secretKey="phoneemail" />}
              </>
            )}

            {entry.category === 'sheet' && (
              <div className="py-1 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>Bảng tính lưu trữ</span>
                  {entry.isIntegrated ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-sans tracking-wide">
                      <span>✓ Trực tuyến</span>
                      {entry.spreadsheetUrl && (
                        <a
                          href={entry.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="p-0.5 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Mở Google Sheets trực tuyến"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 font-sans tracking-wide">Nội bộ</span>
                  )}
                </div>

                {entry.isIntegrated && entry.lastSyncTime && (
                  <div className="text-xs text-slate-400 font-medium bg-emerald-950/10 border border-emerald-900/10 p-1.5 rounded-lg flex items-center justify-between">
                    <span>Google Sheet Synced</span>
                    <span className="font-mono text-slate-500 text-[11px]">Cập nhật: {new Date(entry.lastSyncTime).toLocaleTimeString('vi-VN')}</span>
                  </div>
                )}

                {onOpenWorkspace && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWorkspace(entry as GoogleSheetEntry);
                    }}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/20 text-slate-300 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Mở bảng tính màn hình lớn ↗</span>
                  </button>
                )}

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40 scrollbar-thin max-h-48 overflow-y-auto">
                  <table className="w-full border-collapse text-xs text-slate-300">
                    <thead>
                      <tr className="bg-emerald-550/10 border-b border-slate-800 text-left">
                        {entry.headers && entry.headers.map((hdr, hIdx) => (
                          <th key={hIdx} className="p-1.5 px-2 font-bold text-emerald-450 border-r border-slate-800/85 last:border-0 truncate max-w-[100px]" title={hdr}>
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.rows && entry.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-900/30">
                          {row.map((cell, cIdx) => {
                            const cellId = `cell-${entry.id}-${rIdx}-${cIdx}`;
                            return (
                              <td key={cIdx} className="p-1 px-2 border-r border-slate-800/45 last:border-0 relative font-sans break-all group/cell">
                                <span className="line-clamp-2 pr-4">{cell || '-'}</span>
                                {cell && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(cell, cellId);
                                    }}
                                    className="absolute right-1 top-1.5 opacity-0 group-hover/cell:opacity-100 transition-opacity p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded cursor-pointer shrink-0"
                                    title="Sao chép ô này"
                                  >
                                    {copiedField === cellId ? (
                                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-2.5 w-2.5" />
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {entry.category === 'note' && (
              <div className="py-1 text-left animate-fade-in">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nội dung ghi chú</span>
                <div 
                  onClick={(e) => {
                    if (!showSecrets[`${entry.id}-noteContent`]) {
                      e.stopPropagation();
                      toggleValue(`${entry.id}-noteContent`);
                    }
                  }}
                  className={`relative bg-slate-950/60 border border-slate-800/60 rounded-xl p-3.5 max-h-36 overflow-y-auto text-base text-slate-300 font-sans whitespace-pre-wrap leading-relaxed select-text scrollbar-thin transition-all duration-200 ${
                    !showSecrets[`${entry.id}-noteContent`] ? 'cursor-pointer hover:border-emerald-500/20 active:bg-slate-950/85' : ''
                  }`}
                >
                  {showSecrets[`${entry.id}-noteContent`] ? (
                    entry.content
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-500 select-none space-y-1 bg-slate-950/10 rounded-lg">
                      <Lock className="h-4.5 w-4.5 text-slate-600 animate-pulse" />
                      <span className="font-mono text-sm tracking-widest text-slate-550">••••••••••••</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 px-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValue(`${entry.id}-noteContent`);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-305 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title={showSecrets[`${entry.id}-noteContent`] ? 'Ẩn ghi chú' : 'Hiện ghi chú'}
                  >
                    {showSecrets[`${entry.id}-noteContent`] ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span className="font-sans">Ẩn nội dung</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span className="font-sans">Hiện nội dung</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(entry.content, `note-${entry.id}`);
                    }}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {copiedField === `note-${entry.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans font-semibold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="font-sans">Sao chép ghi chú</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {entry.category === 'gdrive' && (
              <>
                <RenderField label="Tên tệp tin" value={(entry as any).fileName} />
                <RenderField label="Dung lượng tệp" value={(entry as any).fileSize} />
                <RenderField label="Loại phương tiện" value={(entry as any).mediaType === 'video' ? 'Video (MP4, MKV, ...)' : (entry as any).mediaType === 'image' ? 'Hình ảnh' : (entry as any).mediaType === 'archive' ? 'Tệp nén ZIP/RAR' : (entry as any).mediaType === 'audio' ? 'Âm thanh' : (entry as any).mediaType === 'document' ? 'Tài liệu' : 'Đặc biệt / Khác'} />
                
                {(entry as any).driveLink && (
                  <div className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Đường link Google Drive</span>
                    <div className="flex items-center justify-between gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-805 bg-slate-950 border-slate-800 font-sans">
                      <span className="text-[12px] text-indigo-400 font-mono line-clamp-1 truncate max-w-[220px] select-all mr-2">
                        {(entry as any).driveLink}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy((entry as any).driveLink, `${entry.id}-driveLink`);
                          }}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Sao chép đường liên kết"
                        >
                          {copiedField === `${entry.id}-driveLink` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 animate-scale" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={(entry as any).driveLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all flex items-center justify-center shrink-0 font-bold text-xs gap-1"
                          title="Tải trực tiếp hoặc Xem trực tuyến"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline font-sans text-[11px] uppercase">Mở</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'bill' && (
              <>
                <RenderField 
                  label={currentLang === 'vi' ? 'Chu kỳ thanh toán' : 'Billing Cycle'} 
                  value={(entry as any).billCycle === 'yearly' ? (currentLang === 'vi' ? 'Hàng năm' : 'Yearly') : (currentLang === 'vi' ? 'Hàng tháng' : 'Monthly')} 
                />
                
                {(entry as any).billType === 'finance' && (
                  <>
                    <RenderField label={currentLang === 'vi' ? 'Sản phẩm tài chính' : 'Financial Product'} value={(entry as any).productName} />
                    <RenderField label={currentLang === 'vi' ? 'Số hợp đồng' : 'Contract/Policy Number'} value={(entry as any).contractNumber} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Chủ sở hữu' : 'Contract Owner'} value={(entry as any).name} />
                    <RenderField label={currentLang === 'vi' ? 'Hạn thanh toán' : 'Due Date'} value={(entry as any).dueDate} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Số tiền' : 'Amount'} value={(entry as any).amount} fontMono />
                  </>
                )}

                {(entry as any).billType === 'utility' && (
                  <>
                    <RenderField 
                      label={currentLang === 'vi' ? 'Loại dịch vụ' : 'Service Type'} 
                      value={
                        (entry as any).utilityType === 'electricity' ? (currentLang === 'vi' ? '⚡ Điện lực (EVN)' : 'Electricity') :
                        (entry as any).utilityType === 'water' ? (currentLang === 'vi' ? '💧 Nước sạch' : 'Water Service') :
                        (entry as any).utilityType === 'wifi' ? (currentLang === 'vi' ? '📶 Mạng Wifi / Internet' : 'Wifi / Internet') :
                        (entry as any).utilityType === 'rent_house' ? (currentLang === 'vi' ? '🏠 Thuê nhà / Thuê căn hộ' : 'House Rent') :
                        (entry as any).utilityType === 'rent_car' ? (currentLang === 'vi' ? '🚗 Thuê xe / Thuê xe tự lái' : 'Car Rental') :
                        (entry as any).utilityType === 'parking' ? (currentLang === 'vi' ? '🅿️ Gửi xe / Vé xe tháng' : 'Parking Fee') :
                        (currentLang === 'vi' ? 'Khác' : 'Other')
                      } 
                    />
                    <RenderField label={currentLang === 'vi' ? 'Mã khách hàng' : 'Customer Code/ID'} value={(entry as any).customerId} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Tên khách hàng' : 'Subscriber Name'} value={(entry as any).name} />
                    <RenderField label={currentLang === 'vi' ? 'Kỳ đóng / Kỳ thanh toán' : 'Billing Period'} value={(entry as any).billingPeriod} />
                    <RenderField label={currentLang === 'vi' ? 'Số tiền' : 'Amount'} value={(entry as any).amount} fontMono />
                  </>
                )}

                {(entry as any).billType === 'app' && (
                  <>
                    <RenderField label={currentLang === 'vi' ? 'Tên dịch vụ/App' : 'Application / Service'} value={(entry as any).billAppName} />
                    <RenderField label={currentLang === 'vi' ? 'Liên kết thông tin' : 'Linked Account Details'} value={(entry as any).appContact} />
                    <RenderField 
                      label={currentLang === 'vi' ? 'Thanh toán qua' : 'Payment Method'} 
                      value={(entry as any).appPaymentMethod === 'ewallet' ? (currentLang === 'vi' ? 'Ví điện tử' : 'E-Wallet') : ((entry as any).appPaymentMethod === 'bank_card' ? (currentLang === 'vi' ? 'Thẻ Ngân Hàng' : 'Bank Credit Card') : (currentLang === 'vi' ? 'Chợ Ứng Dụng' : 'App Store Billing'))} 
                    />
                    <RenderField label={currentLang === 'vi' ? 'Ngày gia hạn bảo mật' : 'Renewal Due Date'} value={(entry as any).dueDate} fontMono />
                    <RenderField label={currentLang === 'vi' ? 'Phí dịch vụ' : 'Subscription Cost'} value={(entry as any).amount} fontMono />
                  </>
                )}

                <BillPaymentHistorySection entry={entry as BillEntry} onUpdateEntry={onUpdateEntry} currentLang={currentLang} />
              </>
            )}
          </div>
        )}

        {/* 2FA Authenticator (Dynamic countdown) */}
        {isExpanded && entry.totpSecret && (
          <div onClick={(e) => e.stopPropagation()}>
            <TotpDisplay secret={entry.totpSecret} />
          </div>
        )}
      </div>

      {/* Reminder block */}
      {isExpanded && entry.reminder && entry.reminder.enabled && (
        <div className="mt-3.5 p-3.5 bg-indigo-950/25 border border-indigo-500/20 rounded-xl flex items-start gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="p-2 bg-indigo-500/15 rounded-lg text-indigo-400 shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="text-left text-xs">
            <div className="font-bold text-indigo-300 tracking-wide">LỊCH NHẮC NHỞ</div>
            <div className="mt-1 text-slate-200 font-sans text-sm font-medium select-text">{entry.reminder.message || 'Không có mô tả chi tiết'}</div>
            <div className="mt-1.5 font-mono text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500/70" />
              <span>Thời gian: {entry.reminder.date.split('-').reverse().join('/')}{entry.reminder.time ? ` lúc ${entry.reminder.time}` : ''} ({entry.reminder.type === 'yearly' ? 'Lặp lại hàng năm 🎂' : entry.reminder.type === 'monthly' ? 'Lặp lại hàng tháng 📅' : 'Nhắc nhở 1 lần 📌'})</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Notes or dates if prompt */}
      {isExpanded && entry.notes && entry.category !== 'note' && (
        <div id="notes-footer" className="mt-3 pt-2 border-t border-slate-850 text-sm text-slate-350 leading-relaxed italic select-text text-left whitespace-pre-wrap" onClick={(e) => e.stopPropagation()}>
          <span className="font-semibold text-slate-500 not-italic">Lưu ý: </span>
          {entry.notes}
        </div>
      )}

      {/* Local Card Info Banner */}
      {launchInfoMessage && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0b0c2a]/95 border border-indigo-500/30 text-[12px] font-medium text-indigo-300 p-2.5 rounded-xl z-50 flex items-start gap-2 shadow-2xl animate-fade-in select-none" onClick={(e) => e.stopPropagation()}>
          <div className="p-1 bg-indigo-500/10 rounded text-indigo-400 shrink-0">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="text-left flex-1 font-sans leading-relaxed">
            {launchInfoMessage}
          </div>
        </div>
      )}
    </div>
  );
}
