import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileText, Download, Printer, QrCode, KeyRound, Share2, History, 
  CalendarClock, ShieldAlert, Check, Copy, Lock, Unlock, Info, 
  User, Mail, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, Play
} from 'lucide-react';
import QRCode from 'qrcode';
import { VaultEntry } from '../types';
import { decryptText, encryptText, generateRandomHexSalt } from '../utils/crypto';

interface ProUtilitiesProps {
  entries: VaultEntry[];
  isPro: boolean;
  onUpgradeClick: () => void;
  onSaveEntry: (entry: VaultEntry) => void;
  currentLang: 'vi' | 'en';
}

export default function ProUtilities({ entries, isPro, onUpgradeClick, onSaveEntry, currentLang }: ProUtilitiesProps) {
  const [activeTab, setActiveTab] = useState<'kit' | 'share' | 'timeline'>('kit');

  // Translation helper
  const _ = (vi: string, en: string) => (currentLang === 'vi' ? vi : en);

  // Print helper for Emergency Kit
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-2xl animate-fade-in w-full">
      {/* Premium Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/40 pb-5 mb-6 gap-3 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/10 inline-block uppercase">
            ⚡ {_( 'Bản Cao Cấp PRO', 'Premium PRO Features' )}
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{_( 'Bộ Công Cụ Chuyên Sâu PRO', 'Advanced PRO Utilities' )}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {_(
              'Trải nghiệm bảo mật đỉnh cao với các tính năng khép kín chạy hoàn toàn ngoại tuyến ngay trên thiết bị của bạn.',
              'Unlock elite, secure, and privacy-first tools operating 100% locally on your browser.'
            )}
          </p>
        </div>

        {/* Upgrade / Pro Active Indicator */}
        <div className="shrink-0">
          {isPro ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs font-bold font-sans">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{_( 'Đã Kích Hoạt PRO', 'PRO Active' )}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{_( 'Nâng cấp lên PRO', 'Upgrade to PRO' )}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800/40 pb-0 mb-6 overflow-x-auto gap-1 scrollbar-none select-none">
        {[
          { id: 'kit', label: _('1. Thẻ Cứu Hộ (Emergency Kit)', '1. Emergency Kit'), icon: FileText, color: 'text-rose-400' },
          { id: 'share', label: _('2. Chia Sẻ Ngoại Tuyến (Offline Share)', '2. Offline local share'), icon: Share2, color: 'text-emerald-400' },
          { id: 'timeline', label: _('3. Mật Mã Biểu (Password Timeline)', '3. Password Timeline'), icon: CalendarClock, color: 'text-amber-400' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-all ease-out cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'border-indigo-400 text-white bg-slate-950/20 rounded-t-xl' 
                  : 'border-transparent text-slate-450 hover:text-slate-200 hover:bg-slate-950/10 rounded-t-xl'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Non-pro overlay if they try to access tabs without being Pro */}
      <div className="relative min-h-[480px]">
        {!isPro ? (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-2xl z-30 flex flex-col items-center justify-center p-8 text-center">
            <Lock className="h-14 w-14 text-indigo-400 mb-4 animate-bounce" />
            <h3 className="text-lg font-black text-white mb-2">
              {_('Tính năng bị khoá (Bản quyền PRO)', 'Premium Utilities Locked')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
              {_(
                'Các công cụ cao cấp bao gồm Thẻ cứu hộ, chia sẻ mã QR mã hóa gốc và kiểm soát dòng thời hạn mật mã chỉ dành riêng cho chủ tài khoản PRO.',
                'Emergency Kits, secure encrypted QR transfer, and password history logs are premium operations reserved exclusively for PRO users.'
              )}
            </p>
            <button
              type="button"
              onClick={onUpgradeClick}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xl shadow-indigo-500/15 cursor-pointer uppercase tracking-wider"
            >
              {_('Gỡ khóa Bản PRO ngay', 'Unlock PRO features now')}
            </button>
          </div>
        ) : null}

        {/* Dynamic Sub-Components */}
        {activeTab === 'kit' && <EmergencyKitTab currentLang={currentLang} _={_} handlePrint={handlePrint} />}
        {activeTab === 'share' && <OfflineShareTab entries={entries} onSaveEntry={onSaveEntry} currentLang={currentLang} _={_} />}
        {activeTab === 'timeline' && <PasswordTimelineTab entries={entries} currentLang={currentLang} _={_} />}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// TAB 1: EMERGENCY KIT GENERATOR
// -------------------------------------------------------------------------
function EmergencyKitTab({ currentLang, _, handlePrint }: { currentLang: 'vi' | 'en'; _: any; handlePrint: () => void }) {
  const [email, setEmail] = useState('');
  const [setupSecret, setSetupSecret] = useState(() => {
    // Generate a beautiful master setup key
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'SV-';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) result += '-';
    }
    return result;
  });
  const [pwdHint, setPwdHint] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Regenerate setup secret key
  const handleRegenSecret = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'SV-';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) result += '-';
    }
    setSetupSecret(result);
  };

  // Generate QR Code containing the app's current origin + setup metadata
  useEffect(() => {
    const appUrl = window.location.origin;
    const metaString = `SecureVault-Setup-v1|Email:${email || 'Unknown'}|Secret:${setupSecret}`;
    
    QRCode.toDataURL(metaString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#030712', // deep slate/black
        light: '#ffffff' // white
      }
    })
    .then(url => setQrCodeDataUrl(url))
    .catch(err => console.error('Failed to generate QR Code for Emergency kit:', err));
  }, [email, setupSecret]);

  return (
    <div className="space-y-6 text-left animate-fade-in print:bg-white print:text-black print:p-0">
      {/* Intro info box */}
      <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex items-start gap-3 print:hidden">
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200">
            {_('Thẻ Cứu Hộ Khẩn Cấp (Emergency Kit) là gì?', 'What is an Emergency Kit?')}
          </h4>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            {_(
              'Đây là tài liệu cứu trợ duy nhất giúp bạn phục hồi quyền truy cập khi quên mật khẩu chính. Thẻ chứa Khóa cài đặt (Setup Secret) bí mật riêng lẻ của thiết bị. Hãy in ra giấy hoặc lưu ngoại tuyến ở nơi cực kỳ an toàn.',
              'This is a foolproof document containing everything required to restore your vault if you lose or forget your master password. It includes your custom local device setup secret. Keep it safely printed or physically backed up.'
            )}
          </p>
        </div>
      </div>

      {/* Editor inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">{_('Địa chỉ Email của bạn', 'Your Email Address')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. locbaomedia23@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">{_('Gợi ý Mật khẩu chính (Master Password Hint)', 'Master Password Hint')}</label>
            <input
              type="text"
              value={pwdHint}
              onChange={(e) => setPwdHint(e.target.value)}
              placeholder={_('ví dụ: Biệt danh thời thơ ấu của bạn', 'e.g. your childhood primary school')}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-sans"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400">{_('Khóa Cài đặt thiết bị (Setup Secret Key)', 'Device Setup Secret Key')}</label>
              <button
                type="button"
                onClick={handleRegenSecret}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{_('Tạo mã khác', 'Generate New')}</span>
              </button>
            </div>
            <div className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-emerald-400 flex items-center justify-between select-all leading-relaxed">
              <span>{setupSecret}</span>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full px-4 py-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Printer className="h-4 w-4" />
              <span>{_('In Thẻ Cứu Hộ Ngoại Tuyến (Print/PDF)', 'Print Emergency Kit')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visually stunning printable A4 Emergency Kit card */}
      <div 
        id="printable-emergency-kit-sheet" 
        className="bg-white text-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-6 print:border-0 print:shadow-none print:p-0 font-sans print:my-0 text-left relative overflow-hidden"
      >
        {/* Aesthetic Branding banner */}
        <div className="border-b-4 border-rose-500 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-rose-600 uppercase bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
              ⚠️ {_( 'QUAN TRỌNG - THẺ CỨU HỘ', 'IMPORTANT - EMERGENCY KIT' )}
            </span>
            <h3 className="text-xl font-black text-slate-950 tracking-tight mt-1.5">
              SecureVault Crypto Wallet Recovery
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {_('MÃ HÓA KHÉP KÍN BẢO VỆ CHỦ QUYỀN THIẾT BỊ', 'ZERO-KNOWLEDGE PHYSICAL VAULT KEY')}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="font-mono text-xs font-bold text-slate-400">v1.1 (OFFLINE)</span>
            <span className="text-[9px] text-slate-400 mt-0.5">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Fields table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">1. {_('Địa chỉ Email liên kết', 'Email address')}</span>
              <span className="text-sm font-bold text-slate-900 break-all select-all">{email || '_______________________________________'}</span>
            </div>

            <div className="border-b border-slate-100 pb-2.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">2. {_('Khóa bí mật thiết lập (Setup Secret)', 'Setup Secret')}</span>
              <span className="text-sm font-mono font-bold text-emerald-600 tracking-wider break-all select-all">{setupSecret}</span>
            </div>

            <div className="border-b border-slate-100 pb-2.5">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">3. {_('Gợi ý Mật khẩu chính', 'Master Password Hint')}</span>
              <span className="text-sm font-bold text-slate-900 select-all">{pwdHint || '_______________________________________'}</span>
            </div>

            <div className="border-b border-slate-100 pb-2.5 relative">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">4. {_('Tự viết Mật khẩu chính (Viết tay bằng bút chì)', 'Write Master Password (Handwrite with pen/pencil)')}</span>
              <span className="text-xs text-slate-350 italic font-mono block mt-2 h-10 select-all">
                ____________________________________________________________________
              </span>
              <span className="text-[7.5px] text-slate-400 block mt-0.5 leading-snug">
                {_('* Cảnh báo: Nhân viên hỗ trợ sẽ KHÔNG bao giờ hỏi mật khẩu này. Đừng để lộ cho bất kỳ ai.', '* Never share or send this password. SecureVault team cannot recover or reset it for you.')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border border-slate-200 p-2 rounded-2xl bg-slate-50 min-h-[160px]">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Setup QR Code" className="h-32 w-32 object-contain" />
            ) : (
              <div className="h-32 w-32 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-450 font-mono text-[10px]">
                Loading QR...
              </div>
            )}
            <span className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-wide text-center">
              {_('QUÉT ĐỂ THIẾT LẬP LẠI', 'SCAN TO INSTANT SETUP')}
            </span>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-[10px] leading-relaxed text-slate-600 space-y-2">
          <p className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
            <span>⚙️</span>
            <span>{_('HƯỚNG DẪN KHÔI PHỤC KÉT CHỨA', 'RECOVERY & BOOTSTRAPPING INSTRUCTIONS')}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            <div>
              <p className="font-semibold text-slate-800">Tiếng Việt:</p>
              <ul className="list-decimal pl-3 space-y-1">
                <li>Truy cập trực tiếp ứng dụng SecureVault từ thiết bị của bạn.</li>
                <li>Mở mục <strong>"Sao Lưu & Phục Hồi"</strong> hoặc trang đăng nhập ban đầu.</li>
                <li>Chọn <strong>"Nhập khóa phục hồi khẩn cấp"</strong> và điền mã <i>Setup Secret</i> phía trên.</li>
                <li>Sử dụng mật mật khẩu chính (Master Password) viết tay phía trên để giải mã cơ sở dữ liệu khép kín an toàn.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800">English Instruction:</p>
              <ul className="list-decimal pl-3 space-y-1">
                <li>Load the SecureVault application on your device securely.</li>
                <li>Navigate to the <strong>"Backup & Restore"</strong> panel on startup.</li>
                <li>Select <strong>"Restore from Recovery Kit"</strong> and enter the <i>Setup Secret</i> typed above.</li>
                <li>Provide your handwritten master password to decrypt and restore local records immediately without web connections.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// TAB 2: SECURE OFFLINE SHARE VIA QR CODE
// -------------------------------------------------------------------------
function OfflineShareTab({ 
  entries, onSaveEntry, currentLang, _ 
}: { 
  entries: VaultEntry[]; onSaveEntry: (entry: VaultEntry) => void; currentLang: 'vi' | 'en'; _: any 
}) {
  const [subTab, setSubTab] = useState<'send' | 'receive'>('send');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [encryptionPin, setEncryptionPin] = useState('0000');
  const [encryptedPayload, setEncryptedPayload] = useState('');
  const [shareQrCode, setShareQrCode] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  // Receive flow fields
  const [receivePayloadInput, setReceivePayloadInput] = useState('');
  const [decryptionPin, setDecryptionPin] = useState('');
  const [decryptedEntry, setDecryptedEntry] = useState<VaultEntry | null>(null);
  const [decryptError, setDecryptError] = useState('');

  // Handle encoding/encrypting
  const handleGenerateShare = async () => {
    try {
      const entryToShare = entries.find(e => e.id === selectedEntryId);
      if (!entryToShare) {
        alert(_('Vui lòng chọn một mật tài khoản để chia sẻ.', 'Please select credentials to share.'));
        return;
      }

      if (!encryptionPin || encryptionPin.length < 4) {
        alert(_('Mã PIN bảo mật phải gồm tối thiểu 4 ký tự.', 'Security PIN must be at least 4 chars.'));
        return;
      }

      // Generate random salt for password encoding
      const salt = generateRandomHexSalt(16);
      
      // Clean up the entry to remove unnecessary system IDs or custom UI state
      const cleanedEntry = { ...entryToShare };
      delete (cleanedEntry as any).isFavorite;
      delete (cleanedEntry as any).isSecret;

      const clearText = JSON.stringify(cleanedEntry);
      
      // Encrypt the credentials with PIN
      const ciphertext = await encryptText(clearText, encryptionPin, salt);
      const combinedPayload = `SVSHARE|${salt}|${ciphertext}`;
      
      setEncryptedPayload(combinedPayload);

      // Render QR Code 100% offline
      const renderedQr = await QRCode.toDataURL(combinedPayload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#030712'
        }
      });
      setShareQrCode(renderedQr);
    } catch (err: any) {
      console.error('Offline share encryption failed:', err);
      alert(_('Mã hóa thất bại: ' + err.message, 'Encryption failed: ' + err.message));
    }
  };

  // Handle decoding / decrypting
  const handleDecryptShare = async () => {
    try {
      setDecryptError('');
      setDecryptedEntry(null);

      const trimmedPayload = receivePayloadInput.trim();
      if (!trimmedPayload.startsWith('SVSHARE|')) {
        setDecryptError(_('Payload chia sẻ không tải lên đúng cấu trúc SecureVault.', 'Payload does not match SecureVault structural signatures.'));
        return;
      }

      const parts = trimmedPayload.split('|');
      if (parts.length < 3) {
        setDecryptError(_('Định dạng tệp tin chia sẻ bị lỗi.', 'Import file parameters are corrupted.'));
        return;
      }

      const [, salt, ciphertext] = parts;
      if (!decryptionPin) {
        setDecryptError(_('Vui lòng nhập Mã PIN bảo mật dùng một lần.', 'Please supply the temporary decryption PIN code.'));
        return;
      }

      // Perform decryption
      const decryptedJson = await decryptText(ciphertext, decryptionPin, salt);
      const importedRecord = JSON.parse(decryptedJson) as VaultEntry;
      
      setDecryptedEntry(importedRecord);
    } catch (err: any) {
      console.error('Offline share decryption failed:', err);
      setDecryptError(_('PIN giải mã không khớp hoặc chuỗi dữ liệu hỏng. Vui lòng kiểm tra lại.', 'Incorrect PIN or corrupted parameters. Verify key and try again.'));
    }
  };

  const handleConfirmImport = () => {
    if (!decryptedEntry) return;

    // Generate a fresh ID to avoid collisions
    const importedWithFreshId: VaultEntry = {
      ...decryptedEntry,
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onSaveEntry(importedWithFreshId);

    // Reset input fields
    setDecryptedEntry(null);
    setReceivePayloadInput('');
    setDecryptionPin('');
    
    alert(_('Đã nhập tài khoản thành công vào kho lưu trữ ngoại tuyến của bạn!', 'Credentials successfully imported into your primary offline ledger!'));
  };

  const copyToClipboard = () => {
    if (!encryptedPayload) return;
    navigator.clipboard.writeText(encryptedPayload);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      {/* Sub tabs: Send vs Receive */}
      <div className="flex border-b border-slate-800/40 pb-0 gap-3 select-none">
        <button
          type="button"
          onClick={() => setSubTab('send')}
          className={`px-3 py-1.5 font-bold text-xs border-b-2 cursor-pointer transition-all ${
            subTab === 'send' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-450 hover:text-slate-350'
          }`}
        >
          {_('🔒 Phát mã Chia sẻ (Generate Share QR)', 'Send Encryption Link')}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('receive')}
          className={`px-3 py-1.5 font-bold text-xs border-b-2 cursor-pointer transition-all ${
            subTab === 'receive' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-450 hover:text-slate-350'
          }`}
        >
          {_('🔓 Nhận & Giải Mã (Receive & Import)', 'Scan and Import')}
        </button>
      </div>

      {subTab === 'send' ? (
        <div className="space-y-5">
          <div className="bg-emerald-950/20 border border-emerald-500/15 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-300">
                {_('Chia sẻ ngoại tuyến diễn ra như thế nào?', 'How offline QR sharing works?')}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {_(
                  'Hệ thống sẽ lấy dữ liệu mật mã, mã hóa ngoại tuyến bằng một Mã PIN do bạn thiết lập sử dụng Web Crypto. Sau đó xuất chuỗi mã hóa thành Mã QR. Người nhận quét QR và nhập đúng PIN là giải nén được mà KHÔNG qua Internet.',
                  'Your credentials are fully encrypted offline using Web Crypto API and a temporary PIN of your choice. A secure QR is then drawn. The receiver simply scans the code offline and provides the correct PIN to import.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              {/* Select credentials to share */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">{_('Chọn Mật hiệu trong ví', 'Pick Credentials from Vault')}</label>
                <select
                  value={selectedEntryId}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer font-sans"
                >
                  <option value="">-- {_('Chọn mật khẩu để chia sẻ', 'Select item to share')} --</option>
                  {entries.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category.toUpperCase()}] {item.title} {item.notes ? `(${item.notes.substring(0, 15)}...)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Encryption PIN */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  {_('Nhập Mã PIN tạm thời để giải mã (Tối thiểu 4 chữ số)', 'Temporary Decryption PIN (Min 4 chars)')}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={encryptionPin}
                  onChange={(e) => setEncryptionPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-mono tracking-widest text-emerald-400 font-bold"
                  placeholder="e.g. 1234"
                />
              </div>

              <button
                type="button"
                disabled={!selectedEntryId}
                onClick={handleGenerateShare}
                className="w-full px-4 py-3 bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                <Lock className="h-4 w-4" />
                <span>{_('Mã hóa & Xuất Mã QR', 'Encrypt & Draw QR Code')}</span>
              </button>
            </div>

            {/* Generated display */}
            <div className="flex flex-col items-center justify-center bg-slate-950/40 p-4 rounded-3xl border border-slate-850/60 min-h-[300px] text-center">
              {shareQrCode ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl inline-block shadow-2xl">
                    <img src={shareQrCode} alt="Share QR Code" className="h-44 w-44 object-contain" />
                  </div>
                  
                  <div className="space-y-1.5 w-full max-w-xs">
                    <div className="flex items-center justify-between gap-2.5 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 text-left">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                        {encryptedPayload}
                      </span>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedShare ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedShare ? _('Đã sao chép', 'Copied') : _('Sao chép', 'Copy')}</span>
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-455 select-none leading-normal">
                      📣 {_('Gửi mã QR này cho thiết bị nhận cùng với Mã PIN bảo mật đã thiết lập.', 'Send this QR Code or hex string to the recipient along with the temporary PIN.')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-slate-500">
                  <QrCode className="h-12 w-12 mx-auto stroke-1" />
                  <p className="text-xs">
                    {_('Chọn tài khoản bên trái và bấm Xuất QR', 'Select a cabinet item and click generate')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* RECEIVE SUbtab */
        <div className="space-y-5">
          <div className="bg-indigo-950/20 border border-indigo-500/15 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Unlock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-300">
                {_('Nhận & Nhập mật khẩu đã giải mã', 'Receive & Import Shared Records')}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {_(
                  'Dán chuỗi ký tự SVSHARE (thu được khi quét QR hoặc sao chép chuỗi mã hóa), điền đúng Mã PIN dùng một lần để mở khóa bóc tách tài liệu và lưu thẳng vào két.',
                  'Paste the SVSHARE payload (from QR code scanning or messaging), type the temporary unlock PIN, and check data correctness securely prior to import.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">{_('Dán chuỗi dữ liệu SVSHARE', 'Paste SVSHARE string payload')}</label>
                <textarea
                  value={receivePayloadInput}
                  onChange={(e) => setReceivePayloadInput(e.target.value)}
                  rows={4}
                  placeholder="SVSHARE|..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-emerald-400 font-mono focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">{_('Mã PIN Giải mã', 'Decryption PIN Code')}</label>
                <input
                  type="text"
                  maxLength={10}
                  value={decryptionPin}
                  onChange={(e) => setDecryptionPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-mono tracking-widest text-indigo-400 font-bold"
                  placeholder="e.g. 1234"
                />
              </div>

              {decryptError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{decryptError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDecryptShare}
                className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                <Unlock className="h-4 w-4" />
                <span>{_('Giải Mã Dữ Liệu', 'Decrypt shared records')}</span>
              </button>
            </div>

            {/* Decrypted record preview & Confirmation */}
            <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-850/60 min-h-[300px] flex flex-col justify-between">
              {decryptedEntry ? (
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-2.5 text-left">
                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/10 inline-block">
                      ✓ {_('Giải mã thành công', 'Decrypted Successfully')}
                    </span>
                    
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 space-y-2">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        {importedLabelMapping(decryptedEntry.category)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-900/60 pt-2 text-left">
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wide text-[9px] font-bold">{_('Tiêu đề tài khoản', 'Title')}</span>
                          <span className="text-slate-200 font-semibold">{decryptedEntry.title}</span>
                        </div>
                        {((decryptedEntry as any).username || (decryptedEntry as any).phoneNumber) && (
                          <div>
                            <span className="text-slate-500 block uppercase tracking-wide text-[9px] font-bold">{_('Tên đăng nhập / SĐT', 'Username / Tel')}</span>
                            <span className="text-slate-200 font-mono truncate block max-w-[120px]">{ (decryptedEntry as any).username || (decryptedEntry as any).phoneNumber }</span>
                          </div>
                        )}
                      </div>

                      {((decryptedEntry as any).password || (decryptedEntry as any).passcode || (decryptedEntry as any).pin) && (
                        <div className="bg-slate-950/90 p-2 border border-slate-900/80 rounded-xl text-left">
                          <span className="text-slate-500 block uppercase tracking-wide text-[9px] font-bold">{_('Mật mã ẩn', 'Ciphertext Password')}</span>
                          <span className="text-emerald-400 font-mono text-[11px] select-all">••••••••••••</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      💡 {_('Nhấn xác nhận để nhập bản sao dữ liệu này vào Két chìa khóa hiện tại của thiết bị.', 'Click confirm to permanently add this cabinet clone copy to your local storage.')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-xl shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider select-none"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{_('Nhập Vào Kho Khóa', 'Import to Vault')}</span>
                  </button>
                </div>
              ) : (
                <div className="my-auto space-y-2 text-slate-500 text-center">
                  <Unlock className="h-12 w-12 mx-auto stroke-1" />
                  <p className="text-xs">
                    {_('Nhập thông tin bên trái để giải mã dữ liệu chia sẻ', 'Insert the SVSHARE string payload to view record details')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const importedLabelMapping = (cat: string) => {
  const map: { [key: string]: string } = {
    bank: 'Thẻ / Tài khoản Ngân Hàng',
    social: 'Tài khoản Mạng Xã Hội',
    web: 'Tài khoản Website / Email',
    note: 'Ghi Chú Bảo Mật',
    wallet: 'Ví Tiền Mã Hóa Crypto',
    ewallet: 'Ví Điện Tử',
    phoneapp: 'Ứng Dụng Di Động',
    sheet: 'Bảng Tính Google Sheets',
    gdrive: 'Tệp Tin Google Drive'
  };
  return map[cat] || cat.toUpperCase();
};

// -------------------------------------------------------------------------
// TAB 3: PASSWORD TIMELINE & EXPIRY MONITOR
// -------------------------------------------------------------------------
function PasswordTimelineTab({ entries, currentLang, _ }: { entries: VaultEntry[]; currentLang: 'vi' | 'en'; _: any }) {
  // Collect history log elements
  // Let's scan all entries that have passwordHistory
  const timelineLogs = useMemo(() => {
    let list: Array<{
      id: string;
      title: string;
      category: string;
      updatedAt: number;
      type: 'update' | 'creation';
      passwordPreview?: string;
    }> = [];

    entries.forEach((e) => {
      // Add the initial creation
      list.push({
        id: e.id,
        title: e.title,
        category: e.category,
        updatedAt: e.createdAt,
        type: 'creation'
      });

      // Add actual historical password changes if they exist
      const hist = (e as any).passwordHistory || [];
      hist.forEach((histItem: any) => {
        list.push({
          id: e.id,
          title: e.title,
          category: e.category,
          updatedAt: histItem.updatedAt,
          type: 'update'
        });
      });
    });

    // Sort descending by date
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries]);

  // Expiration / Age audit monitor
  const expiryAnalysis = useMemo(() => {
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const expiredList: Array<{
      entry: VaultEntry;
      daysOld: number;
      isUrgent: boolean;
      customReminderDate?: string;
    }> = [];

    entries.forEach((e) => {
      // Check custom reminder date
      let isCustomReminderDue = false;
      if (e.reminder && e.reminder.enabled && e.reminder.date) {
        const reminderTime = new Date(e.reminder.date).getTime();
        if (now >= reminderTime) {
          isCustomReminderDue = true;
        }
      }

      // Check password age
      const lastUpdated = e.updatedAt || e.createdAt;
      const ageMs = now - lastUpdated;
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));

      const isOldPassword = daysOld >= 90;

      if (isOldPassword || isCustomReminderDue) {
        expiredList.push({
          entry: e,
          daysOld,
          isUrgent: isCustomReminderDue || daysOld >= 180,
          customReminderDate: e.reminder?.enabled ? e.reminder.date : undefined
        });
      }
    });

    return expiredList.sort((a, b) => b.daysOld - a.daysOld);
  }, [entries]);

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Side: Password Expiry & Reminders Monitor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>{_('Cảnh Báo Hạn Dùng & Nhắc Nhở', 'Expiry Cautions & Reminders')}</span>
            </h4>
            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {expiryAnalysis.length} {_('mục cần lưu ý', 're-checks required')}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {_(
              'Trình giám sát tự động tính toán thời hạn của mật mã. Khuyên dùng: Hãy kiểm tra và thay đổi các mật khẩu đã lưu quá 90 ngày hoặc đã đến hạn cấu hình nhắc nhở.',
              'Crucial credential monitor list. Recommendations: Replace key passwords older than 90 days or overdue reminders to maintain security.'
            )}
          </p>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1.5 scrollbar-thin">
            {expiryAnalysis.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/20 border border-slate-900/60 rounded-2xl">
                <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto stroke-1 mb-2" />
                <p className="text-xs text-slate-500">
                  {_('Tuyệt đỉnh! Không có mật mã nào bị quá hạn.', 'Splendid! All passwords are brand new and active.')}
                </p>
              </div>
            ) : (
              expiryAnalysis.map(({ entry, daysOld, isUrgent, customReminderDate }) => (
                <div 
                  key={entry.id} 
                  className={`p-3 bg-slate-950/80 border rounded-2xl flex items-start gap-2.5 transition-all hover:border-slate-700/60 ${
                    isUrgent ? 'border-rose-500/20 shadow-lg shadow-rose-950/10' : 'border-slate-850'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${isUrgent ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-left min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-white truncate block max-w-[150px]">{entry.title}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isUrgent ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {isUrgent ? _('CẢNH BÁO', 'CRITICAL') : _('CẦN THAY', 'EXPIRING')}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-450 leading-normal space-y-0.5">
                      <p>
                        {_('Danh mục:', 'Category:')} <span className="text-slate-350 capitalize">{entry.category}</span>
                      </p>
                      
                      <p>
                        {customReminderDate ? (
                          <span className="text-rose-400 font-semibold">
                            🔔 {_(`Đến hạn nhắc nhở: ${customReminderDate}`, `Reminder Overdue: ${customReminderDate}`)}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            🕒 {_(`Đã dùng ${daysOld} ngày`, `Active for ${daysOld} days`)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Password History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              <History className="h-4 w-4 text-indigo-400" />
              <span>{_('Mật Mã Biểu (History Logs)', 'Password Activity Timeline')}</span>
            </h4>
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {timelineLogs.length} {_('mốc thời gian', 'milestones')}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {_(
              'Lịch sử dòng thời gian theo dõi toàn bộ các sự thay đổi của các tủ mật khẩu, cung cấp cái nhìn chi tiết về lịch sử bảo mật.',
              'Security timeline logs documenting historical creations and modifications across your lockbox repositories over time.'
            )}
          </p>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1.5 timeline-list-flow overflow-x-hidden scrollbar-thin">
            {timelineLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/20 border border-slate-900/60 rounded-2xl">
                <Info className="h-10 w-10 text-slate-600 mx-auto stroke-1 mb-2" />
                <p className="text-xs text-slate-550">
                  {_('Chưa ghi nhận sự thay đổi nào.', 'No activity logs documented yet.')}
                </p>
              </div>
            ) : (
              timelineLogs.map((log, idx) => (
                <div key={`${log.id}-${log.updatedAt}-${idx}`} className="flex gap-3 text-left relative group">
                  {/* Decorative Timeline connector dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ring-4 ${
                      log.type === 'creation' 
                        ? 'bg-emerald-400 ring-emerald-500/10' 
                        : 'bg-indigo-400 ring-indigo-500/10'
                    }`} />
                    {idx < timelineLogs.length - 1 && (
                      <div className="w-[1.5px] bg-slate-800 flex-1 my-1" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-slate-200 truncate pr-2 group-hover:text-white transition-all">
                        {log.title}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono shrink-0 select-none">
                        {new Date(log.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      {log.type === 'creation' ? (
                        <span className="text-emerald-400 font-semibold">
                          ✚ {_('Khởi tạo ban đầu trong két', 'Initially configured in lockbox drawer')}
                        </span>
                      ) : (
                        <span className="text-indigo-400 font-semibold">
                          ✎ {_('Cập nhật mới mật khẩu gần đây và lưu lịch sử', 'Updated password details & logged history')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
