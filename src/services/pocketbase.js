import PocketBase from 'pocketbase';

// Connect to the PocketBase backend
// We use window.location.origin as a fallback so it works correctly with our Nginx /api proxy
const getPbUrl = () => {
    const envUrl = import.meta.env.VITE_POCKETBASE_URL;
    if (envUrl && envUrl !== 'http://127.0.0.1:8090' && envUrl !== 'http://localhost:8090') {
        return envUrl;
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8090';
};

export const pb = new PocketBase(getPbUrl());

// Optional: you can turn off auto-cancellation if you have rapid sequential requests
pb.autoCancellation(false);
