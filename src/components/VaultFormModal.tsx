import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, KeyRound, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { VaultEntry, VaultCategory, CustomCategory } from '../types';
import PasswordGenerator from './PasswordGenerator';
import { LangType, translations } from '../utils/lang';

interface VaultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  editingEntry: VaultEntry | null;
  customCategories?: CustomCategory[];
}

export default function VaultFormModal({ isOpen, onClose, onSave, editingEntry, customCategories }: VaultFormModalProps) {
  const isPro = localStorage.getItem('secure_vault_pro_active') === 'true';
  const lang = (localStorage.getItem('secure_vault_lang') as LangType) || 'vi';
  const t = translations[lang];

  const [category, setCategory] = useState<VaultCategory>('bank');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');

  // Reminder Fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'yearly'>('yearly');
  const [reminderMessage, setReminderMessage] = useState('');

  // Bank Specific Fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankPin, setBankPin] = useState('');
  const [bankUsername, setBankUsername] = useState('');
  const [bankPassword, setBankPassword] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Social Specific Fields
  const [platformName, setPlatformName] = useState('');
  const [socialUsername, setSocialUsername] = useState('');
  const [socialPassword, setSocialPassword] = useState('');
  const [socialUrl, setSocialUrl] = useState('');

  // Web Specific Fields
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [webUsername, setWebUsername] = useState('');
  const [webPassword, setWebPassword] = useState('');

  // Note Specific Fields
  const [noteContent, setNoteContent] = useState('');

  // Wallet Specific Fields
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'exchange' | 'dex_app' | 'hardware'>('exchange');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletUsername, setWalletUsername] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [walletSeedPhrase, setWalletSeedPhrase] = useState('');
  const [walletPrivateKey, setWalletPrivateKey] = useState('');
  const [walletApiKey, setWalletApiKey] = useState('');
  const [walletApiSecret, setWalletApiSecret] = useState('');

  // EWallet Specific Fields
  const [ewalletName, setEwalletName] = useState('');
  const [ewalletPhone, setEwalletPhone] = useState('');
  const [ewalletHolder, setEwalletHolder] = useState('');
  const [ewalletPin, setEwalletPin] = useState('');
  const [ewalletPassword, setEwalletPassword] = useState('');
  const [ewalletLinkedBank, setEwalletLinkedBank] = useState('');

  // Phone App Specific Fields (VNeID, VNeTraffic...)
  const [phoneappName, setPhoneappName] = useState('');
  const [phoneappUsername, setPhoneappUsername] = useState('');
  const [phoneappPassword, setPhoneappPassword] = useState('');
  const [phoneappPasscode, setPhoneappPasscode] = useState('');
  const [phoneappNationalId, setPhoneappNationalId] = useState('');
  const [phoneappEmail, setPhoneappEmail] = useState('');

  // Google Sheet Specific Fields
  const [sheetHeaders, setSheetHeaders] = useState<string[]>(['Cột 1', 'Cột 2', 'Cột 3']);
  const [sheetRows, setSheetRows] = useState<string[][]>([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [syncMode, setSyncMode] = useState<'public' | 'private'>('public');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleAccount, setGoogleAccount] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  // Google Drive Large File Fields
  const [driveFileName, setDriveFileName] = useState('');
  const [driveFileSize, setDriveFileSize] = useState('1.0 GB');
  const [driveMediaType, setDriveMediaType] = useState<'video' | 'image' | 'archive' | 'audio' | 'document' | 'other'>('video');
  const [driveLink, setDriveLink] = useState('');
  const [isDriveOptimized, setIsDriveOptimized] = useState(true);
  const [isSecret, setIsSecret] = useState(false);

  // Find which template style to use
  const activeTemplateType = (() => {
    if (customCategories) {
      const matched = customCategories.find(c => c.id === category);
      if (matched) return matched.iconType;
    }
    return category as any; // fallback
  })();

  // Password Generator toggles
  const [showPassGen, setShowPassGen] = useState(false);
  const [passGenTarget, setPassGenTarget] = useState<'bank' | 'social' | 'web' | 'wallet' | 'ewallet' | 'phoneapp' | null>(null);

  // Field Reveal states
  const [showFormSecrets, setShowFormSecrets] = useState<{ [key: string]: boolean }>({});

  // Synchronize editing states
  useEffect(() => {
    if (editingEntry) {
      setCategory(editingEntry.category);
      setTitle(editingEntry.title);
      setNotes(editingEntry.notes || '');
      setIsFavorite(!!editingEntry.isFavorite);
      setIsSecret(!!editingEntry.isSecret);
      setTotpSecret(editingEntry.totpSecret || '');

      // Load reminder configuration if present
      if (editingEntry.reminder) {
        setReminderEnabled(editingEntry.reminder.enabled);
        setReminderDate(editingEntry.reminder.date || '');
        setReminderType(editingEntry.reminder.type || 'yearly');
        setReminderMessage(editingEntry.reminder.message || '');
      } else {
        setReminderEnabled(false);
        setReminderDate('');
        setReminderType('yearly');
        setReminderMessage('');
      }

      if (editingEntry.category === 'bank') {
        setBankName(editingEntry.bankName || '');
        setAccountNumber(editingEntry.accountNumber || '');
        setAccountHolder(editingEntry.accountHolder || '');
        setBankPin(editingEntry.pin || '');
        setBankUsername(editingEntry.username || '');
        setBankPassword(editingEntry.password || '');
        setBankBranch(editingEntry.branch || '');
      } else if (editingEntry.category === 'social') {
        setPlatformName(editingEntry.platformName || '');
        setSocialUsername(editingEntry.username || '');
        setSocialPassword(editingEntry.password || '');
        setSocialUrl(editingEntry.url || '');
      } else if (editingEntry.category === 'web') {
        setWebsiteUrl(editingEntry.websiteUrl || '');
        setWebUsername(editingEntry.username || '');
        setWebPassword(editingEntry.password || '');
      } else if (editingEntry.category === 'note') {
        setNoteContent(editingEntry.content || '');
      } else if (editingEntry.category === 'wallet') {
        setWalletName(editingEntry.walletName || '');
        setWalletType(editingEntry.walletType || 'exchange');
        setWalletAddress(editingEntry.address || '');
        setWalletUsername(editingEntry.username || '');
        setWalletPassword(editingEntry.password || '');
        setWalletSeedPhrase(editingEntry.seedPhrase || '');
        setWalletPrivateKey(editingEntry.privateKey || '');
        setWalletApiKey(editingEntry.apiKey || '');
        setWalletApiSecret(editingEntry.apiSecret || '');
      } else if (editingEntry.category === 'ewallet') {
        setEwalletName(editingEntry.ewalletName || '');
        setEwalletPhone(editingEntry.phoneNumber || '');
        setEwalletHolder(editingEntry.accountHolder || '');
        setEwalletPin(editingEntry.pin || '');
        setEwalletPassword(editingEntry.password || '');
        setEwalletLinkedBank(editingEntry.linkedBank || '');
      } else if (editingEntry.category === 'phoneapp') {
        setPhoneappName(editingEntry.appName || '');
        setPhoneappUsername(editingEntry.username || '');
        setPhoneappPassword(editingEntry.password || '');
        setPhoneappPasscode(editingEntry.passcode || '');
        setPhoneappNationalId(editingEntry.nationalId || '');
        setPhoneappEmail(editingEntry.email || '');
      } else if (editingEntry.category === 'sheet') {
        setSheetHeaders(editingEntry.headers || ['Cột 1', 'Cột 2', 'Cột 3']);
        setSheetRows(editingEntry.rows || [['', '', ''], ['', '', '']]);
        setIsIntegrated(!!editingEntry.isIntegrated);
        setSyncMode(editingEntry.syncMode || 'public');
        setSpreadsheetUrl(editingEntry.spreadsheetUrl || '');
        setGoogleClientId(editingEntry.googleClientId || '');
        setGoogleAccount(editingEntry.googleAccount || '');
        setLastSyncTime(editingEntry.lastSyncTime);
        setSyncError('');
      } else if (editingEntry.category === 'gdrive') {
        const dEntry = editingEntry as any;
        setDriveFileName(dEntry.fileName || '');
        setDriveFileSize(dEntry.fileSize || '1.0 GB');
        setDriveMediaType(dEntry.mediaType || 'video');
        setDriveLink(dEntry.driveLink || '');
        setIsDriveOptimized(dEntry.isOptimized !== false);
      }
    } else {
      // Clear forms
      setCategory('bank');
      setTitle('');
      setNotes('');
      setIsFavorite(false);
      setIsSecret(false);

      setReminderEnabled(false);
      setReminderDate('');
      setReminderType('yearly');
      setReminderMessage('');

      setDriveFileName('');
      setDriveFileSize('1.0 GB');
      setDriveMediaType('video');
      setDriveLink('');
      setIsDriveOptimized(true);

      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setBankPin('');
      setBankUsername('');
      setBankPassword('');
      setBankBranch('');

      setPlatformName('');
      setSocialUsername('');
      setSocialPassword('');
      setSocialUrl('');

      setWebsiteUrl('');
      setWebUsername('');
      setWebPassword('');

      setNoteContent('');

      setWalletName('');
      setWalletType('exchange');
      setWalletAddress('');
      setWalletUsername('');
      setWalletPassword('');
      setWalletSeedPhrase('');
      setWalletPrivateKey('');
      setWalletApiKey('');
      setWalletApiSecret('');

      setEwalletName('');
      setEwalletPhone('');
      setEwalletHolder('');
      setEwalletPin('');
      setEwalletPassword('');
      setEwalletLinkedBank('');

      setPhoneappName('');
      setPhoneappUsername('');
      setPhoneappPassword('');
      setPhoneappPasscode('');
      setPhoneappNationalId('');
      setPhoneappEmail('');

      setSheetHeaders(['Tiêu đề', 'Mã số / Khóa', 'Mô tả']);
      setSheetRows([
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ]);
      setIsIntegrated(false);
      setSyncMode('public');
      setSpreadsheetUrl('');
      setGoogleClientId('');
      setGoogleAccount('');
      setLastSyncTime(undefined);
      setSyncError('');
      setTotpSecret('');
    }
    setShowPassGen(false);
    setPassGenTarget(null);
  }, [editingEntry, isOpen]);

  const handleGoogleSheetSync = async () => {
    if (!spreadsheetUrl.trim()) return;
    setIsSyncing(true);
    setSyncError('');

    // Extract Spreadsheet ID from URL
    let spreadsheetId = '';
    const urlMatch = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      spreadsheetId = urlMatch[1];
    } else {
      // Maybe they pasted the ID directly
      spreadsheetId = spreadsheetUrl.trim();
    }

    if (!spreadsheetId) {
      setSyncError('Không tìm thấy ID bảng tính hợp lệ trong URL.');
      setIsSyncing(false);
      return;
    }

    try {
      if (syncMode === 'public') {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu. Hãy đảm bảo bạn đã chia sẻ quyền "Bất kỳ ai có liên kết đều có thể xem" (Anyone with the link can view) trên Google Sheet.');
        }
        const text = await response.text();
        
        // Custom robust CSV parser that correctly handles quoted strings, line breaks, and commas
        const lines: string[][] = [];
        let row = [""];
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i+1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              row[row.length - 1] += '"';
              i++; // skip next quote
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
          throw new Error('Bảng tính trống hoặc không có nội dung.');
        }

        const headers = filteredLines[0];
        const rows = filteredLines.slice(1);

        setSheetHeaders(headers);
        setSheetRows(rows);
        setLastSyncTime(Date.now());
      } else {
        // Private google account sync
        let tokenToUse = '';
        const token = window.prompt("Nhập OAuth Access Token của tài khoản Google khác để đọc bảng tính riêng tư:\n\n(Cách nhanh nhất: Bạn có thể chọn chế độ 'Công khai' và chia sẻ quyền xem cho liên kết để tránh bước này)");
        if (token && token.trim()) {
          tokenToUse = token.trim();
        } else {
          setIsSyncing(false);
          return;
        }

        const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z100`;
        const response = await fetch(fetchUrl, {
          headers: { 'Authorization': `Bearer ${tokenToUse}` }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Không thể đồng bộ. Quyền truy cập bị từ chối hoặc Access Token hết hạn.');
        }

        const data = await response.json();
        if (!data.values || data.values.length === 0) {
          throw new Error('Bảng tính trống hoặc không tìm thấy cột dữ liệu.');
        }

        const headers = data.values[0];
        const rows = data.values.slice(1);

        setSheetHeaders(headers);
        setSheetRows(rows);
        setGoogleAccount('Tài khoản đã xác thực');
        setLastSyncTime(Date.now());
      }
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || 'Đã xảy ra lỗi không rõ.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetData: any = {
      id: editingEntry?.id || Math.random().toString(36).substring(2, 11),
      category,
      title: title.trim(),
      notes: notes.trim() || undefined,
      isFavorite,
      totpSecret: totpSecret.trim() || undefined,
      updatedAt: Date.now(),
      createdAt: editingEntry?.createdAt || Date.now()
    };

    if (reminderEnabled && reminderDate) {
      targetData.reminder = {
        enabled: true,
        date: reminderDate,
        type: reminderType,
        message: reminderMessage.trim() || undefined
      };
    } else {
      targetData.reminder = undefined;
    }

    if (activeTemplateType === 'bank') {
      targetData = {
        ...targetData,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        pin: bankPin.trim() || undefined,
        username: bankUsername.trim() || undefined,
        password: bankPassword.trim() || undefined,
        branch: bankBranch.trim() || undefined,
      };
    } else if (activeTemplateType === 'social') {
      targetData = {
        ...targetData,
        platformName: platformName.trim() || title.trim(),
        username: socialUsername.trim(),
        password: socialPassword.trim() || undefined,
        url: socialUrl.trim() || undefined,
      };
    } else if (activeTemplateType === 'web') {
      targetData = {
        ...targetData,
        websiteUrl: websiteUrl.trim(),
        username: webUsername.trim(),
        password: webPassword.trim() || undefined,
      };
    } else if (activeTemplateType === 'note') {
      targetData = {
        ...targetData,
        content: noteContent,
      };
    } else if (activeTemplateType === 'wallet') {
      targetData = {
        ...targetData,
        walletName: walletName.trim(),
        walletType,
        username: walletUsername.trim() || undefined,
        password: walletPassword.trim() || undefined,
        address: walletAddress.trim() || undefined,
        seedPhrase: walletSeedPhrase.trim() || undefined,
        privateKey: walletPrivateKey.trim() || undefined,
        apiKey: walletApiKey.trim() || undefined,
        apiSecret: walletApiSecret.trim() || undefined,
      };
    } else if (activeTemplateType === 'ewallet') {
      targetData = {
        ...targetData,
        ewalletName: ewalletName.trim(),
        phoneNumber: ewalletPhone.trim(),
        accountHolder: ewalletHolder.trim() || undefined,
        pin: ewalletPin.trim() || undefined,
        password: ewalletPassword.trim() || undefined,
        linkedBank: ewalletLinkedBank.trim() || undefined,
      };
    } else if (activeTemplateType === 'phoneapp') {
      targetData = {
        ...targetData,
        appName: phoneappName.trim() || title.trim(),
        username: phoneappUsername.trim() || undefined,
        password: phoneappPassword.trim() || undefined,
        passcode: phoneappPasscode.trim() || undefined,
        nationalId: phoneappNationalId.trim() || undefined,
        email: phoneappEmail.trim() || undefined,
      };
    } else if (activeTemplateType === 'sheet') {
      targetData = {
        ...targetData,
        headers: sheetHeaders,
        rows: sheetRows,
        isIntegrated,
        syncMode,
        spreadsheetUrl: spreadsheetUrl.trim(),
        googleClientId: googleClientId.trim(),
        googleAccount: googleAccount.trim(),
        lastSyncTime,
      };
    } else if (activeTemplateType === 'gdrive') {
      targetData = {
        ...targetData,
        fileName: driveFileName.trim() || title.trim(),
        fileSize: driveFileSize.trim() || '1.0 GB',
        mediaType: driveMediaType,
        driveLink: driveLink.trim(),
        isOptimized: isDriveOptimized,
      };
    }

    onSave(targetData);
  };

  const handlePasswordFromGenerator = (password: string) => {
    if (passGenTarget === 'bank') setBankPassword(password);
    if (passGenTarget === 'social') setSocialPassword(password);
    if (passGenTarget === 'web') setWebPassword(password);
    if (passGenTarget === 'wallet') setWalletPassword(password);
    if (passGenTarget === 'ewallet') setEwalletPassword(password);
    setShowPassGen(false);
  };

  const toggleFormSecrets = (key: string) => {
    setShowFormSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="modal-card-container" 
        className="w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/20">
          <h3 className="text-lg font-semibold text-white">
            {editingEntry ? 'Chỉnh sửa tài khoản / ghi chú' : 'Thêm tài khoản / nội dung cần nhớ'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form id="vault-form" onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {/* Category selection - Only allowed on fresh creation */}
          {!editingEntry && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Loại lưu trữ
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['bank', 'social', 'web', 'wallet', 'ewallet', 'phoneapp', 'sheet', 'note', 'gdrive'] as VaultCategory[])
                  .filter(cat => isPro ? true : (cat !== 'sheet' && cat !== 'gdrive'))
                  .map((cat) => {
                  let visualText = '';
                  if (cat === 'bank') visualText = 'N.Hàng';
                  if (cat === 'social') visualText = 'Mã xh';
                  if (cat === 'web') visualText = 'Web/App';
                  if (cat === 'wallet') visualText = 'V.Crypto';
                  if (cat === 'ewallet') visualText = 'V.Momo';
                  if (cat === 'phoneapp') visualText = 'App Mob';
                  if (cat === 'sheet') visualText = 'Bảng tính';
                  if (cat === 'note') visualText = 'Ghi chú';
                  if (cat === 'gdrive') visualText = 'Bảo Mật Drive (>1GB)';

                  return (
                    <button
                      id={`cat-select-${cat}`}
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-center py-2 px-1 text-[10px] font-semibold rounded-xl border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-lg shadow-emerald-500/5 col-span-2'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {visualText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tiêu đề gợi nhớ <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-title-input"
              type="text"
              required
              placeholder={
                activeTemplateType === 'bank' ? 'Ví dụ: Vietcombank Cá nhân, Techcombank Doanh nghiệp' :
                activeTemplateType === 'social' ? 'Ví dụ: Facebook Cá nhân, Google Công việc' :
                activeTemplateType === 'web' ? 'Ví dụ: Tài khoản Netflix, Hosting Vhost' :
                activeTemplateType === 'wallet' ? 'Ví dụ: Sàn Binance, Ví Trust Wallet, MetaMask' :
                activeTemplateType === 'ewallet' ? 'Ví dụ: Ví Momo cá nhân, ZaloPay, ViettelPay' : 
                activeTemplateType === 'phoneapp' ? 'Ví dụ: Tài khoản VNeID của bố, eTax Mobile cá nhân' :
                activeTemplateType === 'sheet' ? 'Ví dụ: Bảng thu chi năm nay, Danh bạ khẩn cấp' : 'Ví dụ: Ý tưởng dự án mới, Chú ý hóa đơn'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm placeholder-slate-650 outline-none transition-all"
            />
          </div>

          {/* DYNAMIC FORM SEGMENTS */}

          {/* Bank Accounts Segment */}
          {activeTemplateType === 'bank' && (
            <div className="space-y-4 border-l border-slate-800 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên ngân hàng
                </label>
                <input
                  id="form-bank-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Techcombank, Vietinbank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Số tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-bank-acc"
                    type="text"
                    required
                    placeholder="Nhập số tài khoản..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Chủ tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-bank-holder"
                    type="text"
                    required
                    placeholder="VIET VAN A..."
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tên đăng nhập (iBanking)
                  </label>
                  <input
                    id="form-bank-username"
                    type="text"
                    placeholder="Nếu có..."
                    value={bankUsername}
                    onChange={(e) => setBankUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu (iBanking)
                  </label>
                  <div className="relative">
                    <input
                      id="form-bank-password"
                      type={showFormSecrets['bankPass'] ? 'text' : 'password'}
                      placeholder="Nếu có..."
                      value={bankPassword}
                      onChange={(e) => setBankPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('bankPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showFormSecrets['bankPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('bank');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Tự tạo mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mã PIN / Rút tiền
                  </label>
                  <input
                    id="form-bank-pin"
                    type="text"
                    maxLength={6}
                    placeholder="Mã PIN 4-6 số..."
                    value={bankPin}
                    onChange={(e) => setBankPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Chi nhánh ngân hàng
                  </label>
                  <input
                    id="form-bank-branch"
                    type="text"
                    placeholder="Ví dụ: PGD Bến Thành..."
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Social Media Accounts Segment */}
          {activeTemplateType === 'social' && (
            <div className="space-y-4 border-l border-slate-800 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên mạng xã hội
                </label>
                <input
                  id="form-soc-platform"
                  type="text"
                  placeholder="Ví dụ: Facebook, Google, Zalo..."
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tài khoản / Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-soc-username"
                    type="text"
                    required
                    placeholder="Nhập email hoặc SĐT..."
                    value={socialUsername}
                    onChange={(e) => setSocialUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="form-soc-password"
                      type={showFormSecrets['socPass'] ? 'text' : 'password'}
                      placeholder="Mật khẩu..."
                      value={socialPassword}
                      onChange={(e) => setSocialPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('socPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showFormSecrets['socPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('social');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Tự tạo mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Đường dẫn liên kết (URL)
                </label>
                <input
                  id="form-soc-url"
                  type="text"
                  placeholder="Ví dụ: facebook.com..."
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {/* Web Accounts Segment */}
          {activeTemplateType === 'web' && (
            <div className="space-y-4 border-l border-slate-800 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Đường dẫn Website / URL <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-web-url"
                  type="text"
                  required
                  placeholder="Ví dụ: netflix.com, github.com..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username / Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-web-username"
                    type="text"
                    required
                    placeholder="Tên đăng nhập..."
                    value={webUsername}
                    onChange={(e) => setWebUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="form-web-password"
                      type={showFormSecrets['webPass'] ? 'text' : 'password'}
                      placeholder="Mật khẩu..."
                      value={webPassword}
                      onChange={(e) => setWebPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('webPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showFormSecrets['webPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('web');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Tự tạo mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secure Note Segment */}
          {activeTemplateType === 'note' && (
            <div className="space-y-4 border-l border-slate-800 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nội dung ghi chú cần nhớ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="form-note-content"
                  required
                  rows={6}
                  placeholder="Nhập nội dung quan trọng cần nhớ..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm placeholder-slate-650 outline-none transition-all resize-y select-text"
                />
              </div>
            </div>
          )}

          {/* Wallet Accounts Segment */}
          {activeTemplateType === 'wallet' && (
            <div className="space-y-4 border-l border-emerald-500 pl-4 py-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tên Sàn / Ví <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-wallet-name"
                    type="text"
                    required
                    placeholder="Ví dụ: Binance, MetaMask..."
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phân loại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="form-wallet-type"
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 outline-none h-[38px]"
                  >
                    <option value="exchange">Sàn giao dịch (Binance...)</option>
                    <option value="dex_app">Ví Web3 (MetaMask...)</option>
                    <option value="hardware">Ví cứng / Ví lạnh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tên đăng nhập / Email
                  </label>
                  <input
                    id="form-wallet-username"
                    type="text"
                    placeholder="Tên đăng nhập sàn..."
                    value={walletUsername}
                    onChange={(e) => setWalletUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu / PIN bảo mật
                  </label>
                  <div className="relative">
                    <input
                      id="form-wallet-password"
                      type={showFormSecrets['walletPass'] ? 'text' : 'password'}
                      placeholder="Mật khẩu..."
                      value={walletPassword}
                      onChange={(e) => setWalletPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('walletPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showFormSecrets['walletPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('wallet');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Tự tạo mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Địa chỉ ví (Public Wallet Address)
                </label>
                <input
                  id="form-wallet-address"
                  type="text"
                  placeholder="Nhập địa chỉ ví..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Khóa bảo mật (Private Key)
                </label>
                <div className="relative">
                  <input
                    id="form-wallet-private"
                    type={showFormSecrets['walletPriv'] ? 'text' : 'password'}
                    placeholder="Nhập Private Key bí mật..."
                    value={walletPrivateKey}
                    onChange={(e) => setWalletPrivateKey(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFormSecrets('walletPriv')}
                    className="absolute right-3 top-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showFormSecrets['walletPriv'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cụm từ khôi phục (12 - 24 từ)
                </label>
                <div className="relative">
                  <textarea
                    id="form-wallet-seed"
                    rows={2}
                    placeholder="Nhập cụm từ khôi phục bí mật (phrase)..."
                    value={walletSeedPhrase}
                    onChange={(e) => setWalletSeedPhrase(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono select-text"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFormSecrets('walletSeed')}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showFormSecrets['walletSeed'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cấu hình API kết nối (Ví dụ Binance API)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        id="form-wallet-apikey"
                        type={showFormSecrets['walletApiKey'] ? 'text' : 'password'}
                        placeholder="API Key..."
                        value={walletApiKey}
                        onChange={(e) => setWalletApiKey(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('walletApiKey')}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showFormSecrets['walletApiKey'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      API Secret
                    </label>
                    <div className="relative">
                      <input
                        id="form-wallet-apisecret"
                        type={showFormSecrets['walletApiSec'] ? 'text' : 'password'}
                        placeholder="API Secret / Secret Key..."
                        value={walletApiSecret}
                        onChange={(e) => setWalletApiSecret(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('walletApiSec')}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showFormSecrets['walletApiSec'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E-Wallets Segment */}
          {activeTemplateType === 'ewallet' && (
            <div className="space-y-4 border-l border-pink-500 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên Ví điện tử <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-ewallet-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Momo, ZaloPay, ShopeePay"
                  value={ewalletName}
                  onChange={(e) => setEwalletName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Số điện thoại / TK <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-ewallet-phone"
                    type="text"
                    required
                    placeholder="SĐT liên kết ví..."
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tên chủ tài khoản
                  </label>
                  <input
                    id="form-ewallet-holder"
                    type="text"
                    placeholder="Tên người dùng..."
                    value={ewalletHolder}
                    onChange={(e) => setEwalletHolder(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mã PIN bảo mật
                  </label>
                  <div className="relative">
                    <input
                      id="form-ewallet-pin"
                      type={showFormSecrets['ewalletPin'] ? 'text' : 'password'}
                      placeholder="Mã PIN ví..."
                      value={ewalletPin}
                      onChange={(e) => setEwalletPin(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono placeholder-slate-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => toggleFormSecrets('ewalletPin')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showFormSecrets['ewalletPin'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu (nếu có)
                  </label>
                  <div className="relative">
                    <input
                      id="form-ewallet-password"
                      type={showFormSecrets['ewalletPass'] ? 'text' : 'password'}
                      placeholder="Mật khẩu..."
                      value={ewalletPassword}
                      onChange={(e) => setEwalletPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('ewalletPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showFormSecrets['ewalletPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('ewallet');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Tự tạo mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ngân hàng đã liên kết
                </label>
                <input
                  id="form-ewallet-linked"
                  type="text"
                  placeholder="Ví dụ: Vietcombank, Techcombank..."
                  value={ewalletLinkedBank}
                  onChange={(e) => setEwalletLinkedBank(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Phone App segment */}
          {activeTemplateType === 'phoneapp' && (
            <div className="space-y-4 border-l border-slate-850 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên ứng dụng điện thoại
                </label>
                <input
                  id="form-phoneapp-name"
                  type="text"
                  required
                  placeholder="Ví dụ: VNeID, VNeTraffic, eTax Mobile"
                  value={phoneappName}
                  onChange={(e) => setPhoneappName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100 placeholder-slate-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tên đăng nhập / Số ĐT
                  </label>
                  <input
                    id="form-phoneapp-user"
                    type="text"
                    placeholder="Số điện thoại hoặc tài khoản..."
                    value={phoneappUsername}
                    onChange={(e) => setPhoneappUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Số CCCD (định danh)
                  </label>
                  <input
                    id="form-phoneapp-national"
                    type="text"
                    placeholder="12 chữ số căn cước..."
                    value={phoneappNationalId}
                    onChange={(e) => setPhoneappNationalId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mã PIN / Passcode (vd: 6 số)
                  </label>
                  <div className="relative">
                    <input
                      id="form-phoneapp-passcode"
                      type={showFormSecrets['phoneappPasscode'] ? 'text' : 'password'}
                      placeholder="Mã passcode bảo mật..."
                      value={phoneappPasscode}
                      onChange={(e) => setPhoneappPasscode(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono placeholder-slate-600 outline-none text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => toggleFormSecrets('phoneappPasscode')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showFormSecrets['phoneappPasscode'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mật khẩu đăng nhập
                  </label>
                  <div className="relative">
                    <input
                      id="form-phoneapp-pass"
                      type={showFormSecrets['phoneappPass'] ? 'text' : 'password'}
                      placeholder="Mật khẩu phụ..."
                      value={phoneappPassword}
                      onChange={(e) => setPhoneappPassword(e.target.value)}
                      className="w-full pl-4 pr-16 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none text-slate-100"
                    />
                    <div className="absolute right-2 top-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('phoneappPass')}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showFormSecrets['phoneappPass'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPassGenTarget('phoneapp');
                          setShowPassGen(!showPassGen);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Tự động phát sinh mật khẩu mạnh"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email liên kết
                </label>
                <div className="relative">
                  <input
                    id="form-phoneapp-email"
                    type={showFormSecrets['phoneappEmail'] ? 'text' : 'password'}
                    placeholder="Nhập email liên kết (ví dụ: nguyenbaoloc24h@gmail.com)..."
                    value={phoneappEmail}
                    onChange={(e) => setPhoneappEmail(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-605 outline-none text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFormSecrets('phoneappEmail')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showFormSecrets['phoneappEmail'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Google Sheet segment */}
          {activeTemplateType === 'sheet' && (
            <div className="space-y-4 border-l border-emerald-550 pl-4 py-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Chế độ nguồn dữ liệu Trang tính
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    id="sheet-source-manual"
                    type="button"
                    onClick={() => setIsIntegrated(false)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      !isIntegrated
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Thiết lập thủ công (Nhập tay)
                  </button>
                  <button
                    id="sheet-source-sync"
                    type="button"
                    onClick={() => setIsIntegrated(true)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isIntegrated
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Đồng bộ Google Sheets (TK khác)
                  </button>
                </div>
              </div>

              {isIntegrated && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 animate-fade-in">
                  <div className="text-xs font-bold text-emerald-450 uppercase tracking-wider border-b border-slate-850 pb-2">
                    Cấu hình kết nối Google Account khác
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-450 uppercase mb-1.5">
                      Liên kết Google Sheet (URL) hoặc ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="google-sheet-url-input"
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={spreadsheetUrl}
                      onChange={(e) => setSpreadsheetUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Mở bảng tính của bạn ở tab khác, Copy toàn bộ URL và dán vào đây.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-455 uppercase mb-1.5">
                      Chế độ truy cập và bảo mật
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSyncMode('public')}
                        className={`p-2 text-left rounded-xl border transition-all cursor-pointer ${
                          syncMode === 'public'
                            ? 'bg-emerald-555/5 border-emerald-500/40 text-emerald-400 text-xs font-medium'
                            : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="block font-bold">1. Công khai (Khuyên dùng)</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">Chia sẻ quyền "Bất kỳ ai có liên kết đều xem được". Cực kỳ nhanh gọn, không cần setup API phức tạp.</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSyncMode('private')}
                        className={`p-2 text-left rounded-xl border transition-all cursor-pointer ${
                          syncMode === 'private'
                            ? 'bg-emerald-555/5 border-emerald-500/40 text-emerald-400 text-xs font-medium'
                            : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="block font-bold">2. Riêng tư (Kèm OAuth)</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">Bảng tính cá nhân bảo mật. Hệ thống sẽ hỏi Access Token tạm thời để kết nối đọc dòng/cột an toàn.</span>
                      </button>
                    </div>
                  </div>

                  {syncError && (
                    <div className="text-xs text-rose-400 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-xl font-medium">
                      ❌ Lỗi: {syncError}
                    </div>
                  )}

                  {lastSyncTime && (
                    <div className="text-[11px] text-emerald-400/90 font-semibold bg-emerald-950/15 border border-emerald-900/10 p-2 rounded-xl flex items-center justify-between">
                      <span>✓ Đã đồng bộ trực tuyến thành công!</span>
                      <span className="text-[10px] font-mono font-medium text-slate-500">Cập nhật: {new Date(lastSyncTime).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  )}

                  <button
                    id="sync-google-sheet-btn"
                    type="button"
                    disabled={isSyncing || !spreadsheetUrl}
                    onClick={handleGoogleSheetSync}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full block"></span>
                        <span>Đang kết nối google và tải bảng...</span>
                      </>
                    ) : (
                      <span>Đồng bộ hóa dữ liệu từ Google Sheets ngay ⟳</span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/40">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>Xem trước dữ liệu bảng tính</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isIntegrated ? 'Bảng ở dưới là kết quả đã đồng bộ. Bạn vẫn có thể sửa tay ở đây dể tinh chỉnh!' : 'Thêm/bớt cột, dòng và bấm tiêu đề cột để sửa tên tiện lợi.'}
                  </p>
                </div>
                <div className="flex gap-1.5 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const newHeaders = [...sheetHeaders, `Cột ${sheetHeaders.length + 1}`];
                      const newRows = sheetRows.map(r => [...r, '']);
                      setSheetHeaders(newHeaders);
                      setSheetRows(newRows);
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-slate-850 rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                  >
                    + Cột
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sheetHeaders.length <= 1) return;
                      const newHeaders = sheetHeaders.slice(0, -1);
                      const newRows = sheetRows.map(r => r.slice(0, -1));
                      setSheetHeaders(newHeaders);
                      setSheetRows(newRows);
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-850 rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                  >
                    - Cột
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const emptyRow = Array(sheetHeaders.length).fill('');
                      setSheetRows([...sheetRows, emptyRow]);
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-slate-850 rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                  >
                    + Dòng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sheetRows.length <= 1) return;
                      setSheetRows(sheetRows.slice(0, -1));
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-850 rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                  >
                    - Dòng
                  </button>
                </div>
              </div>

              {/* Dynamic spreadsheet editor grid table */}
              <div className="overflow-x-auto w-full border border-slate-800 rounded-xl bg-slate-950/30 scrollbar-thin max-h-64 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs min-w-full">
                  <thead>
                    <tr className="bg-emerald-555/10 border-b border-slate-850">
                      <th className="p-2 text-center text-[10px] font-bold text-slate-500 w-10 border-r border-slate-850 select-none bg-slate-950">#</th>
                      {sheetHeaders.map((hdr, colIndex) => (
                        <th key={colIndex} className="p-1 border-r border-slate-850 min-w-[120px] bg-slate-900/60">
                          <input
                            type="text"
                            value={hdr}
                            onChange={(e) => {
                              const updatedHeaders = [...sheetHeaders];
                              updatedHeaders[colIndex] = e.target.value;
                              setSheetHeaders(updatedHeaders);
                            }}
                            className="w-full bg-transparent text-xs font-bold text-emerald-400 px-1 py-1 outline-none focus:bg-slate-950 rounded border-b border-transparent text-center border-dashed focus:border-emerald-555"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-850 hover:bg-slate-900/10">
                        <td className="p-2 text-center text-[10px] font-mono text-slate-400 border-r border-slate-850 select-none bg-slate-950">
                          {rowIndex + 1}
                        </td>
                        {row.map((cellText, colIndex) => (
                          <td key={colIndex} className="p-1 border-r border-slate-850">
                            <input
                              type="text"
                              value={cellText}
                              onChange={(e) => {
                                const updatedRows = sheetRows.map((r, rIdx) => {
                                  if (rIdx === rowIndex) {
                                    const newRow = [...r];
                                    newRow[colIndex] = e.target.value;
                                    return newRow;
                                  }
                                  return r;
                                });
                                setSheetRows(updatedRows);
                              }}
                              className="w-full bg-transparent text-slate-200 placeholder-slate-750 text-xs px-2 py-1 outline-none focus:bg-slate-950 rounded"
                              placeholder="..."
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Google Drive and Large Files Segment */}
          {activeTemplateType === 'gdrive' && (
            <div className="space-y-4 border-l border-indigo-500 pl-4 py-1">
              {/* Informative Security/Storage Warning Banner */}
              <div className="bg-slate-950/75 border border-indigo-500/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Shield className="h-4 w-4 shrink-0 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Lưu Trữ Tối Ưu & Bảo Mật Cao</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Trình duyệt giới hạn bộ nhớ đệm <strong className="text-slate-350">localStorage tối đa là 5MB</strong>. Việc lưu trực tiếp các tệp tin hình ảnh, tài liệu hoặc clip MP4 dung lượng lớn (Ví dụ: <strong className="text-slate-350">&gt; 1GB</strong>) sẽ làm sập bộ nhớ đệm và gây mất toàn bộ dữ liệu.
                </p>
                <p className="text-[11px] text-indigo-400/95 leading-relaxed font-semibold">
                  💡 Giải pháp tối ưu: Tải tệp lên Google Drive của bạn, lấy liên kết bảo mật và nhập vào đây. Hệ thống sẽ mã hóa an toàn liên kết Drive, dung lượng và định dạng để bảo vệ tuyệt mật mà không ngốn dung lượng trình duyệt của bạn!
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tên tệp tin / Ảnh / Video <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-gdrive-filename"
                  type="text"
                  required
                  placeholder="Ví dụ: Video minh chứng sao lưu dự án, Clip kỉ niệm..."
                  value={driveFileName}
                  onChange={(e) => setDriveFileName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Dung lượng tệp (Xấp xỉ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-gdrive-filesize"
                    type="text"
                    required
                    placeholder="Ví dụ: 1.2 GB, 800 MB..."
                    value={driveFileSize}
                    onChange={(e) => setDriveFileSize(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Định dạng tệp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="form-gdrive-mediatype"
                    value={driveMediaType}
                    onChange={(e) => setDriveMediaType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 outline-none h-[38px]"
                  >
                    <option value="video">Video (MP4, MKV, AVI, ...)</option>
                    <option value="image">Hình ảnh (JPG, PNG, HEIC, ...)</option>
                    <option value="archive">Tệp nén (ZIP, RAR, 7Z, ...)</option>
                    <option value="audio">Âm thanh (MP3, WAV, FLAC, ...)</option>
                    <option value="document">Tài liệu (PDF, DOCX, XLSX, ...)</option>
                    <option value="other">Định dạng Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Đường dẫn liên kết Google Drive <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-gdrive-link"
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 outline-none focus:border-indigo-500 transition-all font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 font-sans">
                <input
                  id="form-gdrive-optimized"
                  type="checkbox"
                  checked={isDriveOptimized}
                  onChange={(e) => setIsDriveOptimized(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-500 focus:ring-indigo-500 bg-slate-950 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="form-gdrive-optimized" className="text-xs font-medium text-slate-400 cursor-pointer select-none">
                  Kích hoạt tối ưu hóa đường truyền Google Drive (Tăng tốc độ tải trực tiếp từ Drive)
                </label>
              </div>
            </div>
          )}

          {/* In-form Password Generator Popover */}
          {showPassGen && (
            <div className="bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center px-4 pt-2.5 pb-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Trình tạo nhanh mật khẩu an toàn</span>
                <button 
                  type="button" 
                  onClick={() => setShowPassGen(false)} 
                  className="text-slate-500 hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Đóng x
                </button>
              </div>
              <PasswordGenerator 
                onSelectPassword={handlePasswordFromGenerator} 
                showSelectButton={true} 
              />
            </div>
          )}

          {/* Advanced 2FA / TOTP Section */}
          {activeTemplateType !== 'note' && activeTemplateType !== 'sheet' && (
            <div className="bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Shield className="h-4 w-4 shrink-0 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.totp_codeLabel}
                </span>
                <span className="ml-auto bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">PRO</span>
              </div>
              <p className="text-[11px] text-slate-450 leading-relaxed">
                {t.totp_desc}
              </p>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  {t.totp_secretLabel}
                </label>
                <input
                  id="form-totp-secret"
                  type="text"
                  placeholder={t.totp_secretPlc}
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-indigo-500 transition-colors font-mono tracking-wider"
                />
              </div>
            </div>
          )}

          {/* Additional details */}
          {activeTemplateType !== 'note' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ghi chú thêm
              </label>
              <input
                id="form-add-notes"
                type="text"
                placeholder="Ví dụ: Mã bảo mật phụ, lưu ý đổi sau 3 tháng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
              />
            </div>
          )}

          {/* Reminder Section */}
          <div className={`bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 transition-all relative overflow-hidden ${!isPro ? 'opacity-70 border-rose-500/10' : ''}`}>
            {!isPro && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                <span className="text-xs font-bold text-rose-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-450" />
                  <span>Chức năng Đặt Lịch Nhắc Nhở (PRO Only)</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">Hãy nâng cấp lên phiên bản PRO để đặt thông báo nhắc tự động định kỳ!</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <label htmlFor="form-reminder-checkbox" className="text-sm font-semibold text-slate-200 cursor-pointer select-none">
                  Đặt lịch nhắc nhở (Thông báo sinh nhật / công việc)
                </label>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  id="form-reminder-checkbox"
                  type="checkbox"
                  checked={isPro ? reminderEnabled : false}
                  disabled={!isPro}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
            </div>

            {reminderEnabled && isPro && (
              <div className="space-y-3 pt-1 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Ngày nhắc nhở
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      required={reminderEnabled}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Chu kỳ lặp lại
                    </label>
                    <select
                      value={reminderType}
                      onChange={(e) => setReminderType(e.target.value as 'once' | 'yearly')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="yearly">Hàng năm (như Sinh nhật, Ngày kỷ niệm)</option>
                      <option value="once">Sự kiện 1 lần (như Hạn chót, Hẹn làm việc)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
                    Nội dung lời nhắn
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sinh nhật vợ yêu ❤️, Nhắc đóng tiền điện..."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Make Favorite Toggle and Secret Compartment checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className={`flex items-center gap-2 px-3 py-2 bg-slate-955 border border-slate-850 rounded-xl ${!isPro ? 'col-span-2' : ''}`}>
              <input
                id="form-fav-checkbox"
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="form-fav-checkbox" className="text-sm font-semibold text-slate-350 cursor-pointer select-none">
                Đánh dấu là Yêu thích
              </label>
            </div>

            {isPro ? (
              <div className="flex items-center gap-2 bg-indigo-950/20 px-3 py-2 rounded-xl border border-indigo-500/20">
                <input
                  id="form-secret-checkbox"
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-500 focus:ring-indigo-500 bg-slate-950 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="form-secret-checkbox" className="text-sm font-semibold text-indigo-300 cursor-pointer select-none flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Lưu vào Ngăn bí mật (Code)
                </label>
              </div>
            ) : null}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/85">
            <button
              id="cancel-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700/80 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              id="save-modal-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {editingEntry ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
