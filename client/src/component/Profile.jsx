import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getResumeHistory, deleteResumeRecord, updateResumeRecord, downloadResumePDF, setCurrentTailoredResume } from '../slices/resumeSlice';
import { updateProfile } from '../slices/authSlice';
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
import { useNavigate } from 'react-router-dom';

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

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { history, loading } = useSelector(state => state.resume);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profile: {
      phone: user?.profile?.phone || '',
      address: user?.profile?.address || '',
      linkedin: user?.profile?.linkedin || '',
      github: user?.profile?.github || '',
      portfolio: user?.profile?.portfolio || '',
      summary: user?.profile?.summary || '',
      photo: '' // Added photo field
    }
  });

  useEffect(() => {
    if (activeTab === 'history') {
      dispatch(getResumeHistory());
    }
  }, [activeTab, dispatch]);

  // Load profile from localStorage on mount or when user email changes
  useEffect(() => {
    if (user?.email) {
      const savedProfile = localStorage.getItem(`profile_data_${user.email}`);
      if (savedProfile) {
        try {
          const parsedData = JSON.parse(savedProfile);
          setProfileData(prev => ({
            ...prev,
            profile: { ...prev.profile, ...parsedData }
          }));
        } catch (err) {
          console.error("Failed to parse local profile data", err);
        }
      }
    }
  }, [user?.email]);

  const handleProfileUpdate = () => {
    // 1. Update Core Data (Name) in the Database
    dispatch(updateProfile({ 
      name: profileData.name,
      // We explicitly DON'T send the profile object to keep it out of the DB
    }));

    // 2. Save Extra Data (Phone, Photo, etc.) to localStorage as requested
    if (user?.email) {
      localStorage.setItem(`profile_data_${user.email}`, JSON.stringify(profileData.profile));
    }
    
    setEditMode(false);
    Swal.fire({
      title: 'Success',
      text: 'Name saved to server, and other details saved locally!',
      icon: 'success',
      confirmButtonColor: '#3b82f6'
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('Error', 'File too large! Please choose an image under 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profile: { ...prev.profile, photo: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteRecord = (recordId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete this resume record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteResumeRecord(recordId));
        Swal.fire('Deleted!', 'Resume record has been deleted.', 'success');
      }
    });
  };

  const handleDownload = (recordId) => {
    window.open(`/api/profile/download/${recordId}`, '_blank');
  };

  const handleRevisit = (record) => {
    dispatch(setCurrentTailoredResume({ tailoredResume: record.tailoredResume, recordId: record._id }));
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-heading">My Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal details, generated resumes, and view analytics.</p>
        </div>

        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
          <button
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Resume History
          </button>
          <button
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            Platform Analytics
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`btn btn-sm ${editMode ? 'btn-error' : 'btn-primary'}`}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 pb-8 border-b border-slate-100">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-md flex items-center justify-center">
                  {profileData.profile.photo ? (
                    <img src={profileData.profile.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {editMode && (
                  <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all animate-pulse duration-1000">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-slate-800">{user?.name || 'User'}</h3>
                <p className="text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Resume Tailor'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={profileData.email}
                  disabled
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={profileData.profile.phone}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, phone: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Address</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={profileData.profile.address}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, address: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">LinkedIn</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={profileData.profile.linkedin}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, linkedin: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">GitHub</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={profileData.profile.github}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, github: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Portfolio URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={profileData.profile.portfolio}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, portfolio: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Professional Summary</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={profileData.profile.summary}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    profile: {...profileData.profile, summary: e.target.value}
                  })}
                  disabled={!editMode}
                />
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Resume History</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : history && history.docs && history.docs.length > 0 ? (
              <div className="space-y-4">
                {history.docs.map((record) => (
                  <div key={record._id} className="border border-slate-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">{record.companyName}</h3>
                        <p className="text-slate-600">{record.jobTitle || 'Job Title Not Specified'}</p>
                        <p className="text-sm text-slate-500">
                          Created: {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRevisit(record)}
                          className="btn btn-sm btn-outline btn-primary"
                        >
                          Revisit/Edit
                        </button>
                        <button
                          onClick={() => handleDownload(record._id)}
                          className="btn btn-sm btn-primary"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record._id)}
                          className="btn btn-sm btn-error"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-700 line-clamp-3">
                        {record.tailoredResume.substring(0, 300)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">No resume history found. Start tailoring your first resume!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Your Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="stat bg-slate-50 rounded-lg p-6 border border-slate-100">
                <div className="stat-title text-slate-500 font-medium">Total Resumes</div>
                <div className="stat-value text-4xl mt-2 text-blue-600 font-extrabold">{history?.totalDocs || 0}</div>
                <div className="stat-desc mt-1">Resumes tailored</div>
              </div>
              <div className="stat bg-slate-50 rounded-lg p-6 border border-slate-100">
                <div className="stat-title text-slate-500 font-medium">This Month</div>
                <div className="stat-value text-4xl mt-2 text-green-600 font-extrabold">
                  {history?.docs?.filter(r => {
                    const recordDate = new Date(r.createdAt);
                    const now = new Date();
                    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                  }).length || 0}
                </div>
                <div className="stat-desc mt-1">Resumes tailored this month</div>
              </div>
              <div className="stat bg-slate-50 rounded-lg p-6 border border-slate-100">
                <div className="stat-title text-slate-500 font-medium">Companies</div>
                <div className="stat-value text-4xl mt-2 text-purple-600 font-extrabold">
                  {new Set(history?.docs?.map(r => r.companyName)).size || 0}
                </div>
                <div className="stat-desc mt-1">Unique companies applied to</div>
              </div>
            </div>

            {/* Charts Section */}
            {history?.docs?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Line Chart */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-center text-slate-700 mb-4">Activity Over Time</h3>
                  <div className="h-64">
                    <Line 
                      options={{ maintainAspectRatio: false }}
                      data={{
                        labels: (() => {
                          const dates = history.docs.map(r => new Date(r.createdAt).toLocaleDateString());
                          return [...new Set(dates)].reverse(); // Unique dates sorted
                        })(),
                        datasets: [
                          {
                            label: 'Resumes Tailored',
                            data: (() => {
                              const dateCounts = {};
                              history.docs.forEach(r => {
                                const d = new Date(r.createdAt).toLocaleDateString();
                                dateCounts[d] = (dateCounts[d] || 0) + 1;
                              });
                              const dates = [...new Set(history.docs.map(r => new Date(r.createdAt).toLocaleDateString()))].reverse();
                              return dates.map(d => dateCounts[d]);
                            })(),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            tension: 0.3
                          }
                        ]
                      }} 
                    />
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-center text-slate-700 mb-4">Top Companies Applied To</h3>
                  <div className="h-64">
                    <Bar 
                      options={{ maintainAspectRatio: false }}
                      data={{
                        labels: (() => {
                          const companyCounts = {};
                          history.docs.forEach(r => {
                            companyCounts[r.companyName] = (companyCounts[r.companyName] || 0) + 1;
                          });
                          return Object.keys(companyCounts).sort((a,b) => companyCounts[b] - companyCounts[a]).slice(0, 5);
                        })(),
                        datasets: [
                          {
                            label: 'Resumes Count',
                            data: (() => {
                              const companyCounts = {};
                              history.docs.forEach(r => {
                                companyCounts[r.companyName] = (companyCounts[r.companyName] || 0) + 1;
                              });
                              const topCompanies = Object.keys(companyCounts).sort((a,b) => companyCounts[b] - companyCounts[a]).slice(0, 5);
                              return topCompanies.map(c => companyCounts[c]);
                            })(),
                            backgroundColor: '#8b5cf6',
                            borderRadius: 4
                          }
                        ]
                      }}
                    />
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-bold text-center text-slate-700 mb-4">Distribution of Applications</h3>
                  <div className="h-72 w-full flex justify-center">
                    <Pie 
                      options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                      data={{
                        labels: (() => {
                            const labels = [];
                            const counts = {};
                            history.docs.forEach(r => counts[r.companyName] = (counts[r.companyName] || 0) + 1);
                            for (let company in counts) { labels.push(company); }
                            return labels;
                        })(),
                        datasets: [{
                            data: (() => {
                                const data = [];
                                const counts = {};
                                history.docs.forEach(r => counts[r.companyName] = (counts[r.companyName] || 0) + 1);
                                for (let company in counts) { data.push(counts[company]); }
                                return data;
                            })(),
                            backgroundColor: [
                                '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#6366f1'
                            ],
                            borderWidth: 1
                        }]
                      }} 
                    />
                  </div>
                </div>
              </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 font-medium pb-2">Not enough data to display charts yet.</p>
                    <p className="text-slate-400 text-sm">Tailor some resumes to see your analytics here.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;