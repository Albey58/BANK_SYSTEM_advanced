import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { access_token, user } = response.data;
            if (access_token) {
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
                return { success: true };
            }
            return { success: false, error: 'No token received' };
        } catch (error) {
            console.error("Login error", error);
            let errorMsg = error.response?.data?.error || 'Login failed';
            
             // Handle detailed validation errors
            if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
                const details = error.response.data.details.map(d => {
                     let msg = d.msg || 'Invalid field';
                     if (msg.startsWith('Value error, ')) {
                         msg = msg.replace('Value error, ', '');
                     }
                     return msg;
                });
                errorMsg = `${errorMsg}: ${details.join(', ')}`;
            }
            return { success: false, error: errorMsg };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/api/auth/register', userData);
            if (response.data.success) {
                 // Registration successful, but does it return token?
                 // app.py: return jsonify({"success": True, "message": "User registered successfully", "user_id": ..., "account_id": ...}), 201
                 // It does NOT return token immediately in the snippet I saw!
                 return { success: true };
            }
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error("Register error", error);
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/'; 
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
