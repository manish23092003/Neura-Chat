import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/Button'

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <i className="ri-code-s-slash-line text-white text-xl"></i>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            NeuraChat
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="secondary" className="!bg-transparent hover:!bg-white/10 border border-white/10">
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="primary" className="shadow-lg shadow-purple-500/25">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                                ✨ The Future of Collaboration
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                                Where Ideas Meet <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                                    Intelligence
                                </span>
                            </h1>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Experience seamless project management powered by AI.
                                Real-time chat, intelligent insights, and effortless collaboration in one unified workspace.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/register">
                                    <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                                        Start Building Free
                                        <i className="ri-arrow-right-line"></i>
                                    </button>
                                </Link>
                                <Link to="/login">
                                    <button className="px-8 py-4 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 hover:-translate-y-1 transition-all duration-300 border border-slate-700">
                                        View Demo
                                    </button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Hero Image/Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mt-20 relative"
                        >
                            <div className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden glass-strong p-2">
                                <div className="rounded-xl bg-slate-950 aspect-video relative overflow-hidden group flex flex-col">
                                    {/* Mock Editor Header */}
                                    <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-slate-900/50">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <div className="ml-4 px-3 py-1 rounded-t-lg bg-slate-800 text-xs text-slate-400 font-mono border-t border-x border-white/5 relative top-1.5">
                                            App.jsx
                                        </div>
                                    </div>

                                    {/* Mock Code Content */}
                                    <div className="flex-1 p-4 font-mono text-sm overflow-hidden text-left relative">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-slate-600 text-right select-none flex flex-col gap-1">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <span key={i}>{i + 1}</span>
                                                ))}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-purple-400">import <span className="text-cyan-400">React</span> from <span className="text-green-400">'react'</span></div>
                                                <div className="text-purple-400">import <span className="text-cyan-400">{`{ useState }`}</span> from <span className="text-green-400">'react'</span></div>
                                                <br />
                                                <div><span className="text-purple-400">const</span> <span className="text-yellow-400">App</span> = () <span className="text-purple-400">=&gt;</span> {'{'}</div>
                                                <div className="pl-4"><span className="text-purple-400">const</span> [<span className="text-cyan-400">count</span>, <span className="text-cyan-400">setCount</span>] = <span className="text-blue-400">useState</span>(<span className="text-orange-400">0</span>)</div>
                                                <br />
                                                <div className="pl-4"><span className="text-purple-400">return</span> (</div>
                                                <div className="pl-8">&lt;<span className="text-cyan-400">div</span> <span className="text-blue-400">className</span>=<span className="text-green-400">"app"</span>&gt;</div>
                                                <div className="pl-12">&lt;<span className="text-cyan-400">h1</span>&gt;Hello NeuraChat! &lt;/<span className="text-cyan-400">h1</span>&gt;</div>
                                                <div className="pl-12 text-slate-500">{'/* AI generated optimization */'}</div>
                                                <div className="pl-8">&lt;/<span className="text-cyan-400">div</span>&gt;</div>
                                                <div className="pl-4">)</div>
                                                <div>{'}'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-slate-900/50 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to ship faster</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Powerful features designed for modern development teams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className={`${feature.icon} text-2xl text-white`}></i>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="rounded-3xl bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/20 p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your workflow?</h2>
                            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                                Join thousands of developers using NeuraChat to build the future.
                            </p>
                            <Link
                                to="/register"
                                className="inline-block px-10 py-4 rounded-xl bg-white text-purple-900 font-bold hover:bg-purple-50 transition-colors shadow-xl shadow-purple-900/20"
                            >
                                Get Started For Free
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10 text-slate-400 text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <i className="ri-code-s-slash-line text-purple-500 text-lg"></i>
                        <span className="font-semibold text-slate-200">NeuraChat</span>
                        <span>© 2024</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Contact</a>
                    </div>
                    <div className="flex gap-4">
                        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all">
                            <i className="ri-twitter-x-line"></i>
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all">
                            <i className="ri-github-line"></i>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

const features = [
    {
        title: "Real-time Collaboration",
        description: "Chat, share files, and manage tasks with your team in real-time. No delays, just seamless syncing.",
        icon: "ri-chat-smile-3-line",
        gradient: "from-purple-500 to-indigo-500"
    },
    {
        title: "AI-Powered Assistant",
        description: "Get smart suggestions, automate repetitive tasks, and code smarter with our built-in AI companion.",
        icon: "ri-brain-line",
        gradient: "from-cyan-500 to-blue-500"
    },
    {
        title: "Project Management",
        description: "Organize tasks, track progress, and manage resources with our intuitive kanban and list views.",
        icon: "ri-kanban-view",
        gradient: "from-pink-500 to-rose-500"
    }
]

export default Landing
