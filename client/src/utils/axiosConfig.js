import axios from 'axios';
import Swal from 'sweetalert2';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 (Unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Prevent multiple redirects
            if (isRedirecting) {
                return Promise.reject(error);
            }
            
            try {
                // Try to refresh the token
                const response = await axios.post('http://localhost:5000/api/refresh', {}, {
                    withCredentials: true
                });
                
                if (response.status === 200) {
                    // Token refreshed successfully, retry original request
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                console.log('Session expired, redirecting to login');
                isRedirecting = true;
                
                // Show notification
                await Swal.fire({
                    icon: 'info',
                    title: 'Session Expired',
                    text: 'Your session has expired. Redirecting to login...',
                    timer: 2000,
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
                
                // Clear localStorage
                localStorage.clear();
                
                // Dispatch custom event for logout
                window.dispatchEvent(new CustomEvent('force-logout'));
                
                // Redirect to login
                window.location.href = '/login';
                
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;