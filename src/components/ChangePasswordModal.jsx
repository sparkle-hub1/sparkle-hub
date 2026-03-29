import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendVerificationEmail, generateOTP } from '../utils/emailService';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

const STEPS = { SEND_OTP: 'send_otp', VERIFY_OTP: 'verify_otp', SUCCESS: 'success' };

export default function ChangePasswordModal({ onClose }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(STEPS.SEND_OTP);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send OTP to registered email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const otp = generateOTP();
      const firstName = currentUser.email.split('@')[0];
      await sendVerificationEmail(currentUser.email, firstName, otp);
      setGeneratedOtp(otp);
      setStep(STEPS.VERIFY_OTP);
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Please check your email configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP, re-authenticate, and change password
  const handleVerifyAndChange = async (e) => {
    e.preventDefault();
    setError('');

    if (enteredOtp !== generatedOtp) {
      setError('Incorrect OTP. Please check your email and try again.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate with current password before changing
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Your current password is incorrect. Please try again.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-[0_20px_60px_rgba(255,228,230,0.9)] relative overflow-hidden border border-rose-100 animate-fade-in-up">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-100/70 rounded-full filter blur-[60px] -z-10 pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50 w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all outline-none text-lg"
        >✕</button>

        {/* ── STEP 1: Send OTP ── */}
        {step === STEPS.SEND_OTP && (
          <form onSubmit={handleSendOtp}>
            <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center mb-6 shadow-md">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-rose-950 mb-2">Change Password</h2>
            <p className="text-sm font-medium text-rose-800/70 mb-8 leading-relaxed">
              We'll send a one-time verification code to <strong className="text-rose-600">{currentUser?.email}</strong> to confirm your identity.
            </p>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3 outline-none"
            >
              {loading ? (
                <><span className="w-5 h-5 border-4 border-white/40 border-t-white rounded-full animate-spin" />Sending OTP...</>
              ) : (
                <><span>📧</span> Send Verification Code</>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: Verify OTP + New Password ── */}
        {step === STEPS.VERIFY_OTP && (
          <form onSubmit={handleVerifyAndChange} className="space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-rose-400 rounded-full flex items-center justify-center mb-6 shadow-md">
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-rose-950 mb-1">Verify & Reset</h2>
            <p className="text-sm font-medium text-rose-800/70 mb-6 leading-relaxed">
              Enter the 6-digit code sent to your email, your current password, and your new password below.
            </p>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">
                Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 482913"
                value={enteredOtp}
                onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-black text-xl tracking-[0.4em] text-center transition-all shadow-inner"
              />
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">
                Current Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-black text-rose-400 mb-1.5 uppercase tracking-widest pl-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100/50 text-rose-900 font-bold transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3 outline-none"
            >
              {loading ? (
                <><span className="w-5 h-5 border-4 border-white/40 border-t-white rounded-full animate-spin" />Updating...</>
              ) : (
                <><span>🔑</span> Confirm & Change Password</>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep(STEPS.SEND_OTP); setError(''); }}
              className="w-full text-center text-sm text-rose-400 hover:text-rose-600 font-bold transition-colors py-2 outline-none"
            >
              ← Resend OTP
            </button>
          </form>
        )}

        {/* ── STEP 3: Success ── */}
        {step === STEPS.SUCCESS && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-rose-950 mb-3">Password Updated!</h2>
            <p className="text-sm font-medium text-rose-800/70 mb-8 leading-relaxed">
              Your password has been changed successfully. Please use your new password the next time you sign in.
            </p>
            <button
              onClick={onClose}
              className="px-10 py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all transform hover:-translate-y-0.5 outline-none"
            >
              Done 🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
