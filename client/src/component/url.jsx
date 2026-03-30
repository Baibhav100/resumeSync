import axios from 'axios'
import Swal from 'sweetalert2';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const url = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})


// Flag to prevent multiple redirects
let isRedirecting = false;

// Add response interceptor to handle token refresh
url.interceptors.response.use((response) => {
    return response;
}, async function (error) {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        // Avoid infinite loops if the refresh itself is failing
        if (originalRequest.url === '/refresh') {
            // Refresh failed, trigger logout event
            if (!isRedirecting) {
                isRedirecting = true;
                
                // Clear local storage
                localStorage.removeItem('user');
                
                // Show notification
                await Swal.fire({
                    icon: 'info',
                    title: 'Session Expired',
                    text: 'Your session has expired. Redirecting to login...',
                    timer: 2000,
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
                
                // Dispatch custom event for React to handle redirect
                window.dispatchEvent(new CustomEvent('force-logout'));
            }
            return Promise.reject(error);
        }
        
        originalRequest._retry = true;
        try {
            // Attempt to refresh the token
            await url.post('/refresh');
            // If refresh succeeds, retry the original request
            return url(originalRequest);
        } catch (err) {
            // Refresh failed, trigger logout event
            if (!isRedirecting) {
                isRedirecting = true;
                
                // Clear local storage
                localStorage.removeItem('user');
                
                // Show notification
                await Swal.fire({
                    icon: 'info',
                    title: 'Session Expired',
                    text: 'Your session has expired. Redirecting to login...',
                    timer: 2000,
                    showConfirmButton: false,
                    allowOutsideClick: false
                });
                
                // Dispatch custom event for React to handle redirect
                window.dispatchEvent(new CustomEvent('force-logout'));
            }
            return Promise.reject(err);
        }
    }
    return Promise.reject(error);
});

export default url;