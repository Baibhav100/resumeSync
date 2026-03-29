import React from "react";
import Darkmode from "./Darkmode";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../slices/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const handleLogout = async () => {
    dispatch(logoutUser());
    navigate("/");
  }

  return (
    <>
      <div className="navbar sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 transition-all">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <span className="text-xl font-bold tracking-tight font-heading text-slate-800">AutoResume<span className="text-blue-600">.ai</span></span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="flex items-center gap-8">
            {user && user.role !== 'admin' && (
              <>
                <li>
                  <Link to="/home" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Workspace</Link>
                </li>
                <li>
                  <Link to="/profile" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">My Resumes</Link>
                </li>
              </>
            )}
            {user && user.role === 'admin' && (
              <li>
                <Link to="/admin" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Admin Console</Link>
              </li>
            )}
          </ul>
        </div>



        <div className="navbar-end gap-1 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Hamburger Menu moved here */}
              <div className="dropdown dropdown-end lg:hidden">
                <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm sm:btn-md">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </label>
                <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow-xl bg-white rounded-2xl w-52 border border-slate-100">
                  {user.role !== 'admin' ? (
                    <>
                      <li className="menu-title px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</li>
                      <li>
                        <Link to="/home" className="flex items-center gap-3 py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                          Workspace
                        </Link>
                      </li>
                      <li>
                        <Link to="/profile" className="flex items-center gap-3 py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          My Resumes
                        </Link>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link to="/admin" className="flex items-center gap-3 py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Admin Console
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</span>
                <span className="text-xs text-slate-500 font-medium leading-tight capitalize">{user.role}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm ml-2 hidden sm:flex"
              >
                Sign out
              </button>
              {/* Mobile Logout Icon */}
              <button onClick={handleLogout} className="sm:hidden btn btn-circle btn-sm btn-ghost text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Sign in</Link>
              <Link to="/register" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
