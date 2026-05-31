import React, { useState } from 'react';
import { ShieldCheck, X, Sparkles, Check, KeyRound, Fingerprint, Lock, ShieldAlert, Table, RefreshCw, Gift } from 'lucide-react';
import { translations, LangType } from '../utils/lang';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeSuccess: () => void;
  lang: LangType;
}

export default function UpgradeModal({ isOpen, onClose, isPro, onUpgradeSuccess, lang }: UpgradeModalProps) {
  const t = translations[lang];
  const [couponCode, setCouponCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();

    // Support VIP2026, FREEPRO, SECURE as special promotional codes
    if (cleanCode === 'VIP2026' || cleanCode === 'FREEPRO' || cleanCode === 'SECURE') {
      activatePro();
    } else {
      setErrorMsg(t.tier_invalidCode);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleInstantTrial = () => {
    activatePro();
  };

  const activatePro = () => {
    localStorage.setItem('secure_vault_pro_active', 'true');
    setSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      onUpgradeSuccess();
      setSuccess(false);
      setCouponCode('');
      onClose();
    }, 2500);
  };

  // Compare specifications list
  const compareSpecs = [
    {
      feature: lang === 'vi' ? 'Giới hạn số lượng mật khẩu' : 'Password Capacity',
      free: lang === 'vi' ? 'Giới hạn tối đa 30 mật khẩu' : 'Maximum 30 items',
      pro: lang === 'vi' ? 'Không giới hạn' : 'Unlimited storage',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Trình tạo mật khẩu' : 'Password Generator',
      free: lang === 'vi' ? 'Cơ bản (Độ dài 8-12 ký tự)' : 'Basic (Length 8-12, no symbols)',
      pro: lang === 'vi' ? 'Cao cấp (Độ dài 8-32, ký tự đặc biệt)' : 'Elite (Length 8-32, full options)',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Trình xác thực 2-Lớp (2FA/TOTP)' : 'Two-Factor Authenticator (2FA)',
      free: lang === 'vi' ? 'Tối đa 5 tài khoản bảo mật' : 'Max 5 secure accounts',
      pro: lang === 'vi' ? 'Không giới hạn tài khoản' : 'Unlimited accounts',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Đánh giá sức khỏe mật khẩu' : 'Password Health Audit',
      free: lang === 'vi' ? 'Không hỗ trợ' : 'Not supported',
      pro: lang === 'vi' ? 'Đầy đủ báo cáo an toàn' : 'Full reports & Security scores',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Chủ đề hiển thị' : 'App Themes',
      free: lang === 'vi' ? '1 Chủ đề Slate (Dark Space)' : 'Slate theme only',
      pro: lang === 'vi' ? 'Tùy biến đa màu nghệ thuật' : 'Cyberpunk, Emerald, Sapphire... 🎨',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Thời gian tự khóa màn hình' : 'Auto-lock timeout',
      free: lang === 'vi' ? 'Mặc định 1 phút (khóa cứng)' : 'Fixed to 1 minute',
      pro: lang === 'vi' ? 'Tùy chỉnh linh hoạt / Tắt' : 'Custom duration / Disable',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Ngăn Code bí mật' : 'Secret Drawer (Code)',
      free: lang === 'vi' ? 'Không hỗ trợ' : 'Not supported',
      pro: lang === 'vi' ? 'Hỗ trợ nâng cao đặc quyền' : 'Fully supported with Double-tap',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Tùy biến sắp xếp & chế độ xem' : 'Custom Views & Sorting',
      free: lang === 'vi' ? 'Cố định xem dạng lưới' : 'Fixed to Grid view',
      pro: lang === 'vi' ? 'Grid/List, sắp xếp linh hoạt' : 'Toggle Grid/List & Sorting',
      highlight: false
    },
    {
      feature: lang === 'vi' ? 'Liên kết Google Sheet & Google Drive' : 'Spreadsheets & Google Drive',
      free: lang === 'vi' ? 'Không hỗ trợ' : 'Not supported',
      pro: lang === 'vi' ? 'Hợp nhất đồng bộ tệp lớn >1GB' : 'Fully sync & manage high-cap files',
      highlight: true
    },
    {
      feature: lang === 'vi' ? 'Đặt lịch nhắc nhở' : 'Reminder Calendars',
      free: lang === 'vi' ? 'Không hỗ trợ' : 'Not supported',
      pro: lang === 'vi' ? 'Cảnh báo ngày đáo hạn định kỳ' : 'Periodical password updates alert',
      highlight: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[92vh] flex flex-col">
        
        {/* Glowing Head Decoration */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        
        {/* Header bar */}
        <div className="p-5 border-b border-slate-850 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">{t.tier_compareTitle}</h2>
              <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest font-mono mt-0.5">
                {lang === 'vi' ? 'Cập nhật phiên bản cao cấp' : 'Unlock premium potential'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left select-none">
          {success ? (
            /* Celebrating Success Screen */
            <div className="py-14 text-center space-y-4 animate-scale-up">
              <div className="inline-flex p-4.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                <ShieldCheck className="h-14 w-14" />
              </div>
              <h3 className="text-2xl font-black text-emerald-400 tracking-tight">VIP SUCCESS!</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {t.tier_successUpgrade}
              </p>
            </div>
          ) : isPro ? (
            /* Already Upgraded Prompt */
            <div className="py-10 text-center space-y-3.5">
              <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">{t.tier_proActive}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'vi' 
                  ? 'Ứng dụng của bạn hiện đang ở cấp độ PRO ELITE cao nhất. Cảm ơn bạn đã tin tưởng dịch vụ.' 
                  : 'Your database is secured under the elite license structure. Thank you for using our app.'}
              </p>
            </div>
          ) : (
            <>
              {/* Features Comparison Matrix Table */}
              <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-850/80">
                      <th className="p-3 text-left font-bold text-slate-400">{lang === 'vi' ? 'Tính năng' : 'Feature'}</th>
                      <th className="p-3 text-center font-bold text-slate-500 w-[140px]">{lang === 'vi' ? 'Miễn phí' : 'Free'}</th>
                      <th className="p-3 text-center font-bold text-indigo-400 w-[160px] bg-slate-900/40">{lang === 'vi' ? 'Bản PRO 💎' : 'PRO Elite 💎'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 font-sans">
                    {compareSpecs.map((spec, i) => (
                      <tr key={i} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-3 text-slate-300 font-semibold">{spec.feature}</td>
                        <td className="p-3 text-center text-slate-500">{spec.free}</td>
                        <td className={`p-3 text-center font-bold bg-slate-900/40 ${spec.highlight ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {spec.pro}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Coupon activation box */}
              <div className="p-5.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                <div className="flex items-start gap-2.5">
                  <Gift className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t.tier_enterCode}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lang === 'vi' ? 'Nhập mã VIP2026 hoặc nhấn nút dùng thử miễn phí bên dưới để nâng cấp ngay lập tức' : 'Type code VIP2026 or click instant trial button below to upgrade immediately'}</p>
                  </div>
                </div>

                <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={t.tier_codePlc}
                    className="flex-1 bg-slate-900 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all font-mono tracking-wider"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    {lang === 'vi' ? 'Áp dụng mã' : 'Apply coupon'}
                  </button>
                </form>

                {errorMsg && (
                  <p className="text-[11px] text-rose-400 font-semibold animate-shake">{errorMsg}</p>
                )}
              </div>

              {/* Instant free upgrade option */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-2xl">
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-slate-200 capitalize">{lang === 'vi' ? 'Trải Nghiệm Đầy Đủ Hoàn Toàn Miễn Phí' : 'Full Trial Completely Free'}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-md">{lang === 'vi' ? 'Chúng tôi hỗ trợ bạn kích hoạt trải nghiệm toàn quyền hạn để kiểm toán bảo mật và tạo Rolling Code 2FA thoải mái.' : 'Access unrestricted security monitoring and test auto 2FA authenticator loops fully.'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleInstantTrial}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-705 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shrink-0 text-center"
                >
                  {lang === 'vi' ? 'Kích Hoạt Miễn Phí' : 'Activate Free Upgrade'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
