import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, KeyRound, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { VaultEntry, VaultCategory, CustomCategory } from '../types';
import PasswordGenerator from './PasswordGenerator';
import { LangType, translations } from '../utils/lang';
import { formatAmountString, formatAmountByLang, getRawNumericString } from '../utils/currency';

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
  const _ = (vi: string, en: string) => lang === 'vi' ? vi : en;

  const [category, setCategory] = useState<VaultCategory>('bank');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');

  // Reminder Fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'monthly' | 'yearly'>('yearly');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');

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
  const [webEmail, setWebEmail] = useState('');
  const [webPayoutEmail, setWebPayoutEmail] = useState('');
  const [webPinCode, setWebPinCode] = useState('');
  const [webCreatorHandle, setWebCreatorHandle] = useState('');
  const [webApiKey, setWebApiKey] = useState('');

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
  const [sheetHeaders, setSheetHeaders] = useState<string[]>(() => 
    localStorage.getItem('secure_vault_lang') === 'en' 
      ? ['Title', 'Code / Key', 'Description'] 
      : ['Tiêu đề', 'Mã số / Khóa', 'Mô tả']
  );
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
  const [isSafeForTravel, setIsSafeForTravel] = useState(false);

  // Bill Specific Fields State
  const [billType, setBillType] = useState<'finance' | 'utility' | 'app'>('finance');
  const [billCycle, setBillCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Finance fields
  const [billFinanceProduct, setBillFinanceProduct] = useState('');
  const [billFinanceContract, setBillFinanceContract] = useState('');
  const [billFinanceName, setBillFinanceName] = useState('');
  const [billFinanceDueDate, setBillFinanceDueDate] = useState('');
  const [billFinanceAmount, setBillFinanceAmount] = useState('');

  // Utility fields
  const [billUtilityServiceType, setBillUtilityServiceType] = useState<'electricity' | 'water' | 'wifi' | 'rent_house' | 'rent_car' | 'parking'>('electricity');
  const [billUtilityName, setBillUtilityName] = useState('');
  const [billUtilityCustomerId, setBillUtilityCustomerId] = useState('');
  const [billUtilityPeriod, setBillUtilityPeriod] = useState('Tháng 1');
  const [billUtilityAmount, setBillUtilityAmount] = useState('');

  // App fields
  const [billAppName, setBillAppName] = useState('');
  const [billAppContact, setBillAppContact] = useState('');
  const [billAppPaymentMethod, setBillAppPaymentMethod] = useState('ewallet');
  const [billAppDueDate, setBillAppDueDate] = useState('');
  const [billAppAmount, setBillAppAmount] = useState('');

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
      setIsSafeForTravel(!!editingEntry.isSafeForTravel);
      setTotpSecret(editingEntry.totpSecret || '');

      // Load reminder configuration if present
      if (editingEntry.reminder) {
        setReminderEnabled(editingEntry.reminder.enabled);
        setReminderDate(editingEntry.reminder.date || '');
        setReminderType(editingEntry.reminder.type || 'yearly');
        setReminderMessage(editingEntry.reminder.message || '');
        setReminderTime(editingEntry.reminder.time || '09:00');
      } else {
        setReminderEnabled(false);
        setReminderDate('');
        setReminderType('yearly');
        setReminderMessage('');
        setReminderTime('09:00');
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
        const webEntry = editingEntry as any;
        setWebsiteUrl(webEntry.websiteUrl || '');
        setWebUsername(webEntry.username || '');
        setWebPassword(webEntry.password || '');
        setWebEmail(webEntry.email || '');
        setWebPayoutEmail(webEntry.payoutEmail || '');
        setWebPinCode(webEntry.pinCode || '');
        setWebCreatorHandle(webEntry.creatorHandle || '');
        setWebApiKey(webEntry.apiKey || '');
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
        setSheetHeaders(editingEntry.headers || (lang === 'vi' ? ['Tiêu đề', 'Mã số / Khóa', 'Mô tả'] : ['Title', 'Code / Key', 'Description']));
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
      } else if (editingEntry.category === 'bill') {
        const bEntry = editingEntry as any;
        setBillType(bEntry.billType || 'finance');
        setBillCycle(bEntry.billCycle || 'monthly');
        
        const rawInitAmount = bEntry.amount || '';
        const formattedInitAmount = formatAmountByLang(getRawNumericString(rawInitAmount), lang);
        
        setBillFinanceProduct(bEntry.productName || '');
        setBillFinanceContract(bEntry.contractNumber || '');
        setBillFinanceName(bEntry.holderName || '');
        setBillFinanceDueDate(bEntry.dueDate || '');
        setBillFinanceAmount(formattedInitAmount);

        setBillUtilityServiceType(bEntry.utilityType || 'electricity');
        setBillUtilityName(bEntry.utilityName || '');
        setBillUtilityCustomerId(bEntry.customerId || '');
        setBillUtilityPeriod(bEntry.billingPeriod || 'Tháng 1');
        setBillUtilityAmount(formattedInitAmount);

        setBillAppName(bEntry.billAppName || '');
        setBillAppContact(bEntry.linkedAccount || '');
        setBillAppPaymentMethod(bEntry.paymentMethod || 'ewallet');
        setBillAppDueDate(bEntry.dueDate || '');
        setBillAppAmount(formattedInitAmount);
      }
    } else {
      // Clear forms
      setCategory('bank');
      setTitle('');
      setNotes('');
      setIsFavorite(false);
      setIsSecret(false);
      setIsSafeForTravel(false);

      setBillType('finance');
      setBillCycle('monthly');
      setBillFinanceProduct('');
      setBillFinanceContract('');
      setBillFinanceName('');
      setBillFinanceDueDate('');
      setBillFinanceAmount('');
      setBillUtilityServiceType('electricity');
      setBillUtilityName('');
      setBillUtilityCustomerId('');
      setBillUtilityPeriod('Tháng 1');
      setBillUtilityAmount('');
      setBillAppName('');
      setBillAppContact('');
      setBillAppPaymentMethod('ewallet');
      setBillAppDueDate('');
      setBillAppAmount('');

      setReminderEnabled(false);
      setReminderDate('');
      setReminderType('yearly');
      setReminderMessage('');
      setReminderTime('09:00');

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
      setWebEmail('');
      setWebPayoutEmail('');
      setWebPinCode('');
      setWebCreatorHandle('');
      setWebApiKey('');

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

      setSheetHeaders(lang === 'vi' ? ['Tiêu đề', 'Mã số / Khóa', 'Mô tả'] : ['Title', 'Code / Key', 'Description']);
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
      isSecret: isPro ? isSecret : false,
      totpSecret: totpSecret.trim() || undefined,
      updatedAt: Date.now(),
      createdAt: editingEntry?.createdAt || Date.now()
    };

    if (reminderEnabled && reminderDate) {
      targetData.reminder = {
        enabled: true,
        date: reminderDate,
        type: reminderType,
        message: reminderMessage.trim() || undefined,
        time: reminderTime || undefined
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
        email: webEmail.trim() || undefined,
        payoutEmail: webPayoutEmail.trim() || undefined,
        pinCode: webPinCode.trim() || undefined,
        creatorHandle: webCreatorHandle.trim() || undefined,
        apiKey: webApiKey.trim() || undefined,
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
    } else if (activeTemplateType === 'bill') {
      targetData = {
        ...targetData,
        category: 'bill',
        billType,
        billCycle,
        
        // Finance fields
        productName: billType === 'finance' ? billFinanceProduct.trim() : undefined,
        contractNumber: billType === 'finance' ? billFinanceContract.trim() : undefined,
        holderName: billType === 'finance' ? billFinanceName.trim() : billType === 'utility' ? billUtilityName.trim() : undefined,
        dueDate: billType === 'finance' ? billFinanceDueDate : billType === 'app' ? billAppDueDate : undefined,
        amount: billType === 'finance' ? billFinanceAmount.trim() : billType === 'utility' ? billUtilityAmount.trim() : billType === 'app' ? billAppAmount.trim() : undefined,

        // Utility fields
        utilityType: billType === 'utility' ? billUtilityServiceType : undefined,
        customerId: billType === 'utility' ? billUtilityCustomerId.trim() : undefined,
        billingPeriod: billType === 'utility' ? billUtilityPeriod.trim() : undefined,

        // App fields
        billAppName: billType === 'app' ? billAppName.trim() : undefined,
        linkedAccount: billType === 'app' ? billAppContact.trim() : undefined,
        paymentMethod: billType === 'app' ? billAppPaymentMethod.trim() : undefined,
      };

      // Auto generate/override reminder if a due date is filled
      const derivedDueDate = billType === 'finance' ? billFinanceDueDate : billType === 'app' ? billAppDueDate : undefined;
      if (derivedDueDate) {
        targetData.reminder = {
          enabled: true,
          date: derivedDueDate,
          type: billCycle === 'monthly' ? 'monthly' : 'yearly',
          message: billType === 'finance' 
            ? `${_('Đến hạn thanh toán', 'Payment due')}: ${billFinanceProduct.trim()}`
            : `${_('Hạn gia hạn App', 'App renewal due')}: ${billAppName.trim()}`,
          time: '09:00'
        };
      }
    }

    // Travel Mode & Password History logic for PRO users
    targetData.isSafeForTravel = isPro ? isSafeForTravel : false;

    if (isPro && editingEntry) {
      let newPasswordText = '';
      if (activeTemplateType === 'bank') newPasswordText = bankPassword.trim();
      else if (activeTemplateType === 'social') newPasswordText = socialPassword.trim();
      else if (activeTemplateType === 'web') newPasswordText = webPassword.trim();
      else if (activeTemplateType === 'wallet') newPasswordText = walletPassword.trim();
      else if (activeTemplateType === 'ewallet') newPasswordText = ewalletPassword.trim();
      else if (activeTemplateType === 'phoneapp') newPasswordText = phoneappPassword.trim();

      const oldPwd = (editingEntry as any).password || '';
      if (newPasswordText && oldPwd && newPasswordText !== oldPwd) {
        const history = (editingEntry as any).passwordHistory || [];
        targetData.passwordHistory = [
          { password: oldPwd, updatedAt: editingEntry.updatedAt || Date.now() },
          ...history
        ].slice(0, 10);
      } else if ((editingEntry as any).passwordHistory) {
        targetData.passwordHistory = (editingEntry as any).passwordHistory;
      }
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
            {editingEntry ? _('Chỉnh sửa tài khoản / ghi chú', 'Modify Safe Record / Notes') : _('Thêm tài khoản / nội dung cần nhớ', 'Add Account / Remember Labels')}
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {_('Loại lưu trữ', 'Locker Category')}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['bank', 'social', 'web', 'wallet', 'ewallet', 'phoneapp', 'sheet', 'note', 'gdrive', 'bill'] as VaultCategory[])
                  .filter(cat => isPro ? true : (cat !== 'sheet' && cat !== 'gdrive'))
                  .map((cat) => {
                  let visualText = '';
                  if (lang === 'vi') {
                    if (cat === 'bank') visualText = 'Ngân Hàng';
                    if (cat === 'social') visualText = 'Mạng Xã Hội';
                    if (cat === 'web') visualText = 'Website & App';
                    if (cat === 'wallet') visualText = 'Ví Crypto';
                    if (cat === 'ewallet') visualText = 'Ví Điện Tử';
                    if (cat === 'phoneapp') visualText = 'App Di Động';
                    if (cat === 'sheet') visualText = 'Bảng Tính';
                    if (cat === 'note') visualText = 'Ghi Chú';
                    if (cat === 'gdrive') visualText = 'Bảo Mật Drive';
                    if (cat === 'bill') visualText = 'Hóa Đơn';
                  } else {
                    if (cat === 'bank') visualText = 'Bank Account';
                    if (cat === 'social') visualText = 'Social Media';
                    if (cat === 'web') visualText = 'Website / App';
                    if (cat === 'wallet') visualText = 'Crypto Wallet';
                    if (cat === 'ewallet') visualText = 'E-Wallet';
                    if (cat === 'phoneapp') visualText = 'Mobile App';
                    if (cat === 'sheet') visualText = 'Spreadsheet';
                    if (cat === 'note') visualText = 'Secure Notes';
                    if (cat === 'gdrive') visualText = 'Secure Drive';
                    if (cat === 'bill') visualText = 'Bill / Invoice';
                  }

                  if (cat === 'bill') {
                    return (
                      <div key={cat} className="relative group col-span-1">
                        <button
                          id={`cat-select-${cat}`}
                          type="button"
                          onClick={() => {
                            setCategory('bill');
                            setBillType('finance');
                          }}
                          className={`w-full h-10 flex items-center justify-center text-center px-0.5 text-[10px] sm:text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                            category === cat
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {visualText} ▾
                        </button>
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-36 bg-slate-950 border border-slate-800 rounded-xl py-1 shadow-lg hidden group-hover:block hover:block z-30 animate-fade-in text-[10.5px] space-y-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('finance');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'finance' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            💼 {_('Tài chính', 'Finance')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('electricity');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'electricity' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            ⚡ {_('Điện', 'Electricity')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('water');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'water' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            💧 {_('Nước', 'Water')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('wifi');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'wifi' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            📶 {_('Wifi', 'Wifi')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('rent_house');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'rent_house' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            🏠 {_('Thuê nhà', 'House Rent')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('rent_car');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'rent_car' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            🚗 {_('Thuê xe', 'Car Rental')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('utility');
                              setBillUtilityServiceType('parking');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'utility' && billUtilityServiceType === 'parking' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            🅿️ {_('Tiền gửi xe', 'Parking Fee')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategory('bill');
                              setBillType('app');
                            }}
                            className={`w-full text-left px-2.5 py-1 hover:bg-slate-900 transition-colors ${billType === 'app' && category === 'bill' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}
                          >
                            📱 {_('App / Thuê bao', 'Apps')}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      id={`cat-select-${cat}`}
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`w-full h-10 flex items-center justify-center text-center px-0.5 text-[10px] sm:text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
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
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              {_('Tiêu đề gợi nhớ', 'Remember Title')} <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-title-input"
              type="text"
              required
              placeholder={
                activeTemplateType === 'bank' ? _('Ví dụ: Vietcombank Cá nhân, Techcombank Doanh nghiệp', 'e.g., Personal Chase Bank, Citibank Business') :
                activeTemplateType === 'social' ? _('Ví dụ: Facebook Cá nhân, Google Công việc', 'e.g., Facebook Private Account, Workplace Google ID') :
                activeTemplateType === 'web' ? _('Ví dụ: Tài khoản Netflix, Hosting Vhost', 'e.g., Netflix Premium Account, DigitalOcean Drops') :
                activeTemplateType === 'wallet' ? _('Ví dụ: Sàn Binance, Ví Trust Wallet, MetaMask', 'e.g., Binance Exchange ID, MetaMask Wallet, Key Ledger') :
                activeTemplateType === 'ewallet' ? _('Ví dụ: Ví Momo cá nhân, ZaloPay, ViettelPay', 'e.g., PayPal Balance, Venmo card, CashApp') : 
                activeTemplateType === 'phoneapp' ? _('Ví dụ: Tài khoản VNeID của bố, eTax Mobile cá nhân', 'e.g., Authenticator ID, Mobile Banking app, Tax Hub') :
                activeTemplateType === 'sheet' ? _('Ví dụ: Bảng thu chi năm nay, Danh bạ khẩn cấp', 'e.g., Master Financial Ledger, Crisis Contacts') : _('Ví dụ: Ý tưởng dự án mới, Chú ý hóa đơn', 'e.g., New Startup Draft, electricity bills note')
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Tên ngân hàng', 'Bank Name')}
                </label>
                <input
                  id="form-bank-name"
                  type="text"
                  required
                  placeholder={_('Ví dụ: Techcombank, Vietinbank', 'e.g., Techcombank, Vietinbank')}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Số tài khoản', 'Account Number')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-bank-acc"
                    type="text"
                    required
                    placeholder={_('Nhập số tài khoản...', 'Enter account number...')}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Chủ tài khoản', 'Account Holder')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-bank-holder"
                    type="text"
                    required
                    placeholder={_('VIET VAN A...', 'JOHN DOE...')}
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tên đăng nhập (iBanking)', 'Login Username (iBanking)')}
                  </label>
                  <input
                    id="form-bank-username"
                    type="text"
                    placeholder={_('Nếu có...', 'If any...')}
                    value={bankUsername}
                    onChange={(e) => setBankUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu (iBanking)', 'Password (iBanking)')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-bank-password"
                      type={showFormSecrets['bankPass'] ? 'text' : 'password'}
                      placeholder={_('Nếu có...', 'If any...')}
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
                        title={_('Tự tạo mật khẩu mạnh', 'Generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mã PIN / Rút tiền', 'PIN Code / Withdrawal')}
                  </label>
                  <input
                    id="form-bank-pin"
                    type="text"
                    maxLength={6}
                    placeholder={_('Mã PIN 4-6 số...', '4-6 digit PIN...')}
                    value={bankPin}
                    onChange={(e) => setBankPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Chi nhánh ngân hàng', 'Bank Branch')}
                  </label>
                  <input
                    id="form-bank-branch"
                    type="text"
                    placeholder={_('Ví dụ: PGD Bến Thành...', 'e.g., Wall Street Branch...')}
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Tên mạng xã hội', 'Social Network')}
                </label>
                <input
                  id="form-soc-platform"
                  type="text"
                  placeholder={_('Ví dụ: Facebook, Google, Zalo...', 'e.g., Facebook, Google, LinkedIn...')}
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tài khoản / Email', 'Account / Email')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-soc-username"
                    type="text"
                    required
                    placeholder={_('Nhập email hoặc SĐT...', 'Enter email or phone number...')}
                    value={socialUsername}
                    onChange={(e) => setSocialUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu', 'Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-soc-password"
                      type={showFormSecrets['socPass'] ? 'text' : 'password'}
                      placeholder={_('Mật khẩu...', 'Password...')}
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
                        title={_('Tự tạo mật khẩu mạnh', 'Generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Đường dẫn liên kết (URL)', 'Profile Link (URL)')}
                </label>
                <input
                  id="form-soc-url"
                  type="text"
                  placeholder={_('Ví dụ: facebook.com...', 'e.g., facebook.com...')}
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Đường dẫn Website / URL', 'Website URL')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-web-url"
                  type="text"
                  required
                  placeholder={_('Ví dụ: netflix.com, github.com...', 'e.g., netflix.com, github.com...')}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Username / Email', 'Username / Email')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-web-username"
                    type="text"
                    required
                    placeholder={_('Tên đăng nhập...', 'Username...')}
                    value={webUsername}
                    onChange={(e) => setWebUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu', 'Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-web-password"
                      type={showFormSecrets['webPass'] ? 'text' : 'password'}
                      placeholder={_('Mật khẩu...', 'Password...')}
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
                        title={_('Tự tạo mật khẩu mạnh', 'Generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Creator / Advanced Web fields */}
              <div className="pt-3 border-t border-slate-900 mt-3 space-y-3">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {_('Thông tin bổ sung cho Creator / Web App (Ko-fi, Patreon, Paypal,...)', 'Additional Creator & Web App Info (eg. Ko-fi, Patreon, Paypal...)')}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {_('Email liên kết riêng', 'Associated Email')}
                    </label>
                    <input
                      id="form-web-email"
                      type="email"
                      placeholder={_('Ví dụ: contact@creator.com...', 'e.g. contact@creator.com...')}
                      value={webEmail}
                      onChange={(e) => setWebEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {_('Biệt danh / Creator Handle (@)', 'Creator Handle (@)')}
                    </label>
                    <input
                      id="form-web-handle"
                      type="text"
                      placeholder={_('Ví dụ: @my-nickname...', 'e.g. @my-nickname...')}
                      value={webCreatorHandle}
                      onChange={(e) => setWebCreatorHandle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {_('Cổng nhận tiền / Payout Address', 'Payout Receiver (e.g. PayPal)')}
                    </label>
                    <input
                      id="form-web-payout"
                      type="text"
                      placeholder={_('Ví dụ: paypal.me/nickname...', 'e.g. paypal.me/nickname...')}
                      value={webPayoutEmail}
                      onChange={(e) => setWebPayoutEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {_('Mã PIN / Passcode bảo mật', 'Security PIN Code')}
                    </label>
                    <div className="relative">
                      <input
                        id="form-web-pin"
                        type={showFormSecrets['webPin'] ? 'text' : 'password'}
                        placeholder={_('Mã PIN phụ nếu có...', 'Security PIN if any...')}
                        value={webPinCode}
                        onChange={(e) => setWebPinCode(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => toggleFormSecrets('webPin')}
                        className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showFormSecrets['webPin'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    {_('Mã API / Webhook Token', 'API Authorization Key / Token')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-web-apikey"
                      type={showFormSecrets['webApiKey'] ? 'text' : 'password'}
                      placeholder={_('Nhập API key / Token liên kết tại đây...', 'Paste your developer token / Webhook API auth...')}
                      value={webApiKey}
                      onChange={(e) => setWebApiKey(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => toggleFormSecrets('webApiKey')}
                      className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showFormSecrets['webApiKey'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secure Note Segment */}
          {activeTemplateType === 'note' && (
            <div className="space-y-4 border-l border-slate-800 pl-4 py-1">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Nội dung ghi chú cần nhớ', 'Secure Note Content')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="form-note-content"
                  required
                  rows={6}
                  placeholder={_('Nhập nội dung quan trọng cần nhớ...', 'Enter critical notes or info to secure...')}
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
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tên Sàn / Ví', 'Exchange / Wallet')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-wallet-name"
                    type="text"
                    required
                    placeholder={_('Ví dụ: Binance, MetaMask...', 'e.g., Binance, MetaMask...')}
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Phân loại', 'Category')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="form-wallet-type"
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 outline-none h-[38px]"
                  >
                    <option value="exchange">{_('Sàn giao dịch (Binance...)', 'Exchange Space (Binance...)')}</option>
                    <option value="dex_app">{_('Ví Web3 (MetaMask...)', 'Web3 DApp Wallet (MetaMask...)')}</option>
                    <option value="hardware">{_('Ví cứng / Ví lạnh', 'Hardware Cold Wallet')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tên đăng nhập / Email', 'Username / Email')}
                  </label>
                  <input
                    id="form-wallet-username"
                    type="text"
                    placeholder={_('Tên đăng nhập sàn...', 'Login Username...')}
                    value={walletUsername}
                    onChange={(e) => setWalletUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu / PIN bảo mật', 'Security Password / PIN')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-wallet-password"
                      type={showFormSecrets['walletPass'] ? 'text' : 'password'}
                      placeholder={_('Mật khẩu...', 'Password...')}
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
                        title={_('Tự tạo mật khẩu mạnh', 'Generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Địa chỉ ví (Public Wallet Address)', 'Public Wallet Address')}
                </label>
                <input
                  id="form-wallet-address"
                  type="text"
                  placeholder={_('Nhập địa chỉ ví...', 'Enter public address...')}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Khóa bảo mật (Private Key)', 'Private key (Secret key)')}
                </label>
                <div className="relative">
                  <input
                    id="form-wallet-private"
                    type={showFormSecrets['walletPriv'] ? 'text' : 'password'}
                    placeholder={_('Nhập Private Key bí mật...', 'Enter private key seed...')}
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Cụm từ khôi phục (12 - 24 từ)', 'Seed Recovery Phrase (12 - 24 words)')}
                </label>
                <div className="relative">
                  <textarea
                    id="form-wallet-seed"
                    rows={2}
                    placeholder={_('Nhập cụm từ khôi phục bí mật (phrase)...', 'Enter recovery phrase...')}
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
                <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">{_('Cấu hình API kết nối (Ví dụ Binance API)', 'API Credentials Config (e.g. Binance Token)')}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-400 mb-1">
                      {_('API Key', 'API Public Key')}
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
                    <label className="block text-[12px] font-medium text-slate-400 mb-1">
                      {_('API Secret', 'API Secret Key')}
                    </label>
                    <div className="relative">
                      <input
                        id="form-wallet-apisecret"
                        type={showFormSecrets['walletApiSec'] ? 'text' : 'password'}
                        placeholder={_('API Secret / Secret Key...', 'API Private Secret Key...')}
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Tên Ví điện tử', 'E-Wallet Provider')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-ewallet-name"
                  type="text"
                  required
                  placeholder={_('Ví dụ: Momo, ZaloPay, ShopeePay', 'e.g., Momo, ZaloPay, ShopeePay')}
                  value={ewalletName}
                  onChange={(e) => setEwalletName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Số điện thoại / TK', 'Phone / Account No.')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-ewallet-phone"
                    type="text"
                    required
                    placeholder={_('SĐT liên kết ví...', 'Registered mobile number...')}
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-mono placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tên chủ tài khoản', 'Account Holder')}
                  </label>
                  <input
                    id="form-ewallet-holder"
                    type="text"
                    placeholder={_('Tên người dùng...', 'Full Name...')}
                    value={ewalletHolder}
                    onChange={(e) => setEwalletHolder(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mã PIN bảo mật', 'Security PIN Code')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-ewallet-pin"
                      type={showFormSecrets['ewalletPin'] ? 'text' : 'password'}
                      placeholder={_('Mã PIN ví...', 'Wallet PIN...')}
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
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu (nếu có)', 'Password (if any)')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-ewallet-password"
                      type={showFormSecrets['ewalletPass'] ? 'text' : 'password'}
                      placeholder={_('Mật khẩu...', 'Password...')}
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
                        title={_('Tự tạo mật khẩu mạnh', 'Generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Ngân hàng đã liên kết', 'Linked Bank')}
                </label>
                <input
                  id="form-ewallet-linked"
                  type="text"
                  placeholder={_('Ví dụ: Vietcombank, Techcombank...', 'e.g., Vietcombank, Chase...')}
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
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Tên ứng dụng điện thoại', 'Phone Application')}
                </label>
                <input
                  id="form-phoneapp-name"
                  type="text"
                  required
                  placeholder={_('Ví dụ: VNeID, VNeTraffic, eTax Mobile', 'e.g., Identity App, eTax Mobile')}
                  value={phoneappName}
                  onChange={(e) => setPhoneappName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100 placeholder-slate-655"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Tên đăng nhập / Số ĐT', 'Username / Phone Number')}
                  </label>
                  <input
                    id="form-phoneapp-user"
                    type="text"
                    placeholder={_('Số điện thoại hoặc tài khoản...', 'Mobile or Username...')}
                    value={phoneappUsername}
                    onChange={(e) => setPhoneappUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Số CCCD (định danh)', 'National ID Card No.')}
                  </label>
                  <input
                    id="form-phoneapp-national"
                    type="text"
                    placeholder={_('12 chữ số căn cước...', 'National ID digits...')}
                    value={phoneappNationalId}
                    onChange={(e) => setPhoneappNationalId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mã PIN / Passcode (vd: 6 số)', 'PIN / Passcode (e.g. 6-digits)')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-phoneapp-passcode"
                      type={showFormSecrets['phoneappPasscode'] ? 'text' : 'password'}
                      placeholder={_('Mã passcode bảo mật...', 'Secure passcode...')}
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
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Mật khẩu đăng nhập', 'App Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="form-phoneapp-pass"
                      type={showFormSecrets['phoneappPass'] ? 'text' : 'password'}
                      placeholder={_('Mật khẩu phụ...', 'Backup password...')}
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
                        title={_('Tự động phát sinh mật khẩu mạnh', 'Auto generate secure password')}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Email liên kết', 'Recovery / Linked Email')}
                </label>
                <div className="relative">
                  <input
                    id="form-phoneapp-email"
                    type={showFormSecrets['phoneappEmail'] ? 'text' : 'password'}
                    placeholder={_('Nhập email liên kết (ví dụ: loc@gmail.com)...', 'Enter linked account email...')}
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
            <div className="space-y-4 border-l border-emerald-555 pl-4 py-1">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {_('Chế độ nguồn dữ liệu Trang tính', 'Spreadsheet Data Source Mode')}
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
                    {_('Thiết lập thủ công (Nhập tay)', 'Manual Entry (Handwritten)')}
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
                    {_('Đồng bộ Google Sheets (TK khác)', 'Sync Google Sheets Integration')}
                  </button>
                </div>
              </div>

              {isIntegrated && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 animate-fade-in">
                  <div className="text-xs font-bold text-emerald-450 uppercase tracking-wider border-b border-slate-850 pb-2">
                    {_('Cấu hình kết nối Google Account khác', 'External Google Account Connection Configuration')}
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-450 uppercase mb-1.5">
                      {_('Liên kết Google Sheet (URL) hoặc ID', 'Google Sheets Document URL or File ID')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="google-sheet-url-input"
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={spreadsheetUrl}
                      onChange={(e) => setSpreadsheetUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {_('Mở bảng tính của bạn ở tab khác, Copy toàn bộ URL và dán vào đây.', 'Open your sheet in another browser tab, copy the entire URL address and paste here.')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-slate-455 uppercase mb-1.5">
                      {_('Chế độ truy cập và bảo mật', 'Access Authorization & Security Level')}
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
                        <span className="block font-bold">{_('1. Công khai (Khuyên dùng)', '1. Anyone with Link (Recommended)')}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{_('Chia sẻ quyền "Bất kỳ ai có liên kết đều xem được". Cực kỳ nhanh gọn, không cần setup API phức tạp.', 'Set link sharing to "Anyone with the link can view". Safe, fast, and does not require complex token setups.')}</span>
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
                        <span className="block font-bold">{_('2. Riêng tư (Kèm OAuth)', '2. Restricted / Private (OAuth)')}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{_('Bảng tính cá nhân bảo mật. Hệ thống sẽ hỏi Access Token tạm thời để kết nối đọc dòng/cột an toàn.', 'Private spreadsheet. The system will prompt for standard Google access authorization token queries to read securely.')}</span>
                      </button>
                    </div>
                  </div>

                  {syncError && (
                    <div className="text-xs text-rose-400 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-xl font-medium">
                      ❌ {_('Lỗi', 'Error')}: {syncError}
                    </div>
                  )}

                  {lastSyncTime && (
                    <div className="text-[12px] text-emerald-400/90 font-semibold bg-emerald-950/15 border border-emerald-900/10 p-2 rounded-xl flex items-center justify-between">
                      <span>✓ {_('Đã đồng bộ trực tuyến thành công!', 'Successfully synchronized online!')}</span>
                      <span className="text-[11px] font-mono font-medium text-slate-500">{_('Cập nhật:', 'Last Sync:')} {new Date(lastSyncTime).toLocaleTimeString('vi-VN')}</span>
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
                        <span>{_('Đang kết nối google và tải bảng...', 'Connecting Google and loading sheet...')}</span>
                      </>
                    ) : (
                      <span>{_('Đồng bộ hóa dữ liệu từ Google Sheets ngay ⟳', 'Sync data from Google Sheets now ⟳')}</span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/40">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>{_('Xem trước dữ liệu bảng tính', 'Spreadsheet Data Preview')}</span>
                  </h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {isIntegrated 
                      ? _('Bảng ở dưới là kết quả đã đồng bộ. Bạn vẫn có thể sửa tay ở đây để tinh chỉnh!', 'The table below contains synced results. You can still edit manually here to fine-tune!') 
                      : _('Thêm/bớt cột, dòng và bấm tiêu đề cột để sửa tên tiện lợi.', 'Add/remove columns, rows and click on column titles to easily edit names.')}
                  </p>
                </div>
                <div className="flex gap-1.5 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const newHeaders = [...sheetHeaders, lang === 'vi' ? `Cột ${sheetHeaders.length + 1}` : `Col ${sheetHeaders.length + 1}`];
                      const newRows = sheetRows.map(r => [...r, '']);
                      setSheetHeaders(newHeaders);
                      setSheetRows(newRows);
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-slate-850 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                  >
                    {_('+ Cột', '+ Col')}
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
                    className="px-2 py-1 bg-slate-950 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-850 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                  >
                    {_('- Cột', '- Col')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const emptyRow = Array(sheetHeaders.length).fill('');
                      setSheetRows([...sheetRows, emptyRow]);
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-slate-850 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                  >
                    {_('+ Dòng', '+ Row')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sheetRows.length <= 1) return;
                      setSheetRows(sheetRows.slice(0, -1));
                    }}
                    className="px-2 py-1 bg-slate-950 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-850 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                  >
                    {_('- Dòng', '- Row')}
                  </button>
                </div>
              </div>

              {/* Dynamic spreadsheet editor grid table */}
              <div className="overflow-x-auto w-full border border-slate-800 rounded-xl bg-slate-950/30 scrollbar-thin max-h-64 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs min-w-full">
                  <thead>
                    <tr className="bg-emerald-555/10 border-b border-slate-850">
                      <th className="p-2 text-center text-[11px] font-bold text-slate-500 w-10 border-r border-slate-850 select-none bg-slate-950">#</th>
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
                        <td className="p-2 text-center text-[11px] font-mono text-slate-400 border-r border-slate-850 select-none bg-slate-950">
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
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {_('Lưu Trữ Tối Ưu & Bảo Mật Cao', 'Optimized Storage & High Security')}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  {lang === 'vi' ? (
                    <>
                      Trình duyệt giới hạn bộ nhớ đệm <strong className="text-slate-350">localStorage tối đa là 5MB</strong>. Việc lưu trực tiếp các tệp tin hình ảnh, tài liệu hoặc clip MP4 dung lượng lớn (Ví dụ: <strong className="text-slate-350">&gt; 1GB</strong>) sẽ làm sập bộ nhớ đệm và gây mất toàn bộ dữ liệu.
                    </>
                  ) : (
                    <>
                      In-browser caching restricts <strong className="text-slate-350">localStorage to a 5MB maximum</strong>. Storing massive raw image/document files or MP4 clips directly (e.g. <strong className="text-slate-350">&gt; 1GB</strong>) will crash local storage arrays, causing permanent data loss.
                    </>
                  )}
                </p>
                <p className="text-[12px] text-indigo-400/95 leading-relaxed font-semibold">
                  {lang === 'vi' 
                    ? '💡 Giải pháp tối ưu: Tải tệp lên Google Drive của bạn, lấy liên kết bảo mật và nhập vào đây. Hệ thống sẽ mã hóa an toàn liên kết Drive, dung lượng và định dạng để bảo vệ tuyệt mật mà không ngốn dung lượng trình duyệt của bạn!'
                    : '💡 Optimal Solution: Simply upload files to your Google Drive, obtain a secure link, and paste it here. Secure Vault is fully capable of encoding and securing your Drive links, sizes, and extensions, keeping your vaults bulletproof without using up local browser limits!'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Tên tệp tin / Ảnh / Video', 'File Name / Image / Video')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-gdrive-filename"
                  type="text"
                  required
                  placeholder={_('Ví dụ: Video minh chứng sao lưu dự án, Clip kỉ niệm...', 'e.g., Project backup video demo, Memory clip...')}
                  value={driveFileName}
                  onChange={(e) => setDriveFileName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Dung lượng tệp (Xấp xỉ)', 'File Size (Approximate)')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                     id="form-gdrive-filesize"
                     type="text"
                     required
                     placeholder={_('Ví dụ: 1.2 GB, 800 MB...', 'e.g., 1.2 GB, 800 MB...')}
                     value={driveFileSize}
                     onChange={(e) => setDriveFileSize(e.target.value)}
                     className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                    {_('Định dạng tệp', 'File Type')} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="form-gdrive-mediatype"
                    value={driveMediaType}
                    onChange={(e) => setDriveMediaType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 outline-none h-[38px]"
                  >
                    <option value="video">{_('Video (MP4, MKV, AVI, ...)', 'Video (MP4, MKV, AVI, ...)')}</option>
                    <option value="image">{_('Hình ảnh (JPG, PNG, HEIC, ...)', 'Image (JPG, PNG, HEIC, ...)')}</option>
                    <option value="archive">{_('Tệp nén (ZIP, RAR, 7Z, ...)', 'Compressed Archive (ZIP, RAR, 7Z, ...)')}</option>
                    <option value="audio">{_('Âm thanh (MP3, WAV, FLAC, ...)', 'Audio Sound (MP3, WAV, FLAC, ...)')}</option>
                    <option value="document">{_('Tài liệu (PDF, DOCX, XLSX, ...)', 'Document (PDF, DOCX, XLSX, ...)')}</option>
                    <option value="other">{_('Định dạng Khác', 'Other Format')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  {_('Đường dẫn liên kết Google Drive', 'Google Drive Link / Shared URL')} <span className="text-rose-500">*</span>
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
                  {_('Kích hoạt tối ưu hóa đường truyền Google Drive (Tăng tốc độ tải trực tiếp từ Drive)', 'Enable Google Drive bandwidth optimization (Boost direct load from Drive)')}
                </label>
              </div>
            </div>
          )}

          {/* Bill and Invoices Segment */}
          {activeTemplateType === 'bill' && (
            <div className="space-y-4 border-l border-emerald-500 pl-4 py-1 animate-fade-in">
              {/* Type Switcher tabs: Finance / Utilities / App */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {_('Phân loại hóa đơn / Chi phí', 'Bill Category')}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setBillType('finance')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      billType === 'finance'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💼 {_('Tài chính', 'Finance')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillType('utility');
                      setBillUtilityServiceType('electricity');
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      billType === 'utility'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💧 {_('Điện / Nước / Wifi', 'Utilities')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillType('app')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      billType === 'app'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📱 {_('App / Thuê bao', 'Apps')}
                  </button>
                </div>
              </div>

              {/* Cycle frequency switcher: Monthly or Yearly */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {_('Chu kỳ thanh toán', 'Billing Frequency')}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="billCycle"
                      checked={billCycle === 'monthly'}
                      onChange={() => setBillCycle('monthly')}
                      className="rounded border-slate-850 text-emerald-500 bg-slate-950 focus:ring-emerald-500 pointer-events-auto cursor-pointer"
                    />
                    <span>{_('Hàng tháng', 'Monthly')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="billCycle"
                      checked={billCycle === 'yearly'}
                      onChange={() => setBillCycle('yearly')}
                      className="rounded border-slate-850 text-emerald-500 bg-slate-950 focus:ring-emerald-500 pointer-events-auto cursor-pointer"
                    />
                    <span>{_('Hàng năm', 'Annually')}</span>
                  </label>
                </div>
              </div>

              {/* SEGMENT FOR FINANCE */}
              {billType === 'finance' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Sản phẩm tài chính / Gói vay', 'Product / Loan Package')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={category === 'bill' && billType === 'finance'}
                      placeholder={_('Ví dụ: Vay mua nhà Shinhan, Bảo hiểm Manulife...', 'e.g., Home Loan, Insurance policy...')}
                      value={billFinanceProduct}
                      onChange={(e) => {
                        setBillFinanceProduct(e.target.value);
                        if (!title) setTitle(e.target.value);
                      }}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm placeholder-slate-705 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-sans">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Số hợp đồng', 'Contract ID / Policy No')}
                      </label>
                      <input
                        type="text"
                        placeholder={_('Ví dụ: HD-1203-99A...', 'e.g., PL-9923-B2...')}
                        value={billFinanceContract}
                        onChange={(e) => setBillFinanceContract(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 font-mono text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Tên khách hàng / Đại diện', 'Representative Name')}
                      </label>
                      <input
                        type="text"
                        placeholder={_('Nhập tên đại diện...', 'Who pays...')}
                        value={billFinanceName}
                        onChange={(e) => setBillFinanceName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-sans">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <span>{_('Hạn thanh toán', 'Due Date')}</span>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">Báo thức</span>
                      </label>
                      <input
                        type="date"
                        value={billFinanceDueDate}
                        onChange={(e) => setBillFinanceDueDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-300 h-[38px] cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Số tiền cần đóng', 'Due Amount')}
                      </label>
                      <div className="relative flex items-center">
                        {lang !== 'vi' && (
                          <span className="absolute left-3 text-slate-400 font-bold text-sm pointer-events-none">
                            $
                          </span>
                        )}
                        <input
                          type="text"
                          placeholder={_('Ví dụ: 2.500.000...', 'e.g., 150...')}
                          value={billFinanceAmount}
                          onChange={(e) => setBillFinanceAmount(formatAmountString(e.target.value, lang))}
                          className={`w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 font-bold text-emerald-400 h-[38px] ${
                            lang === 'vi' ? 'pl-4 pr-8' : 'pl-7 pr-4'
                          }`}
                        />
                        {lang === 'vi' && (
                          <span className="absolute right-3 text-slate-400 font-bold text-sm pointer-events-none">
                            đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEGMENT FOR UTILITIES (Electricity / Water / Wifi) */}
              {billType === 'utility' && (
                <div className="space-y-4 pt-1 animate-fade-in font-sans">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {_('Lựa chọn Dịch vụ', 'Service Type')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'electricity'}
                          onChange={() => {
                            setBillUtilityServiceType('electricity');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Hóa đơn tiền Điện' : 'Electricity Bill');
                            }
                          }}
                          className="rounded border-slate-850 text-amber-500 bg-slate-950 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-amber-400">⚡ {_('Báo Điện', 'Electricity')}</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'water'}
                          onChange={() => {
                            setBillUtilityServiceType('water');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Hóa đơn tiền Nước' : 'Water Bill');
                            }
                          }}
                          className="rounded border-slate-850 text-cyan-500 bg-slate-950 focus:ring-cyan-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-cyan-400">💧 {_('Báo Nước', 'Water')}</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'wifi'}
                          onChange={() => {
                            setBillUtilityServiceType('wifi');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Hóa đơn Wifi Internet' : 'Wifi Internet Bill');
                            }
                          }}
                          className="rounded border-slate-850 text-indigo-500 bg-slate-950 focus:ring-indigo-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-indigo-400">📶 {_('Mạng Wifi', 'Wifi')}</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'rent_house'}
                          onChange={() => {
                            setBillUtilityServiceType('rent_house');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Tiền Thuê nhà / Căn hộ' : 'House Rent');
                            }
                          }}
                          className="rounded border-slate-850 text-emerald-500 bg-slate-950 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-emerald-400">🏠 {_('Thuê nhà', 'House Rent')}</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'rent_car'}
                          onChange={() => {
                            setBillUtilityServiceType('rent_car');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Tiền Thuê xe tự lái' : 'Car Rental Bill');
                            }
                          }}
                          className="rounded border-slate-850 text-orange-500 bg-slate-950 focus:ring-orange-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-orange-400">🚗 {_('Thuê xe', 'Car Rental')}</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer select-none font-semibold">
                        <input
                          type="radio"
                          name="utilityType"
                          checked={billUtilityServiceType === 'parking'}
                          onChange={() => {
                            setBillUtilityServiceType('parking');
                            if (!title || title.includes('Điện') || title.includes('Nước') || title.includes('Wifi') || title.includes('nhà') || title.includes('xe')) {
                              setTitle(lang === 'vi' ? 'Biểu phí gửi xe / thẻ xe' : 'Parking Fee');
                            }
                          }}
                          className="rounded border-slate-850 text-sky-500 bg-slate-950 focus:ring-sky-500 cursor-pointer shrink-0"
                        />
                        <span className="flex items-center gap-1 text-sky-400">🅿️ {_('Tiền gửi xe', 'Parking Fee')}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Tên đứng tên / Người thụ hưởng', 'Bill Beneficiary')}
                    </label>
                    <input
                      type="text"
                      placeholder={_('Ví dụ: Nguyễn Văn A...', 'e.g., Alex Johnson...')}
                      value={billUtilityName}
                      onChange={(e) => setBillUtilityName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Mã khách hàng / Danh bộ', 'Customer ID / Code')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={category === 'bill' && billType === 'utility'}
                        placeholder={_('Ví dụ: PE1300021303, DB-12...', 'e.g., EN-881230...')}
                        value={billUtilityCustomerId}
                        onChange={(e) => setBillUtilityCustomerId(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 font-mono tracking-wider text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Kỳ thanh toán (1-12)', 'Billing Period (1-12)')}
                      </label>
                      <select
                        value={billUtilityPeriod}
                        onChange={(e) => setBillUtilityPeriod(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 h-[38px] text-slate-300 text-xs sm:text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={lang === 'vi' ? `Tháng ${m} (Kỳ ${m})` : `Month ${m} (Cycle ${m})`}>
                            {lang === 'vi' ? `Kỳ ${m} (Tháng ${m})` : `Cycle ${m} (Month ${m})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Số tiền cần đóng', 'Utility Bill Amount')}
                    </label>
                    <div className="relative flex items-center">
                      {lang !== 'vi' && (
                        <span className="absolute left-3 text-slate-400 font-bold text-sm pointer-events-none">
                          $
                        </span>
                      )}
                      <input
                        type="text"
                        placeholder={_('Ví dụ: 350.000...', 'e.g., 45...')}
                        value={billUtilityAmount}
                        onChange={(e) => setBillUtilityAmount(formatAmountString(e.target.value, lang))}
                        className={`w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 font-bold text-emerald-400 h-[38px] ${
                          lang === 'vi' ? 'pl-4 pr-8' : 'pl-7 pr-4'
                        }`}
                      />
                      {lang === 'vi' && (
                        <span className="absolute right-3 text-slate-400 font-bold text-sm pointer-events-none">
                          đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SEGMENT FOR APP SUBSCRIPTIONS */}
              {billType === 'app' && (
                <div className="space-y-4 pt-1 animate-fade-in font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Tên ứng dụng / App', 'Application Name')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={category === 'bill' && billType === 'app'}
                        placeholder={_('Ví dụ: CapCut, So9, Netflix...', 'e.g., Netflix, CapCut, Spotify...')}
                        value={billAppName}
                        onChange={(e) => {
                          setBillAppName(e.target.value);
                          if (!title) setTitle(e.target.value);
                        }}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('SĐT / Email liên kết', 'Linked Email / Phone')}
                      </label>
                      <input
                        type="text"
                        placeholder={_('Ví dụ: user@example.com, sđt...', 'e.g., user@email.com...')}
                        value={billAppContact}
                        onChange={(e) => setBillAppContact(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Thanh toán qua', 'Linked Account / Card')}
                      </label>
                      <select
                        value={billAppPaymentMethod}
                        onChange={(e) => setBillAppPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 h-[38px] text-slate-300"
                      >
                        <option value="ewallet">{_('📱 Ví Điện Tử (Momo, Zalopay...)', 'E-Wallet (Paypal...)')}</option>
                        <option value="bank_card">{_('💳 Thẻ Ngân Hàng (VISA, ATM...)', 'Bank Credit/ATM card')}</option>
                        <option value="google_apple">{_('🛍️ Chợ Ứng Dụng (Google/Apple Pay)', 'In-App billing (Store)')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        {_('Số tiền gia hạn', 'Renewal Price')}
                      </label>
                      <div className="relative flex items-center">
                        {lang !== 'vi' && (
                          <span className="absolute left-3 text-slate-400 font-bold text-sm pointer-events-none">
                            $
                          </span>
                        )}
                        <input
                          type="text"
                          placeholder={_('Ví dụ: 199.000...', 'e.g., 9.99...')}
                          value={billAppAmount}
                          onChange={(e) => setBillAppAmount(formatAmountString(e.target.value, lang))}
                          className={`w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 font-bold text-emerald-400 h-[38px] ${
                            lang === 'vi' ? 'pl-4 pr-8' : 'pl-7 pr-4'
                          }`}
                        />
                        {lang === 'vi' && (
                          <span className="absolute right-3 text-slate-400 font-bold text-sm pointer-events-none">
                            đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <span>{_('Hạn gia hạn / Thanh toán', 'Renewal Deadline')}</span>
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">Báo thức</span>
                    </label>
                    <input
                      type="date"
                      value={billAppDueDate}
                      onChange={(e) => setBillAppDueDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-300 h-[38px] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* In-form Password Generator Popover */}
          {showPassGen && (
            <div className="bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center px-4 pt-2.5 pb-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{_('Trình tạo nhanh mật khẩu an toàn', 'Quick Secure Password Generator')}</span>
                <button 
                  type="button" 
                  onClick={() => setShowPassGen(false)} 
                  className="text-slate-500 hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  {_('Đóng x', 'Close x')}
                </button>
              </div>
              <PasswordGenerator 
                onSelectPassword={handlePasswordFromGenerator} 
                showSelectButton={true} 
              />
            </div>
          )}

          {/* Advanced 2FA / TOTP Section */}
          {activeTemplateType !== 'note' && activeTemplateType !== 'sheet' && activeTemplateType !== 'bill' && (
            <div className="bg-slate-950/20 p-4 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Shield className="h-4 w-4 shrink-0 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {t.totp_codeLabel}
                </span>
                <span className="ml-auto bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">PRO</span>
              </div>
              <p className="text-[12px] text-slate-450 leading-relaxed">
                {t.totp_desc}
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-widest mb-1.5 font-sans">
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {_('Ghi chú thêm', 'Additional Notes')}
              </label>
              <textarea
                id="form-add-notes"
                placeholder={_('Ví dụ: Câu hỏi bảo mật, tài khoản phụ...', 'e.g. Additional recovery backup hints, question safety answers...')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm min-h-[80px] resize-y"
                rows={3}
              />
            </div>
          )}

          {/* Reminder Section */}
          <div className={`bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 transition-all relative overflow-hidden ${!isPro ? 'opacity-70 border-rose-500/10' : ''}`}>
            {!isPro && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10">
                <span className="text-xs font-bold text-rose-400 tracking-wide uppercase flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-450" />
                  <span>{_('Chức năng Đặt Lịch Nhắc Nhở (PRO Only)', 'Reminder Scheduler (PRO Only)')}</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[280px]">{_('Hãy nâng cấp lên phiên bản PRO để đặt thông báo nhắc tự động định kỳ!', 'Upgrade to PRO version to schedule automatic recurring alerts!')}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <label htmlFor="form-reminder-checkbox" className="text-sm font-semibold text-slate-200 cursor-pointer select-none">
                  {_('Đặt lịch nhắc nhở (Thông báo sinh nhật / công việc)', 'Schedule Reminder (Birthday / Task alerts)')}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Ngày nhắc nhở', 'Reminder Date')}
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
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Giờ báo thức', 'Alert Time')}
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                      {_('Chu kỳ lặp lại', 'Repeat Cycle')}
                    </label>
                    <select
                      id="form-repeat-cycle"
                      value={reminderType}
                      onChange={(e) => setReminderType(e.target.value as 'once' | 'monthly' | 'yearly')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="yearly">{_('Hàng năm (như Sinh nhật, Ngày kỷ niệm)', 'Annually (like Birthday, Anniversary)')}</option>
                      <option value="monthly">{_('Hàng tháng (như Tiền nhà, Đóng phí dịch vụ)', 'Monthly (like Rent, Subscriptions, Bills)')}</option>
                      <option value="once">{_('Sự kiện 1 lần (như Hạn chót, Hẹn làm việc)', 'Once (like Deadline, Task appoint)')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 font-sans">
                    {_('Nội dung lời nhắn', 'Notification Message')}
                  </label>
                  <input
                    type="text"
                    placeholder={_('Ví dụ: Sinh nhật vợ yêu ❤️, Nhắc đóng tiền điện...', "e.g., Wife's birthday ❤️, Pay energy bill...")}
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
                {_('Đánh dấu là Yêu thích', 'Add to Starred Favorites')}
              </label>
            </div>

            {isPro ? (
              <>
                <div className="flex items-center gap-2 bg-indigo-950/20 px-3 py-2 rounded-xl border border-indigo-500/20">
                  <input
                    id="form-secret-checkbox"
                    type="checkbox"
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-500 focus:ring-indigo-500 bg-slate-950 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="form-secret-checkbox" className="text-sm font-semibold text-indigo-300 cursor-pointer select-none flex items-center gap-1.5">
                    <Lock className="h-4 w-4 shrink-0" />
                    {_('Lưu vào Ngăn bí mật (Bảo mật đặc biệt)', 'Save to Secret Drawer (Special stealth)')}
                  </label>
                </div>
                <div className="flex items-center gap-2 bg-amber-950/20 px-3 py-3 rounded-xl border border-amber-500/20 col-span-1 sm:col-span-2">
                  <input
                    id="form-travel-checkbox"
                    type="checkbox"
                    checked={isSafeForTravel}
                    onChange={(e) => setIsSafeForTravel(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="form-travel-checkbox" className="text-sm font-semibold text-amber-300 cursor-pointer select-none flex items-center gap-1.5 leading-snug">
                    <span className="text-sm shrink-0">✈️</span>
                    {_('Cho phép giữ lại khi bật Chế độ Du lịch', 'Approve details to remain inside Travel Mode')}
                  </label>
                </div>
              </>
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
              {_('Hủy bỏ', 'Cancel')}
            </button>
            <button
              id="save-modal-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {editingEntry ? _('Lưu thay đổi', 'Apply Changes') : _('Thêm mới', 'Add Credential')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
