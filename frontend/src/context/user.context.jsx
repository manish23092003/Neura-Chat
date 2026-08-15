import React, { createContext, useState, useEffect } from 'react';
import axios from '../config/axios';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            // Verify token and get user data
            axios.get('/users/profile')
                .then((res) => {
                    setUser(res.data.user);
                })
                .catch((err) => {
                    console.warn('Token validation failed:', err.message);
                    if (err.response?.status === 401) {
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

