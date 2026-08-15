import React from 'react'
import { Link } from 'react-router-dom'
import NeuraLogo from './ui/NeuraLogo'

const Footer = () => {
    return (
        <footer className="glass-strong border-t border-white/10 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <NeuraLogo size={36} showText animated />
                        </div>
                        <p className="text-slate-400 mb-4 max-w-md">
                            AI-powered collaborative development platform. Build better software together with intelligent code collaboration.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">
                                <i className="ri-twitter-fill text-xl"></i>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">
                                <i className="ri-github-fill text-xl"></i>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">
                                <i className="ri-linkedin-fill text-xl"></i>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-blue-500 transition-colors">
                                <i className="ri-discord-fill text-xl"></i>
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#faq" className="text-slate-400 hover:text-white transition-colors">
                                    FAQ
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    API
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-sm">
                        © 2025 NeuraChat. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                            Terms of Service
                        </a>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                            Cookie Policy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
