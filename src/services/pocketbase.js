// A Mock/Compatibility wrapper mimicking the PocketBase JS SDK
// to redirect all operations to the custom Express + PostgreSQL backend.
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

class AuthStore {
    constructor() {
        this.load();
    }

    load() {
        try {
            const dataStr = localStorage.getItem('pb_auth');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                this.token = data.token || '';
                this.model = data.model || null;
            } else {
                this.token = '';
                this.model = null;
            }
        } catch (e) {
            this.token = '';
            this.model = null;
        }
    }

    get isValid() {
        return !!this.token;
    }

    save(token, model) {
        this.token = token;
        this.model = model;
        localStorage.setItem('pb_auth', JSON.stringify({ token, model }));
    }

    clear() {
        this.token = '';
        this.model = null;
        localStorage.removeItem('pb_auth');
        signOut(auth).catch(e => console.error("Firebase signout error:", e));
    }
}

class Collection {
    constructor(name, client) {
        this.name = name;
        this.client = client;
    }

    async _request(path, options = {}) {
        const url = `${this.client.baseUrl}${path}`;
        const headers = {
            ...options.headers,
        };
        
        // Dynamically fetch fresh Firebase ID Token if logged in
        if (auth.currentUser) {
            try {
                const firebaseToken = await auth.currentUser.getIdToken(true);
                this.client.authStore.save(firebaseToken, this.client.authStore.model);
            } catch (tokenErr) {
                console.error("Firebase token refresh error:", tokenErr);
            }
        }

        if (this.client.authStore.token) {
            headers['Authorization'] = `Bearer ${this.client.authStore.token}`;
        }

        const fetchOptions = {
            ...options,
            headers
        };

        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
            let errMsg = 'API Request Failed';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (e) {}
            throw new Error(errMsg);
        }

        if (res.status === 204) {
            return true;
        }

        return res.json();
    }

    async getFullList(options = {}) {
        const queryParams = new URLSearchParams();
        if (options.filter) queryParams.append('filter', options.filter);
        if (options.sort) queryParams.append('sort', options.sort);
        if (options.expand) queryParams.append('expand', options.expand);

        const data = await this._request(`/api/collections/${this.name}?${queryParams.toString()}`);
        return data.items || [];
    }

    async getList(page = 1, perPage = 30, options = {}) {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            perPage: perPage.toString()
        });
        if (options.filter) queryParams.append('filter', options.filter);
        if (options.sort) queryParams.append('sort', options.sort);
        if (options.expand) queryParams.append('expand', options.expand);

        return this._request(`/api/collections/${this.name}?${queryParams.toString()}`);
    }

    async getOne(id, options = {}) {
        const queryParams = new URLSearchParams();
        if (options.expand) queryParams.append('expand', options.expand);
        return this._request(`/api/collections/${this.name}/${id}?${queryParams.toString()}`);
    }

    async create(body) {
        const isFormData = body instanceof FormData;
        const options = {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body),
        };
        if (!isFormData) {
            options.headers = {
                'Content-Type': 'application/json'
            };
        }
        return this._request(`/api/collections/${this.name}`, options);
    }

    async update(id, body) {
        const isFormData = body instanceof FormData;
        const options = {
            method: 'PATCH',
            body: isFormData ? body : JSON.stringify(body),
        };
        if (!isFormData) {
            options.headers = {
                'Content-Type': 'application/json'
            };
        }
        return this._request(`/api/collections/${this.name}/${id}`, options);
    }

    async delete(id) {
        return this._request(`/api/collections/${this.name}/${id}`, {
            method: 'DELETE'
        });
    }

    async authWithPassword(email, password) {
        // Authenticate with Firebase first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseToken = await userCredential.user.getIdToken(true);
        
        // Sync with PostgreSQL backend using Firebase Token
        const url = `${this.client.baseUrl}/api/auth/sync`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${firebaseToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            let errMsg = 'Authentication sync failed';
            try {
                const errData = await res.json();
                errMsg = errData.message || errMsg;
            } catch (e) {}
            // Sign out of Firebase if PostgreSQL sync fails to keep them in sync
            await signOut(auth);
            throw new Error(errMsg);
        }

        const data = await res.json();
        if (data && data.token) {
            this.client.authStore.save(data.token, data.record);
        }
        return data;
    }

    async authWithOAuth2(providerName) {
        if (providerName === 'google') {
            const provider = new GoogleAuthProvider();
            // Force select account to allow choosing different accounts easily
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const userCredential = await signInWithPopup(auth, provider);
            const firebaseToken = await userCredential.user.getIdToken(true);
            
            // Sync with PostgreSQL backend using Firebase Token
            const url = `${this.client.baseUrl}/api/auth/sync`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${firebaseToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                let errMsg = 'Authentication sync failed';
                try {
                    const errData = await res.json();
                    errMsg = errData.message || errMsg;
                } catch (e) {}
                // Sign out of Firebase if PostgreSQL sync fails to keep them in sync
                await signOut(auth);
                throw new Error(errMsg);
            }

            const data = await res.json();
            if (data && data.token) {
                this.client.authStore.save(data.token, data.record);
            }
            return data;
        }
        throw new Error(`OAuth provider ${providerName} is not supported`);
    }

    async authRefresh() {
        if (!auth.currentUser) return null;
        try {
            const firebaseToken = await auth.currentUser.getIdToken(true);
            const url = `${this.client.baseUrl}/api/auth/sync`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${firebaseToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.token) {
                    this.client.authStore.save(data.token, data.record);
                    return data;
                }
            }
        } catch (e) {
            console.error("Auth refresh error:", e);
        }
        return null;
    }
}

class Files {
    constructor(client) {
        this.client = client;
    }

    getURL(record, filename, options = {}) {
        if (!record || !filename) return '';
        const collection = record.collectionName || 'properties';
        return `https://pub-6b00eae276bf483fafd7296068e638b0.r2.dev/${collection}/${record.id}/${filename}`;
    }
}

class PocketBaseMock {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.authStore = new AuthStore();
        this.files = new Files(this);
    }

    collection(name) {
        return new Collection(name, this);
    }

    autoCancellation(val) {
        // No-op
    }

    filter(expr, params = {}) {
        let result = expr;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{:${key}}`, 'g'), JSON.stringify(value));
        }
        return result;
    }
}

// Instantiate and export the client
const getPbUrl = () => {
    const envUrl = import.meta.env.VITE_POCKETBASE_URL;
    if (envUrl && envUrl !== 'http://127.0.0.1:8090' && envUrl !== 'http://localhost:8090') {
        return 'http://localhost:3000';
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

export const pb = new PocketBaseMock(getPbUrl());
