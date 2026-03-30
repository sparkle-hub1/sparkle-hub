import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateOTP, sendVerificationEmail } from '../utils/emailService';
import sparkleLogo from '../assets/sparkle.jpg';

// ─── Step Enum ──────────────────────────────────────────
const STEP = {
  LOGIN: 'login',
  SIGNUP_DETAILS: 'signup_details',
  OTP_VERIFY: 'otp_verify',
};

export default function Login() {
  const { currentUser, isAdmin, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // OTP state
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSending, setOtpSending] = useState(false);

  // ─── Post-Login Redirection ───
  React.useEffect(() => {
    if (currentUser) {
      if (isAdmin) navigate('/admin');
      else navigate('/profile');
    }
  }, [currentUser, isAdmin, navigate]);

  // ─── Helpers ──────────────────────────────────────────
  const resetErrors = () => { setError(''); setSuccess(''); };

  // ─── Login Handler ────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      const userCredential = await login(loginData.email, loginData.password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login Handler ─────────────────────────────
  const handleGoogleLogin = async () => {
    resetErrors();
    setLoading(true);
    try {
      await loginWithGoogle();
      // Page will redirect to Google...
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  // ─── Signup Step 1: Validate & Send OTP ───────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    resetErrors();

    const { fullName, email, password, confirmPassword } = signupData;

    if (!fullName.trim() || fullName.trim().length < 2) {
      return setError('Please enter your full name (at least 2 characters).');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please try again.');
    }

    setOtpSending(true);
    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      await sendVerificationEmail(email, fullName.trim(), otp);
      setSuccess(`✅ Verification code sent to ${email}. Please check your inbox.`);
      setStep(STEP.OTP_VERIFY);
    } catch (err) {
      console.error('EmailJS error:', err);
      setError('Failed to send verification email. Please check your EmailJS configuration.');
    } finally {
      setOtpSending(false);
    }
  };

  // ─── Signup Step 2: Verify OTP & Create Account ───────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetErrors();

    if (otpInput.trim() !== generatedOTP) {
      return setError('Invalid verification code. Please check your email and try again.');
    }

    setLoading(true);
    try {
      const userCredential = await signup(signupData.email, signupData.password, signupData.fullName.trim());
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────
  const handleResend = async () => {
    resetErrors();
    setOtpSending(true);
    setOtpInput('');
    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      await sendVerificationEmail(signupData.email, signupData.fullName.trim(), otp);
      setSuccess('✅ New verification code sent!');
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // ─── Shared Input Style ───────────────────────────────
  const inputCls =
    'w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-6 py-4 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all font-bold placeholder-rose-300 shadow-inner';
  const labelCls = 'block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-2';
  const btnCls =
    'w-full py-5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl font-black text-xl shadow-[0_15px_30px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(244,114,182,0.4)] text-white disabled:opacity-50 mt-4 outline-none';

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 w-full py-10">
      <div className="w-full max-w-md bg-white/95 border border-white p-10 sm:p-12 rounded-[3rem] backdrop-blur-xl shadow-[0_20px_60px_rgba(255,228,230,0.8)] relative overflow-hidden animate-fade-in-up">

        {/* Decorative glow — bottom corners only, away from logo */}
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-[70px] pointer-events-none" />
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-rose-200/20 rounded-full mix-blend-multiply filter blur-[70px] pointer-events-none" />

        {/* ── LOGO ── */}
        <div className="flex justify-center mb-8 relative z-20">
          <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-white ring-4 ring-pink-200/70 shadow-[0_8px_30px_rgba(244,114,182,0.35)] flex-shrink-0 bg-white">
            <img
              src={sparkleLogo}
              alt="Sparkle Hub"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 mb-2 drop-shadow-sm">
            {step === STEP.LOGIN && 'Welcome Back'}
            {step === STEP.SIGNUP_DETAILS && 'Create Account'}
            {step === STEP.OTP_VERIFY && 'Verify Email'}
          </h2>
          <p className="text-rose-800/70 font-medium text-sm">
            {step === STEP.LOGIN && 'Enter your credentials to access your collection.'}
            {step === STEP.SIGNUP_DETAILS && 'Join to track your masterpiece lifecycle.'}
            {step === STEP.OTP_VERIFY && `We sent a 6-digit code to ${signupData.email}`}
          </p>
        </div>

        {/* ── ERROR / SUCCESS BANNERS ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-500 text-sm font-bold text-center shadow-inner relative z-10">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600 text-sm font-bold text-center shadow-inner relative z-10">
            {success}
          </div>
        )}

        {/* ════════════════════════════════════
            STEP: LOGIN
        ════════════════════════════════════ */}
        {step === STEP.LOGIN && (
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData(p => ({ ...p, email: e.target.value }))}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData(p => ({ ...p, password: e.target.value }))}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading
                ? <span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-4 border-white/50 border-t-white rounded-full animate-spin" />Signing In...</span>
                : 'Secure Sign In'
              }
            </button>
          </form>
        )}

        {/* ════════════════════════════════════
            STEP: SIGNUP DETAILS
        ════════════════════════════════════ */}
        {step === STEP.SIGNUP_DETAILS && (
          <form onSubmit={handleSendOTP} className="space-y-5 relative z-10">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                type="text"
                required
                value={signupData.fullName}
                onChange={(e) => setSignupData(p => ({ ...p, fullName: e.target.value }))}
                className={inputCls}
                placeholder="E.g. Maryam Khan"
              />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                required
                value={signupData.email}
                onChange={(e) => setSignupData(p => ({ ...p, email: e.target.value }))}
                className={inputCls}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                required
                value={signupData.password}
                onChange={(e) => setSignupData(p => ({ ...p, password: e.target.value }))}
                className={inputCls}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className={labelCls}>Confirm Password</label>
              <input
                type="password"
                required
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData(p => ({ ...p, confirmPassword: e.target.value }))}
                className={inputCls}
                placeholder="Re-enter your password"
              />
            </div>
            <button type="submit" disabled={otpSending} className={btnCls}>
              {otpSending
                ? <span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-4 border-white/50 border-t-white rounded-full animate-spin" />Sending Code...</span>
                : 'Send Verification Code →'
              }
            </button>
          </form>
        )}

        {/* ════════════════════════════════════
            STEP: OTP VERIFY
        ════════════════════════════════════ */}
        {step === STEP.OTP_VERIFY && (
          <form onSubmit={handleVerifyOTP} className="space-y-6 relative z-10">
            {/* 6-box OTP input */}
            <div>
              <label className={labelCls}>Enter 6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className={`${inputCls} text-center text-3xl tracking-[0.5em] font-black`}
                placeholder="● ● ● ● ● ●"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading || otpInput.length !== 6} className={btnCls}>
              {loading
                ? <span className="flex items-center justify-center gap-3"><span className="w-5 h-5 border-4 border-white/50 border-t-white rounded-full animate-spin" />Creating Account...</span>
                : 'Verify & Create Account ✓'
              }
            </button>

            {/* Resend + back */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { resetErrors(); setStep(STEP.SIGNUP_DETAILS); }}
                className="text-rose-500 hover:text-rose-700 text-sm font-bold transition-colors"
              >
                ← Change Details
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={otpSending}
                className="text-pink-500 hover:text-pink-700 text-sm font-bold transition-colors disabled:opacity-50"
              >
                {otpSending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* ── SWITCH BETWEEN LOGIN / SIGNUP ── */}
        {step !== STEP.OTP_VERIFY && (
          <div className="mt-8 text-center relative z-10">
            <button
              type="button"
              onClick={() => {
                resetErrors();
                setStep(step === STEP.LOGIN ? STEP.SIGNUP_DETAILS : STEP.LOGIN);
              }}
              className="text-rose-600 hover:text-pink-500 font-bold transition-colors underline-offset-4 hover:underline text-sm"
            >
              {step === STEP.LOGIN
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        )}

        {/* ── GOOGLE SIGN IN ── */}
        {step !== STEP.OTP_VERIFY && (
          <>
            <div className="relative mt-8 mb-6 z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rose-100/60"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-rose-400 font-bold uppercase tracking-widest">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full relative z-10 flex items-center justify-center gap-3 bg-white border-2 border-rose-100 hover:border-pink-200 hover:bg-rose-50 px-6 py-4 rounded-2xl font-bold text-rose-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </>
        )}

      </div>
    </div>
  );
}
