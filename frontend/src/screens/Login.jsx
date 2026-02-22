import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import Input from '../components/Input'
import Button from '../components/Button'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()

        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            toast.success('Welcome back!')
            navigate('/dashboard')
        }).catch((err) => {
            console.log(err.response?.data)
            toast.error(err.response?.data?.message || 'Login failed. Please try again.')
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center animated-gradient p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-strong p-8 rounded-2xl shadow-2xl w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg">
                        <i className="ri-code-s-slash-line text-white text-3xl"></i>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h2>
                <p className="text-slate-300 text-center mb-8">Sign in to continue to NeuraChat</p>

                <form onSubmit={submitHandler} className="space-y-5">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        icon={<i className="ri-mail-line"></i>}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        icon={<i className="ri-lock-line"></i>}
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        loading={loading}
                    >
                        <i className="ri-login-box-line"></i>
                        Sign In
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -z-10"></div>
            </motion.div>
        </div>
    )
}

export default Login