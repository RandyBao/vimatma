import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, Lock, Unlock, Search, PlusCircle, LogOut, Download, Upload, 
  Settings, KeyRound, Star, CreditCard, Smartphone, Globe, 
  FileText, ArrowUpDown, ChevronRight, RefreshCw, Layers, Wallet,
  Fingerprint, Table, ArrowUp, ArrowDown, Eye, EyeOff, ChevronUp, ChevronDown,
  Trash2, Edit2, LayoutGrid, List, Bell, Calendar, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LockScreen from './components/LockScreen';
import VaultItemCard from './components/VaultItemCard';
import VaultFormModal from './components/VaultFormModal';
import SpreadsheetWorkspaceModal from './components/SpreadsheetWorkspaceModal';
import PasswordGenerator from './components/PasswordGenerator';
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

  // Visual branding title state with suggestions
  const [vaultTitle, setVaultTitle] = useState(() => {
    return localStorage.getItem('secure_vault_app_title') || '';
  });
  const currentVaultTitle = vaultTitle || t.app_title;
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [customAppTitle, setCustomAppTitle] = useState('');

  // Filtering and Controls state
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

  // Status popups
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- AUTO LOCK MECHANISM ---
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('secure_vault_auto_lock_time');
    return saved !== null ? Number(saved) : 3; // Mặc định 3 Phút
  });

  const [isEditingAutoLock, setIsEditingAutoLock] = useState<boolean>(false);
  const [tempAutoLockVal, setTempAutoLockVal] = useState<string>('3');

  const [isCountdownHidden, setIsCountdownHidden] = useState<boolean>(() => {
    return localStorage.getItem('secure_vault_hide_countdown') === 'true';
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(autoLockMinutes * 60);

  // Cập nhật lại số giây đếm ngược khi thời gian cấu hình thay đổi
  useEffect(() => {
    setTimeLeftSeconds(autoLockMinutes * 60);
  }, [autoLockMinutes]);

  // Bộ đếm lùi và tự động bắt sự kiện tương tác để hoãn khóa kho
  useEffect(() => {
    if (!isUnlocked || autoLockMinutes <= 0) {
      return;
    }

    // Thiết lập số giây ban đầu
    setTimeLeftSeconds(autoLockMinutes * 60);

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
          setToast({ text: t.head_toastAutoLock, type: 'info' });
          setTimeout(() => setToast(null), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const resetTimer = () => {
      setTimeLeftSeconds(autoLockMinutes * 60);
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
  }, [isUnlocked, autoLockMinutes, t]);

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
    
    if (exists) {
      updated = entries.map(e => e.id === savedEntry.id ? savedEntry : e);
      triggerToast('Cập nhật tài khoản thành công!');
    } else {
      updated = [savedEntry, ...entries];
      triggerToast('Đã lưu tài khoản bảo mật mới!');
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
    categories.forEach((cat) => {
      counts[cat.id] = entries.filter((e) => e.category === cat.id).length;
    });
    return {
      total: entries.length,
      fav: entries.filter((e) => e.isFavorite).length,
      counts,
    };
  }, [entries, categories]);

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
  }, [entries, activeCategory, searchQuery, sortBy]);

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
    return entries
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
  }, [entries]);

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
    <div id="main-vault-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5  py-3.5 rounded-2xl flex items-center gap-2.5 font-medium shadow-2xl border text-sm backdrop-blur-md ${
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
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-0 md:h-20 flex flex-col gap-4 md:gap-0 md:grid md:grid-cols-3 items-center">
          
          {/* LEFT COLUMN: Tool Buttons (Tạo mật khẩu, Sao lưu lưu trữ) */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-center md:justify-start order-2 md:order-1 md:h-full">
            {/* Password Generator Sidebar Toggle */}
            <button
              id="gen-tools-toggle"
              type="button"
              onClick={() => {
                setShowGenTools(!showGenTools);
                setShowSettings(false);
              }}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showGenTools 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={t.head_createPwd}
            >
              <KeyRound className="h-4 w-4 shrink-0 text-emerald-500/70" />
              <span>{t.head_createPwd}</span>
            </button>

            {/* Settings and Backup/Restore Panel Link */}
            <button
              id="settings-panel-toggle"
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                setShowGenTools(false);
              }}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showSettings 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={t.head_backup}
            >
              <Settings className="h-4 w-4 shrink-0 text-emerald-500/70" />
              <span>{t.head_backup}</span>
            </button>
          </div>

          {/* CENTER COLUMN: Identity (Prominent, Centered, Aesthetic) */}
          <div className="flex flex-col items-center justify-center order-1 md:order-2 text-center md:h-full">
            <div className="flex items-center gap-3 bg-gradient-to-b from-slate-900 to-slate-950/60 pl-4 pr-5 py-2.5 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/35 transition-all group/header">
              <div className="h-9.5 w-9.5 bg-emerald-500/10 rounded-xl border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner group-hover/header:border-emerald-400 transition-colors">
                <Shield className="h-4.5 w-4.5 fill-emerald-550/10 group-hover/header:scale-105 transition-transform" />
              </div>
              
              <div className="relative text-left">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-wide uppercase select-none font-sans">
                    {currentVaultTitle}
                  </h1>
                  <button
                    id="rename-app-btn"
                    type="button"
                    onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-450 transition-colors cursor-pointer"
                    title={t.head_renameBtn}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest font-mono select-none">{t.head_encryptionText}</p>

                {showTitleSuggestions && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-72 bg-slate-950 border border-slate-800/80 p-4 rounded-2xl shadow-2xl z-50 text-left animate-slide-up">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{t.head_renameSuggestionsTitle}</span>
                      <button 
                        type="button"
                        onClick={() => setShowTitleSuggestions(false)}
                        className="text-slate-500 hover:text-slate-400 text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'vi' ? 'Đóng' : 'Close'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">{t.head_renameDesc}</p>
                    
                    {/* Suggestion list */}
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
                            className={`text-left px-2 py-1.5 text-[11px] font-medium rounded-lg border transition-all cursor-pointer truncate ${
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

                    {/* Manual Rename field */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t.head_renameCustomField}</label>
                      <div className="flex gap-1.5">
                        <input
                          id="custom-rename-input"
                          type="text"
                          value={customAppTitle}
                          onChange={(e) => setCustomAppTitle(e.target.value)}
                          placeholder={t.head_renameCustomPlc}
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Auto lock settings & Locked actions */}
          <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto order-3 md:h-full">
            
            {/* 1. Language Toggle Icon Displayed at Top Right */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLangChange(lang === 'vi' ? 'en' : 'vi')}
                className="p-1 px-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                title={lang === 'vi' ? 'Lockscreen language settings (EN / VN)' : 'Chuyển đổi ngôn ngữ hiển thị (VI / EN)'}
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">
                  {lang === 'vi' ? 'VI' : 'EN'}
                </span>
              </button>
            </div>

            {/* 2. Unified Auto-Lock Countdown + Timer Configuration Pill Capsule */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-xl p-1 shrink-0">
              {isEditingAutoLock ? (
                <div className="flex items-center gap-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-0.5 shadow-inner">
                  <Clock className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
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
                    className="font-mono font-extrabold text-indigo-400 text-[11px] w-12 bg-transparent text-center outline-none border-b border-indigo-500/30 focus:border-indigo-400 pb-0.5"
                    autoFocus
                    placeholder="3"
                  />
                  <span className="text-[9px] text-slate-500 font-bold font-mono uppercase pb-0.5 select-none shrink-0">
                    m
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setIsEditingAutoLock(true);
                    setTempAutoLockVal(String(autoLockMinutes));
                  }}
                  className="flex items-center gap-1.5 text-slate-400 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950/45 border border-slate-850 hover:bg-slate-900/40 hover:border-slate-800 hover:text-slate-200 transition-all select-none cursor-pointer group"
                  title={lang === 'vi' ? 'Bấm để đổi thời gian tự khóa (phút, 0 để tắt)' : 'Click to customize auto-lock minutes (0 to disable)'}
                >
                  <Clock className={`h-3.5 w-3.5 group-hover:text-indigo-400 transition-colors ${autoLockMinutes > 0 ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                  <span className="font-mono font-extrabold text-indigo-400 text-[11px] min-w-[34px] text-center pb-0.5 border-b border-transparent group-hover:border-indigo-400/40 transition-colors">
                    {autoLockMinutes === 0 ? '00:00' : (isCountdownHidden ? '••:••' : formatCountdown(timeLeftSeconds))}
                  </span>
                </div>
              )}

              {/* Eye toggle check countdown visibility */}
              <button
                type="button"
                onClick={toggleCountdownVisibility}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title={isCountdownHidden ? (lang === 'vi' ? 'Hiện đếm ngược' : 'Show countdown') : (lang === 'vi' ? 'Ẩn đếm ngược' : 'Hide countdown')}
              >
                {isCountdownHidden ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-indigo-400" />}
              </button>

              {/* Lock app button */}
              <button
                id="app-lock-btn"
                type="button"
                onClick={() => handleLock()}
                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/35 text-rose-400 hover:text-rose-300 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                title={t.head_lockBtn}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>

        </div>
      </header>

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
                    <span className="bg-indigo-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full leading-none">
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
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
                      <span className="text-[10px] font-semibold text-slate-500 font-mono">
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
                  
                  <div className="mt-3.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
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

            <hr className="border-slate-800/40" />

            {/* Custom Storage Category manager header */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t.side_storageTypes}</span>
                </h3>
                
                <div className="flex items-center gap-1.5 font-sans">
                  {/* Display options / Tùy chọn hiển thị button */}
                  <button
                    type="button"
                    onClick={() => setShowSidebarOptions(!showSidebarOptions)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-sm font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 cursor-pointer ${
                      showSidebarOptions
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={t.side_displayBtn}
                  >
                    <Settings className={`h-3 w-3 transition-transform duration-500 ${showSidebarOptions ? 'rotate-45 text-emerald-400' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{t.side_displayBtn}</span>
                  </button>

                  {/* Lock button */}
                  <button
                    id="categories-lock-btn"
                    type="button"
                    onClick={() => {
                      setIsCategoriesLocked(!isCategoriesLocked);
                      if (isCategoriesLocked) {
                        // reset inline Add Cat widget
                        setShowAddCatForm(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 cursor-pointer ${
                      isCategoriesLocked 
                        ? 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700' 
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-semibold shadow-lg shadow-amber-500/5'
                    }`}
                    title={isCategoriesLocked ? t.side_unlockEditTooltip : t.side_lockEditTooltip}
                  >
                    {isCategoriesLocked ? (
                      <>
                        <Lock className="h-3 w-3 text-slate-400" />
                        <span className="hidden sm:inline">{t.side_lockedState}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 text-amber-400 animate-pulse" />
                        <span className="hidden sm:inline">{t.side_editState}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Display Options right below header */}
              {showSidebarOptions && (
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 mb-3 space-y-3 text-left animate-fade-in">
                  <div className="flex flex-col gap-2">
                    {/* Compact Mode Toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer select-none group/opt">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={sidebarCompact}
                          onChange={(e) => setSidebarCompact(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 h-4 w-4 accent-emerald-500 cursor-pointer transition-all"
                        />
                      </div>
                      <span className="transition-colors group-hover/opt:text-slate-300">{t.side_optCompact}</span>
                    </label>

                    {/* Hide empty categories mode toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer select-none group/opt">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={hideEmptyCategories}
                          onChange={(e) => setHideEmptyCategories(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 h-4 w-4 accent-emerald-500 cursor-pointer transition-all"
                        />
                      </div>
                      <span className="transition-colors group-hover/opt:text-slate-300">
                        {t.side_optHideEmpty} ({categories.filter(c => (stats.counts[c.id] || 0) === 0).length})
                      </span>
                    </label>

                    {/* Hide counts toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer select-none group/opt">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={hideCounts}
                          onChange={(e) => setHideCounts(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-505/20 h-4 w-4 accent-emerald-500 cursor-pointer transition-all"
                        />
                      </div>
                      <span className="transition-colors group-hover/opt:text-slate-300">{t.side_optHideCounts}</span>
                    </label>

                    {/* Hide compact summaries toggle */}
                    <label className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer select-none group/opt">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={hideCompactSummaries}
                          onChange={(e) => handleSetHideCompactSummaries(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20 h-4 w-4 accent-emerald-500 cursor-pointer transition-all"
                        />
                      </div>
                      <span className="transition-colors group-hover/opt:text-slate-300">{t.side_optHideSums}</span>
                    </label>
                  </div>

                  {/* Sắp xếp phân loại */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-850/60 pb-1">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t.side_sortHeading}</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850/60">
                      {[
                        { id: 'default', label: t.side_sortManual },
                        { id: 'alpha', label: t.side_sortAlpha },
                        { id: 'count', label: t.side_sortCount },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCategorySortMode(opt.id as any)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center cursor-pointer transition-all ${
                            categorySortMode === opt.id
                              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/10 shadow-sm'
                              : 'text-slate-500 hover:text-slate-355 border border-transparent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bố cục danh mục */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-850/60 pb-1">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">{t.side_layoutHeading}</span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850/60">
                      {[
                        { id: 'list', label: t.side_layoutList, icon: <List className="h-3 w-3" /> },
                        { id: 'grid', label: t.side_layoutGrid, icon: <LayoutGrid className="h-3 w-3" /> },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetCategoryLayoutMode(opt.id as 'list' | 'grid')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            categoryLayoutMode === opt.id
                              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/10 shadow-sm'
                              : 'text-slate-500 hover:text-slate-205 border border-transparent'
                          }`}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Categories List */}
              <div className={`${
                categoryLayoutMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1'
              } overflow-y-auto pr-0.5 scrollbar-thin select-none transition-all duration-350 ${
                sidebarCompact ? 'max-h-[220px]' : 'max-h-[300px]'
              }`}>
                {displayedCategories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const originalIdx = categories.findIndex(c => c.id === cat.id);
                  const displayLabel = lang === 'en' ? (cat.id === 'bank' ? 'Bank details' : cat.id === 'social' ? 'Social Accounts' : cat.id === 'web' ? 'Regular Web' : cat.id === 'wallet' ? 'Crypto Wallets' : cat.id === 'ewallet' ? 'E-Wallets' : cat.id === 'phoneapp' ? 'Phone Apps' : cat.id === 'note' ? 'Secure Notes' : cat.id === 'sheet' ? 'Spreadsheets' : cat.label) : cat.label;
                  
                  return (
                    <div 
                      key={cat.id} 
                      className={`flex items-center justify-between rounded-xl border transition-all font-semibold group ${
                        categoryLayoutMode === 'grid'
                          ? (sidebarCompact ? 'px-2 py-1.5 text-xs' : 'px-2.5 py-1.5 text-sm')
                          : (sidebarCompact ? 'px-2 py-1.5 text-sm' : 'px-2.5 py-2.5 text-base')
                      } ${
                        isActive 
                          ? 'bg-slate-950/90 text-emerald-400 border-l-2 border-emerald-500 border-y-slate-950 border-r-slate-950 pl-2' 
                          : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-950/20'
                      }`}
                    >
                      {/* Left: icon/label */}
                      <button
                        type="button"
                        onClick={() => {
                          // we can still filter even if unlocked, for rapid debug
                          setActiveCategory(cat.id);
                        }}
                        className="flex-1 text-left flex items-center gap-1.5 cursor-pointer outline-none overflow-hidden"
                      >
                        <span className={isActive ? 'text-emerald-400 shrink-0' : 'text-slate-500 group-hover:text-slate-300 flex-shrink-0'}>
                          {getCategoryIcon(cat.iconType)}
                        </span>
                        <span className="truncate" title={displayLabel}>{displayLabel}</span>
                      </button>

                      {/* Right: counter or control actions */}
                      {isCategoriesLocked ? (
                        !hideCounts && (
                          <span className={`font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                            categoryLayoutMode === 'grid' ? 'text-[11px]' : (sidebarCompact ? 'text-xs' : 'text-xs')
                          } ${
                            isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-950 text-slate-500'
                          }`}>
                            {stats.counts[cat.id] || 0}
                          </span>
                        )
                      ) : (
                        <div className={`flex items-center gap-0.5 flex-shrink-0 animate-fade-in ${
                          categoryLayoutMode === 'grid' ? 'flex-wrap justify-end max-w-[45px]' : ''
                        }`}>
                          {/* Reorder Up */}
                          <button
                            type="button"
                            disabled={originalIdx === 0}
                            onClick={() => moveCategory(originalIdx, 'up')}
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 text-slate-400 hover:text-slate-200 cursor-pointer"
                            title={t.side_moveUp}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          
                          {/* Reorder Down */}
                          <button
                            type="button"
                            disabled={originalIdx === categories.length - 1}
                            onClick={() => moveCategory(originalIdx, 'down')}
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-20 text-slate-400 hover:text-slate-200 cursor-pointer"
                            title={t.side_moveDown}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>

                          {/* Rename */}
                          <button
                            type="button"
                            onClick={() => renameCategory(cat.id, cat.label)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 cursor-pointer"
                            title={t.side_renameCatTooltip}
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteCategory(cat.id, cat.label)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            title={t.side_deleteCatTooltip}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Plus add category row for Unlocked modes */}
              {!isCategoriesLocked && (
                <div className="mt-3">
                  {!showAddCatForm ? (
                    <button
                      type="button"
                      onClick={() => setShowAddCatForm(true)}
                      className="w-full flex items-center justify-center gap-1 border border-dashed border-slate-800 hover:border-emerald-500/40 text-slate-500 hover:text-emerald-400 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-slate-950/20"
                    >
                      <span>+ {t.side_addNewCatBtn}</span>
                    </button>
                  ) : (
                    <form onSubmit={addCustomCategorySubmit} className="bg-slate-950/70 p-3 rounded-xl border border-slate-850 space-y-2.5 animate-slide-up text-left">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {t.side_newCatHeader}
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                          {t.side_newCatLabelField}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t.side_newCatLabelPlc}
                          value={newCatLabel}
                          onChange={(e) => setNewCatLabel(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm outline-none text-slate-200 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                          {t.side_newCatSchemaField}
                        </label>
                        <select
                          value={newCatIconType}
                          onChange={(e) => setNewCatIconType(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm outline-none text-slate-355 cursor-pointer focus:border-emerald-500"
                        >
                          <option value="bank">{lang === 'vi' ? 'Ngân hàng (Tài khoản, PIN...)' : 'Bank Details (Accounts & PIN)'}</option>
                          <option value="social">{lang === 'vi' ? 'Mạng xã hội (E-mail, Mật khẩu...)' : 'Social Medias (E-mail, Password)'}</option>
                          <option value="web">{lang === 'vi' ? 'Web thông thường (URL, Username...)' : 'Generic Websites (URLs)'}</option>
                          <option value="wallet">{lang === 'vi' ? 'Ví Crypto (Sàn, Address, Seed Phrase...)' : 'Crypto Wallets (Seeds & Keys)'}</option>
                          <option value="ewallet">{lang === 'vi' ? 'Ví điện tử (Momo, ZaloPay, PIN...)' : 'E-Wallets (Momo, Pin)'}</option>
                          <option value="phoneapp">{lang === 'vi' ? 'App di động (Đăng nhập, PIN, CCCD...)' : 'Phone Apps (Login & PIN)'}</option>
                          <option value="sheet">{lang === 'vi' ? 'Bảng tính (Google Sheet tự dựng)' : 'Excel/Spreadsheets context'}</option>
                          <option value="note">{lang === 'vi' ? 'Ghi chú (Văn bản tự do)' : 'Secure Freeform Notes'}</option>
                        </select>
                      </div>

                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCatForm(false);
                            setNewCatLabel('');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-755 text-slate-400 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {lang === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          {lang === 'vi' ? 'Lưu' : 'Save'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
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
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-900 border border-slate-800/40 p-4.5 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                id="search-input"
                type="text"
                placeholder={t.work_searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-655 rounded-xl text-base outline-none transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-sm font-semibold cursor-pointer"
                >
                  {lang === 'vi' ? 'Xóa' : 'Clear'}
                </button>
              )}
            </div>

            {/* Sort & Display Controls */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 font-medium">{t.work_sortByLabel}</span>
                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    id="sort-recent"
                    type="button"
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      sortBy === 'recent' 
                        ? 'bg-slate-900 text-emerald-400' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.work_sortByRecent}
                  </button>
                  <button
                    id="sort-alpha"
                    type="button"
                    onClick={() => setSortBy('alphabetical')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      sortBy === 'alphabetical' 
                        ? 'bg-slate-900 text-emerald-400' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.work_sortByAlpha}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-800 pl-3 md:pl-4 md:ml-1">
                <span className="text-sm text-slate-500 font-medium">{t.work_viewModeLabel}</span>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    id="view-grid-btn"
                    type="button"
                    onClick={() => handleSetViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      viewMode === 'grid' 
                        ? 'bg-slate-900 text-emerald-400' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                    title={t.work_viewGridTooltip}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    id="view-table-btn"
                    type="button"
                    onClick={() => handleSetViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                      viewMode === 'table' 
                        ? 'bg-slate-900 text-emerald-400' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                    title={t.work_viewTableTooltip}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
                        <p className="text-[11px] text-slate-500 mt-1">
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
                        <p className="text-[11px] text-slate-500 mt-1">
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

          {/* Main Credentials Display Area */}
          <div id="credentials-grid-flow">
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
    </div>
  );
}
