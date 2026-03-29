import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import url from './url';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await url.post('/forgot-password', { email });
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent',
        text: 'A 6-digit verification code has been sent to your email (and printed in the server terminal).',
        confirmButtonColor: '#3b82f6'
      });
      setStep(2);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: err.response?.data?.message || 'Failed to send OTP. Please try again.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return Swal.fire('Error', 'OTP must be 6 digits', 'error');
    }
    setLoading(true);
    try {
      await url.post('/verify-otp', { email, otp });
      setStep(3);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid OTP',
        text: err.response?.data?.message || 'Verification failed.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return Swal.fire('Error', 'Passwords do not match!', 'error');
    }
    if (newPassword.length < 6) {
      return Swal.fire('Error', 'Password must be at least 6 characters long', 'error');
    }
    setLoading(true);
    try {
      await url.post('/reset-password', { email, otp, newPassword });
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your password has been reset successfully. You can now login.',
        confirmButtonColor: '#10b981'
      });
      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: err.response?.data?.message || 'Failed to reset password.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-3xl font-bold">Account Recovery</h2>
          <p className="mt-2 text-blue-100 opacity-90">
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Create a secure new password."}
          </p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-700">Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="input input-bordered w-full h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-md"></span> : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-700">Verification Code</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    className="input input-bordered w-full h-14 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-500 transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-md"></span> : "Verify Code"}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn btn-ghost btn-sm w-full text-slate-500"
                disabled={loading}
              >
                ← Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-700">New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="input input-bordered w-full h-12 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-slate-700">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Type it again"
                  className="input input-bordered w-full h-12 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-md"></span> : "Update Password"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link to="/login" className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
