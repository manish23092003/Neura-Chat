import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
    const ref = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Create smooth springs for the rotation values
    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    // Map mouse position to rotation degrees
    // We want the card to rotate visually towards the mouse
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        // Calculate mouse position relative to the center of the card
        // Range: -0.5 to 0.5
        const mouseXRelative = (e.clientX - rect.left) / width - 0.5;
        const mouseYRelative = (e.clientY - rect.top) / height - 0.5;

        x.set(mouseXRelative);
        y.set(mouseYRelative);
    };

    const handleMouseLeave = () => {
        // Reset to center on leave
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: "1000px",
            }}
            className="h-full"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="glass p-6 rounded-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-shadow h-full flex flex-col items-start border border-white/10"
            >
                {/* Floating Icon */}
                <motion.div
                    style={{ transform: "translateZ(50px)" }}
                    className="w-12 h-12 rounded-lg bg-[var(--nc-primary)] flex items-center justify-center mb-4 shadow-lg"
                >
                    <i className={`${icon} text-white text-2xl`}></i>
                </motion.div>

                {/* Floating Text */}
                <motion.h3
                    style={{ transform: "translateZ(30px)" }}
                    className="text-xl font-semibold text-white mb-2"
                >
                    {title}
                </motion.h3>

                <motion.p
                    style={{ transform: "translateZ(20px)" }}
                    className="text-slate-400"
                >
                    {description}
                </motion.p>

                {/* Shine Effect */}
                <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ transform: "translateZ(1px)" }}
                />
            </motion.div>
        </motion.div>
    )
}

export default FeatureCard
