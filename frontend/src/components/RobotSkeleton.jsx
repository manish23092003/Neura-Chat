import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

/**
 * RobotSkeleton — Elite 3D-Styled AI Robot Assistant
 * Re-designed with high-contrast metallic chassis, mechanical claws, 
 * bright exhaust nozzles, and glowing HUD elements.
 * Props:
 *   - state: 'idle' | 'typing' | 'thinking' | 'success' | 'error'
 *   - message: Custom string message to display in bubble
 *   - colorTheme: 'purple' | 'cyan' | 'green' | 'gold'
 */
const RobotSkeleton = ({ state = 'idle', message: customMessage = '', colorTheme = 'purple', showBubble = false, scale = 0.85 }) => {
    const [isActing, setIsActing] = useState(false)
    const [currentMove, setCurrentMove] = useState('idle') // idle, spin, jump, wave, shake
    const [bubbleMessage, setBubbleMessage] = useState('')
    const [isHovering, setIsHovering] = useState(false)

    // Dynamic theme colors definition
    const themes = {
        purple: {
            primary: '#2563EB',
            secondary: '#3B82F6',
            gaze: '#60A5FA',
            trimStart: '#60A5FA',
            trimEnd: '#1D4ED8',
            chassisStart: '#1E293B',
            chassisMid: '#0F172A',
            chassisEnd: '#020617'
        },
        cyan: {
            primary: '#06B6D4',
            secondary: '#22D3EE',
            gaze: '#67E8F9',
            trimStart: '#22D3EE',
            trimEnd: '#0891B2',
            chassisStart: '#083344',
            chassisMid: '#155E75',
            chassisEnd: '#021822'
        },
        green: {
            primary: '#10B981',
            secondary: '#34D399',
            gaze: '#6EE7B7',
            trimStart: '#34D399',
            trimEnd: '#047857',
            chassisStart: '#064E3B',
            chassisMid: '#065F46',
            chassisEnd: '#012014'
        },
        gold: {
            primary: '#F59E0B',
            secondary: '#FBBF24',
            gaze: '#FDE047',
            trimStart: '#FBBF24',
            trimEnd: '#B45309',
            chassisStart: '#78350F',
            chassisMid: '#92400E',
            chassisEnd: '#331401'
        }
    }

    const t = themes[colorTheme] || themes.purple

    // Sync state changes to animations & dialogue bubbles
    useEffect(() => {
        if (state === 'thinking') {
            setCurrentMove('spin')
            setBubbleMessage('Processing complex algorithms… ⚙️')
        } else if (state === 'success') {
            setCurrentMove('jump')
            setBubbleMessage('Systems active. Ready! 🚀')
            setTimeout(() => setBubbleMessage(''), 3000)
        } else if (state === 'error') {
            setCurrentMove('shake')
            setBubbleMessage('Critical warning! Check log output. ⚠️')
        } else if (state === 'typing') {
            setCurrentMove('idle')
            setBubbleMessage('AI drafting responses… ⌨️')
        } else {
            setCurrentMove('idle')
            setBubbleMessage(customMessage)
        }
    }, [state, customMessage])

    // Mouse tracking for perspective rotations
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const headRotateX = useTransform(mouseY, [-1, 1], [15, -15])
    const headRotateY = useTransform(mouseX, [-1, 1], [-22, 22])
    const eyeX = useTransform(mouseX, [-1, 1], [-8, 8])
    const eyeY = useTransform(mouseY, [-1, 1], [-4, 4])

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e
            const { innerWidth, innerHeight } = window
            const mkX = (clientX - innerWidth / 2) / (innerWidth / 2)
            const mkY = (clientY - innerHeight / 2) / (innerHeight / 2)
            mouseX.set(mkX)
            mouseY.set(mkY)
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    const triggerMove = () => {
        if (isActing || state !== 'idle') return
        setIsActing(true)
        const moves = ['spin', 'jump', 'wave', 'shake']
        const randomMove = moves[Math.floor(Math.random() * moves.length)]
        setCurrentMove(randomMove)

        let msg = ''
        if (randomMove === 'spin') msg = 'Scanning system logs… 🔄'
        else if (randomMove === 'jump') msg = 'Calibrating thruster injectors! 🚀'
        else if (randomMove === 'wave') msg = 'Greetings, operator! 👋'
        else if (randomMove === 'shake') msg = 'Performing diagnostics… ✔️'
        setBubbleMessage(msg)

        setTimeout(() => {
            setCurrentMove('idle')
            setIsActing(false)
            setBubbleMessage('')
        }, 1800)
    }

    // --- Kinetic Animation Timings ---
    const bodyVariants = {
        idle: { y: [0, -10, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
        jump: { y: [0, -60, 0], transition: { duration: 0.6, ease: 'easeOut' } },
        spin: { rotateY: [0, 360], transition: { duration: 1.2, ease: 'easeInOut' } },
        wave: { rotate: [0, 6, -6, 0], transition: { duration: 1.2 } },
        shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
    }

    const rightArmVariants = {
        idle: { rotate: [0, 20, -10, 0], y: [0, 3, 0], transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } },
        wave: { rotate: [0, -85, -50, -85, 0], y: -8, transition: { duration: 1.2 } },
        spin: { rotate: 0, y: 0 }
    }

    const leftArmVariants = {
        idle: { y: [0, -3, 3, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }
    }

    return (
        <div 
            className="relative group perspective-1000 select-none flex items-center justify-center animate-fade-in shrink-0" 
            style={{ 
                width: `${Math.round(250 * scale)}px`, 
                height: `${Math.round(310 * scale)}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'center center'
            }}
        >
            {/* Telemetry Bubble Message */}
            <AnimatePresence>
                {showBubble && bubbleMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute px-4 py-2 rounded-[14px] font-mono text-[11px] font-[600] z-50 text-center"
                        style={{
                            background: '#0B0A1A',
                            color: '#E0E7FF',
                            border: `1.5px solid ${t.primary}`,
                            boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 24px ${t.primary}40`,
                            backdropFilter: 'blur(16px)',
                            bottom: 'calc(100% + 12px)',
                            left: '50%',
                            x: '-50%',
                            width: '230px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                        }}
                    >
                        {bubbleMessage}
                        <div 
                            className="absolute -bottom-1.5 w-2.5 h-2.5"
                            style={{
                                background: '#0B0A1A',
                                borderRight: `1.5px solid ${t.primary}`,
                                borderBottom: `1.5px solid ${t.primary}`,
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Robot Core Structure */}
            <motion.div
                className="w-full h-full relative cursor-pointer flex flex-col items-center justify-start pt-6"
                onClick={triggerMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                animate={currentMove}
                variants={bodyVariants}
            >
                {/* --- DEFINED ROBOTIC HEAD --- */}
                <motion.div
                    className="w-32 h-24 relative z-30 flex items-center justify-center"
                    style={{
                        rotateX: headRotateX,
                        rotateY: headRotateY,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <svg className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Metallic Gradients Definition */}
                        <defs>
                            <linearGradient id="chassisGrad" x1="0" y1="0" x2="120" y2="90" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={t.chassisStart} />
                                <stop offset="50%" stopColor={t.chassisMid} />
                                <stop offset="100%" stopColor={t.chassisEnd} />
                            </linearGradient>
                            <linearGradient id="trimGrad" x1="0" y1="0" x2="0" y2="90" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={t.trimStart} />
                                <stop offset="100%" stopColor={t.trimEnd} />
                            </linearGradient>
                            <radialGradient id="visorCore" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#12102E" />
                                <stop offset="100%" stopColor="#050414" />
                            </radialGradient>
                        </defs>

                        {/* Ear Stabilizers */}
                        <rect x="4" y="32" width="6" height="24" rx="3" fill="url(#trimGrad)" stroke="#110E33" strokeWidth="1" />
                        <rect x="110" y="32" width="6" height="24" rx="3" fill="url(#trimGrad)" stroke="#110E33" strokeWidth="1" />

                        {/* Top mechanical antenna */}
                        <rect x="58.5" y="4" width="3" height="12" rx="1.5" fill="url(#trimGrad)" />
                        <circle cx="60" cy="4" r="3.5" fill={t.gaze} filter={`drop-shadow(0 0 4px ${t.primary})`} />

                        {/* Main Helmet Base (Aerodynamic design) */}
                        <path d="M14 42 C14 22, 106 22, 106 42 C106 62, 94 76, 60 76 C26 76, 14 62, 14 42 Z" fill="url(#chassisGrad)" stroke="url(#trimGrad)" strokeWidth="2.5" />
                        
                        {/* Upper shell bevel lines */}
                        <path d="M24 38 C32 28, 88 28, 96 38" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />

                        {/* Curved Glass Visor Screen */}
                        <path d="M22 44 C22 36, 98 36, 98 44 C98 56, 88 64, 60 64 C32 64, 22 56, 22 44 Z" fill="url(#visorCore)" stroke={t.primary} strokeWidth="1.5" />
                    </svg>

                    {/* Interactive Facial HUD inside Visor */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mt-2.5">
                        <div className="w-[72px] h-7 relative overflow-hidden flex items-center justify-center">
                            {/* Scanning HUD grid line */}
                            <motion.div 
                                className="absolute left-0 w-full h-[2px] opacity-60 z-10"
                                style={{
                                    background: state === 'error' ? '#EF4444' : t.gaze,
                                    boxShadow: state === 'error' ? '0 0 8px #EF4444' : `0 0 8px ${t.primary}`
                                }}
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Expression HUD */}
                            <motion.div 
                                className="flex items-center gap-3"
                                style={{ x: eyeX, y: eyeY }}
                            >
                                {state === 'error' && (
                                    <>
                                        <i className="ri-close-line text-[20px] text-red-500 font-bold drop-shadow-[0_0_6px_#ef4444]" />
                                        <i className="ri-close-line text-[20px] text-red-500 font-bold drop-shadow-[0_0_6px_#ef4444]" />
                                    </>
                                )}

                                {state === 'thinking' && (
                                    <i className="ri-loader-4-line text-[20px] text-blue-300 nc-spin drop-shadow-[0_0_6px_#60A5FA]" />
                                )}

                                {state === 'success' && (
                                    <>
                                        <span className="text-[16px] font-[800] text-emerald-400 leading-none drop-shadow-[0_0_8px_#10b981]">^</span>
                                        <span className="text-[16px] font-[800] text-emerald-400 leading-none drop-shadow-[0_0_8px_#10b981]">^</span>
                                    </>
                                )}

                                {(state === 'idle' || state === 'typing') && (
                                    <>
                                        <motion.div 
                                            className="w-2.5 h-2.5 rounded-[3px]" 
                                            style={{ background: t.gaze, boxShadow: `0 0 10px ${t.primary}` }}
                                            animate={{ scaleY: [1, 1, 0.1, 1] }}
                                            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.95, 0.97, 1] }}
                                        />
                                        <motion.div 
                                            className="w-2.5 h-2.5 rounded-[3px]" 
                                            style={{ background: t.gaze, boxShadow: `0 0 10px ${t.primary}` }}
                                            animate={{ scaleY: [1, 1, 0.1, 1] }}
                                            transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.95, 0.97, 1] }}
                                        />
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* --- NECK CONNECTION JOINT --- */}
                <div className="w-8 h-3.5 bg-[#0F0E26] border-x-2 border-b-2 border-[#4C1D95] rounded-b-md z-20 -mt-1 shadow-md" />

                {/* --- TORSO & ARMOR PLATING --- */}
                <div className="w-34 h-32 relative -mt-1 z-20">
                    <svg className="w-full h-full drop-shadow-[0_16px_32px_rgba(0,0,0,0.65)]" viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Torso casing (Aerodynamic shield contours) */}
                        <path d="M12 25 C12 12, 118 12, 118 25 C118 55, 108 90, 90 102 C72 108, 58 108, 40 102 C22 90, 12 55, 12 25 Z" fill="url(#chassisGrad)" stroke="url(#trimGrad)" strokeWidth="2.5" />
                        
                        {/* Armor Plate joint seams */}
                        <path d="M12 45 C40 38, 90 38, 118 45" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                        <path d="M65 40 L65 106" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

                        {/* Exhaust Cone nozzle base */}
                        <path d="M50 104 L80 104 L74 112 L56 112 Z" fill="#0A0914" stroke="url(#trimGrad)" strokeWidth="1.5" />
                    </svg>

                    {/* Glowing Core Reactor Panel (Floating in Torso Center) */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none -mt-3.5">
                        <div className="w-18 h-18 rounded-full flex items-center justify-center bg-black/70 border border-blue-900/50 shadow-inner">
                            {/* Outer Mechanical Aperture Blades */}
                            <motion.div 
                                className="absolute inset-0 rounded-full border border-dashed"
                                style={{ borderColor: state === 'error' ? '#EF4444' : t.primary, opacity: 0.4 }}
                                animate={{ rotate: -360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Inner Rotor */}
                            <motion.div
                                className="w-13 h-13 rounded-full flex items-center justify-center relative border border-blue-500/10"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                            >
                                <div 
                                    className="w-9 h-9 rounded-full flex items-center justify-center relative"
                                    style={{
                                        boxShadow: state === 'error' ? '0 0 20px rgba(239,68,68,0.7)' : `0 0 20px ${t.primary}70`
                                    }}
                                >
                                    <div 
                                        className="absolute inset-0 rounded-full opacity-40 blur-[2px] animate-pulse"
                                        style={{ background: state === 'error' ? '#EF4444' : t.primary }}
                                    />
                                    <div 
                                        className="w-5 h-5 rounded-full flex items-center justify-center" 
                                        style={{ 
                                            background: state === 'error' ? '#EF4444' : t.gaze,
                                            boxShadow: state === 'error' ? '0 0 10px #EF4444' : `0 0 10px ${t.primary}` 
                                        }} 
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full opacity-90" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* --- ARTICULATED CLAWS (Inductor mechanical limbs) --- */}
                {/* Left Arm Claws */}
                <motion.div
                    className="absolute left-[-22px] top-[120px] w-10 h-16 flex flex-col items-center justify-start z-10"
                    variants={leftArmVariants}
                    animate="idle"
                >
                    {/* Magnetic floating joint node */}
                    <div 
                        className="w-8 h-8 rounded-[12px] flex items-center justify-center shadow-lg"
                        style={{ 
                            background: 'linear-gradient(135deg, var(--nc-elevated) 0%, var(--nc-surface) 100%)',
                            border: `1.5px solid ${t.primary}50`
                        }}
                    >
                        <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.primary, boxShadow: `0 0 8px ${t.primary}` }} />
                    </div>
                    {/* Articulated claw pinchers */}
                    <svg className="w-6 h-8 -mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0 L12 12 M6 12 C6 18, 18 18, 18 12 C18 12, 18 24, 12 28 C6 24, 6 12, 6 12 Z" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2.5" fill={t.gaze} />
                    </svg>
                </motion.div>

                {/* Right Arm Claws */}
                <motion.div
                    className="absolute right-[-22px] top-[120px] w-10 h-16 flex flex-col items-center justify-start z-10"
                    variants={rightArmVariants}
                    animate={currentMove === 'wave' ? 'wave' : 'idle'}
                    style={{ transformOrigin: 'top center' }}
                >
                    {/* Magnetic floating joint node */}
                    <div 
                        className="w-8 h-8 rounded-[12px] flex items-center justify-center shadow-lg"
                        style={{ 
                            background: 'linear-gradient(135deg, var(--nc-elevated) 0%, var(--nc-surface) 100%)',
                            border: `1.5px solid ${t.primary}50`
                        }}
                    >
                        <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.primary, boxShadow: `0 0 8px ${t.primary}` }} />
                    </div>
                    {/* Articulated claw pinchers */}
                    <svg className="w-6 h-8 -mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0 L12 12 M6 12 C6 18, 18 18, 18 12 C18 12, 18 24, 12 28 C6 24, 6 12, 6 12 Z" stroke={t.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2.5" fill={t.gaze} />
                    </svg>
                </motion.div>

                {/* --- MAGNET LEVITATION STABILIZER RING --- */}
                <motion.div 
                    className="absolute bottom-[36px] w-24 h-5 rounded-full border-2 opacity-65 z-10"
                    style={{
                        borderColor: state === 'error' ? 'rgba(239,68,68,0.6)' : `${t.primary}60`,
                        boxShadow: state === 'error' ? '0 0 16px rgba(239,68,68,0.3)' : `0 0 16px ${t.primary}40`,
                        transform: 'rotateX(75deg)'
                    }}
                    animate={{
                        scale: [1, 1.15, 1],
                        y: [0, 2, 0]
                    }}
                    transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                {/* --- HIGH-ENERGY THRUSTER PLASMA FLAME --- */}
                <div className="absolute bottom-[6px] w-full flex flex-col items-center z-0">
                    {/* Flame Heat Aura */}
                    <motion.div 
                        className="w-12 h-14 rounded-b-full blur-[6px] absolute top-0 opacity-25"
                        style={{
                            background: state === 'error' ? '#EF4444' : t.primary
                        }}
                        animate={{
                            scaleY: [1.2, 1.9, 1.1, 1.6, 1.2],
                        }}
                        transition={{
                            duration: 0.75, repeat: Infinity, ease: 'easeInOut'
                        }}
                    />

                    {/* Primary Thruster Flame */}
                    <motion.div 
                        className="w-6 h-10 rounded-b-full blur-[1px]"
                        style={{
                            background: state === 'error' 
                                ? 'linear-gradient(180deg, rgba(239,68,68,0.9) 0%, rgba(239,68,68,0) 100%)' 
                                : `linear-gradient(180deg, ${t.primary}e0 0%, ${t.primary}00 100%)`
                        }}
                        animate={{
                            scaleY: [1, 1.5, 0.85, 1.3, 1],
                            opacity: [0.85, 1, 0.75, 0.95, 0.85]
                        }}
                        transition={{
                            duration: 0.75, repeat: Infinity, ease: 'easeInOut'
                        }}
                    />

                    {/* Core hot spark flare */}
                    <motion.div 
                        className="w-3.5 h-3.5 rounded-full blur-[2px] -mt-2"
                        style={{
                            background: '#FFFFFF',
                            boxShadow: state === 'error' ? '0 0 12px #EF4444' : `0 0 12px ${t.secondary}`
                        }}
                        animate={{
                            y: [0, 11, 4, 13, 0],
                            opacity: [0.7, 0.95, 0.45, 0, 0.7]
                        }}
                        transition={{
                            duration: 1.1, repeat: Infinity, ease: 'easeOut'
                        }}
                    />
                </div>
            </motion.div>
        </div>
    )
}

export default RobotSkeleton
