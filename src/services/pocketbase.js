import PocketBase from 'pocketbase';

// Connect to the PocketBase backend using the environment variable or defaulting to localhost
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);

// Optional: you can turn off auto-cancellation if you have rapid sequential requests
pb.autoCancellation(false);
