import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import Input from '../components/Input'
import Button from '../components/Button'

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    // Password strength calculation
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, label: '', color: '' }

        let strength = 0
        if (pwd.length >= 8) strength++
        if (pwd.length >= 12) strength++
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
        if (/\d/.test(pwd)) strength++
        if (/[^a-zA-Z\d]/.test(pwd)) strength++

        const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
        const colors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400']

        return {
            strength,
            label: labels[strength - 1] || 'Weak',
            color: colors[strength - 1] || 'text-red-400',
            percentage: (strength / 5) * 100
        }
    }

    const passwordStrength = getPasswordStrength(password)

    function submitHandler(e) {
        e.preventDefault()

        if (!email || !password || !confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            toast.success('Account created! Please log in.')
            navigate('/login')
        }).catch((err) => {
            console.log(err.response?.data)
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
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

                <h2 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h2>
                <p className="text-slate-300 text-center mb-8">Join NeuraChat and start collaborating</p>

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

                    <div>
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            icon={<i className="ri-lock-line"></i>}
                            required
                        />

                        {/* Password Strength Indicator */}
                        {password && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-400">Password Strength</span>
                                    <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${passwordStrength.percentage}%` }}
                                        className={`h-full ${passwordStrength.strength <= 1 ? 'bg-red-500' :
                                            passwordStrength.strength === 2 ? 'bg-orange-500' :
                                                passwordStrength.strength === 3 ? 'bg-yellow-500' :
                                                    passwordStrength.strength === 4 ? 'bg-green-500' :
                                                        'bg-emerald-500'
                                            }`}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        icon={<i className="ri-lock-line"></i>}
                        error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                        required
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        loading={loading}
                    >
                        <i className="ri-user-add-line"></i>
                        Create Account
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            Sign in
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

export default Register