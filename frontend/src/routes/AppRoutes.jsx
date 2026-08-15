import React, { Suspense, lazy } from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import SuspenseFallback from '../components/SuspenseFallback'
import UserAuth from '../auth/UserAuth'
import ErrorBoundary from '../components/ErrorBoundary'

// Lazy load all screen components to enable code splitting.
// Each screen is loaded on-demand when the user navigates to that route.
const Landing   = lazy(() => import('../screens/Landing'))
const Login     = lazy(() => import('../screens/Login'))
const Register  = lazy(() => import('../screens/Register'))
const Home      = lazy(() => import('../screens/Home'))
const Project   = lazy(() => import('../screens/Project'))
const Profile   = lazy(() => import('../screens/Profile'))
const JoinProject = lazy(() => import('../screens/JoinProject'))

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                    <Route path="/"         element={<Landing />} />
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home"     element={<UserAuth><Home /></UserAuth>} />
                    <Route path="/project"  element={<UserAuth><ErrorBoundary><Project /></ErrorBoundary></UserAuth>} />
                    <Route path="/profile"  element={<UserAuth><Profile /></UserAuth>} />
                    <Route path="/invite/:token" element={<JoinProject />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}

export default AppRoutes