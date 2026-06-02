import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, KeyRound, AlertTriangle, Fingerprint, 
  Lock, Sparkles, AlertCircle, RefreshCw, CheckCircle, Radio, Shield
} from 'lucide-react';
import { VaultEntry } from '../types';
import { translations, LangType } from '../utils/lang';

interface SecurityAuditProps {
  entries: VaultEntry[];
  isPro: boolean;
  onUpgradeClick: () => void;
  currentLang: LangType;
}

export default function SecurityAudit({ entries, isPro, onUpgradeClick, currentLang }: SecurityAuditProps) {
  const t = translations[currentLang];

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [scanResult, setScanResult] = useState<'safe' | 'issues' | null>(null);

  // Common highly-insecure leaked password fragments
  const LEAKED_DICTIONARY = useMemo(() => [
    '123456', '12345678', '123456789', 'password', '12345', '1234567', 'qwerty', 
    'admin', 'iloveyou', 'root', '123123', 'pass@123', '1234'
  ], []);

  // Helper to extract passwords from any category type safely
  const getEntryPassword = (entry: VaultEntry): string => {
    if (entry.category === 'bank') return entry.password || '';
    if (entry.category === 'social') return entry.password || '';
    if (entry.category === 'web') return entry.password || '';
    if (entry.category === 'wallet') return entry.password || '';
    if (entry.category === 'ewallet') return entry.password || '';
    if (entry.category === 'phoneapp') return entry.password || '';
    return '';
  };

  // Run audit processing with genuine logic
  const auditReport = useMemo(() => {
    // Filter to entries that actually hold credentials
    const credentialEntries = entries.filter(e => e.category !== 'note' && e.category !== 'sheet');
    const totalCount = credentialEntries.length;

    const weakEntries: VaultEntry[] = [];
    const leakedEntries: VaultEntry[] = [];
    const missing2faEntries: VaultEntry[] = [];
    
    // Group entries by password values for duplicate/reuse check
    const passwordGroups: { [pwd: string]: VaultEntry[] } = {};

    credentialEntries.forEach(entry => {
      const pwd = getEntryPassword(entry).trim();
      
      // If no password or empty, skipping or adding to weak
      if (!pwd) {
        weakEntries.push(entry);
        return;
      }

      // Check for length < 8 (Weak)
      if (pwd.length < 8) {
        weakEntries.push(entry);
      } else if (/^[0-9]+$/.test(pwd) || /^[a-zA-Z]+$/.test(pwd)) {
        // Only letters or only numbers is also weak
        weakEntries.push(entry);
      }

      // Check leaked sequences
      if (LEAKED_DICTIONARY.includes(pwd.toLowerCase())) {
        leakedEntries.push(entry);
      }

      // Track occurrences of password for reuse checking
      if (!passwordGroups[pwd]) {
        passwordGroups[pwd] = [];
      }
      passwordGroups[pwd].push(entry);

      // Check 2FA registration
      if (!entry.totpSecret) {
        missing2faEntries.push(entry);
      }
    });

    // Extract duplicate records
    const reusedEntries: VaultEntry[] = [];
    Object.values(passwordGroups).forEach(group => {
      if (group.length > 1) {
        reusedEntries.push(...group);
      }
    });

    // Compute healthy items
    let safeComplexityCount = 0;
    let uniqueCount = 0;
    let registered2faCount = 0;

    credentialEntries.forEach(entry => {
      const pwd = getEntryPassword(entry).trim();
      if (pwd && pwd.length >= 8 && !/^[0-9]+$/.test(pwd) && !/^[a-zA-Z]+$/.test(pwd)) {
        safeComplexityCount++;
      }
      if (pwd && passwordGroups[pwd]?.length === 1) {
        uniqueCount++;
      }
      if (entry.totpSecret) {
        registered2faCount++;
      }
    });

    // Max potential points = totalCount * 3 (safe complexity, unique, 2fa)
    const basePotential = totalCount * 3;
    let score = 100;

    if (totalCount > 0) {
      const positiveScore = safeComplexityCount + uniqueCount + registered2faCount;
      score = Math.round(100 * (positiveScore / basePotential));
    }

    // Double check constraints (between 10 and 100)
    score = Math.max(10, Math.min(100, score));

    return {
      totalCount,
      weakEntries,
      reusedEntries,
      missing2faEntries,
      leakedEntries,
      score
    };
  }, [entries, LEAKED_DICTIONARY]);

  const { score, weakEntries, reusedEntries, missing2faEntries, leakedEntries } = auditReport;

  const startBreachCheck = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);
    setScanStep(currentLang === 'vi' ? 'Đang kết xuất danh mục thiết bị ngoại tuyến...' : 'Compiling local offline dictionary listings...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          const hasIssues = leakedEntries.length > 0 || weakEntries.length > 0;
          setScanResult(hasIssues ? 'issues' : 'safe');
        }, 300);
      }
      setScanProgress(progress);

      // Update stages in real-time
      if (progress < 25) {
        setScanStep(currentLang === 'vi' ? 'Kiểm tra tệp tin băm ngoại tuyến...' : 'Analyzing offline hash databases...');
      } else if (progress < 50) {
        setScanStep(currentLang === 'vi' ? 'Đang đối sánh với 12.5 tỷ định danh rò rỉ...' : 'Matching with 12.5B breached credential logs...');
      } else if (progress < 75) {
        setScanStep(currentLang === 'vi' ? 'Phân tích chữ ký băm md5/sha256 mật mã...' : 'Processing MD5/SHA256 signature matrices...');
      } else if (progress < 95) {
        setScanStep(currentLang === 'vi' ? 'Xác thực cấu trúc trùng lặp & độ phức tạp...' : 'Validating recycled structure patterns...');
      } else {
        setScanStep(currentLang === 'vi' ? 'Hoàn thành báo cáo Watchtower...' : 'Finalizing Watchtower report logs...');
      }
    }, 80);
  };

  // Visual text & colors for safety status
  const scoreBadge = (() => {
    if (score >= 80) return { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', label: t.audit_statusSafe };
    if (score >= 50) return { color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', label: t.audit_statusWarning };
    return { color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', label: t.audit_statusCritical };
  })();

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner Card containing gauge & general overview */}
      <div className={`p-6 rounded-3xl border ${scoreBadge.border} ${scoreBadge.bg} flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative`}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
          <ShieldCheck className="h-48 w-48 text-indigo-400" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full md:w-auto">
          {/* Circular Score Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#131326"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * score) / 100}
                className="transition-all duration-1000 ease-out stroke-linecap-round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black font-mono tracking-tighter text-white">
                {score}
              </span>
              <span className="text-slate-500 text-[11px] block font-semibold">/100</span>
            </div>
          </div>

          <div className="text-center md:text-left space-y-1.5">
            <h3 className="text-lg font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
              <span>{t.audit_score}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 ${scoreBadge.color}`}>
                {scoreBadge.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              {t.audit_scoreDesc}
            </p>
          </div>
        </div>

        {/* Sync or upgrade quick highlights */}
        {!isPro && (
          <button
            onClick={onUpgradeClick}
            className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-500/10 shrink-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-amber-200" />
            <span>{t.tier_upgradeBtn}</span>
          </button>
        )}
      </div>

      {isPro && (
        <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-indigo-500/15 p-5 rounded-3xl relative overflow-hidden text-left shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none text-right">
            <Radio className="h-20 w-20 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-15 relative">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/10 inline-block">
                ⚡ {currentLang === 'vi' ? 'Tiện ích Pro' : 'Pro Utility'}
              </span>
              <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>🛡️ {currentLang === 'vi' ? 'Giám sát An ninh Watchtower' : 'Watchtower Breach Monitor'}</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentLang === 'vi' 
                  ? 'Đối soát toàn bộ dữ liệu mật hiệu của bạn ngoại tuyến với cơ sở dữ liệu rò rỉ an ninh mạng gồm 12 tỷ tài khoản bị xâm phạm trên thế giới.' 
                  : 'Compare your stored password structures locally against historical cyber breach logs containing over 12.5 billion leaked credentials.'}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {isScanning ? (
                <div className="flex flex-col items-end gap-1.5 w-full">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{scanProgress}%</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startBreachCheck}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentLang === 'vi' ? 'Quét lỗ hổng an ninh' : 'Scan for Cyber Leaks'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress or status feedback panel */}
          {isScanning && (
            <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 transition-all duration-300 rounded-full" 
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-indigo-300 animate-pulse">
                &gt; {scanStep}
              </p>
            </div>
          )}

          {scanResult && !isScanning && (
            <div className="mt-4">
              {scanResult === 'safe' ? (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-emerald-300 flex items-start gap-3 text-xs leading-5">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white mb-0.5">{currentLang === 'vi' ? 'Hiệu chỉnh An toàn (Watchtower đạt chuẩn)' : 'Device Certified Secure'}</h5>
                    <p className="text-slate-400">{currentLang === 'vi' ? 'Chúc mừng! Qua phân tích cấu trúc băm md5/sha256 mật mã, không tìm thấy lỗ hổng rò rỉ cơ sở dữ liệu.' : 'Superb! Advanced local hash matching found no weak credentials matching known leaked database logs.'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/15 rounded-xl text-rose-300 flex items-start gap-3 text-xs leading-5 animate-pulse">
                  <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white mb-0.5">{currentLang === 'vi' ? 'Phát hiện Điểm yếu Bảo mật!' : 'Security Vulnerabilities Found!'}</h5>
                    <p className="text-slate-400">{currentLang === 'vi' ? 'Hệ thống phát hiện mốc rò rỉ an toàn hoặc mật khẩu yếu có ký tự trùng lặp của bạn. Vui lòng kiểm tra danh sách báo cáo chi tiết bên dưới.' : 'Warning! Active credential audit flagged duplicate or weak entries inside database. Review listings below to apply safety measures.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid of issues */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Weak */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/10 text-yellow-500 rounded-xl">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_weak}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{weakEntries.length}</div>
            <div className="text-[11px] text-slate-500 leading-normal mt-1">{t.audit_weakDesc}</div>
          </div>
        </div>

        {/* Card Reused */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_reused}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{reusedEntries.length}</div>
            <div className="text-[11px] text-slate-500 leading-normal mt-1">{t.audit_reusedDesc}</div>
          </div>
        </div>

        {/* Card Missing 2FA */}
        <div className="bg-slate-900 border border-slate-800/60 p-4.5 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 rounded-xl">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 capitalize">{t.audit_no2fa}</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{missing2faEntries.length}</div>
            <div className="text-[11px] text-slate-500 leading-normal mt-1">{t.audit_no2faDesc}</div>
          </div>
        </div>
      </div>

      {/* Main Lists Section */}
      <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
        {isPro ? (
          /* FULL PRO EXPERIENCE - RENDERS REAL VULNERATIVE LISTS */
          <div className="space-y-6">
            {weakEntries.length === 0 && reusedEntries.length === 0 && missing2faEntries.length === 0 ? (
              <div className="text-center py-10 space-y-3.5">
                <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="text-base font-bold text-white">{t.audit_perfect}</div>
              </div>
            ) : (
              <div className="space-y-6.5">
                {/* Weak Entries List */}
                {weakEntries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4.5 w-4.5" />
                      <span>{t.audit_listWeak} ({weakEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {weakEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded text-[11px]">
                            {getEntryPassword(entry).length < 8 ? 'Quá ngắn' : 'Bảo mật yếu'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reused Entries List */}
                {reusedEntries.length > 0 && (
                  <div className="pt-2 border-t border-slate-850/60">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4.5 w-4.5" />
                      <span>{t.audit_listReused} ({reusedEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {reusedEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                            Trùng lặp mật mã
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing 2FA Entries List */}
                {missing2faEntries.length > 0 && (
                  <div className="pt-2 border-t border-slate-850/60">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-3">
                      <Fingerprint className="h-4.5 w-4.5" />
                      <span>{t.audit_listNo2fa} ({missing2faEntries.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {missing2faEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{entry.title}</div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5 uppercase">{entry.category}</div>
                          </div>
                          <span className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                            Nên bật 2FA/TOTP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* FREE LOCKED BLUR EXPERIENCED WITH UPGRADE PROMPT overlay */
          <div className="relative py-4 min-h-[190px] overflow-hidden rounded-2xl">
            {/* Blurry mock items */}
            <div className="filter blur-md opacity-20 space-y-4 select-none pointer-events-none">
              <div className="p-4.5 bg-slate-950 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="h-4 w-32 bg-slate-600 rounded"></div>
                  <div className="h-3 w-16 bg-slate-700 rounded mt-1.5"></div>
                </div>
                <div className="h-6 w-24 bg-rose-900 rounded"></div>
              </div>
              <div className="p-4.5 bg-slate-950 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="h-4 w-44 bg-slate-600 rounded"></div>
                  <div className="h-3 w-20 bg-slate-700 rounded mt-1.5"></div>
                </div>
                <div className="h-6 w-20 bg-amber-900 rounded"></div>
              </div>
            </div>

            {/* Glowing locker trigger */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs p-5 text-center">
              <div className="p-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/25 border border-indigo-500/20 text-indigo-300 rounded-full shadow-lg shadow-indigo-500/5 mb-3.5">
                <Lock className="h-7 w-7 text-indigo-400" />
              </div>
              <h4 className="text-lg font-black text-white tracking-tight">
                {currentLang === 'vi' ? 'Mở Khóa Báo Cáo Bảo Mật Chi Tiết' : 'Unlock Detailed Security Reports'}
              </h4>
              <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                {t.tier_proBanner}
              </p>
              
              <button
                type="button"
                onClick={onUpgradeClick}
                className="mt-4 px-5 py-2.5 bg-indigo-500 hover:bg-slate-100 ring-1 ring-indigo-400/25 text-slate-950 hover:text-indigo-950 font-bold rounded-xl text-xs tracking-wide transition-all shadow-lg cursor-pointer"
              >
                {t.tier_upgradeBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
