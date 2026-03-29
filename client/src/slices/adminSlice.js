import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import url from '../component/url';

export const getAllUsers = createAsyncThunk(
  'admin/getUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await url.get('/admin/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const blockUser = createAsyncThunk(
  'admin/blockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await url.put(`/admin/users/${userId}/block`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const unblockUser = createAsyncThunk(
  'admin/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await url.put(`/admin/users/${userId}/unblock`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await url.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getAnalytics = createAsyncThunk(
  'admin/getAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await url.get('/admin/analytics');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getUserResumes = createAsyncThunk(
  'admin/getUserResumes',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await url.get(`/admin/users/${userId}/resumes`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Add this new thunk for activity logs
export const getActivityLogs = createAsyncThunk(
  'admin/getActivityLogs',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await url.get(`/admin/activity-logs?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [],
    analytics: null,
    userResumes: [],
    activityLogs: null,  // Add this
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        const user = state.users.docs?.find(u => u._id === action.meta.arg);
        if (user) user.isBlocked = true;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        const user = state.users.docs?.find(u => u._id === action.meta.arg);
        if (user) user.isBlocked = false;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users.docs = state.users.docs?.filter(u => u._id !== action.meta.arg);
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(getUserResumes.fulfilled, (state, action) => {
        state.userResumes = action.payload;
      })
      // Add activity logs cases
      .addCase(getActivityLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(getActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload;
      })
      .addCase(getActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;