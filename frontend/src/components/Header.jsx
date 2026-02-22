import React, { useContext, useState, useRef, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'

const Header = () => {
    const { user, setUser } = useContext(UserContext)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        localStorage.removeItem('token')
        setUser(null)
        navigate('/login')
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Get user initials
    const getInitials = (email) => {
        if (!email) return 'U'
        return email.charAt(0).toUpperCase()
    }

    // Get page title based on route
    const getPageTitle = () => {
        if (location.pathname === '/') return 'NeuraChat'
        if (location.pathname === '/project') return 'Project Workspace'
        return 'NeuraChat'
    }

    return (
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
                                <i className="ri-code-s-slash-line text-white text-xl"></i>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{getPageTitle()}</h1>
                            </div>
                        </div>
                    </div>

                    {/* User Menu */}
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                                    {getInitials(user.email)}
                                </div>
                                <span className="text-slate-300 hidden md:block">{user.email}</span>
                                <i className={`ri-arrow-down-s-line text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 glass-strong rounded-lg shadow-xl border border-white/10 overflow-hidden scale-in">
                                    <div className="p-3 border-b border-white/10">
                                        <p className="text-sm text-slate-400">Signed in as</p>
                                        <p className="text-white font-medium truncate">{user.email}</p>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                navigate('/')
                                                setIsDropdownOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                        >
                                            <i className="ri-dashboard-line"></i>
                                            <span>Dashboard</span>
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <i className="ri-logout-box-line"></i>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
