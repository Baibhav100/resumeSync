import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { tailorResume, clearCurrentResume, updateCurrentResumeText, updateResumeRecord } from '../slices/resumeSlice';
import Swal from 'sweetalert2';
import ResumePreview from './ResumePreview';

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentTailoredResume, loading } = useSelector(state => state.resume);
  
  // Add this console.log to check the current tailored resume
  console.log('🔍 Current tailored resume:', currentTailoredResume);
  console.log('📝 Record ID:', currentTailoredResume?.recordId);
  console.log('🏢 Company:', currentTailoredResume?.companyName);
  
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [baseResume, setBaseResume] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleTailor = async () => {
    if ((!jobDescription && !jobUrl) || (!baseResume && !resumeFile)) {
      Swal.fire('Missing Information', 'Please provide your resume (text or PDF) and the job details (text or Link).', 'warning');
      return;
    }

    const formData = new FormData();
    if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    } else {
      formData.append('baseResume', baseResume);
    }

    if (jobUrl) {
      formData.append('jobUrl', jobUrl);
    } else {
      formData.append('jobDescription', jobDescription);
    }

    const result = await dispatch(tailorResume(formData));
    console.log('📊 Tailor response:', result);
    if (result.payload) {
      console.log('✅ New record ID:', result.payload.recordId);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTailoredResume?.tailoredResume || '');
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Resume copied to clipboard.',
      timer: 1500,
      showConfirmButton: false
    });
  };

const handleDownload = async () => {
  if (!currentTailoredResume?.recordId) {
    Swal.fire('Error', 'No resume record found', 'error');
    return;
  }
  
  setDownloading(true);
  
  try {
    console.log('📥 Downloading resume for record:', currentTailoredResume.recordId);
    
    // Save modifications if in edit mode
    if (editMode) {
      await dispatch(updateResumeRecord({
        recordId: currentTailoredResume.recordId,
        updates: { tailoredResume: currentTailoredResume.tailoredResume }
      })).unwrap();
    }
    
    // Simple approach: open the PDF in a new tab
    const timestamp = Date.now();
    const pdfUrl = `/api/profile/download/${currentTailoredResume.recordId}?t=${timestamp}`;
    
    console.log('🌐 Opening PDF URL:', pdfUrl);
    
    // Open in new tab - browser will handle download/popup
    window.open(pdfUrl, '_blank');
    
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'PDF opened in new tab. Use the browser\'s save option to download.',
      timer: 3000,
      showConfirmButton: false
    });
    
  } catch (err) {
    console.error('❌ Download error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Download Failed',
      text: err.message || 'Failed to download resume.',
      confirmButtonText: 'OK'
    });
  } finally {
    setDownloading(false);
  }
};
  
  const handleSaveModifications = async () => {
    if (currentTailoredResume?.recordId) {
      try {
        await dispatch(updateResumeRecord({
          recordId: currentTailoredResume.recordId,
          updates: { tailoredResume: currentTailoredResume.tailoredResume }
        })).unwrap();
        Swal.fire({
          icon: 'success',
          title: 'Saved',
          text: 'Modifications saved successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire('Error', 'Failed to save modifications.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-[95%] mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 px-2 tracking-tight font-heading">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Resume Tailor</span> & Scraper
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            Upload your PDF, paste a link to the job, and watch the AI optimize your experience perfectly to beat the ATS in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* ── Inputs Column ── */}
          <div className="space-y-8">
            {/* Resume Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 font-heading">1. Base Resume</h2>
                <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">Required</span>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Upload PDF</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                      </svg>
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-slate-400">PDF documents only</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {resumeFile && (
                    <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      {resumeFile.name} attached
                    </p>
                  )}
                </div>

                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">OR PASTE TEXT</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <textarea
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[160px] text-sm text-slate-700 bg-slate-50 transition-all focus:bg-white resize-none"
                  placeholder="Paste your current resume layout..."
                  value={baseResume}
                  onChange={(e) => {
                    setBaseResume(e.target.value);
                    if (e.target.value) setResumeFile(null);
                  }}
                />
              </div>
            </div>

            {/* Job Details Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 font-heading">2. Job Profile</h2>
                <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-600 rounded-full uppercase tracking-wider">Required</span>
              </div>
              <div className="space-y-5">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Scrape Job URL (LinkedIn, Indeed, etc.)</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/jobs/view/..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  />
                </div>

                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">OR PASTE DESCRIPTION</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <textarea
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[160px] text-sm text-slate-700 bg-slate-50 transition-all focus:bg-white resize-none"
                  placeholder="Paste the job responsibilities and requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleTailor}
              disabled={loading}
              className="w-full py-5 px-6 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform transition hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center mt-2"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-md mr-3" />
                  AI is Tailoring your CV...
                </>
              ) : (
                "Tailor My Resume Spark"
              )}
            </button>
          </div>

          {/* ── Results Column ── */}
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 sm:p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-grow hover:shadow-md transition-shadow">

              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800 font-heading">3. Your Tailored Result</h2>
                {currentTailoredResume && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopy}
                      className="btn btn-sm bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm flex items-center font-semibold rounded-lg"
                    >
                      Copy Text
                    </button>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`btn btn-sm border font-semibold rounded-lg shadow-sm flex items-center transition-colors ${editMode ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {editMode ? '✓ Done Editing' : 'Edit Mode'}
                    </button>
                    <button
                      onClick={handleSaveModifications}
                      className="btn btn-sm bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 shadow-sm flex items-center font-semibold rounded-lg"
                    >
                      Save modifications
                    </button>
                    <button
  onClick={handleDownload}
  disabled={downloading}
  className={`btn btn-sm flex items-center font-semibold rounded-lg transition-all ${
    downloading 
      ? 'bg-blue-600 text-white cursor-wait opacity-75' 
      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
  }`}
>
  {downloading ? (
    <>
      <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Downloading...
    </>
  ) : (
    'Download PDF'
  )}
</button>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="flex-grow flex flex-col items-center overflow-y-auto rounded-xl border border-slate-200 shadow-inner bg-slate-200 px-3 py-4 sm:px-6 sm:py-8">

                {currentTailoredResume ? (
                  editMode ? (
                    <div className="w-full max-w-[794px] bg-white shadow-xl shadow-slate-300/50 border border-slate-200 rounded-xl p-4 sm:p-6 min-h-[320px]">
                      <textarea
                        className="w-full h-full outline-none resize-none bg-transparent font-mono text-xs text-slate-800 leading-relaxed border-none focus:ring-0"
                        value={currentTailoredResume.tailoredResume}
                        onChange={(e) => dispatch(updateCurrentResumeText(e.target.value))}
                        autoFocus
                        placeholder="Edit your resume markdown here..."
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[794px] overflow-hidden">
                      <ResumePreview markdown={currentTailoredResume.tailoredResume} />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full min-h-[520px] border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-xl transition-colors hover:bg-slate-50">
                    <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Your tailored resume preview will appear here.</p>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs">Upload your PDF or paste text, add a job link, and click the tailor button to begin.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;