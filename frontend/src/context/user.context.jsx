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

    // Auto-resolve the loading flag after an auth transition.
    //
    // When an external login flow (Google Sign-In, etc.) calls setLoading(true)
    // before calling setUser() + navigate(), React batches those updates and
    // renders UserAuth with loading=true (spinner) instead of the redirect guard.
    // This effect fires after React commits the new user value and resets loading
    // back to false — completing the transition cleanly.
    //
    // It is a no-op in every other scenario:
    //   • Normal startup: user is null, so the condition never fires.
    //   • Normal startup with token: loading is set false in .finally(), so by
    //     the time user is set, loading is already false — condition does not fire.
    //   • After this effect runs: loading is false, so the condition won't re-fire.
    useEffect(() => {
        if (user !== null && loading) {
            setLoading(false);
        }
    }, [user, loading]);

    return (
        <UserContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </UserContext.Provider>
    );
};

