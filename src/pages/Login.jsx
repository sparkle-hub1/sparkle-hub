import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STEP = {
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  OTP: 'OTP',
  FORGOT: 'FORGOT'
};

export default function Login() {
  const { currentUser, isAdmin, login, signup, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [otpSent, setOtpSent] = useState('');
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

  const handleGoogleLogin = async () => {
    resetErrors();
    setLoading(true);
    try {
      await loginWithGoogle();
      // AuthContext handles the rest (Redirect/User Creation)
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address to reset password.");
      return;
    }
    resetErrors();
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess("A password reset link has been sent to your email address.");
      setStep(STEP.LOGIN);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    resetErrors();
    setOtpSending(true);

    try {
      // 1. Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpSent(code);

      // 2. Send via EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_twxadki',
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ith1o0w',
        {
          to_email: email,
          to_name: fullName,
          otp_code: code,
          reply_to: 'sparkle.hub.admin@gmail.com'
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'kJFGKOJXvNUe4-jdy'
      );

      setSuccess("A verification code has been sent to your email.");
      setStep(STEP.OTP);
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please check your email and try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    resetErrors();

    if (otpInput === otpSent) {
      setLoading(true);
      try {
        await signup(email, password, fullName);
      } catch (err) {
        setError(err.message.replace('Firebase: ', ''));
        setLoading(false);
      }
    } else {
      setError("Invalid verification code. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-[90vh] flex flex-col items-center justify-center pt-6 pb-20 px-4">
      
      {/* Decorative Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-100/40 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-50/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg animate-fade-in-up">
        
        {/* Toggle Header */}
        {(step === STEP.LOGIN || step === STEP.SIGNUP) && (
          <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl mb-8 border border-rose-100/50 shadow-sm w-fit mx-auto">
            <button 
              onClick={() => { setStep(STEP.LOGIN); resetErrors(); }}
              className={`px-8 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all ${step === STEP.LOGIN ? 'bg-rose-500 text-white shadow-md' : 'text-rose-400 hover:text-rose-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setStep(STEP.SIGNUP); resetErrors(); }}
              className={`px-8 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all ${step === STEP.SIGNUP ? 'bg-rose-500 text-white shadow-md' : 'text-rose-400 hover:text-rose-600'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        <div className="bg-white/95 border border-white rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-14 backdrop-blur-xl shadow-[0_30px_80px_rgba(255,228,230,0.8)] relative overflow-hidden">
          
          <div className="text-center mb-10 relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-rose-950 tracking-tighter leading-none mb-3">
              {step === STEP.LOGIN && "Welcome Back"}
              {step === STEP.SIGNUP && "Join the Family"}
              {step === STEP.OTP && "Verify Account"}
              {step === STEP.FORGOT && "Reset Password"}
            </h1>
            <p className="text-rose-400 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              {step === STEP.LOGIN && "Enter your details to continue"}
              {step === STEP.SIGNUP && "Create an account for a faster checkout"}
              {step === STEP.OTP && "Check your email for the code"}
              {step === STEP.FORGOT && "We will send you a reset link"}
            </p>
          </div>

          <div className="space-y-6 relative z-10 text-rose-950">
            {/* Google Login Section */}
            {(step === STEP.LOGIN || step === STEP.SIGNUP) && (
              <div className="space-y-6">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-4 bg-white hover:bg-rose-50 border-2 border-rose-100 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black transition-all shadow-sm active:scale-95 group outline-none"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="text-sm sm:text-lg tracking-tight">Continue as Google</span>
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-100"></div>
                  <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Or securely via email</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-100"></div>
                </div>
              </div>
            )}

            {error && <p className="bg-red-50 text-red-500 py-3 rounded-xl border border-red-100 text-xs sm:text-sm font-bold text-center animate-shake">⚠️ {error}</p>}
            {success && <p className="bg-emerald-50 text-emerald-600 py-3 rounded-xl border border-emerald-100 text-xs sm:text-sm font-bold text-center animate-fade-in-up">✅ {success}</p>}

            {/* Forms */}
            {step === STEP.LOGIN && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                />
                <div className="space-y-2">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => { setStep(STEP.FORGOT); resetErrors(); }}
                      className="text-xs font-bold text-rose-400 hover:text-rose-600 transition-colors tracking-wide outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 sm:py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <div className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin mx-auto"></div> : "Trace Identity"}
                </button>
              </form>
            )}

            {step === STEP.SIGNUP && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                />
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                />
                <button 
                  type="submit" 
                  disabled={otpSending}
                  className="w-full py-4 sm:py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {otpSending ? <div className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin mx-auto"></div> : "Create Account ✨"}
                </button>
              </form>
            )}

            {step === STEP.OTP && (
              <div className="space-y-8 text-center">
                <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                    <span className="text-3xl mb-4 block">✉️</span>
                    <p className="text-rose-800 font-bold mb-4 leading-relaxed">We've sent a 6-digit code to <br/><span className="text-rose-950 font-black">{email}</span></p>
                </div>
                
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="— — —   — — —" 
                    maxLength="6"
                    value={otpInput} 
                    onChange={(e) => setOtpInput(e.target.value)} 
                    required 
                    className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-6 text-2xl sm:text-4xl text-rose-950 font-black tracking-[0.3em] focus:outline-none focus:border-pink-300 focus:bg-white transition-all placeholder-rose-200 text-center"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 sm:py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  >
                    {loading ? <div className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin mx-auto"></div> : "Verify & Complete"}
                  </button>
                </form>
                
                <button onClick={() => setStep(STEP.SIGNUP)} className="text-rose-400 hover:text-pink-500 text-xs font-black uppercase tracking-widest transition-colors">← Wrong email? Go back</button>
              </div>
            )}

            {step === STEP.FORGOT && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Registered Email Address" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-rose-50/50 border border-rose-100 rounded-2xl px-6 py-4 sm:py-5 text-sm sm:text-lg focus:outline-none focus:border-pink-300 focus:bg-white transition-all font-bold placeholder-rose-200"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 sm:py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl sm:rounded-3xl font-black text-lg sm:text-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <div className="w-6 h-6 border-4 border-white/50 border-t-white rounded-full animate-spin mx-auto"></div> : "Send Reset Link ✨"}
                </button>
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => { setStep(STEP.LOGIN); resetErrors(); }} 
                    className="text-rose-400 hover:text-pink-500 text-xs font-black uppercase tracking-widest transition-colors outline-none"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
