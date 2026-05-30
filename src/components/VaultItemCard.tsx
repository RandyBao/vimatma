import { useState } from 'react';
import { 
  Star, CreditCard, Globe, Smartphone, FileText, 
  Lock, Eye, EyeOff, Copy, Check, Edit2, Trash2, ExternalLink, Wallet,
  Fingerprint, Table, Maximize2, ChevronDown, ChevronUp, Bell, Calendar
} from 'lucide-react';
import { VaultEntry, GoogleSheetEntry, CustomCategory } from '../types';

interface VaultItemCardProps {
  entry: VaultEntry;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenWorkspace?: (entry: GoogleSheetEntry) => void;
  categories?: CustomCategory[];
  layoutMode?: 'grid' | 'table';
  hideCompactSummaries?: boolean;
}

export default function VaultItemCard({ 
  entry, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  onOpenWorkspace,
  categories,
  layoutMode = 'grid',
  hideCompactSummaries = false
}: VaultItemCardProps) {
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getPrimaryValue = () => {
    if (entry.category === 'bank') return entry.accountNumber;
    if (entry.category === 'social') return entry.password || entry.username;
    if (entry.category === 'web') return entry.password || entry.username;
    if (entry.category === 'wallet') return entry.privateKey || entry.seedPhrase || entry.address;
    if (entry.category === 'ewallet') return entry.pin || entry.phoneNumber;
    if (entry.category === 'phoneapp') return entry.passcode || entry.password || entry.username;
    if (entry.category === 'note') return entry.content;
    return undefined;
  };

  const getCompactSummary = () => {
    if (entry.category === 'bank') {
      return `${entry.bankName || 'Ngân hàng'} • ${entry.accountNumber || ''}`;
    }
    if (entry.category === 'social') {
      return `${entry.platformName || 'Mạng xã hội'} • ${entry.username || ''}`;
    }
    if (entry.category === 'web') {
      return `${entry.username || ''}`;
    }
    if (entry.category === 'wallet') {
      return `${entry.walletName || 'Ví Crypto'} ${entry.address ? '• ' + entry.address.slice(0, 10) + '...' : ''}`;
    }
    if (entry.category === 'ewallet') {
      return `${entry.ewalletName || 'Ví điện tử'} • ${entry.phoneNumber || ''}`;
    }
    if (entry.category === 'phoneapp') {
      return `${entry.appName || 'Ứng dụng'} • ${entry.username || ''}`;
    }
    if (entry.category === 'sheet') {
      return `Bảng tính (${entry.headers?.length || 0} cột, ${entry.rows?.length || 0} hàng)`;
    }
    if (entry.category === 'note') {
      return '••••••••••••';
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
    return 'G';
  };

  // Determine icon & theme color based on category
  const getCategoryStyles = () => {
    const matchedCat = categories?.find(c => c.id === entry.category);
    const catType = matchedCat ? matchedCat.iconType : entry.category;
    const label = matchedCat ? matchedCat.label : null;

    switch (catType) {
      case 'bank':
        return {
          icon: <CreditCard className="h-5 w-5 text-blue-400" />,
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          badgeText: label || 'Ngân hàng',
          badgeColor: 'bg-blue-500/20 text-blue-300',
        };
      case 'social':
        return {
          icon: <Smartphone className="h-5 w-5 text-teal-400" />,
          bgColor: 'bg-teal-500/10 border-teal-500/20',
          badgeText: label || 'Mạng xã hội',
          badgeColor: 'bg-teal-500/20 text-teal-300',
        };
      case 'web':
        return {
          icon: <Globe className="h-5 w-5 text-purple-400" />,
          bgColor: 'bg-purple-500/10 border-purple-500/20',
          badgeText: label || 'Tài khoản Web',
          badgeColor: 'bg-purple-500/20 text-purple-300',
        };
      case 'note':
        return {
          icon: <FileText className="h-5 w-5 text-amber-400" />,
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          badgeText: label || 'Ghi chú',
          badgeColor: 'bg-amber-500/20 text-amber-300',
        };
      case 'wallet':
        return {
          icon: <Wallet className="h-5 w-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          badgeText: label || 'Ví Crypto',
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'ewallet':
        return {
          icon: <Smartphone className="h-5 w-5 text-pink-400" />,
          bgColor: 'bg-pink-500/10 border-pink-500/20',
          badgeText: label || 'Ví điện tử',
          badgeColor: 'bg-pink-500/20 text-pink-300',
        };
      case 'phoneapp':
        return {
          icon: <Fingerprint className="h-5 w-5 text-indigo-400" />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/20',
          badgeText: label || 'App Mobile',
          badgeColor: 'bg-indigo-500/20 text-indigo-300',
        };
      case 'sheet':
        return {
          icon: <Table className="h-5 w-5 text-emerald-400" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          badgeText: label || 'Bảng tính',
          badgeColor: 'bg-emerald-500/25 text-emerald-300',
        };
      default:
        return {
          icon: <FileText className="h-5 w-5 text-slate-400" />,
          bgColor: 'bg-slate-500/10 border-slate-500/20',
          badgeText: label || 'Khác',
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
    const displayValue = isShowing ? value : '••••••••••••';
    const uniqueKey = `${entry.id}-${secretKey || label}`;

    return (
      <div className="flex flex-col gap-1 py-1.5 border-b border-slate-800/40 last:border-0 text-left">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center justify-between gap-2.5">
          <span className={`text-base text-slate-200 select-all ${fontMono ? 'font-mono tracking-wider text-emerald-400' : ''}`}>
            {displayValue}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {isSecret && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleValue(secretKey);
                }}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={isShowing ? 'Ẩn' : 'Hiện'}
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
              title="Sao chép"
            >
              {copiedField === uniqueKey ? (
                <Check className="h-3.5 w-3.5 text-emerald-400 animate-scale" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (layoutMode === 'table') {
    return (
      <div 
        id={`vault-row-${entry.id}`} 
        onClick={() => setIsExpanded(!isExpanded)}
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
                  <span className="hidden md:inline text-[11px] font-semibold text-indigo-400 font-sans tracking-wide bg-indigo-500/10 px-1.5 py-0.2 rounded">
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
                title="Sao chép nhanh thông tin"
              >
                {copiedField === `row-primary-${entry.id}` ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400 animate-scale" />
                    <span className="text-emerald-400 font-sans font-semibold">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="font-sans font-semibold">Copy nhanh</span>
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
                  title={entry.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
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
                title="Sửa"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Bạn có chắc muốn xóa "${entry.title}"?`)) {
                    onDelete(entry.id);
                  }
                }}
                className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg text-slate-400 hover:text-rose-450 transition-colors cursor-pointer"
                title="Xóa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

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
          <div className="space-y-1 mt-3 pt-3 border-t border-slate-850/60 animate-fade-in select-text">
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
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Liên kết URL</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm text-slate-300 line-clamp-1">{entry.url}</span>
                      <a 
                        href={formatUrl(entry.url)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'web' && (
              <>
                <RenderField label="Tài khoản / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="webPass" />}
                {entry.websiteUrl && (
                  <div className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Website</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm text-slate-300 line-clamp-1">{entry.websiteUrl}</span>
                      <a 
                        href={formatUrl(entry.websiteUrl)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-450 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Phân loại Ví</span>
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
                    <span className="font-mono text-slate-500 text-[10px]">Cập nhật: {new Date(entry.lastSyncTime).toLocaleTimeString('vi-VN')}</span>
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
          </div>
        )}

        {/* Reminder block */}
        {isExpanded && entry.reminder && entry.reminder.enabled && (
          <div className="mt-3.5 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
            <div className="p-1.5 bg-indigo-500/15 rounded-lg text-indigo-400 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-indigo-300">Nhắc nhở lịch hẹn:</div>
              <div className="mt-0.5 text-slate-200 font-medium select-text">{entry.reminder.message || 'Thông báo tự động'}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-slate-500" />
                Ngày: {entry.reminder.date.split('-').reverse().join('-')} • {entry.reminder.type === 'yearly' ? 'Lặp lại hàng năm 🎂' : 'Lời nhắc 1 lần 📌'}
              </div>
            </div>
          </div>
        )}

        {/* Notes block */}
        {isExpanded && entry.notes && entry.category !== 'note' && (
          <div className="mt-2.5 pt-2 border-t border-slate-850 text-slate-400 text-sm text-left italic select-text">
            <span className="font-semibold text-slate-500 not-italic">Lưu ý: </span> {entry.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id={`vault-card-${entry.id}`} 
      onClick={() => setIsExpanded(!isExpanded)}
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
                    <span className="text-[10px] font-bold font-mono bg-indigo-500/10 px-1 rounded">
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
                    title={entry.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
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

          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry);
              }}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Sửa"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Bạn có chắc muốn xóa "${entry.title}"?`)) {
                  onDelete(entry.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
          <div className="space-y-1 mt-4 pt-3 border-t border-slate-850 animate-fade-in select-text">
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
                      <a 
                        href={formatUrl(entry.url)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}

            {entry.category === 'web' && (
              <>
                <RenderField label="Tài khoản / Email" value={entry.username} />
                {entry.password && <RenderField label="Mật khẩu" value={entry.password} secretKey="webPass" />}
                {entry.websiteUrl && (
                  <div id="website-link-container" className="flex flex-col gap-1 py-1.5 text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Website</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-base text-slate-300 line-clamp-1">{entry.websiteUrl}</span>
                      <a 
                        href={formatUrl(entry.websiteUrl)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
                    <span className="font-mono text-slate-500 text-[10px]">Cập nhật: {new Date(entry.lastSyncTime).toLocaleTimeString('vi-VN')}</span>
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
          </div>
        )}
      </div>

      {/* Reminder block */}
      {isExpanded && entry.reminder && entry.reminder.enabled && (
        <div className="mt-3.5 p-3.5 bg-indigo-950/25 border border-indigo-500/20 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-indigo-500/15 rounded-lg text-indigo-400 shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="text-left text-xs">
            <div className="font-bold text-indigo-300 tracking-wide">LỊCH NHẮC NHỞ</div>
            <div className="mt-1 text-slate-200 font-sans text-sm font-medium select-text">{entry.reminder.message || 'Không có mô tả chi tiết'}</div>
            <div className="mt-1.5 font-mono text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500/70" />
              <span>Thời gian: {entry.reminder.date.split('-').reverse().join('/')} ({entry.reminder.type === 'yearly' ? 'Lặp lại hàng năm 🎂' : 'Nhắc nhở 1 lần 📌'})</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Notes or dates if prompt */}
      {isExpanded && entry.notes && entry.category !== 'note' && (
        <div id="notes-footer" className="mt-3 pt-2 border-t border-slate-850 text-sm text-slate-350 leading-relaxed italic line-clamp-3 select-text text-left">
          <span className="font-semibold text-slate-500 not-italic">Lưu ý: </span>
          {entry.notes}
        </div>
      )}
    </div>
  );
}
