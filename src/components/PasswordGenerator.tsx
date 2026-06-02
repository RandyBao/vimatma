import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordGeneratorProps {
  onSelectPassword?: (password: string) => void;
  showSelectButton?: boolean;
}

export default function PasswordGenerator({ onSelectPassword, showSelectButton = false }: PasswordGeneratorProps) {
  // Direct localStorage dynamic premium structure/language check
  const isPro = localStorage.getItem('secure_vault_pro_active') === 'true';
  const currentLang = (localStorage.getItem('secure_vault_lang') as 'vi' | 'en') || 'vi';

  const [length, setLength] = useState(isPro ? 16 : 12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Clamp length based on license, and adjust state if modified
  const currentMax = isPro ? 32 : 12;
  const actualLength = isPro ? length : Math.min(length, 12);

  const generatePassword = useCallback(() => {
    let charset = '';
    
    // Non-PRO has locked options: Uppercase, Lowercase, Numbers always true, Symbols always false
    const useUpper = isPro ? includeUppercase : true;
    const useLower = isPro ? includeLowercase : true;
    const useNumbers = isPro ? includeNumbers : true;
    const useSymbols = isPro ? includeSymbols : false;

    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    let generated = '';
    const array = new Uint32Array(actualLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < actualLength; i++) {
      generated += charset[array[i] % charset.length];
    }
    setPassword(generated);
  }, [actualLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols, isPro]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Evaluate password strength
  const getPasswordStrength = () => {
    if (!password) return { label: currentLang === 'vi' ? 'Chưa tạo' : 'Not generated', color: 'bg-slate-700', text: 'text-slate-400', width: 'w-0' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    
    const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    score += varietyCount;

    if (score <= 3) {
      return { label: currentLang === 'vi' ? 'Yếu' : 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: 'w-1/3' };
    } else if (score <= 5) {
      return { label: currentLang === 'vi' ? 'Trung bình' : 'Medium', color: 'bg-amber-500', text: 'text-amber-400', width: 'w-2/3' };
    } else {
      return { label: currentLang === 'vi' ? 'Mạnh' : 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' };
    }
  };

  const strength = getPasswordStrength();

  return (
    <div id="password-generator-container" className="p-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-md">
      <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
        <span>{currentLang === 'vi' ? 'Trình tạo Mật khẩu Bảo mật' : 'Secure Password Generator'}</span>
      </h3>

      {/* Generated Password Box */}
      <div className="relative mb-5 flex items-center bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-lg text-emerald-400 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
        <span className="pr-12">{password || <span className="text-slate-600 font-sans italic text-sm">{currentLang === 'vi' ? 'Vui lòng chọn ít nhất một tùy chọn' : 'Please select at least one option'}</span>}</span>
        
        <div className="absolute right-2 flex items-center gap-1">
          <button
            id="regen-password-btn"
            onClick={generatePassword}
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={currentLang === 'vi' ? 'Tạo lại' : 'Generate new'}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            id="copy-password-btn"
            onClick={handleCopy}
            disabled={!password}
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title={currentLang === 'vi' ? 'Sao chép' : 'Copy'}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Strength Indicator */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-400">{currentLang === 'vi' ? 'Độ an toàn:' : 'Security level:'}</span>
          <span className={strength.text}>{strength.label}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`}></div>
        </div>
      </div>

      {/* Length Slider */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-300 font-medium">
            {currentLang === 'vi' ? 'Độ dài ký tự:' : 'Password length:'}
            {!isPro && <span className="text-slate-500 text-[11px] ml-1.5 font-bold uppercase font-sans">(Bản Free - Max 12)</span>}
          </span>
          <span id="password-length-val" className="text-emerald-400 font-mono font-bold">{actualLength}</span>
        </div>
        <input
          id="password-length-slider"
          type="range"
          min="8"
          max={currentMax}
          value={actualLength}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Option Toggles */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <label className={`flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-lg cursor-pointer transition-colors border border-slate-800/80 ${!isPro ? 'opacity-65 cursor-not-allowed bg-slate-950/70' : 'hover:bg-slate-900/70'}`}>
          <input
            id="toggle-upper-cb"
            type="checkbox"
            checked={isPro ? includeUppercase : true}
            disabled={!isPro}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 h-4 w-4 bg-slate-800 disabled:opacity-80"
          />
          <span className="text-xs font-medium text-slate-300">
            {currentLang === 'vi' ? 'Viết hoa (A-Z)' : 'Uppercase (A-Z)'}
          </span>
        </label>

        <label className={`flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-lg cursor-pointer transition-colors border border-slate-800/80 ${!isPro ? 'opacity-65 cursor-not-allowed bg-slate-950/70' : 'hover:bg-slate-900/70'}`}>
          <input
            id="toggle-lower-cb"
            type="checkbox"
            checked={isPro ? includeLowercase : true}
            disabled={!isPro}
            onChange={(e) => setIncludeLowercase(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 h-4 w-4 bg-slate-800 disabled:opacity-80"
          />
          <span className="text-xs font-medium text-slate-300">
            {currentLang === 'vi' ? 'Viết thường (a-z)' : 'Lowercase (a-z)'}
          </span>
        </label>

        <label className={`flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-lg cursor-pointer transition-colors border border-slate-800/80 ${!isPro ? 'opacity-65 cursor-not-allowed bg-slate-950/70' : 'hover:bg-slate-900/70'}`}>
          <input
            id="toggle-num-cb"
            type="checkbox"
            checked={isPro ? includeNumbers : true}
            disabled={!isPro}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 h-4 w-4 bg-slate-800 disabled:opacity-80"
          />
          <span className="text-xs font-medium text-slate-300">
            {currentLang === 'vi' ? 'Chữ số (0-9)' : 'Numbers (0-9)'}
          </span>
        </label>

        <label className={`flex items-center justify-between p-2 bg-slate-900/40 rounded-lg cursor-pointer transition-colors border border-slate-800/80 ${!isPro ? 'cursor-not-allowed bg-slate-950/70 border-rose-500/20' : 'hover:bg-slate-900/70'}`}>
          <div className="flex items-center gap-2.5">
            <input
              id="toggle-symbol-cb"
              type="checkbox"
              checked={isPro ? includeSymbols : false}
              disabled={!isPro}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 h-4 w-4 bg-slate-800 disabled:opacity-80"
            />
            <span className="text-xs font-medium text-slate-300">
              {currentLang === 'vi' ? 'Đặc biệt (!@#)' : 'Symbols (!@#$)'}
            </span>
          </div>
          {!isPro && (
            <span className="text-[9px] bg-rose-500/10 text-rose-450 border border-rose-500/20 px-1 py-0.2 rounded font-extrabold uppercase font-sans scale-90 tracking-wider">
              PRO
            </span>
          )}
        </label>
      </div>

      {/* Select button if used inside forms */}
      <AnimatePresence>
        {showSelectButton && onSelectPassword && password && (
          <motion.button
            id="select-password-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => onSelectPassword(password)}
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
          >
            {currentLang === 'vi' ? 'Sử dụng mật khẩu này' : 'Use this password'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
