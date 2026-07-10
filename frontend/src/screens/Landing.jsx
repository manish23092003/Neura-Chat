import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FeatureCard from '../components/FeatureCard'
import RobotSkeleton from '../components/RobotSkeleton'
import LiveCodeDemo from '../components/LiveCodeDemo'
import CodeRainBackground from '../components/CodeRainBackground'

const Landing = () => {
    const [robotState, setRobotState] = useState('idle')
    const [robotMsg, setRobotMsg] = useState('Click a command below to control my behaviors!')
    const [robotColor, setRobotColor] = useState('purple')

    const triggerAction = (actionType) => {
        setRobotState(actionType)
        if (actionType === 'thinking') {
            setRobotMsg('Scanning landing page… All modules running at peak capacity! ⚡')
        } else if (actionType === 'success') {
            setRobotMsg('Welcome to NeuraChat! High-five, developer! 🚀')
        } else if (actionType === 'error') {
            setRobotMsg('Self-destruct sequence initialized! Just joking, system stable. 🤖')
        } else {
            setRobotMsg("Hello! Let's build the future of collaborative code together. 👋")
        }
        setTimeout(() => {
            setRobotState('idle')
        }, 3000)
    }

    const features = [
        {
            icon: 'ri-team-line',
            title: 'Real-time Collaboration',
            description: 'Work together seamlessly with your team in real-time. See changes instantly and collaborate effortlessly.'
        },
        {
            icon: 'ri-robot-line',
            title: 'AI Code Assistant',
            description: 'Get intelligent code suggestions and automated assistance powered by advanced AI technology.'
        },
        {
            icon: 'ri-folder-line',
            title: 'Project Management',
            description: 'Organize your projects efficiently with intuitive tools and streamlined workflows.'
        },
        {
            icon: 'ri-shield-check-line',
            title: 'Secure & Private',
            description: 'Enterprise-grade security with end-to-end encryption to keep your code safe and private.'
        },
        {
            icon: 'ri-file-upload-line',
            title: 'File Sharing',
            description: 'Share files instantly with your team. Support for images, documents, and code files.'
        },
        {
            icon: 'ri-message-3-line',
            title: 'Built-in Chat',
            description: 'Communicate with your team without leaving the platform. Integrated messaging for seamless collaboration.'
        }
    ]

    const steps = [
        {
            number: '01',
            title: 'Create Account',
            description: 'Sign up in seconds with email or social login. No credit card required.'
        },
        {
            number: '02',
            title: 'Create Project',
            description: 'Start your first project and set up your workspace in minutes.'
        },
        {
            number: '03',
            title: 'Invite Team',
            description: 'Add team members and start collaborating together instantly.'
        },
        {
            number: '04',
            title: 'Build Together',
            description: 'Code, chat, and ship faster with AI-powered collaboration tools.'
        }
    ]

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Senior Developer',
            company: 'TechCorp',
            avatar: 'SJ',
            content: 'NeuraChat has transformed how our team collaborates. The AI assistant is incredibly helpful and saves us hours every day.',
            rating: 5
        },
        {
            name: 'Michael Chen',
            role: 'CTO',
            company: 'StartupXYZ',
            avatar: 'MC',
            content: 'Best collaboration platform we\'ve used. The real-time features and file sharing make remote work seamless.',
            rating: 5
        },
        {
            name: 'Emily Rodriguez',
            role: 'Product Manager',
            company: 'InnovateLabs',
            avatar: 'ER',
            content: 'The project management tools are intuitive and powerful. Our team productivity has increased by 40%.',
            rating: 5
        }
    ]

    return (
        <div className="min-h-screen relative galaxy-bg">
            <Navbar />

            {/* Background Layers */}
            <div className="fixed inset-0 z-0 pointer-events-none" />
            <CodeRainBackground />

            {/* Content Layer */}
            <div className="relative z-10">

                {/* Hero Section */}
                <section 
                    className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[1.05] mb-6">
                                    AI-Powered
                                    <br />
                                    <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                                        Collaborative Development
                                    </span>
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto"
                            >
                                Build better software together with intelligent code collaboration,
                                real-time messaging, and AI-powered assistance.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                            >
                                <Link
                                    to="/register"
                                    className="nc-btn nc-btn-primary px-8 py-4 text-base font-bold transition-all shadow-md active:scale-95"
                                    style={{ height: 'auto' }}
                                >
                                    Get Started Free
                                </Link>
                                <a
                                    href="#features"
                                    className="nc-btn nc-btn-secondary px-8 py-4 text-base font-semibold transition-all active:scale-95"
                                    style={{ height: 'auto' }}
                                >
                                    Learn More
                                </a>
                            </motion.div>

                            {/* Robot Skeleton - Interactive */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="mt-12 mb-2 flex justify-center"
                            >
                                <div className="scale-125 md:scale-[1.45] origin-center py-6">
                                    <RobotSkeleton state={robotState} message={robotMsg} colorTheme={robotColor} />
                                </div>
                            </motion.div>

                            {/* Interactive Control Console */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                                className="mt-6 max-w-lg mx-auto p-5 rounded-[22px] text-center relative overflow-hidden"
                                style={{
                                    background: 'rgba(9, 9, 15, 0.75)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(20px)'
                                }}
                            >
                                <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 opacity-60" />
                                
                                <h4 className="text-[10px] font-[700] uppercase tracking-[0.2em] text-slate-400 mb-3.5">AI DRONE CONTROL PANEL</h4>
                                
                                {/* Quick Trigger Command Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    <button 
                                        onClick={() => triggerAction('typing')}
                                        className="py-2.5 px-3 bg-[#111119] hover:bg-[#161622] border border-[#27273F] hover:border-purple-500/50 text-[10px] font-[700] rounded-xl text-slate-300 hover:text-white transition-all font-mono active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <i className="ri-hand-line mr-1 text-purple-400" /> Wave Hello
                                    </button>
                                    <button 
                                        onClick={() => triggerAction('thinking')}
                                        className="py-2.5 px-3 bg-[#111119] hover:bg-[#161622] border border-[#27273F] hover:border-purple-500/50 text-[10px] font-[700] rounded-xl text-slate-300 hover:text-white transition-all font-mono active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <i className="ri-radar-line mr-1 text-purple-400" /> Run Scan
                                    </button>
                                    <button 
                                        onClick={() => triggerAction('error')}
                                        className="py-2.5 px-3 bg-[#111119] hover:bg-[#161622] border border-[#27273F] hover:border-purple-500/50 text-[10px] font-[700] rounded-xl text-slate-300 hover:text-white transition-all font-mono active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <i className="ri-fire-line mr-1 text-purple-400" /> Overload
                                    </button>
                                    <button 
                                        onClick={() => triggerAction('success')}
                                        className="py-2.5 px-3 bg-[#111119] hover:bg-[#161622] border border-[#27273F] hover:border-purple-500/50 text-[10px] font-[700] rounded-xl text-slate-300 hover:text-white transition-all font-mono active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <i className="ri-rocket-line mr-1 text-purple-400" /> Launch
                                    </button>
                                </div>

                                {/* Live Color Customization */}
                                <div className="flex items-center justify-center gap-3 pt-3.5 border-t border-white/5">
                                    <span className="text-[9px] uppercase font-[700] tracking-[0.15em] text-slate-500">ACCENT SPECTRAL:</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setRobotColor('purple')}
                                            className={`w-5 h-5 rounded-full bg-purple-600 border-2 transition-transform cursor-pointer shadow-[0_0_8px_rgba(139,92,246,0.5)] ${robotColor === 'purple' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            title="Purple LED"
                                        />
                                        <button 
                                            onClick={() => setRobotColor('cyan')}
                                            className={`w-5 h-5 rounded-full bg-cyan-500 border-2 transition-transform cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.5)] ${robotColor === 'cyan' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            title="Cyan LED"
                                        />
                                        <button 
                                            onClick={() => setRobotColor('green')}
                                            className={`w-5 h-5 rounded-full bg-emerald-500 border-2 transition-transform cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.5)] ${robotColor === 'green' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            title="Green LED"
                                        />
                                        <button 
                                            onClick={() => setRobotColor('gold')}
                                            className={`w-5 h-5 rounded-full bg-amber-500 border-2 transition-transform cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.5)] ${robotColor === 'gold' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                            title="Gold LED"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Live Demo Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/40 backdrop-blur-sm border-y border-purple-500/10">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 glow-text">
                                See NeuraChat in Action
                            </h2>
                            <p className="text-lg text-purple-200/80 max-w-2xl mx-auto">
                                Experience intelligent code completion and real-time collaboration.
                            </p>
                        </motion.div>

                        <div className="flex justify-center transform hover:scale-[1.02] transition-transform duration-500 shadow-[0_0_40px_rgba(139,92,246,0.3)] rounded-2xl">
                            <LiveCodeDemo />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Powerful Features
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Everything you need to build, collaborate, and ship faster
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                    delay={index * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                How It Works
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Get started in minutes with our simple 4-step process
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center galaxy-glass p-8 rounded-2xl hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.8)] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6">
                                        {step.number}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-400">
                                        {step.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Loved by Developers
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                See what our users have to say about NeuraChat
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass p-6 rounded-xl"
                                >
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <i key={i} className="ri-star-fill text-yellow-400"></i>
                                        ))}
                                    </div>
                                    <p className="text-slate-300 mb-6">"{testimonial.content}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-semibold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">
                                                {testimonial.name}
                                            </div>
                                            <div className="text-slate-400 text-sm">
                                                {testimonial.role} at {testimonial.company}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="glass-strong p-12 rounded-2xl text-center"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-xl text-slate-300 mb-8">
                                Join thousands of developers building better software together
                            </p>
                            <Link
                                to="/register"
                                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105"
                            >
                                Start Free Trial
                            </Link>
                            <p className="text-slate-400 text-sm mt-4">
                                No credit card required • Free forever plan available
                            </p>
                        </motion.div>
                    </div>
                </section>

                <Footer />
            </div>
        </div >
    )
}

export default Landing
