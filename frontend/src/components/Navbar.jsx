import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <nav className="fixed top-0 left-0 right-0 z-[9999] border-b border-white/10 backdrop-blur-md bg-[#13131a]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group text-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow">
                            <i className="ri-focus-3-line text-white text-2xl"></i>
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 leading-none -mb-1 tracking-tight">Neura</span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-[0.3em] leading-none mt-1">CHAT</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
                            How It Works
                        </a>
                        <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors">
                            Testimonials
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-slate-300 hover:text-white transition-colors font-medium"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/40 transition-all hover:scale-105"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2"
                    >
                        <i className={`text-2xl ${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden glass-strong border-t border-white/10"
                >
                    <div className="px-4 py-4 space-y-3">
                        <a
                            href="#features"
                            className="block text-slate-300 hover:text-white transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="block text-slate-300 hover:text-white transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            How It Works
                        </a>
                        <a
                            href="#testimonials"
                            className="block text-slate-300 hover:text-white transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Testimonials
                        </a>
                        <div className="pt-4 space-y-2">
                            <Link
                                to="/login"
                                className="block text-center py-2 text-slate-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="block text-center px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-semibold"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </nav>
    )
}

export default Navbar
