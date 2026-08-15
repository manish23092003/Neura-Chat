import axios from 'axios';

// ── Retry configuration ─────────────────────────────────────────────────────
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Axios instance ──────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://neura-chat-backend-q81j.onrender.com';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30-second timeout — prevents requests from hanging indefinitely
    withCredentials: true,
});

// ── Request interceptor — attach fresh auth token on every request ──────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Initialize retry counter
        config._retryCount = config._retryCount ?? 0;
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors globally ───────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // 401 Unauthorized — token expired, redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Only redirect if not already on auth pages
            if (!window.location.pathname.match(/^\/(login|register|invite|$)/)) {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // Retry on network errors or 5xx server errors (not on 4xx client errors)
        const isRetryable =
            !error.response || // network error (no response)
            error.response.status >= 500; // server error

        if (isRetryable && config && config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            await sleep(RETRY_DELAY_MS * config._retryCount); // exponential-ish backoff
            return axiosInstance(config);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;