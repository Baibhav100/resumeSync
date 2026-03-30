import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './url';
import { useSelector, useDispatch } from 'react-redux';
import {
  getAllUsers,
  blockUser,
  unblockUser,
  getAnalytics,
  getUserResumes,
  getActivityLogs,
  deleteUser 
} from '../slices/adminSlice';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {

  const [activityPage, setActivityPage] = useState(1);
const { users, analytics, userResumes, activityLogs, loading } = useSelector(state => state.admin);
const { user: currentUser } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const prevStats = React.useRef({ totalUsers: -1, totalResumes: -1 });

useEffect(() => {
  if (activeTab === 'users') {
    dispatch(getAllUsers());
  } else if (activeTab === 'analytics') {
    dispatch(getAnalytics());
  } else if (activeTab === 'activity') {
    dispatch(getActivityLogs({ page: activityPage, limit: 20 }));
  }
}, [activeTab, dispatch, activityPage]);

  // Polling for real-time notifications
  useEffect(() => {
    import('../component/url').then(({ default: url }) => {
      const pollInterval = setInterval(async () => {
        try {
          const res = await url.get('/admin/analytics');
          const currentTotalUsers = res.data.summary.totalUsers;
          const currentTotalResumes = res.data.summary.totalResumes;

          if (prevStats.current.totalUsers !== -1) {
            if (currentTotalUsers > prevStats.current.totalUsers) {
              addNotification(`New user registered! Total: ${currentTotalUsers}`, 'success');
              if (activeTab === 'users') dispatch(getAllUsers());
            }
            if (currentTotalResumes > prevStats.current.totalResumes) {
              addNotification(`New resume tailored! Total: ${currentTotalResumes}`, 'info');
            }
          }

          prevStats.current = { totalUsers: currentTotalUsers, totalResumes: currentTotalResumes };
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 5000); // 5 seconds

      return () => clearInterval(pollInterval);
    });
  }, [activeTab, dispatch]);

  const handleBlockUser = (userId) => {
    Swal.fire({
      title: 'Block User?',
      text: 'This user will be unable to access the system.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, block user'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(blockUser(userId));
        addNotification(`User blocked successfully`, 'warning');
        Swal.fire('Blocked!', 'User has been blocked.', 'success');
      }
    });
  };

  const handleUnblockUser = (userId) => {
    dispatch(unblockUser(userId));
    addNotification(`User unblocked successfully`, 'success');
    Swal.fire('Unblocked!', 'User has been unblocked.', 'success');
  };

  const handleViewUserResumes = (userId) => {
    setSelectedUser(userId);
    dispatch(getUserResumes(userId));
  };

  const handleUserDelete = (userId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete this user and all their resume history!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete user'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteUser(userId));
        addNotification(`User deleted successfully`, 'error');
        Swal.fire('Deleted!', 'User has been removed.', 'success');
      }
    });
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);

    // Play notification sound
    playNotificationSound();

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  return (
    <div className="flex bg-slate-50 font-sans min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 relative z-20 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <span className={`font-extrabold text-xl tracking-wide font-heading whitespace-nowrap overflow-hidden transition-all text-blue-400 ${isSidebarOpen ? 'opacity-100 flex-1' : 'opacity-0 w-0'}`}>
            Admin<span className="text-white">Console</span>
          </span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors shrink-0"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 mt-4">
          <button
            className={`w-full flex items-center p-3 rounded-xl transition-all font-semibold ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>User Management</span>
          </button>

          <button
            className={`w-full flex items-center p-3 rounded-xl transition-all font-semibold ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Analytics & Metrics</span>
          </button>

          <button
            className={`w-full flex items-center p-3 rounded-xl transition-all font-semibold ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={() => setActiveTab('activity')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>System Activity</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full h-full min-h-[calc(100vh-64px)] overflow-x-hidden p-6 sm:p-10 relative">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`alert alert-${notification.type} shadow-lg max-w-sm pointer-events-auto`}
            >
              <div>
                <span>{notification.message}</span>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Platform Users</h2>

            {loading ? (
              <div className="flex justify-center py-20">
                <span className="loading loading-spinner text-blue-600 loading-lg"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(users?.docs || [])].sort((a, b) => {
                      if (a.role === 'admin' && b.role !== 'admin') return -1;
                      if (a.role !== 'admin' && b.role === 'admin') return 1;
                      return 0;
                    }).map((user) => (
                      <tr key={user._id}>
                        <td className="font-medium">{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewUserResumes(user._id)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors shadow-sm"
                            >
                              View Resumes
                            </button>
                            
                            {user.email !== currentUser?.email && (
                              <>
                                {user.isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user._id)}
                                    className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg border border-green-200 text-xs transition-colors shadow-sm"
                                  >
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(user._id)}
                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg border border-red-200 text-xs transition-colors shadow-sm"
                                  >
                                    Block
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUserDelete(user._id)}
                                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedUser && userResumes && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-lg font-semibold mb-4">User Resume History</h3>
                <div className="space-y-4">
                  {userResumes.docs?.map((record) => (
                    <div key={record._id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.companyName}</h4>
                          <p className="text-sm text-slate-600">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: `${record.companyName} Resume`,
                              html: `<div style="text-align: left; max-height: 60vh; overflow-y: auto; white-space: pre-wrap; font-family: monospace; font-size: 14px; background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">${record.tailoredResume.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
                              width: '800px',
                              confirmButtonText: 'Close',
                              confirmButtonColor: '#3b82f6'
                            });
                          }}
                          className="btn btn-sm btn-outline btn-info"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => window.open(`${API_BASE_URL}/profile/download/${record._id}`, '_blank')}
                          className="btn btn-sm btn-primary"
                        >
                          Download
                        </button>
                      </div>
                      <div className="mt-2 bg-slate-50 p-3 rounded">
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {record.tailoredResume.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics?.summary?.totalUsers || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Active Users</h3>
                <p className="text-3xl font-bold text-green-600">{analytics?.summary?.activeUsers || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Resumes</h3>
                <p className="text-3xl font-bold text-purple-600">{analytics?.summary?.totalResumes || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Blocked Users</h3>
                <p className="text-3xl font-bold text-red-600">{analytics?.summary?.blockedUsers || 0}</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 font-heading">Activity Charts</h2>
              {analytics?.analytics?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-72 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.05)] transition-shadow">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-wide uppercase">Daily Visitors</h3>
                    <div className="h-48">
                      <Line 
                        options={{ maintainAspectRatio: false }}
                        data={{
                          labels: analytics.analytics.map(a => new Date(a.date).toLocaleDateString()),
                          datasets: [{
                            label: 'Visitors',
                            data: analytics.analytics.map(a => a.visitors),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                          }]
                        }}
                      />
                    </div>
                  </div>

                  <div className="h-72 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.05)] transition-shadow flex flex-col items-center">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-wide uppercase self-start w-full">Activity Distribution Overview</h3>
                    <div className="h-48 w-full flex justify-center">
                      <Pie 
                        options={{ 
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                                position: 'right',
                                labels: { font: { size: 12, family: "'Inter', sans-serif" } }
                            }
                          }
                        }}
                        data={{
                          labels: ['Total Visitors', 'Tailored Resumes', 'Total Downloads'],
                          datasets: [{
                            data: [
                              analytics.analytics.reduce((acc, curr) => acc + curr.visitors, 0),
                              analytics.analytics.reduce((acc, curr) => acc + curr.resumeTailorings, 0),
                              analytics.analytics.reduce((acc, curr) => acc + curr.downloads, 0)
                            ],
                            backgroundColor: [
                              '#3b82f6', // blue
                              '#8b5cf6', // purple
                              '#ec4899', // pink
                            ],
                            borderWidth: 0,
                            hoverOffset: 6
                          }]
                        }}
                      />
                    </div>
                  </div>

                  <div className="h-72 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.05)] transition-shadow">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-wide uppercase">User Registrations</h3>
                    <div className="h-48">
                      <Line 
                        options={{ maintainAspectRatio: false }}
                        data={{
                          labels: analytics.analytics.map(a => new Date(a.date).toLocaleDateString()),
                          datasets: [{
                            label: 'New Users',
                            data: analytics.analytics.map(a => a.registrations),
                            borderColor: '#10b981',
                            borderWidth: 3,
                            tension: 0.4
                          }]
                        }}
                      />
                    </div>
                  </div>

                  <div className="h-72 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.05)] transition-shadow">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-wide uppercase">Resumes Downloaded</h3>
                    <div className="h-48">
                      <Bar 
                        options={{ 
                            maintainAspectRatio: false,
                            borderRadius: 6 
                        }}
                        data={{
                          labels: analytics.analytics.map(a => new Date(a.date).toLocaleDateString()),
                          datasets: [{
                            label: 'Downloads',
                            data: analytics.analytics.map(a => a.downloads),
                            backgroundColor: '#f43f5e'
                          }]
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-xl">Chart distribution is building up. Gathering tracking data...</div>
              )}
            </div>
          </div>
        )}

{activeTab === 'activity' && (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-slate-900 font-heading">System Activity Log</h2>
      <button 
        onClick={() => dispatch(getActivityLogs({ page: activityPage, limit: 20 }))}
        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
    
    {loading ? (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner text-blue-600 loading-lg"></span>
      </div>
    ) : !activityLogs || activityLogs?.docs?.length === 0 ? (
      <div className="text-center py-12 text-slate-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No activity logs yet</p>
        <p className="text-sm mt-1">Activities will appear here as users interact with the platform</p>
      </div>
    ) : (
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {activityLogs?.docs?.map((log) => {
          const getActivityIcon = (action) => {
            switch(action) {
              case 'USER_REGISTERED': return '🎉';
              case 'USER_LOGGED_IN': return '🔐';
              case 'USER_LOGGED_OUT': return '🚪';
              case 'RESUME_TAILORED': return '✨';
              case 'PDF_DOWNLOADED': return '📄';
              case 'USER_BLOCKED': return '🚫';
              case 'USER_UNBLOCKED': return '✅';
              case 'LOGIN_FAILED': return '❌';
              default: return '📌';
            }
          };
          
          const getActivityColor = (action) => {
            switch(action) {
              case 'USER_REGISTERED': return 'bg-green-100 text-green-600';
              case 'USER_LOGGED_IN': return 'bg-blue-100 text-blue-600';
              case 'USER_LOGGED_OUT': return 'bg-slate-100 text-slate-600';
              case 'RESUME_TAILORED': return 'bg-purple-100 text-purple-600';
              case 'PDF_DOWNLOADED': return 'bg-indigo-100 text-indigo-600';
              case 'USER_BLOCKED': return 'bg-red-100 text-red-600';
              case 'USER_UNBLOCKED': return 'bg-emerald-100 text-emerald-600';
              case 'LOGIN_FAILED': return 'bg-orange-100 text-orange-600';
              default: return 'bg-slate-100 text-slate-600';
            }
          };
          
          const getActivityTitle = (action) => {
            switch(action) {
              case 'USER_REGISTERED': return 'New User Registration';
              case 'USER_LOGGED_IN': return 'User Logged In';
              case 'USER_LOGGED_OUT': return 'User Logged Out';
              case 'RESUME_TAILORED': return 'Resume Tailored';
              case 'PDF_DOWNLOADED': return 'PDF Downloaded';
              case 'USER_BLOCKED': return 'User Blocked';
              case 'USER_UNBLOCKED': return 'User Unblocked';
              case 'LOGIN_FAILED': return 'Failed Login Attempt';
              default: return 'System Activity';
            }
          };
          
          return (
            <div key={log._id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getActivityColor(log.action)}`}>
                    <span className="text-xl">{getActivityIcon(log.action)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {getActivityTitle(log.action)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">{log.userName || 'System'}</span>
                      {log.details && <span className="text-slate-500"> - {log.details}</span>}
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-slate-400 mt-1">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap ml-4">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    )}
    
    {/* Pagination */}
    {activityLogs?.totalPages > 1 && (
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
          disabled={activityLogs.page === 1}
          className="px-3 py-1 rounded border border-slate-200 text-sm disabled:opacity-50 hover:bg-slate-50"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm">
          Page {activityLogs.page} of {activityLogs.totalPages}
        </span>
        <button
          onClick={() => setActivityPage(prev => Math.min(activityLogs.totalPages, prev + 1))}
          disabled={activityLogs.page === activityLogs.totalPages}
          className="px-3 py-1 rounded border border-slate-200 text-sm disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    )}
  </div>
)}
      </main>
    </div>
  );
};

export default AdminDashboard;