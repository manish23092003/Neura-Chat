import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import LoadingSpinner from '../components/LoadingSpinner'

const UserAuth = ({ children }) => {
    const { user, loading } = useContext(UserContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login')
        }
    }, [user, loading, navigate])

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="text-slate-400 mt-4">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

export default UserAuth