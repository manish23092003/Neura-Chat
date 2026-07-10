import React, { useEffect, useRef } from 'react';

const CodeRainBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // thorough resize handling
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Configuration
        const fontSize = 16;
        const characters = '0123456789ABCDEF<>/{}[]*&^%$#@!abcdef';
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);

        // Colors from the theme (Professional Tech: Violet, Blue, Cyan)
        const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#6366f1', '#a855f7'];

        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Pure black with low opacity
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Randomly select a color from our theme palette
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;

                // Random character
                const text = characters.charAt(Math.floor(Math.random() * characters.length));

                // Draw the character
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop or move it down
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 33); // ~30fps

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
};

export default CodeRainBackground;
