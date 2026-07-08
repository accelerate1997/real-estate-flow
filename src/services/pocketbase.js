// A Mock/Compatibility wrapper mimicking the PocketBase JS SDK
// to redirect all operations to the custom Express + PostgreSQL backend.

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
        const data = await this._request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (data && data.token) {
            this.client.authStore.save(data.token, data.record);
        }
        return data;
    }
}

class Files {
    constructor(client) {
        this.client = client;
    }

    getURL(record, filename, options = {}) {
        if (!record || !filename) return '';
        const collection = record.collectionName || 'properties';
        return `${this.client.baseUrl}/api/files/${collection}/${record.id}/${filename}`;
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
        // When migrating to postgres custom Express api, the backend URL matches VITE_APP_URL or host port 3000
        return 'http://localhost:3000';
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

export const pb = new PocketBaseMock(getPbUrl());
