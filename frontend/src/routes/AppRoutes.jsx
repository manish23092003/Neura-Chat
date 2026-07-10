import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Landing from '../screens/Landing'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import Profile from '../screens/Profile'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => {
    return (
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<UserAuth><Home /></UserAuth>} />
                <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                <Route path="/profile" element={<UserAuth><Profile /></UserAuth>} />
            </Routes>

        </BrowserRouter>
    )
}

export default AppRoutes