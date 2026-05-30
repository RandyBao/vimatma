import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { encryptText, decryptText, generateRandomHexSalt } from '../utils/crypto';
import { EncryptedDatabase } from '../types';

interface LockScreenProps {
  onUnlock: (password: string, decryptedEntries: any[]) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDb = localStorage.getItem('secure_vault_db');
    if (!savedDb) {
      setIsSetupMode(true);
    } else {
      setIsSetupMode(false);
    }
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (password.length < 8) {
      setErrorCode('Mật khẩu Master phải dài ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorCode('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      // Create fresh DB structure
      const salt = generateRandomHexSalt();
      
      // Encrypt verification token
      const verificationStr = 'VAULT_VERIFIED';
      const encryptedVerification = await encryptText(verificationStr, password, salt);
      
      // Encrypt empty entries Array
      const encryptedEntries = await encryptText(JSON.stringify([]), password, salt);

      const newDb: EncryptedDatabase = {
        salt,
        verification: encryptedVerification,
        encryptedEntries,
        lastUpdated: Date.now(),
      };

      localStorage.setItem('secure_vault_db', JSON.stringify(newDb));
      onUnlock(password, []);
    } catch (err) {
      console.error(err);
      setErrorCode('Không thể thiết lập mật khẩu Master. Đã xảy ra lỗi hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (!password) {
      setErrorCode('Vui lòng nhập mật khẩu Master.');
      return;
    }

    setLoading(true);
    // Add small artificial timeout for sleek unlocking animation feel
    await new Promise((r) => setTimeout(r, 600));

    try {
      const savedDbStr = localStorage.getItem('secure_vault_db');
      if (!savedDbStr) {
        setErrorCode('Không tìm thấy dữ liệu kho khóa.');
        setIsSetupMode(true);
        setLoading(false);
        return;
      }

      const db: EncryptedDatabase = JSON.parse(savedDbStr);
      
      // Try decrypting verification token first
      const decryptedVerification = await decryptText(db.verification, password, db.salt);
      
      if (decryptedVerification === 'VAULT_VERIFIED') {
        // Correct password! Decrypt items
        const decryptedEntriesStr = await decryptText(db.encryptedEntries, password, db.salt);
        const decryptedEntries = JSON.parse(decryptedEntriesStr);
        onUnlock(password, decryptedEntries);
      } else {
        setErrorCode('Mật khẩu Master không đúng hoặc định dạng sai.');
      }
    } catch (err) {
      console.error(err);
      setErrorCode('Nhập sai mật khẩu Master hoặc dữ liệu lưu trữ đã bị thay đổi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="lockscreen-root" className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Absolute ambient background light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        id="lockscreen-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800 text-emerald-400 mb-4 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            {loading ? (
              <Unlock className="h-7 w-7 text-emerald-400 animate-pulse" />
            ) : (
              <Shield className="h-7 w-7 text-emerald-400" />
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {isSetupMode ? 'Thiết lập Kho bảo mật' : 'Giải mã Kho lưu trữ'}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            {isSetupMode
              ? 'Mã hóa thông tin cá nhân của bạn trực triếp trên trình duyệt'
              : 'Nhập mật khẩu Master để truy cập các mật khẩu đã được mã hóa của bạn'}
          </p>
        </div>

        {isSetupMode ? (
          <form id="setup-form" onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mật khẩu Master mới
              </label>
              <div className="relative">
                <input
                  id="new-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập tối thiểu 8 ký tự..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-600 outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button
                  id="toggle-setup-pwd-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Xác nhận Mật khẩu Master
              </label>
              <div className="relative">
                <input
                  id="confirm-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu Master..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-600 outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {/* Crucial Security Warning */}
            <div className="flex gap-3 bg-amber-500/15 border border-amber-500/25 p-3.5 rounded-xl text-amber-300 text-xs leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Lưu ý quan trọng:</span> Mật khẩu này không thể khôi phục hay đổi lại nếu bạn quên. Tất cả dữ liệu của bạn được mã hóa an toàn offline. Hãy lưu mật khẩu Master ở nơi thích hợp.
              </div>
            </div>

            {errorCode && (
              <div id="setup-err-msg" className="text-rose-400 text-xs font-medium text-center bg-rose-500/10 border border-rose-500/20 py-2.5 px-3 rounded-lg">
                {errorCode}
              </div>
            )}

            <button
              id="submit-setup-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? 'Đang tạo khóa mã hóa...' : 'Khởi tạo Kho mật khẩu'}
            </button>
          </form>
        ) : (
          <form id="login-form" onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mật khẩu Master
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-master-pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu Master..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono tracking-wide placeholder-slate-600 outline-none transition-all"
                  autoFocus
                />
                <Lock className="absolute left-3.5 top-4 h-4 w-4 text-slate-500" />
                <button
                  id="toggle-login-pwd-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorCode && (
              <div id="login-err-msg" className="text-rose-400 text-xs font-medium text-center bg-rose-500/10 border border-rose-500/20 py-3 px-3 rounded-lg">
                {errorCode}
              </div>
            )}

            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              {loading ? 'Đang giải mã dữ liệu...' : 'Giải mã và Đăng nhập'}
            </button>

            <div className="text-center pt-2">
              <button
                id="reset-vault-link"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu mật khẩu hiện có trong thiết bị và bắt đầu lại kho mới. Khôi phục lại là KHÔNG thể trừ khi bạn có tệp sao lưu. Bạn có chắc chắn muốn tiếp tục?'
                    )
                  ) {
                    localStorage.removeItem('secure_vault_db');
                    setIsSetupMode(true);
                    setPassword('');
                    setConfirmPassword('');
                    setErrorCode(null);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Xóa sạch kho dữ liệu & tạo lại Master Password
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 leading-relaxed max-w-[280px] mx-auto">
            <span>Mã hóa bảo mật cao 256-bit AES-GCM cục bộ. Dữ liệu của bạn được an toàn tuyệt đối.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
