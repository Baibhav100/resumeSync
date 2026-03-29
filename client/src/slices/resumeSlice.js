import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import url from '../component/url';

export const tailorResume = createAsyncThunk(
  'resume/tailor',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await url.post('/tailor', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getResumeHistory = createAsyncThunk(
  'resume/getHistory',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await url.get(`/profile/resume-history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteResumeRecord = createAsyncThunk(
  'resume/deleteRecord',
  async (recordId, { rejectWithValue, dispatch }) => {
    try {
      const response = await url.delete(`/profile/resume-history/${recordId}`);
      // After successful deletion, refresh the history with current page
      // You might want to get the current page from state
      dispatch(getResumeHistory({ page: 1, limit: 10 }));
      return { recordId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateResumeRecord = createAsyncThunk(
  'resume/updateRecord',
  async ({ recordId, updates }, { rejectWithValue }) => {
    try {
      const response = await url.put(`/profile/resume-history/${recordId}`, updates);
      return { recordId, updates: response.data.record };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const downloadResumePDF = createAsyncThunk(
  'resume/downloadPDF',
  async (recordId, { rejectWithValue }) => {
    try {
      const response = await url.get(`/profile/download/${recordId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    currentTailoredResume: null,
    history: {
      docs: [],
      totalDocs: 0,
      limit: 10,
      page: 1,
      totalPages: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentResume: (state) => {
      state.currentTailoredResume = null;
    },
    updateCurrentResumeText: (state, action) => {
      if (state.currentTailoredResume) {
        state.currentTailoredResume.tailoredResume = action.payload;
      }
    },
    setCurrentTailoredResume: (state, action) => {
      state.currentTailoredResume = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Tailor Resume
      .addCase(tailorResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(tailorResume.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTailoredResume = action.payload;
      })
      .addCase(tailorResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Resume History
      .addCase(getResumeHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getResumeHistory.fulfilled, (state, action) => {
        state.loading = false;
        // The backend returns a paginated response with docs, totalDocs, etc.
        state.history = {
          docs: action.payload.docs || [],
          totalDocs: action.payload.totalDocs || 0,
          limit: action.payload.limit || 10,
          page: action.payload.page || 1,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(getResumeHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Resume Record
      .addCase(deleteResumeRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResumeRecord.fulfilled, (state, action) => {
        state.loading = false;
        // The history will be refreshed by the getResumeHistory dispatch in the thunk
        // But we can also optimistically update the UI
        if (state.history.docs) {
          state.history.docs = state.history.docs.filter(
            record => record._id !== action.payload.recordId
          );
          state.history.totalDocs -= 1;
        }
      })
      .addCase(deleteResumeRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Resume Record
      .addCase(updateResumeRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateResumeRecord.fulfilled, (state, action) => {
        state.loading = false;
        if (state.history.docs) {
          const index = state.history.docs.findIndex(
            record => record._id === action.payload.recordId
          );
          if (index !== -1) {
            state.history.docs[index] = { 
              ...state.history.docs[index], 
              ...action.payload.updates 
            };
          }
        }
      })
      .addCase(updateResumeRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearCurrentResume, 
  updateCurrentResumeText, 
  setCurrentTailoredResume, 
  clearError 
} = resumeSlice.actions;

export default resumeSlice.reducer;