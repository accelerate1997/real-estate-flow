export const mockBackend = {
    // Database 'Table'
    getUsers: () => {
        const users = localStorage.getItem('users_db');
        return users ? JSON.parse(users) : [];
    },

    saveUser: (user) => {
        const users = mockBackend.getUsers();
        users.push(user);
        localStorage.setItem('users_db', JSON.stringify(users));
    },

    // Auth Actions
    login: async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = mockBackend.getUsers();
                const user = users.find(u => u.email === email && u.password === password);

                if (user) {
                    // Return user without password
                    const { password, ...userWithoutPassword } = user;
                    resolve({
                        success: true,
                        token: 'mock_token_' + Date.now(),
                        user: userWithoutPassword
                    });
                } else {
                    reject({ message: 'Invalid email or password' });
                }
            }, 800); // Simulate network delay
        });
    },

    register: async (userData) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = mockBackend.getUsers();
                if (users.find(u => u.email === userData.email)) {
                    reject({ message: 'Email already exists' });
                    return;
                }

                const newUser = {
                    id: Date.now(),
                    ...userData,
                    role: 'owner', // Default role
                    agency_id: Date.now() // Mock Agency ID
                };

                mockBackend.saveUser(newUser);

                const { password, ...userWithoutPassword } = newUser;
                resolve({
                    success: true,
                    token: 'mock_token_' + Date.now(),
                    user: userWithoutPassword
                });
            }, 800);
        });
    }
};
