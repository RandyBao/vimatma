import * as OTPAuth from 'otpauth';

/**
 * Generates a standard 6-digit TOTP code based on a Base32 secret key.
 * Dynamically computes remaining seconds in the current 30-second window.
 */
export function generateTOTPCode(secret: string): { code: string; secondsRemaining: number } {
  if (!secret || secret.trim() === '') {
    return { code: '------', secondsRemaining: 30 };
  }
  
  try {
    // Speculatively clean base32 secrets (remove spaces, handle lowercases, remove padding if native otpauth requires)
    let cleanedSecret = secret.replace(/[\s-]/g, '').toUpperCase();
    
    // Simple Base32 character verification (A-Z, 2-7, optional padding '=')
    if (!/^[A-Z2-7]+=*$/.test(cleanedSecret)) {
      return { code: 'INVALID', secondsRemaining: 30 };
    }

    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: cleanedSecret,
    });

    const code = totp.generate();
    const secondsRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    return { code, secondsRemaining };
  } catch (err) {
    console.error('TOTP Generation Error:', err);
    return { code: 'ERROR', secondsRemaining: 30 };
  }
}
