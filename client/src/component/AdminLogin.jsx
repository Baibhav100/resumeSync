import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { adminLogin, clearError } from "../slices/authSlice";

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    if (user) {
      Swal.fire({
        icon: 'success',
        title: 'Welcome Admin!',
        text: 'Successfully logged in',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        if (user.role === 'admin') navigate("/admin");
        else navigate("/home");
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message || "Invalid credentials",
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill all the fields",
      });
      return;
    }

    dispatch(adminLogin({ email, password }));
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-600 opacity-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight font-heading">AutoResume<span className="text-blue-400">.ai</span></span>
        </div>
        <div className="relative z-10 max-w-lg mb-20">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 font-heading">
            Admin access for the team, with the same clean login experience.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed font-light">
            Use your admin credentials to manage users, view analytics, and oversee resume activity.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-200"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-400"></div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-white font-medium">+2k</div>
            </div>
            <p className="text-sm text-slate-400 font-medium">Trusted by internal teams and admins.</p>
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-sm">&copy; {new Date().getFullYear()} AutoResume.ai. All rights reserved.</div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="text-slate-900 text-2xl font-bold tracking-tight font-heading">AutoResume<span className="text-blue-600">.ai</span></span>
          </div>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 font-heading tracking-tight">Admin sign in</h2>
            <p className="text-slate-500 text-sm sm:text-base">Enter your admin credentials to access the dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:scale-100 flex items-center justify-center mt-2"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign in as admin'}
            </button>
            <div className="relative py-6 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Need admin access?</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <Link to="/admin/register" className="w-full flex justify-center py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-colors active:scale-[0.98]">
              Register as admin
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
