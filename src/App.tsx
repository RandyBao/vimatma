import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, Lock, Unlock, Search, PlusCircle, LogOut, Download, Upload, 
  Settings, KeyRound, Star, CreditCard, Smartphone, Globe, Code,
  FileText, ArrowUpDown, ChevronRight, RefreshCw, Layers, Wallet,
  Fingerprint, Table, ArrowUp, ArrowDown, Eye, EyeOff, ChevronUp, ChevronDown,
  Trash2, Edit2, LayoutGrid, List, Bell, Calendar, Clock, ShieldAlert, Sparkles, Gift,
  Menu, X, Database, Gem, Vault
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LockScreen from './components/LockScreen';
import VaultItemCard from './components/VaultItemCard';
import VaultFormModal from './components/VaultFormModal';
import SpreadsheetWorkspaceModal from './components/SpreadsheetWorkspaceModal';
import PasswordGenerator from './components/PasswordGenerator';
import SecurityAudit from './components/SecurityAudit';
import UpgradeModal from './components/UpgradeModal';
import ProUtilities from './components/ProUtilities';
import { VaultEntry, VaultCategory, CustomCategory, GoogleSheetEntry } from './types';
import { encryptText } from './utils/crypto';
import { LangType, translations } from './utils/lang';

// Tính toán ngày nhắc nhở còn lại (hỗ trợ nhắc nhở một lần hoặc lặp lại hàng năm như sinh nhật)
function getReminderDaysLeft(reminderDateStr: string, reminderType: 'once' | 'yearly'): { daysLeft: number; isToday: boolean; formattedDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = reminderDateStr.split('-'); // YYYY-MM-DD
  if (parts.length !== 3) {
    return { daysLeft: -999, isToday: false, formattedDate: reminderDateStr };
  }

  const rYear = parseInt(parts[0], 10);
  const rMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const rDay = parseInt(parts[2], 10);

  const formattedDate = `${rDay.toString().padStart(2, '0')}/${(rMonth + 1).toString().padStart(2, '0')}/${rYear}`;

  let targetDate = new Date(rYear, rMonth, rDay, 0, 0, 0, 0);

  if (reminderType === 'yearly') {
    const currentYear = today.getFullYear();
    targetDate = new Date(currentYear, rMonth, rDay, 0, 0, 0, 0);
    
    // Nếu ngày kỉ niệm trong năm nay đã qua nhiều hơn 3 ngày, chuyển sang nhắc nhở của năm sau
    const diffMs = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 3) {
      targetDate.setFullYear(currentYear + 1);
    }
  }

  const diffMs = targetDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isToday = daysLeft === 0;

  return { daysLeft, isToday, formattedDate };
}

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [dbSalt, setDbSalt] = useState('');

  const [lang, setLang] = useState<LangType>(() => {
    return (localStorage.getItem('secure_vault_lang') as LangType) || 'vi';
  });

  const handleLangChange = (newLang: LangType) => {
    setLang(newLang);
    localStorage.setItem('secure_vault_lang', newLang);
  };

  const t = translations[lang];
  
  // Decrypted entries loaded in memory
  const [entries, setEntries] = useState<VaultEntry[]>([]);

  // Dynamic customized categories with lock feature
  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem('secure_vault_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback to default
      }
    }
    return [
      { id: 'bank', label: 'Tài khoản Ngân hàng', iconType: 'bank' },
      { id: 'social', label: 'Mạng xã hội', iconType: 'social' },
      { id: 'web', label: 'Tài khoản Web / App', iconType: 'web' },
      { id: 'wallet', label: 'Ví Crypto (Binance...)', iconType: 'wallet' },
      { id: 'ewallet', label: 'Ví điện tử Momo/Zalo', iconType: 'ewallet' },
      { id: 'phoneapp', label: 'Ứng dụng di động', iconType: 'phoneapp' },
      { id: 'sheet', label: 'Google Trang tính', iconType: 'sheet' },
      { id: 'note', label: 'Ghi chú / Mật hiệu', iconType: 'note' },
    ];
  });

  const [isCategoriesLocked, setIsCategoriesLocked] = useState(true);

  // Dynamic Category addition inline form states
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIconType, setNewCatIconType] = useState<'bank' | 'social' | 'web' | 'wallet' | 'ewallet' | 'phoneapp' | 'sheet' | 'note'>('bank');

  const saveCategoriesList = (updated: CustomCategory[]) => {
    setCategories(updated);
    localStorage.setItem('secure_vault_categories', JSON.stringify(updated));
  };

  // Check if deployed on GitHub Pages or Vercel
  const isDeployedOnGithubOrVercel = typeof window !== 'undefined' && (
    window.location.hostname.includes('github') || 
    window.location.hostname.includes('vercel')
  );

  // Visual branding title state with suggestions
  const [vaultTitle, setVaultTitle] = useState(() => {
    return localStorage.getItem('secure_vault_app_title') || '';
  });
  const currentVaultTitle = isDeployedOnGithubOrVercel ? t.app_title : (vaultTitle || t.app_title);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [customAppTitle, setCustomAppTitle] = useState('');

  // Filtering and Controls state
  const [showSecretDrawer, setShowSecretDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'fav' | VaultCategory>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('secure_vault_view_mode') as 'grid' | 'table') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('secure_vault_view_mode', mode);
  };

  // Additional display options for sidebar / categories
  const [showNavbarMenu, setShowNavbarMenu] = useState(false);

  const [showSidebarOptions, setShowSidebarOptions] = useState(false);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);
  const [hideCounts, setHideCounts] = useState(false);
  const [categorySortMode, setCategorySortMode] = useState<'default' | 'alpha' | 'count'>('default');
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [categoryLayoutMode, setCategoryLayoutMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('secure_vault_category_layout_mode') as 'list' | 'grid') || 'list';
  });

  const handleSetCategoryLayoutMode = (mode: 'list' | 'grid') => {
    setCategoryLayoutMode(mode);
    localStorage.setItem('secure_vault_category_layout_mode', mode);
  };

  const [hideCompactSummaries, setHideCompactSummaries] = useState<boolean>(() => {
    const saved = localStorage.getItem('secure_vault_hide_compact_summaries');
    return saved === null ? true : saved === 'true';
  });

  const handleSetHideCompactSummaries = (value: boolean) => {
    setHideCompactSummaries(value);
    localStorage.setItem('secure_vault_hide_compact_summaries', value ? 'true' : 'false');
  };

  // Modal & Drawer management
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  
  // Spreadsheet Large View Workspace States
  const [activeWorkspaceSheet, setActiveWorkspaceSheet] = useState<GoogleSheetEntry | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  
  const [showGenTools, setShowGenTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProUtilities, setShowProUtilities] = useState(false);
  const [isAllAccountsExpanded, setIsAllAccountsExpanded] = useState(true);
  const [isTravelModeActive, setIsTravelModeActive] = useState(() => localStorage.getItem('secure_vault_travel_mode') === 'true');
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const [isPro, setIsPro] = useState(() => {
    const isPermanent = localStorage.getItem('secure_vault_pro_active') === 'true';
    if (isPermanent) return true;
    const trialExpiry = localStorage.getItem('secure_vault_pro_trial_expires');
    if (trialExpiry && Date.now() < Number(trialExpiry)) {
      return true;
    }
    return false;
  });
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<string>(() => {
    return localStorage.getItem('secure_vault_theme') || 'slate';
  });

  // --- AUTO LOCK MECHANISM ---
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('secure_vault_auto_lock_time');
    return saved !== null ? Number(saved) : 3; // Mặc định 3 Phút
  });

  // Enforced limitation variables for Free vs Pro
  const effectiveViewMode = isPro ? viewMode : 'grid';
  const effectiveCategoryLayoutMode = isPro ? categoryLayoutMode : 'grid';
  const effectiveSortBy = isPro ? sortBy : 'recent';
  const effectiveCategorySortMode = isPro ? categorySortMode : 'default';
  const effectiveAppTheme = isPro ? appTheme : 'slate';
  const effectiveAutoLockMinutes = isPro ? autoLockMinutes : 1;

  // Status popups
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleProPreviewMode = () => {
    const nextProState = !isPro;
    setIsPro(nextProState);
    if (nextProState) {
      localStorage.setItem('secure_vault_pro_active', 'true');
      triggerToast(lang === 'vi' ? 'Đã bật chế độ xem trước PRO Elite!' : 'PRO Elite preview mode enabled!', 'success');
    } else {
      localStorage.removeItem('secure_vault_pro_active');
      localStorage.removeItem('secure_vault_pro_trial_expires');
      triggerToast(lang === 'vi' ? 'Đã chuyển về bản FREE cơ bản!' : 'Switched back to standard FREE mode!', 'info');
    }
  };

  const [isEditingAutoLock, setIsEditingAutoLock] = useState<boolean>(false);
  const [tempAutoLockVal, setTempAutoLockVal] = useState<string>('3');

  const [isCountdownHidden, setIsCountdownHidden] = useState<boolean>(() => {
    return localStorage.getItem('secure_vault_hide_countdown') === 'true';
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(effectiveAutoLockMinutes * 60);

  // Cập nhật lại số giây đếm ngược khi thời gian cấu hình thay đổi
  useEffect(() => {
    setTimeLeftSeconds(effectiveAutoLockMinutes * 60);
  }, [effectiveAutoLockMinutes]);

  // Bộ đếm lùi và tự động bắt sự kiện tương tác để hoãn khóa kho
  useEffect(() => {
    if (!isUnlocked || effectiveAutoLockMinutes <= 0) {
      return;
    }

    // Thiết lập số giây ban đầu
    setTimeLeftSeconds(effectiveAutoLockMinutes * 60);

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Gọi hàm khóa kho an toàn trực tiếp
          setMasterPassword('');
          setDbSalt('');
          setEntries([]);
          setIsUnlocked(false);
          setShowSettings(false);
          setShowGenTools(false);
          setShowSystemConfig(false);
          setToast({ text: t.head_toastAutoLock, type: 'info' });
          setTimeout(() => setToast(null), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const resetTimer = () => {
      setTimeLeftSeconds(effectiveAutoLockMinutes * 60);
    };

    // Lắng nghe các tương tác của người dùng để hoãn khóa kho
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isUnlocked, effectiveAutoLockMinutes, t]);

  const handleAutoLockMinutesChange = (val: number) => {
    setAutoLockMinutes(val);
    localStorage.setItem('secure_vault_auto_lock_time', String(val));
    triggerToast(`${t.head_toastChangeTime} ${val > 0 ? val + ' ' + (lang === 'vi' ? 'phút' : 'min') : (lang === 'vi' ? 'không tự khóa' : 'never')}`, 'info');
  };

  const handleSaveAutoLock = () => {
    setIsEditingAutoLock(false);
    const val = parseInt(tempAutoLockVal, 10);
    if (!isNaN(val) && val >= 0) {
      handleAutoLockMinutesChange(Math.min(1440, val));
    }
  };

  const toggleCountdownVisibility = () => {
    const nextVal = !isCountdownHidden;
    setIsCountdownHidden(nextVal);
    localStorage.setItem('secure_vault_hide_countdown', String(nextVal));
  };

  const formatCountdown = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return '00:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Called when successfully unlocked
  const handleUnlock = (password: string, decryptedEntries: VaultEntry[]) => {
    setMasterPassword(password);
    setEntries(decryptedEntries);
    
    // Read current salt
    const savedDbStr = localStorage.getItem('secure_vault_db');
    if (savedDbStr) {
      const db = JSON.parse(savedDbStr);
      setDbSalt(db.salt);
    }
    
    setIsUnlocked(true);
    triggerToast(t.head_toastUnlocked, 'success');
  };

  // Lock vault / Log out safely
  const handleLock = (reason?: string) => {
    setMasterPassword('');
    setDbSalt('');
    setEntries([]);
    setIsUnlocked(false);
    setShowSettings(false);
    setShowGenTools(false);
    setShowSystemConfig(false);
    triggerToast(reason || t.head_toastLocked, 'info');
  };

  // Encrypt and write to localStorage
  const saveEntries = async (updatedEntries: VaultEntry[]) => {
    setEntries(updatedEntries);
    if (!masterPassword || !dbSalt) return;

    try {
      const encryptedData = await encryptText(JSON.stringify(updatedEntries), masterPassword, dbSalt);
      const savedDbStr = localStorage.getItem('secure_vault_db');
      if (savedDbStr) {
        const db = JSON.parse(savedDbStr);
        const updatedDb = {
          ...db,
          encryptedEntries: encryptedData,
          lastUpdated: Date.now()
        };
        localStorage.setItem('secure_vault_db', JSON.stringify(updatedDb));
      }
    } catch (err) {
      console.error('Persistence error:', err);
      triggerToast('Đã xảy ra lỗi khi mã hóa thông tin.', 'error');
    }
  };

  // Save changes from add/edit form
  const handleSaveEntry = (savedEntry: VaultEntry) => {
    let updated: VaultEntry[];
    const exists = entries.some(e => e.id === savedEntry.id);

    // Limit check for Free 2FA TOTP
    const hasTotp = !!savedEntry.totpSecret;
    if (hasTotp && !isPro) {
      const isNewlyAddingTotp = !exists || !entries.find(e => e.id === savedEntry.id)?.totpSecret;
      if (isNewlyAddingTotp) {
        const currentTotpCount = entries.filter(e => !!e.totpSecret).length;
        if (currentTotpCount >= 5) {
          setIsUpgradeModalOpen(true);
          triggerToast(
            lang === 'vi'
              ? 'Đạt giới hạn 5 tài khoản kích hoạt 2FA của Bản Miễn Phí. Vui lòng nâng cấp lên PRO! 🛡️'
              : 'Reached 5 2FA-enabled accounts limit of Free version. Please upgrade to PRO! 🛡️',
            'error'
          );
          return;
        }
      }
    }
    
    if (exists) {
      updated = entries.map(e => e.id === savedEntry.id ? savedEntry : e);
      triggerToast(lang === 'vi' ? 'Cập nhật tài khoản thành công!' : 'Account updated successfully!');
    } else {
      // Limit check for Free version (30 credentials)
      if (!isPro && entries.length >= 30) {
        setIsUpgradeModalOpen(true);
        triggerToast(
          lang === 'vi' 
            ? 'Đạt giới hạn 30 tài khoản của Bản Miễn Phí. Vui lòng nâng cấp lên PRO!' 
            : 'Reached 30 items limit of Free version. Please upgrade to PRO to store unlimited credentials!',
          'error'
        );
        return;
      }
      updated = [savedEntry, ...entries];
      triggerToast(lang === 'vi' ? 'Đã lưu tài khoản bảo mật mới!' : 'New secure vault entry saved!');
    }
    
    saveEntries(updated);
    setIsAddEditOpen(false);
    setEditingEntry(null);
  };

  // Open spreadsheet workspace large view
  const handleOpenWorkspace = (sheetEntry: GoogleSheetEntry) => {
    setActiveWorkspaceSheet(sheetEntry);
    setIsWorkspaceOpen(true);
  };

  // Save changes completed in the workspace large view
  const handleSaveWorkspaceSheet = (updatedSheet: GoogleSheetEntry) => {
    const updated = entries.map(e => e.id === updatedSheet.id ? updatedSheet : e);
    saveEntries(updated);
    setActiveWorkspaceSheet(updatedSheet);
    triggerToast('Đã cập nhật dữ liệu bảng tính an toàn!', 'success');
  };

  // Delete credentials
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
    triggerToast('Đã xóa vĩnh viễn dữ liệu.', 'info');
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    const updated = entries.map(e => e.id === id ? { ...e, isFavorite: !e.isFavorite } : e);
    saveEntries(updated);
  };

  // Helper to resolve visual icons corresponding to template styles
  const getCategoryIcon = (iconType: string) => {
    switch (iconType) {
      case 'bank': return <CreditCard className="h-4 w-4 text-blue-450" />;
      case 'social': return <Smartphone className="h-4 w-4 text-teal-400" />;
      case 'web': return <Globe className="h-4 w-4 text-purple-400" />;
      case 'wallet': return <Wallet className="h-4 w-4 text-emerald-400" />;
      case 'ewallet': return <Smartphone className="h-4 w-4 text-pink-400" />;
      case 'phoneapp': return <Fingerprint className="h-4 w-4 text-indigo-400" />;
      case 'sheet': return <Table className="h-4 w-4 text-emerald-400" />;
      case 'note': return <FileText className="h-4 w-4 text-amber-400" />;
      default: return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryColorClasses = (iconType: string) => {
    switch (iconType) {
      case 'bank': return 'bg-blue-500/20 text-blue-300';
      case 'social': return 'bg-teal-500/20 text-teal-300';
      case 'web': return 'bg-purple-500/20 text-purple-300';
      case 'wallet': return 'bg-emerald-500/20 text-emerald-300';
      case 'ewallet': return 'bg-pink-500/20 text-pink-300';
      case 'phoneapp': return 'bg-indigo-500/20 text-indigo-300';
      case 'sheet': return 'bg-emerald-500/25 text-emerald-350';
      case 'note': return 'bg-amber-500/20 text-amber-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getCategorySmallIcon = (iconType: string) => {
    switch (iconType) {
      case 'bank': return <CreditCard className="h-3.5 w-3.5 shrink-0" />;
      case 'social': return <Smartphone className="h-3.5 w-3.5 shrink-0" />;
      case 'web': return <Globe className="h-3.5 w-3.5 shrink-0" />;
      case 'wallet': return <Wallet className="h-3.5 w-3.5 shrink-0" />;
      case 'ewallet': return <Smartphone className="h-3.5 w-3.5 shrink-0" />;
      case 'phoneapp': return <Fingerprint className="h-3.5 w-3.5 shrink-0" />;
      case 'sheet': return <Table className="h-3.5 w-3.5 shrink-0" />;
      case 'note': return <FileText className="h-3.5 w-3.5 shrink-0" />;
      default: return <FileText className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  const moveCategory = (idx: number, direction: 'up' | 'down') => {
    const list = [...categories];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    saveCategoriesList(list);
    triggerToast('Đã di chuyển loại lưu trữ!');
  };

  const deleteCategory = (id: string, label: string) => {
    const count = entries.filter(e => e.category === id).length;
    if (count > 0) {
      triggerToast(`Đang có ${count} tài khoản lưu trong loại "${label}". Không thể xóa!`, 'error');
      return;
    }
    const updated = categories.filter(c => c.id !== id);
    saveCategoriesList(updated);
    if (activeCategory === id) {
      setActiveCategory('all');
    }
    triggerToast(`Đã xóa loại lưu trữ "${label}".`, 'info');
  };

  const renameCategory = (id: string, currentLabel: string) => {
    const newName = prompt(`Nhập tên mới cho loại lưu trữ "${currentLabel}":`, currentLabel);
    if (newName && newName.trim() && newName.trim() !== currentLabel) {
      const updated = categories.map(c => c.id === id ? { ...c, label: newName.trim() } : c);
      saveCategoriesList(updated);
      triggerToast(`Đã thay đổi tên loại thành "${newName.trim()}"`);
    }
  };

  const addCustomCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;
    
    const duplicate = categories.find(c => c.label.toLowerCase() === newCatLabel.trim().toLowerCase());
    if (duplicate) {
      triggerToast('Tên loại lưu trữ này đã tồn tại!', 'error');
      return;
    }

    const newId = 'custom_' + Math.random().toString(36).substring(2, 9);
    const newCategoryItem: CustomCategory = {
      id: newId,
      label: newCatLabel.trim(),
      iconType: newCatIconType
    };

    saveCategoriesList([...categories, newCategoryItem]);
    setNewCatLabel('');
    setShowAddCatForm(false);
    triggerToast(`Đã thêm loại lưu trữ mới: "${newCategoryItem.label}"`);
  };

  // Export encrypted backup JSON
  const handleExportBackup = () => {
    try {
      const rawDb = localStorage.getItem('secure_vault_db');
      if (!rawDb) {
        triggerToast('Không có dữ liệu để xuất sao lưu.', 'error');
        return;
      }
      
      const blob = new Blob([rawDb], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KhoMatKhau_MaHoa_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast('Tải xuống tệp sao lưu thành công!', 'success');
    } catch (err) {
      triggerToast('Không thể tải tệp sao lưu.', 'error');
    }
  };

  // Import encrypted backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsed = JSON.parse(rawContent);

        if (parsed.salt && parsed.verification && parsed.encryptedEntries) {
          localStorage.setItem('secure_vault_db', JSON.stringify(parsed));
          triggerToast('Khôi phục hoàn tất! Khóa lại để xác minh.', 'success');
          handleLock(); // force re-unlock
        } else {
          triggerToast('Định dạng tệp sao lưu không đúng chuẩn mã hóa.', 'error');
        }
      } catch (err) {
        triggerToast('Tệp sao lưu bị lỗi hoặc sai định dạng.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Statistics calculation helpers
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    const isSecretActive = showSecretDrawer && isPro;
    const visibleEntries = entries.filter((e) => isSecretActive ? !!(e as any).isSecret : !(e as any).isSecret);
    categories.forEach((cat) => {
      counts[cat.id] = visibleEntries.filter((e) => e.category === cat.id).length;
    });
    return {
      total: visibleEntries.length,
      fav: visibleEntries.filter((e) => e.isFavorite).length,
      counts,
    };
  }, [entries, categories, showSecretDrawer, isPro]);

  // Computed categories considering display settings
  const displayedCategories = useMemo(() => {
    let result = [...categories];
    
    // Hide empty option (only if not active & categories are locked to avoid vanishing items when customizing)
    if (hideEmptyCategories && isCategoriesLocked) {
      result = result.filter(c => (stats.counts[c.id] || 0) > 0 || activeCategory === c.id);
    }
    
    // Sorting
    if (categorySortMode === 'alpha') {
      result.sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    } else if (categorySortMode === 'count') {
      result.sort((a, b) => (stats.counts[b.id] || 0) - (stats.counts[a.id] || 0));
    }
    
    return result;
  }, [categories, hideEmptyCategories, categorySortMode, stats.counts, isCategoriesLocked, activeCategory]);

  // Search filter and category selections
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Travel Mode filter
    if (isTravelModeActive && isPro) {
      result = result.filter((e) => !!(e as any).isSafeForTravel);
    }

    // Secret compartment filter
    if (showSecretDrawer && isPro) {
      result = result.filter((e) => !!(e as any).isSecret);
    } else {
      result = result.filter((e) => !(e as any).isSecret);
    }

    // Filter categories
    if (activeCategory === 'fav') {
      result = result.filter((e) => e.isFavorite);
    } else if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Filter text queries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const searchTitle = e.title?.toLowerCase() || '';
        const searchNotes = e.notes?.toLowerCase() || '';
        
        let customMatch = false;
        if (e.category === 'bank') {
          customMatch = (e.bankName?.toLowerCase() || '').includes(q) || 
                        (e.accountNumber || '').includes(q) ||
                        (e.accountHolder?.toLowerCase() || '').includes(q);
        } else if (e.category === 'social') {
          customMatch = (e.platformName?.toLowerCase() || '').includes(q) ||
                        (e.username?.toLowerCase() || '').includes(q);
        } else if (e.category === 'web') {
          customMatch = (e.websiteUrl?.toLowerCase() || '').includes(q) ||
                        (e.username?.toLowerCase() || '').includes(q);
        } else if (e.category === 'wallet') {
          customMatch = (e.walletName?.toLowerCase() || '').includes(q) ||
                        (e.address?.toLowerCase() || '').includes(q) ||
                        (e.username?.toLowerCase() || '').includes(q) ||
                        (e.notes?.toLowerCase() || '').includes(q);
        } else if (e.category === 'ewallet') {
          customMatch = (e.ewalletName?.toLowerCase() || '').includes(q) ||
                        (e.phoneNumber || '').includes(q) ||
                        (e.accountHolder?.toLowerCase() || '').includes(q);
        } else if (e.category === 'phoneapp') {
          customMatch = (e.appName?.toLowerCase() || '').includes(q) ||
                        (e.username?.toLowerCase() || '').includes(q) ||
                        (e.nationalId || '').includes(q);
        } else if (e.category === 'sheet') {
          const hasHeaderMatch = e.headers?.some(h => h.toLowerCase().includes(q)) || false;
          const hasRowMatch = e.rows?.some(row => row.some(cell => cell.toLowerCase().includes(q))) || false;
          customMatch = hasHeaderMatch || hasRowMatch;
        } else if (e.category === 'note') {
          customMatch = (e.content?.toLowerCase() || '').includes(q);
        }

        return searchTitle.includes(q) || searchNotes.includes(q) || customMatch;
      });
    }

    // Sorting
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return result;
  }, [entries, activeCategory, searchQuery, sortBy, showSecretDrawer, isPro, isTravelModeActive]);

  // Open Edit Dialog
  const handleEditInit = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setIsAddEditOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEntry(null);
    setIsAddEditOpen(true);
  };

  // Tập hợp danh sách các nhắc nhở cần lưu ý hiển thị
  const remindersToShow = useMemo(() => {
    const isSecretActive = showSecretDrawer && isPro;
    const visibleEntries = entries.filter((e) => isSecretActive ? !!(e as any).isSecret : !(e as any).isSecret);
    return visibleEntries
      .filter(e => e.reminder && e.reminder.enabled && e.reminder.date)
      .map(e => {
        const { daysLeft, isToday, formattedDate } = getReminderDaysLeft(e.reminder!.date, e.reminder!.type);
        return {
          entry: e,
          reminder: e.reminder!,
          daysLeft,
          isToday,
          formattedDate
        };
      })
      // Chỉ hiển thị các lời nhắc: hôm nay, sắp diễn ra trong 30 ngày tới hoặc mới diễn ra trong 3 ngày qua
      .filter(r => r.daysLeft >= -3 && r.daysLeft <= 30)
      .sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a.daysLeft - b.daysLeft;
      });
  }, [entries, showSecretDrawer, isPro]);

  // Điều hướng và trượt tới xem nhanh mục có lời nhắc
  const handleFocusReminderItem = (itemId: string, category: string) => {
    setActiveCategory('all');
    setSearchQuery('');
    setTimeout(() => {
      const el = document.getElementById(`vault-card-${itemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Kích hoạt kích vào phần tử để tự động mở rộng thông tin chi tiết
        const titleEl = el.querySelector('h4');
        if (titleEl) {
          (el as HTMLElement).click();
        }
      }
    }, 150);
  };

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} lang={lang} onLangChange={handleLangChange} />;
  }

  return (
    <div id="main-vault-root" data-theme={effectiveAppTheme} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased transition-colors duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 font-medium shadow-2xl border text-sm backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : toast.type === 'info'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* LEFT: Menu button (dấu 3 -), Logo, Title */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Hamburger / Menu button */}
            <button
              id="navbar-hamburger"
              type="button"
              onClick={() => setShowNavbarMenu(!showNavbarMenu)}
              className={`p-1.5 md:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                showNavbarMenu
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
              title={lang === 'vi' ? 'Menu tính năng' : 'Features Menu'}
            >
              {showNavbarMenu ? <X className="h-4.5 w-4.5 text-emerald-450" /> : <Menu className="h-4.5 w-4.5" />}
            </button>

            {/* Custom Sized Logo Icon - Interactive Ruby Gemstone */}
            <button
              id="header-logo-badge"
              type="button"
              onClick={() => {
                if (!isPro) {
                  triggerToast(lang === 'vi' 
                    ? '🔒 Tính năng Ngăn Bí Mật (Code) yêu cầu nâng cấp tài khoản PRO Elite!' 
                    : '🔒 Secret Cabinet (Code) feature requires upgrading to PRO Elite!', 'error');
                  setIsUpgradeModalOpen(true);
                  return;
                }
                triggerToast(lang === 'vi' 
                  ? '💡 MẸO: Hãy kích đúp (bấm liên tục 2 lần) vào Viên Kim Cương Đỏ này để mở/khóa Ngăn Bí Mật!' 
                  : '💡 TIP: Double-click this Red Gem to unlock or lock the Secret Area!', 'info');
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                if (!isPro) {
                  triggerToast(lang === 'vi' 
                    ? '🔒 Tính năng Ngăn Bí Mật (Code) yêu cầu nâng cấp tài khoản PRO Elite!' 
                    : '🔒 Secret Cabinet (Code) feature requires upgrading to PRO Elite!', 'error');
                  setIsUpgradeModalOpen(true);
                  return;
                }
                setActiveCategory('all');
                setShowSecretDrawer(prev => !prev);
                triggerToast(!showSecretDrawer 
                  ? (lang === 'vi' ? '💎 Đã kích hoạt Viên Kim Cương Đỏ (Ngăn bí mật) thành công!' : '💎 Activated the Red Gem (Secret Drawer) successfully!')
                  : (lang === 'vi' ? '🔒 Đã khóa ngăn bí mật & tệp tin an toàn!' : '🔒 Locked & secured the Secret Drawer successfully!'),
                  !showSecretDrawer ? 'success' : 'info'
                );
              }}
              className={`h-[32px] w-[32px] rounded-lg border flex items-center justify-center shrink-0 shadow-inner cursor-pointer transition-all duration-300 outline-none select-none ${
                showSecretDrawer && isPro
                  ? 'bg-rose-500/20 border-rose-500/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.85)] scale-105 active:scale-95 animate-pulse'
                  : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 hover:border-rose-500/40 hover:bg-rose-550/5 hover:text-rose-400'
              }`}
              title={lang === 'vi' ? 'Kích đúp liên tục để truy cập Ngăn bí mật' : 'Double-click to access Secret Drawer'}
            >
              <Gem className={`h-[18px] w-[18px] shrink-0 transition-all duration-500 ${
                showSecretDrawer && isPro 
                  ? 'fill-rose-500 text-rose-200 scale-110 animate-[spin_4s_linear_infinite]' 
                  : 'text-emerald-400 hover:text-rose-400'
              }`} />
            </button>

            {/* App branding title */}
            <div className="flex flex-col select-none">
              <div className="flex items-center gap-1.5">
                <h1 id="header-app-title" className="font-extrabold uppercase tracking-wide select-none font-sans text-xs md:text-sm text-slate-100">
                  {currentVaultTitle}
                </h1>
                {!isDeployedOnGithubOrVercel && (
                  <button
                    id="rename-app-btn"
                    type="button"
                    onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-450 transition-colors cursor-pointer"
                    title={t.head_renameBtn}
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              
              {/* Secure Subtitle line under the title */}
              <p id="header-app-subtitle" className="uppercase tracking-widest font-mono text-[9px] text-emerald-400/80 font-bold exclude-min-size leading-none">
                {t.head_encryptionText}
              </p>
            </div>
          </div>

          {/* MIDDLE GAP: Deleted header search bar */}
          <div className="flex-1 max-w-xs md:max-w-md hidden sm:block"></div>

          {/* RIGHT: Status tools, lock configurations */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Auto-Lock Indicator */}
            <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-850 rounded-xl p-0.5 md:p-1 shrink-0">
              {isEditingAutoLock ? (
                <div className="flex items-center gap-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-1 py-0.5 shadow-inner">
                  <Clock className="h-3 w-3 text-indigo-400 animate-pulse" />
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={tempAutoLockVal}
                    onChange={(e) => setTempAutoLockVal(e.target.value)}
                    onBlur={handleSaveAutoLock}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveAutoLock();
                      } else if (e.key === 'Escape') {
                        setIsEditingAutoLock(false);
                      }
                    }}
                    className="font-mono font-extrabold text-indigo-450 text-[11px] w-10 bg-transparent text-center outline-none border-b border-indigo-500/30 focus:border-indigo-400 pb-0.5"
                    autoFocus
                    placeholder="3"
                  />
                  <span className="text-[10px] text-slate-500 font-bold font-mono uppercase pb-0.5 select-none shrink-0 border-none">
                    m
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    if (!isPro) {
                      setIsUpgradeModalOpen(true);
                      return;
                    }
                    setIsEditingAutoLock(true);
                    setTempAutoLockVal(String(autoLockMinutes));
                  }}
                  className="flex items-center gap-1 text-slate-400 px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold bg-slate-950/45 border border-slate-850 hover:bg-slate-900/40 hover:border-slate-800 hover:text-slate-200 transition-all select-none cursor-pointer group"
                  title={isPro 
                    ? (lang === 'vi' ? 'Bấm để đổi thời gian tự khóa (phút, 0 để tắt)' : 'Click to customize auto-lock minutes (0 to disable)')
                    : (lang === 'vi' ? 'Yêu cầu phiên bản PRO để tùy chỉnh thời gian khóa' : 'PRO version required to customize auto-lock timer')
                  }
                >
                  <Clock className={`h-3.5 w-3.5 group-hover:text-indigo-455 transition-colors ${effectiveAutoLockMinutes > 0 ? 'text-indigo-405 animate-pulse' : 'text-slate-500'}`} />
                  <span className="font-mono font-extrabold text-indigo-400 text-[11px] min-w-[28px] text-center">
                    {effectiveAutoLockMinutes === 0 ? '00:00' : (isCountdownHidden ? '••:••' : formatCountdown(timeLeftSeconds))}
                  </span>
                </div>
              )}
            </div>

            {/* Language toggle badge */}
            <button
              type="button"
              onClick={() => handleLangChange(lang === 'vi' ? 'en' : 'vi')}
              className="p-1 px-2.5 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl text-slate-300 hover:text-slate-100 transition-all flex items-center gap-1.5 cursor-pointer h-7 md:h-8 shrink-0"
              title={lang === 'vi' ? 'Chuyển đổi ngôn ngữ hiển thị (VI / EN)' : 'Lockscreen language settings (EN / VN)'}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase font-mono tracking-wider">
                {lang === 'vi' ? 'VI' : 'EN'}
              </span>
            </button>

            {/* Lock app button */}
            <button
              id="app-lock-btn"
              type="button"
              onClick={() => handleLock()}
              className="h-7 w-7 md:h-8 md:w-8 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/35 text-rose-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
              title={t.head_lockBtn}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Suggestion overlay for rename */}
        {showTitleSuggestions && !isDeployedOnGithubOrVercel && (
          <div className="absolute top-16 left-4 md:left-24 w-72 bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-2xl z-50 text-left animate-slide-up">
            <div className="flex items-center justify-between mb-3 border-b border-slate-905 pb-2">
              <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-wider exclude-min-size">{t.head_renameSuggestionsTitle}</span>
              <button 
                type="button"
                onClick={() => setShowTitleSuggestions(false)}
                className="text-slate-500 hover:text-slate-400 text-xs font-semibold cursor-pointer"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
            <p className="text-[12px] text-slate-400 mb-2.5 leading-relaxed">{t.head_renameDesc}</p>
            
            <div className="grid grid-cols-2 gap-1.5 mb-3.5">
              {[
                { vi: 'Ví Mật Mã', en: 'Save Code' },
                { vi: 'Quản Lí Mật Khẩu', en: 'Password Locker' },
                { vi: 'Két Sắt Mật Mã', en: 'Confidential Safe' },
                { vi: 'Mật Mã Bảo Mật', en: 'Crypto Secure' },
                { vi: 'Trình Giữ Mật Mã', en: 'Secret Keeper' },
                { vi: 'Kho Biệt Lập', en: 'Isolated Vault' }
              ].map((item) => {
                const name = lang === 'vi' ? item.vi : item.en;
                return (
                  <button
                    key={item.vi}
                    type="button"
                    onClick={() => {
                      setVaultTitle(name);
                      localStorage.setItem('secure_vault_app_title', name);
                      setShowTitleSuggestions(false);
                      triggerToast(lang === 'vi' ? `Đã đổi tên ứng dụng thành "${name}"!` : `Vault title changed to "${name}"!`);
                    }}
                    className={`text-left px-2 py-1.5 text-[12px] font-medium rounded-lg border transition-all cursor-pointer truncate exclude-min-size ${
                      currentVaultTitle.toLowerCase() === name.toLowerCase()
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                        : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    title={name}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-500 font-semibold uppercase tracking-wider exclude-min-size">{t.head_renameCustomField}</label>
              <div className="flex gap-1.5">
                <input
                  id="custom-rename-input"
                  type="text"
                  value={customAppTitle}
                  onChange={(e) => setCustomAppTitle(e.target.value)}
                  placeholder={t.head_renameCustomPlc}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-605 font-sans"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAppTitle.trim()) {
                      const trimmed = customAppTitle.trim();
                      setVaultTitle(trimmed);
                      localStorage.setItem('secure_vault_app_title', trimmed);
                      setShowTitleSuggestions(false);
                      triggerToast(lang === 'vi' ? `Đã đổi tên ứng dụng thành "${trimmed}"!` : `Vault title changed to "${trimmed}"!`);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer shrink-0"
                >
                  {t.head_renameSave}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider exclude-min-size">
                  {lang === 'vi' ? '🧪 CHẾ ĐỘ XEM THỬ' : '🧪 PREVIEW MODE'}
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-500 exclude-min-size">
                  {isPro ? 'PRO 👑' : 'FREE 🔒'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleProPreviewMode}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border font-sans text-[11px] font-black cursor-pointer transition-all duration-300 shadow-md bg-slate-900 border-slate-805 text-indigo-400 hover:text-indigo-300 hover:border-slate-700 active:scale-98"
                title={lang === 'vi' ? 'Thay đổi chế độ xem thử để phát triển/kiểm tra nhanh' : 'Modify views instantly for quick development testing'}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${isPro ? 'bg-amber-400 animate-ping' : 'bg-slate-700'} shrink-0`}></span>
                  <span>{lang === 'vi' ? 'Bật tính năng PRO Elite' : 'Toggle PRO Elite'}</span>
                </span>
                <span className="tracking-wide text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 exclude-min-size">
                  {isPro ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </button>
            </div>
          </div>
        )}

      </header>

      {/* Hamburger Drawer Dropdown (Menu Thẻ) */}
      <AnimatePresence>
        {showNavbarMenu && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              id="sidebar-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowNavbarMenu(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 cursor-pointer"
            />

            {/* Left Drawer Panels adhering to GitHub design layout */}
            <motion.div
              id="sidebar-drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 h-full w-80 max-w-[85vw] bg-slate-950/98 border-r border-slate-900 shadow-2xl z-50 flex flex-col pt-5 pb-6 text-left text-slate-200 outline-none font-sans"
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between px-4 pb-4 border-b border-slate-900 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPro) {
                        triggerToast(lang === 'vi' 
                          ? '🔒 Tính năng Ngăn Bí Mật (Code) yêu cầu nâng cấp tài khoản PRO Elite!' 
                          : '🔒 Secret Cabinet (Code) feature requires upgrading to PRO Elite!', 'error');
                        setIsUpgradeModalOpen(true);
                        return;
                      }
                      triggerToast(lang === 'vi' 
                        ? '💡 MẸO: Hãy kích đúp (bấm liên tục 2 lần) vào Viên Kim Cương Đỏ này để mở/khóa Ngăn Bí Mật!' 
                        : '💡 TIP: Double-click this Red Gem to unlock or lock the Secret Area!', 'info');
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      if (!isPro) {
                        triggerToast(lang === 'vi' 
                          ? '🔒 Tính năng Ngăn Bí Mật (Code) yêu cầu nâng cấp tài khoản PRO Elite!' 
                          : '🔒 Secret Cabinet (Code) feature requires upgrading to PRO Elite!', 'error');
                        setIsUpgradeModalOpen(true);
                        return;
                      }
                      setActiveCategory('all');
                      setShowSecretDrawer(prev => !prev);
                      setShowNavbarMenu(false);
                      triggerToast(!showSecretDrawer 
                        ? (lang === 'vi' ? '💎 Đã kích hoạt Viên Kim Cương Đỏ (Ngăn bí mật) thành công!' : '💎 Activated the Red Gem (Secret Drawer) successfully!')
                        : (lang === 'vi' ? '🔒 Đã khóa ngăn bí mật & tệp tin an toàn!' : '🔒 Locked & secured the Secret Drawer successfully!'),
                        !showSecretDrawer ? 'success' : 'info'
                      );
                    }}
                    className={`h-[32px] w-[32px] rounded-lg border flex items-center justify-center shrink-0 shadow-inner cursor-pointer transition-all duration-300 outline-none select-none ${
                      showSecretDrawer && isPro
                        ? 'bg-rose-500/20 border-rose-500/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.85)] scale-105 active:scale-95 animate-pulse'
                        : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 hover:border-rose-500/40 hover:bg-rose-550/5 hover:text-rose-400'
                    }`}
                    title={lang === 'vi' ? 'Kích đúp liên tục để truy cập Ngăn bí mật' : 'Double-click to access Secret Drawer'}
                  >
                    <Gem className={`h-[18px] w-[18px] shrink-0 transition-all duration-500 ${
                      showSecretDrawer && isPro 
                        ? 'fill-rose-500 text-rose-200 scale-110 animate-[spin_4s_linear_infinite]' 
                        : 'text-emerald-400 hover:text-rose-400'
                    }`} />
                  </button>
                  <div>
                    <h2 className="font-extrabold uppercase tracking-wide text-sm text-slate-100 leading-none">
                      {currentVaultTitle}
                    </h2>
                    <span className="text-[12px] text-slate-500 font-bold uppercase tracking-widest block mt-1">
                      MÃ HÓA AES-256 NỘI BỘ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNavbarMenu(false)}
                  className="p-1.5 rounded-lg border border-slate-850 hover:border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-100 cursor-pointer transition-all active:scale-95"
                  title={lang === 'vi' ? 'Đóng menu' : 'Close menu'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable list options area */}
              <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scrollbar-thin">
                
                {/* Group 1: Category lists */}
                <div className="space-y-1">
                  <span className="px-3.5 text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                    {lang === 'vi' ? 'Kho khóa hàng đầu' : 'Top Key Repositories'}
                  </span>

                  {/* Select 'all' */}
                    <div className="flex items-center justify-between w-full relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory('all');
                          setShowGenTools(false);
                          setShowSettings(false);
                          setShowSecurityAudit(false);
                          setShowProUtilities(false);
                          setShowSystemConfig(false);
                          setShowNavbarMenu(false);
                          triggerToast(lang === 'vi' ? 'Tất cả tài khoản' : 'All Accounts');
                        }}
                        className={`flex-1 flex items-center justify-between pl-3.5 pr-10 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left relative group ${
                          activeCategory === 'all' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities
                            ? 'bg-slate-900/80 text-emerald-400 font-bold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                        }`}
                      >
                        {activeCategory === 'all' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-md"></span>
                        )}
                        <span className="flex items-center gap-3">
                          <span className={`${activeCategory === 'all' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-350'} shrink-0 ml-1`}>
                            <Layers className="h-4 w-4" />
                          </span>
                          <span className="truncate">{lang === 'vi' ? 'Tất cả tài khoản' : 'All Accounts'}</span>
                        </span>
                        {!hideCounts && (
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded-md ${
                            activeCategory === 'all' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900/60 text-slate-500'
                          }`}>
                            {stats.total || 0}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAllAccountsExpanded(!isAllAccountsExpanded);
                        }}
                        className="absolute right-2 top-2 bottom-2 px-1.5 hover:bg-slate-800 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                        title={lang === 'vi' ? 'Mở rộng/Thu gọn' : 'Expand/Collapse'}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAllAccountsExpanded ? '' : '-rotate-90'}`} />
                      </button>
                    </div>

                    {/* Loop list categories nested as children */}
                    {isAllAccountsExpanded && (
                      <div id="nested-categories-tree" className="ml-5 pl-3 border-l border-slate-850/60 space-y-1 mt-1">
                        {displayedCategories.map((cat) => {
                          const isCatActive = activeCategory === cat.id && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities;
                          const displayLabel = lang === 'en' 
                            ? (cat.id === 'bank' ? 'Bank details' : cat.id === 'social' ? 'Social Accounts' : cat.id === 'web' ? 'Regular Web' : cat.id === 'wallet' ? 'Crypto Wallets' : cat.id === 'ewallet' ? 'E-Wallets' : cat.id === 'phoneapp' ? 'Phone Apps' : cat.id === 'note' ? 'Secure Notes' : cat.id === 'sheet' ? 'Spreadsheets' : cat.label) 
                            : cat.label;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setActiveCategory(cat.id);
                                setShowGenTools(false);
                                setShowSettings(false);
                                setShowSecurityAudit(false);
                                setShowProUtilities(false);
                                setShowSystemConfig(false);
                                setShowNavbarMenu(false);
                                triggerToast((lang === 'vi' ? 'Đã chọn: ' : 'Selected: ') + displayLabel);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-xs font-semibold cursor-pointer select-none text-left relative group ${
                                isCatActive
                                  ? 'bg-slate-900/60 text-indigo-400 font-bold'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                              }`}
                            >
                              {isCatActive && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-r-md"></span>
                              )}
                              <span className="flex items-center gap-2.5">
                                <span className={`${isCatActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400' } shrink-0`}>
                                  {getCategoryIcon(cat.iconType)}
                                </span>
                                <span className="truncate">{displayLabel}</span>
                              </span>
                              {!hideCounts && (
                                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                                  isCatActive ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900/50 text-slate-500'
                                }`}>
                                  {stats.counts[cat.id] || 0}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Starred folder */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('fav');
                      setShowGenTools(false);
                      setShowSettings(false);
                      setShowSecurityAudit(false);
                      setShowProUtilities(false);
                      setShowSystemConfig(false);
                      setShowNavbarMenu(false);
                      triggerToast(lang === 'vi' ? 'Đã yêu thích' : 'Starred Folder');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left relative group ${
                      activeCategory === 'fav' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities
                        ? 'bg-slate-900/80 text-amber-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    {activeCategory === 'fav' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r-md"></span>
                    )}
                    <span className="flex items-center gap-3">
                      <span className={`${activeCategory === 'fav' && !showGenTools && !showSettings && !showSecurityAudit && !showSystemConfig && !showProUtilities ? 'text-amber-400' : 'text-slate-550 group-hover:text-slate-350'} shrink-0 ml-1`}>
                        <Star className="h-4 w-4" />
                      </span>
                      <span className="truncate">{lang === 'vi' ? 'Đã gắn dấu sao' : 'Starred Items'}</span>
                    </span>
                  </button>
                </div>

                {/* Separation line */}
                <div className="border-t border-slate-900 my-1"></div>

                {/* Group 2: System Security utilities */}
                <div className="space-y-1">
                  <span className="px-3.5 text-xs font-extrabold uppercase tracking-widest text-slate-500 block mb-2">
                    {lang === 'vi' ? 'An ninh tiện ích' : 'Security Utilities'}
                  </span>

                  {/* Tool 1: Password Gen */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenTools(!showGenTools);
                      setShowSettings(false);
                      setShowSecurityAudit(false);
                      setShowProUtilities(false);
                      setShowSystemConfig(false);
                      setShowNavbarMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left group ${
                      showGenTools
                        ? 'bg-slate-900/80 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className={`${showGenTools ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-350'} shrink-0 ml-1`}>
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <span>{lang === 'vi' ? 'Trình Tạo Mật Khẩu' : 'Password Generator'}</span>
                  </button>

                  {/* Tool 2: 2FA Audit */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecurityAudit(!showSecurityAudit);
                      setShowSettings(false);
                      setShowGenTools(false);
                      setShowProUtilities(false);
                      setShowSystemConfig(false);
                      setShowNavbarMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left group ${
                      showSecurityAudit
                        ? 'bg-slate-900/80 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`${showSecurityAudit ? 'text-indigo-400' : 'text-slate-550'} shrink-0 ml-1`}>
                        <ShieldAlert className="h-4 w-4" />
                      </span>
                      <span>{lang === 'vi' ? 'Kiểm Toán Bảo Mật 2FA' : '2FA Security Audit'}</span>
                    </span>
                    {!isPro && (
                      <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold px-1.5 rounded uppercase scale-90 shrink-0">
                        PRO
                      </span>
                    )}
                  </button>

                  {/* Tool 5: PRO Premium Toolkit */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProUtilities(!showProUtilities);
                      setShowSettings(false);
                      setShowGenTools(false);
                      setShowSecurityAudit(false);
                      setShowSystemConfig(false);
                      setShowNavbarMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left group ${
                      showProUtilities
                        ? 'bg-slate-900/80 text-indigo-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`${showProUtilities ? 'text-indigo-400' : 'text-slate-550'} shrink-0 ml-1`}>
                        <Gem className="h-4 w-4" />
                      </span>
                      <span>{lang === 'vi' ? 'Bộ Tiện Ích Cao Cấp PRO' : 'PRO Premium Toolkit'}</span>
                    </span>
                    {!isPro && (
                      <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold px-1.5 rounded uppercase scale-90 shrink-0">
                        PRO
                      </span>
                    )}
                  </button>

                  {/* Tool 3: Backup */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowGenTools(false);
                      setShowSecurityAudit(false);
                      setShowProUtilities(false);
                      setShowSystemConfig(false);
                      setShowNavbarMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left group ${
                      showSettings
                        ? 'bg-slate-900/80 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className={`${showSettings ? 'text-emerald-400' : 'text-slate-550'} shrink-0 ml-1`}>
                      <Database className="h-4 w-4" />
                    </span>
                    <span>{lang === 'vi' ? 'Sao Lưu & Đồng Bộ' : 'Backup & Sync'}</span>
                  </button>

                  {/* Tool 4: Config */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSystemConfig(!showSystemConfig);
                      setShowGenTools(false);
                      setShowSecurityAudit(false);
                      setShowProUtilities(false);
                      setShowSettings(false);
                      setShowNavbarMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm font-bold cursor-pointer select-none text-left group ${
                      showSystemConfig
                        ? 'bg-slate-900/80 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className={`${showSystemConfig ? 'text-emerald-400' : 'text-slate-550'} shrink-0 ml-1`}>
                      <Settings className="h-4 w-4" />
                    </span>
                    <span>{lang === 'vi' ? 'Cài Đặt Hệ Thống' : 'System Settings'}</span>
                  </button>
                </div>
              </div>

              {/* Status footer for Drawer */}
              <div className="px-4 pt-3 border-t border-slate-900 shrink-0 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold">
                  <span>SYSTEM STATUS:</span>
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    SECURE & LIVE
                  </span>
                </div>
                {!isPro && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpgradeModalOpen(true);
                      setShowNavbarMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-sans text-xs font-black select-none cursor-pointer transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{lang === 'vi' ? 'Nâng cấp lên PRO Elite' : 'Upgrade to PRO Elite'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* System Notification Band / Birthday & Reminders Hub */}
      {isUnlocked && remindersToShow.length > 0 && (
        <div id="reminders-dashboard-banner" className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-5 animate-fade-in relative z-20">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-905 border border-indigo-500/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            {/* Glowing orb accent */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bell className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    {t.rem_title}
                    <span className="bg-indigo-500 text-slate-950 font-mono font-bold text-[11px] px-2 py-0.5 rounded-full leading-none">
                      {remindersToShow.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t.rem_desc}</p>
                </div>
              </div>
            </div>
            
            {/* Horizontal Grid list for events */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {remindersToShow.map(({ entry, reminder, daysLeft, isToday, formattedDate }) => (
                <div 
                   key={entry.id}
                   onClick={() => handleFocusReminderItem(entry.id, entry.category)}
                   className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between hover:scale-[1.01] hover:bg-slate-900 ${
                     isToday 
                       ? 'bg-indigo-500/10 border-indigo-500/35 shadow-lg shadow-indigo-500/5 hover:border-indigo-400' 
                       : daysLeft < 0
                       ? 'bg-slate-900/40 border-slate-900 opacity-65 hover:opacity-100'
                       : 'bg-slate-900/70 border-slate-850 hover:border-slate-705'
                   }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
                        isToday 
                          ? 'bg-indigo-400 text-slate-950 animate-pulse' 
                          : daysLeft < 0
                          ? 'bg-slate-800 text-slate-450'
                          : daysLeft <= 3
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-indigo-300'
                      }`}>
                        {isToday 
                          ? t.rem_today 
                          : daysLeft < 0
                          ? t.rem_daysPassed.replace('{n}', String(Math.abs(daysLeft)))
                          : t.rem_daysLeft.replace('{n}', String(daysLeft))
                        }
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {formattedDate.split('/').slice(0, 2).join('/')}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1 group-hover:text-indigo-300">
                      {entry.title}
                    </h4>
                    
                    {reminder.message && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic font-sans">
                        "{reminder.message}"
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{reminder.type === 'yearly' ? t.rem_yearly : t.rem_once}</span>
                    <span className="text-indigo-400 font-semibold">{t.rem_quickView}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Statistics & Category Selector Column */}
        <section id="sidebar-filters" className="col-span-1 space-y-6">
          
          {/* Quick Add Button */}
          <button
            id="sidebar-add-btn"
            type="button"
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" />
            <span>{t.side_addNewAccount}</span>
          </button>

          {/* Stats quick board */}
          <div className="bg-slate-900 border border-slate-800/60 p-5 rounded-2xl space-y-4">
            {/* Presets Header */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{t.side_quickFilters}</span>
              </h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: t.side_allAccounts, count: stats.total, icon: <Layers className="h-4 w-4" /> },
                  { id: 'fav', label: t.side_starred, count: stats.fav, icon: <Star className="h-4 w-4 text-amber-500" /> },
                ].map((filter) => {
                  const isActive = activeCategory === filter.id;
                  return (
                    <button
                      id={`sidebar-filter-btn-${filter.id}`}
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveCategory(filter.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-base font-semibold cursor-pointer ${
                        isActive 
                          ? 'bg-slate-950 text-emerald-400 font-semibold border-l-2 border-emerald-500 pl-2.5' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                          {filter.icon}
                        </span>
                        <span>{filter.label}</span>
                      </div>
                      <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick advice block */}
          <div className="bg-slate-950/40 border border-slate-900 p-4.5 rounded-2xl text-sm text-slate-500 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-xs">
              <Shield className="h-3.5 w-3.5 text-emerald-500/60" />
              <span>{t.side_adviceHeader}</span>
            </div>
            <p>{t.side_advicePara1}</p>
            <p className="font-medium text-slate-400">{t.side_advicePara2}</p>
          </div>
        </section>

        {/* Core Workspace column */}
        <section id="vault-workspace" className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Top filter drawer & options */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/40 p-3.5 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                id="search-input"
                type="text"
                placeholder={t.work_searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-550 placeholder-slate-600 rounded-xl text-xs outline-none transition-all placeholder:text-slate-500"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-slate-450 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {lang === 'vi' ? 'Xóa' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* Expanded Slideouts panels (Generator / Settings Settings) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                id="vault-settings-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900 border border-emerald-500/10 p-6 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{t.sett_title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {t.sett_desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Backup box */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{t.sett_exportHeader}</span>
                        </h4>
                        <p className="text-[12px] text-slate-500 mt-1">
                          {t.sett_exportDesc}
                        </p>
                      </div>
                      <button
                        id="backup-export-btn"
                        type="button"
                        onClick={handleExportBackup}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold border border-slate-850 py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t.sett_exportBtn}</span>
                      </button>
                    </div>

                    {/* Restore box */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5 text-blue-400" />
                          <span>{t.sett_importHeader}</span>
                        </h4>
                        <p className="text-[12px] text-slate-500 mt-1">
                          <span className="text-rose-400 font-semibold">{t.sett_importWarningLabel}:</span> {t.sett_importWarningDesc}
                        </p>
                      </div>

                      <label className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-850 py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer select-none text-center">
                        <Upload className="h-4 w-4" />
                        <span>{t.sett_importBtn}</span>
                        <input
                          id="backup-import-file"
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Theme Selector Section */}
                  <div className="pt-5 border-t border-slate-800/60 mt-4 select-none">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-indigo-400" />
                          <span>{t.theme_title}</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {t.theme_desc}
                        </p>
                      </div>
                      {!isPro && (
                        <span className="self-start sm:self-center px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-indigo-500/10 border border-indigo-505/20 text-indigo-400 uppercase">
                          PRO ONLY
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { 
                          id: 'slate', 
                          name: t.theme_slate, 
                          isProTheme: false,
                          colors: ['bg-slate-950', 'bg-slate-900', 'bg-emerald-500'],
                        },
                        { 
                          id: 'cyberpunk', 
                          name: t.theme_cyberpunk, 
                          isProTheme: true,
                          colors: ['bg-[#070010]', 'bg-[#120124]', 'bg-fuchsia-500', 'bg-yellow-400'],
                        },
                        { 
                          id: 'emerald', 
                          name: t.theme_emerald, 
                          isProTheme: true,
                          colors: ['bg-[#01140e]', 'bg-[#022c22]', 'bg-emerald-600'],
                        },
                        { 
                          id: 'darkspace', 
                          name: t.theme_darkspace, 
                          isProTheme: true,
                          colors: ['bg-[#02020f]', 'bg-[#0a0b22]', 'bg-indigo-600'],
                        },
                      ].map((themeItem) => {
                        const isSelected = appTheme === themeItem.id;
                        const handleThemeClick = () => {
                          if (themeItem.isProTheme && !isPro) {
                            setIsUpgradeModalOpen(true);
                            triggerToast(t.theme_locked_toast, 'error');
                            return;
                          }
                          setAppTheme(themeItem.id);
                          localStorage.setItem('secure_vault_theme', themeItem.id);
                          triggerToast(t.theme_unlocked_toast, 'success');
                        };

                        return (
                          <button
                            key={themeItem.id}
                            type="button"
                            onClick={handleThemeClick}
                            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between gap-3 text-center transition-all cursor-pointer relative overflow-hidden group/theme-item select-none ${
                              isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold' 
                                : 'bg-slate-950/40 border-slate-850/80 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {/* Pro Block Overlay Indicator */}
                            {themeItem.isProTheme && !isPro && (
                              <div className="absolute top-1.5 right-1.5">
                                <Lock className="h-3 w-3 text-slate-600 group-hover/theme-item:text-indigo-400 transition-colors" />
                              </div>
                            )}

                            {/* Bullet Circle Preview */}
                            <div className="flex items-center gap-1 shrink-0">
                              {themeItem.colors.map((bgC, idx) => (
                                <div key={idx} className={`h-4.5 w-4.5 rounded-full border border-slate-950/50 shadow-sm ${bgC}`} />
                              ))}
                            </div>

                            <span className="text-[12px] font-bold leading-tight truncate w-full tracking-wide">
                              {themeItem.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Travel Mode Section for Pro version */}
                  <div className="pt-5 border-t border-slate-800/60 mt-5 select-none">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                          <span className="text-sm shrink-0">✈️</span>
                          <span>Chế độ Du lịch (Travel Mode)</span>
                        </h4>
                        <p className="text-[12px] text-slate-400 mt-1 max-w-xl leading-relaxed">
                          {lang === 'vi' 
                            ? 'Một công nghệ độc đáo bảo vệ thông tin khi qua biên giới. Khi bật, toàn bộ mật khẩu KHÔNG đánh dấu "Cho phép giữ lại khi du lịch" sẽ tạm thời biến mất hoàn toàn khỏi ứng dụng ngoại tuyến này để giữ an toàn.'
                            : 'A unique boundary protection safeguard. When active, all secrets NOT explicitly marked as "Safe for Travel" are completely hidden from all vaults locally.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {!isPro && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-amber-500/10 border border-amber-505/20 text-amber-400 uppercase">
                            PRO
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isPro) {
                              setIsUpgradeModalOpen(true);
                              triggerToast(lang === 'vi' ? 'Tiện ích thuộc bản PRO!' : 'Upgrade to PRO to active!', 'error');
                              return;
                            }
                            const nextState = !isTravelModeActive;
                            setIsTravelModeActive(nextState);
                            localStorage.setItem('secure_vault_travel_mode', nextState ? 'true' : 'false');
                            triggerToast(
                              lang === 'vi' 
                                ? (nextState ? 'Kích hoạt Chế độ Du lịch! Các mục nhạy cảm đã ẩn.' : 'Đã tắt Chế độ Du lịch! Khôi phục dữ liệu.')
                                : (nextState ? 'Travel Mode active! Sensitive information hidden.' : 'Travel Mode disabled! Display restored.'),
                              'success'
                            );
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isTravelModeActive && isPro ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isTravelModeActive && isPro ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hướng dẫn Đồng bộ & Cài đặt Ngoại tuyến PWA */}
                  <div className="pt-5 border-t border-slate-800/60 mt-4 text-left select-none">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-amber-500" />
                      <span>{lang === 'vi' ? 'Hướng dẫn Tải Ngoại tuyến & Đồng bộ Điện thoại' : 'Offline Download & Phone Sync Guide'}</span>
                    </h4>
                    <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
                      {lang === 'vi' 
                        ? 'Vì dữ liệu bảo mật được mã hóa AES-256 nội bộ (Zero-Knowledge) độc lập ngay trên thiết bị của bạn, việc đồng bộ giữa Máy tính và Điện thoại diễn ra cực kỳ an toàn mà không qua máy chủ trung gian.' 
                        : 'Since security data is encrypted client-side using military-grade AES-256 (Zero-Knowledge), synchronization between PC and Mobile is highly secure and runs completely serverless.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* Bước 1: Hướng dẫn cài đặt PWA */}
                      <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black">1</span>
                          <h5 className="text-[12px] font-bold text-slate-350 tracking-wide uppercase">
                            {lang === 'vi' ? 'Cài đặt App Ngoại tuyến (PWA)' : 'Install Offline Desktop / App'}
                          </h5>
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-slate-400 leading-relaxed space-y-1">
                          {lang === 'vi' ? (
                            <>
                              Ứng dụng tự động tối ưu hóa để chạy như một app cục bộ trên mọi hệ điều hành:
                              <span className="block mt-1"><strong className="text-slate-300">• Trên Máy tính (Chrome/Edge):</strong> Bấm vào biểu tượng cài đặt / tải app trên thanh địa chỉ để chuyển sang dạng ứng dụng riêng biệt.</span>
                              <span className="block mt-0.5"><strong className="text-slate-300">• Trên iPhone (iOS Safari):</strong> Nhấp vào nút <strong className="text-indigo-400">Chia sẻ</strong> rồi chọn <strong className="text-indigo-400">Thêm vào MH chính</strong>.</span>
                              <span className="block mt-0.5"><strong className="text-slate-300">• Trên Android (Chrome):</strong> Nhấp vào dấu <strong className="text-indigo-400">3 chấm</strong> và chọn <strong className="text-indigo-400">Cài đặt ứng dụng</strong>.</span>
                            </>
                          ) : (
                            <>
                              The app responds smoothly as a native application across all mobile/desktop platforms:
                              <span className="block mt-1"><strong className="text-slate-300">• PC/Mac (Chrome/Edge):</strong> Click the install icon on the browser address bar to add it directly to your Desktop.</span>
                              <span className="block mt-0.5"><strong className="text-slate-300">• iPhone/iOS (Safari):</strong> Tap the <strong className="text-indigo-400">Share</strong> menu, then choose <strong className="text-indigo-400">Add to Home Screen</strong>.</span>
                              <span className="block mt-0.5"><strong className="text-slate-300">• Android (Chrome):</strong> Tap the <strong className="text-indigo-400">3-dots menu</strong> and select <strong className="text-indigo-400">Install app</strong>.</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Bước 2: Hướng dẫn đồng bộ mã hóa */}
                      <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black">2</span>
                          <h5 className="text-[12px] font-bold text-slate-350 tracking-wide uppercase">
                            {lang === 'vi' ? 'Liên kết & Đồng bộ dữ liệu' : 'Secure Data Synchronization'}
                          </h5>
                        </div>
                        <p className="text-[11px] sm:text-[12px] text-slate-400 leading-relaxed space-y-1">
                          {lang === 'vi' ? (
                            <>
                              Để đồng bộ tài liệu an toàn từ Máy tính sang Điện thoại mà không lo lộ lọt bí mật:
                              <span className="block mt-1"><strong className="text-slate-200">1.</strong> Trên máy tính, bấm <strong className="text-emerald-400">"Xuất tệp sao lưu"</strong> tải về file khóa <strong className="text-indigo-300 font-mono">.json</strong> mã hóa cường độ cao.</span>
                              <span className="block mt-0.5"><strong className="text-slate-200">2.</strong> Gửi tệp này sang điện thoại qua tin nhắn tự truyền, Cloud Drive hoặc ứng dụng nhắn tin cá nhân.</span>
                              <span className="block mt-0.5"><strong className="text-slate-200">3.</strong> Trên thiết bị điện thoại, truy cập Settings, nhấp chọn <strong className="text-emerald-400">"Nhập tệp sao lưu"</strong> và nạp file này. Nhập Master Password của bạn để giải nén tức thì!</span>
                            </>
                          ) : (
                            <>
                              To securely link and sync your vault data from Desktop to Mobile smoothly:
                              <span className="block mt-1"><strong className="text-slate-200">1.</strong> On your primary device, click <strong className="text-emerald-400">"Export backup file"</strong> above to retrieve your secure <strong className="text-indigo-300 font-mono">.json</strong> file.</span>
                              <span className="block mt-0.5"><strong className="text-slate-200">2.</strong> Send this file to your mobile phone via private channels or private Drive.</span>
                              <span className="block mt-0.5"><strong className="text-slate-200">3.</strong> Open settings on your destination, tap <strong className="text-emerald-400">"Import/Restore backup"</strong> and load the file with your Master Password!</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showGenTools && (
              <motion.div
                id="vault-gentools-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <PasswordGenerator />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSystemConfig && (
              <motion.div
                id="vault-systemconfig-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6 animate-fade-in"
              >
                <div className="bg-slate-900 border border-indigo-500/10 p-6 rounded-2xl md:space-y-6 space-y-4">
                  
                  {/* Header Title section */}
                  <div className="flex items-center gap-3 border-b border-slate-800/85 pb-4">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-extrabold text-slate-100 font-sans tracking-wide uppercase">
                        {lang === 'vi' ? 'Cấu Hình Hệ Thống & Két Sắt' : 'System & Cryptographic Core Configuration'}
                      </h3>
                      <p className="text-[12px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                        {lang === 'vi' 
                          ? 'Tùy chỉnh linh hoạt bối cảnh hiển thị, cách sắp xếp tài khoản, thay đổi thương hiệu và cá nhân hóa trải nghiệm bảo mật.' 
                          : 'Customize your credential display preferences, security lock parameters, and application branding.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Options Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    
                    {/* COLUMN 1: Bố cục & Sắp xếp */}
                    <div className="space-y-4 p-4 bg-slate-950/45 border border-slate-850/80 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <h4 className="text-[12px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 shrink-0" />
                          <span>{lang === 'vi' ? 'Sắp Xếp & Bố Cục' : 'Sorting & Layout'}</span>
                        </h4>
                        
                        {/* Sorting triggers */}
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none">
                            {lang === 'vi' ? 'Thứ tự ưu tiên danh mục' : 'Category display sorting'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isPro) {
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                setSortBy('recent');
                              }}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg text-center transition-all cursor-pointer ${
                                sortBy === 'recent'
                                  ? 'bg-slate-950 text-emerald-450 border border-emerald-500/25 font-black shadow-inner'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              {lang === 'vi' ? 'Gần nhất' : 'Recent'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isPro) {
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                setSortBy('alphabetical');
                              }}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg text-center transition-all cursor-pointer ${
                                sortBy === 'alphabetical'
                                  ? 'bg-slate-950 text-emerald-455 border border-emerald-500/25 font-black shadow-inner'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              {lang === 'vi' ? 'Chữ cái (A-Z)' : 'A-Z Alphabet'}
                            </button>
                          </div>
                        </div>

                        {/* View Modes */}
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none">
                            {lang === 'vi' ? 'Bố cục xem dữ liệu' : 'Datasheet display style'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isPro) {
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                handleSetViewMode('grid');
                              }}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                viewMode === 'grid'
                                  ? 'bg-slate-950 text-emerald-450 border border-emerald-500/25 font-black'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                              <span>{lang === 'vi' ? 'Ô lưới' : 'Grid'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isPro) {
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                handleSetViewMode('table');
                              }}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                viewMode === 'table'
                                  ? 'bg-slate-950 text-emerald-455 border border-emerald-500/25 font-black'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              <List className="h-3.5 w-3.5 shrink-0" />
                              <span>{lang === 'vi' ? 'Bảng kê' : 'Table'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium pt-2.5 leading-relaxed italic border-t border-slate-900/40">
                        {!isPro 
                          ? (lang === 'vi' ? '*Yêu cầu gói PRO để thay đổi sắp xếp dữ liệu bổ sung.' : '*PRO edition required to customize advanced sort algorithms.')
                          : (lang === 'vi' ? 'Quyền truy cập chỉnh sửa PRO đã hoạt động.' : 'PRO customization rights authorized.')
                        }
                      </div>
                    </div>

                    {/* COLUMN 2: Ngôn ngữ & Chế độ hiển thị */}
                    <div className="space-y-4 p-4 bg-slate-950/45 border border-slate-850/80 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <h4 className="text-[12px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                          <Globe className="h-4 w-4 shrink-0" />
                          <span>{lang === 'vi' ? 'Ngôn Ngữ & Hiển Thị' : 'Language & Display'}</span>
                        </h4>

                        {/* Languages toggling */}
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none">
                            {lang === 'vi' ? 'Ngôn ngữ hiển thị' : 'System language'}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                            <button
                              type="button"
                              onClick={() => handleLangChange('vi')}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg text-center transition-all cursor-pointer ${
                                lang === 'vi'
                                  ? 'bg-slate-950 text-indigo-400 border border-indigo-500/25 font-black'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              Tiếng Việt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLangChange('en')}
                              className={`px-2 py-1.5 text-[11px] font-extrabold tracking-wide uppercase rounded-lg text-center transition-all cursor-pointer ${
                                lang === 'en'
                                  ? 'bg-slate-950 text-indigo-400 border border-indigo-500/25 font-black'
                                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              English
                            </button>
                          </div>
                        </div>

                        {/* Layout checklists */}
                        <div className="space-y-2 pt-0.5">
                          <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none mb-1.5">
                            {lang === 'vi' ? 'Tùy chọn hiển thị' : 'Display adjustments'}
                          </label>
                          <div className="space-y-2 text-[12px] font-sans text-slate-300">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hideEmptyCategories}
                                onChange={() => setHideEmptyCategories(!hideEmptyCategories)}
                                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-opacity-0 h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                              />
                              <span>{lang === 'vi' ? 'Ẩn danh mục trống' : 'Hide empty folders'}</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hideCounts}
                                onChange={() => setHideCounts(!hideCounts)}
                                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-opacity-0 h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                              />
                              <span>{lang === 'vi' ? 'Ẩn lượt đếm hồ sơ' : 'Hide record counts'}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={sidebarCompact}
                                onChange={() => setSidebarCompact(!sidebarCompact)}
                                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-opacity-0 h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                              />
                              <span>{lang === 'vi' ? 'Chế độ thu nhỏ danh mục' : 'Compact category rail'}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-450 font-semibold pt-2 border-t border-slate-900/40 flex items-center justify-between">
                        <span className="text-slate-500">{lang === 'vi' ? 'Tự khóa sau:' : 'Auto Lock:'}</span>
                        <div className="flex items-center gap-1.5 bg-slate-900/80 p-0.5 px-1 border border-slate-850 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              if (autoLockMinutes > 1) {
                                const val = autoLockMinutes - 1;
                                setAutoLockMinutes(val);
                                localStorage.setItem('secure_vault_auto_lock_time', String(val));
                                triggerToast((lang === 'vi' ? 'Đổi tự khóa: ' : 'Auto lock updated: ') + val + 'm', 'info');
                              } else if (autoLockMinutes === 1) {
                                setAutoLockMinutes(0);
                                localStorage.setItem('secure_vault_auto_lock_time', '0');
                                triggerToast(lang === 'vi' ? 'Đã tắt tự động khóa' : 'Auto lock disabled', 'info');
                              }
                            }}
                            className="h-4.5 w-4.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded flex items-center justify-center text-[11px] font-black cursor-pointer active:scale-90"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-extrabold text-indigo-400 min-w-[20px] text-center">
                            {autoLockMinutes === 0 ? (lang === 'vi' ? 'Tắt' : 'Off') : `${autoLockMinutes}m`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const val = autoLockMinutes + 1;
                              setAutoLockMinutes(val);
                              localStorage.setItem('secure_vault_auto_lock_time', String(val));
                              triggerToast((lang === 'vi' ? 'Đổi tự khóa: ' : 'Auto lock updated: ') + val + 'm', 'info');
                            }}
                            className="h-4.5 w-4.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded flex items-center justify-center text-[11px] font-black cursor-pointer active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showGenTools && (
              <motion.div
                id="vault-gentools-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <PasswordGenerator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Credentials Display Area / Security Audit Dashboard / Pro Utilities */}
          {showSecurityAudit ? (
            <div id="security-audit-container">
              <SecurityAudit
                entries={entries}
                isPro={isPro}
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
                currentLang={lang}
              />
            </div>
          ) : showProUtilities ? (
            <div id="pro-utilities-container">
              <ProUtilities
                entries={entries}
                isPro={isPro}
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
                onSaveEntry={handleSaveEntry}
                currentLang={lang}
              />
            </div>
          ) : (
            <div id="credentials-grid-flow">
              {isTravelModeActive && isPro && (
                <div className="mb-5 bg-amber-500/10 border border-amber-500/15 border-l-4 border-l-amber-500 rounded-r-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left animate-pulse text-amber-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">✈️</span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-amber-200">
                        {lang === 'vi' ? 'Đang bật Chế độ Du lịch (Travel Mode)' : 'Travel Mode is Active'}
                      </h4>
                      <p className="text-[12px] text-slate-450 leading-normal mt-1">
                        {lang === 'vi' 
                          ? 'Một số thông tin hoặc mật khẩu nhạy cảm của bạn đã tạm thời được ẩn khỏi thiết bị để giữ an toàn.'
                          : 'Sensitive credentials have been hidden from the device to guard border screenings.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsTravelModeActive(false);
                      localStorage.setItem('secure_vault_travel_mode', 'false');
                      triggerToast(lang === 'vi' ? 'Đã tắt Chế độ Du lịch!' : 'Travel Mode disabled!', 'success');
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg transition-all hover:bg-amber-400 shrink-0 select-none cursor-pointer"
                  >
                    {lang === 'vi' ? 'Tắt chế độ' : 'Disable'}
                  </button>
                </div>
              )}

              {showSecretDrawer && (
                <div className="mb-5 bg-indigo-950/25 border border-indigo-500/20 border-l-4 border-l-indigo-500 rounded-r-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left animate-fade-in text-indigo-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-indigo-500/15 rounded-xl text-indigo-400 shrink-0">
                      <Unlock className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                        <span>Khu vực Ngăn Bí Mật (Code Cabinet)</span>
                        <span className="bg-indigo-500/20 text-[10px] font-black tracking-widest text-indigo-300 px-1 py-0.2 rounded">SECURE</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">Các tài khoản, ví, dữ liệu và tệp lớn qua Google Drive trong ngăn này cực kỳ an toàn.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecretDrawer(false);
                      triggerToast(lang === 'vi' ? '🔒 Đã khoá Ngăn bí mật thành công!' : '🔒 Locked Secret Drawer successfully!', 'info');
                    }}
                    className="self-end sm:self-auto px-3.5 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm"
                  >
                    🔒 Khóa Ngăn (Lock)
                  </button>
                </div>
              )}

              {filteredEntries.length === 0 ? (
                <div id="no-cards-placeholder" className="bg-slate-900 border border-slate-800/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-slate-500">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-200">{t.work_emptyTitle}</h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                      {searchQuery 
                        ? t.work_emptySearch
                        : t.work_emptyDesc}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      id="placeholder-add-btn"
                      type="button"
                      onClick={handleCreateNew}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/5 mt-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>{t.work_createFirst}</span>
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredEntries.map((item) => (
                    <motion.div
                      id={`anim-wrapper-${item.id}`}
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                    >
                      <VaultItemCard
                        entry={item}
                        onEdit={handleEditInit}
                        onDelete={handleDeleteEntry}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenWorkspace={handleOpenWorkspace}
                        categories={categories}
                        layoutMode="grid"
                        hideCompactSummaries={hideCompactSummaries}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div id="credentials-list-flow" className="flex flex-col gap-3">
                  {filteredEntries.map((item) => (
                    <motion.div
                      id={`anim-wrapper-${item.id}`}
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VaultItemCard
                        entry={item}
                        onEdit={handleEditInit}
                        onDelete={handleDeleteEntry}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenWorkspace={handleOpenWorkspace}
                        categories={categories}
                        layoutMode="table"
                        hideCompactSummaries={hideCompactSummaries}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Form Modal */}
      <VaultFormModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
        customCategories={categories}
      />

      {/* Spreadsheet Workspace Large View Modal */}
      <SpreadsheetWorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => {
          setIsWorkspaceOpen(false);
          setActiveWorkspaceSheet(null);
        }}
        entry={activeWorkspaceSheet}
        onSave={handleSaveWorkspaceSheet}
      />

      {/* Premium Edition Comparison & Coupon Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        isPro={isPro}
        onUpgradeSuccess={() => {
          setIsPro(true);
          triggerToast(lang === 'vi' ? 'Kích hoạt thành công phiên bản PRO Cận Vệ! 🎉' : 'Activated PRO Elite Edition successfully! 🎉', 'success');
        }}
        lang={lang}
      />
    </div>
  );
}
