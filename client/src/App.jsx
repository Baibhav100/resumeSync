import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Home from './component/Home'
import Login from './component/Login'
import Register from './component/Register'
import AdminLogin from './component/AdminLogin'
import AdminRegister from './component/AdminRegister'
import Profile from './component/Profile'
import AdminDashboard from './component/AdminDashboard'
import ForgotPassword from './component/ForgotPassword'
import Navbar from './component/Navbar'
import { verifyUser, logout } from './slices/authSlice'
import Swal from 'sweetalert2'

const AppContent = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useSelector(state => state.auth)
  const authPages = ['/login', '/register', '/admin/login', '/admin/register', '/forgot-password']
  const isAuthPage = authPages.includes(location.pathname)

  // Log current state for debugging
  console.log('🔍 AppContent State:', { 
    user: user?.email, 
    loading, 
    pathname: location.pathname,
    isAuthPage
  });

  // Verify user on mount
  useEffect(() => {
    if (isAuthPage && !user) {
      console.log('ℹ️ Skipping auth verification on public auth page:', location.pathname);
      return;
    }

    const verifyAuth = async () => {
      console.log('🔄 Verifying user authentication...');
      try {
        const result = await dispatch(verifyUser()).unwrap();
        console.log('✅ User verified:', result.user?.email);
      } catch (error) {
        console.log('❌ User verification failed:', error);
        // If not authenticated and not on login/register or admin auth pages, redirect to login
        if (!authPages.includes(location.pathname)) {
          console.log('🚪 Redirecting to login from:', location.pathname);
          navigate('/login');
        }
      }
    };
    
    verifyAuth();
    
    // Track visitor
    import('./component/url').then(({ default: url }) => {
      url.post('/analytics/visit').catch(err => console.log('Visitor tracking error:', err));
    });
  }, [dispatch, navigate, isAuthPage, user]);

  // Listen for force-logout event from axios interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      console.log('🚨 Force logout event received');
      dispatch(logout());
      navigate('/login');
    };
    
    window.addEventListener('force-logout', handleForceLogout);
    
    return () => {
      window.removeEventListener('force-logout', handleForceLogout);
    };
  }, [dispatch, navigate]);

  // Check token periodically
  useEffect(() => {
    let interval;
    
    if (user) {
      console.log('⏰ Setting up token check interval for user:', user.email);
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/verify', {
            credentials: 'include'
          });
          
          if (response.status === 401) {
            console.log('⏰ Token expired, logging out...');
            dispatch(logout());
            await Swal.fire({
              icon: 'info',
              title: 'Session Expired',
              text: 'Your session has expired. Redirecting to login...',
              timer: 2000,
              showConfirmButton: false,
              allowOutsideClick: false
            });
            navigate('/login');
          } else {
            console.log('✅ Token still valid');
          }
        } catch (error) {
          console.error('Token check failed:', error);
        }
      }, 60000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, dispatch, navigate]);

  // Show loading spinner while verifying for unauthenticated protected pages
  if (loading && !isAuthPage && !user) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="flex items-center justify-center h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  console.log('🎨 Rendering routes, user:', user?.email, 'role:', user?.role);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/home" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Home />) : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Profile />) : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/home" />} />
        <Route path="/admin/login" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <AdminLogin />} />
        <Route path="/admin/register" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <AdminRegister />} />
        <Route path="/login" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <Login />} />
        <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <Navigate to="/login" />} />
        <Route path="/register" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />) : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App;