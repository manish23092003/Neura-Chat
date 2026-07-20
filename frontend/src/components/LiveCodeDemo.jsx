import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LiveCodeDemo = () => {
    const [code, setCode] = useState('');
    const [step, setStep] = useState(0);

    const fullCode = `const UserProfile = ({ user }) => {
  return (
    <div className="profile-card">
      <img src={user.avatar} alt="Avatar" />
      <h3>{user.name}</h3>
      <p>{user.role}</p>
      {/* AI: Suggest adding status indicator */}
      <StatusBadge status={user.status} />
    </div>
  );
};`;

    useEffect(() => {
        if (step < fullCode.length) {
            const timeout = setTimeout(() => {
                setCode(prev => prev + fullCode[step]);
                setStep(prev => prev + 1);
            }, 50); // Typing speed
            return () => clearTimeout(timeout);
        }
    }, [step, fullCode]);

    return (
        <div className="w-full max-w-3xl mx-auto bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-slate-700">
            {/* Window Header */}
            <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-black/20">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 text-xs text-slate-400 font-mono">UserProfile.jsx — NeuraChat</div>
            </div>

            {/* Code Area */}
            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto min-h-[300px]">
                <pre>
                    <code className="language-jsx text-slate-300">
                        {code.split('\n').map((line, i) => (
                            <div key={i} className="table-row">
                                <span className="table-cell text-slate-600 select-none pr-4 text-right w-8">{i + 1}</span>
                                <span className="table-cell">
                                    <SyntaxHighlight line={line} />
                                </span>
                            </div>
                        ))}
                    </code>
                </pre>
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2 h-5 bg-blue-400 ml-1 align-middle"
                />
            </div>
        </div>
    );
};

// Simple syntax highlighter component
const SyntaxHighlight = ({ line }) => {
    const parts = line.split(/(\s+|[{}()<>/"'=])/g);

    return parts.map((part, index) => {
        let color = 'text-slate-300';

        if (['const', 'return', 'import', 'export', 'default', 'function'].includes(part)) color = 'text-blue-500';
        else if (['UserProfile', 'div', 'img', 'h3', 'p', 'StatusBadge'].includes(part)) color = 'text-yellow-300';
        else if (['className', 'src', 'alt', 'status'].includes(part)) color = 'text-blue-300';
        else if (part.startsWith('"') || part.startsWith("'")) color = 'text-green-300';
        else if (part.includes('//')) return <span key={index} className="text-slate-500 italic">{part}</span>;
        else if (['{', '}', '(', ')', '<', '>', '/', '='].includes(part)) color = 'text-slate-400';

        return <span key={index} className={color}>{part}</span>;
    });
};

export default LiveCodeDemo;
