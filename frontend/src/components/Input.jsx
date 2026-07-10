import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    helperText,
    icon,
    className = '',
    required = false,
    disabled = false,
    success = false,
    loading = false,
    floatingLabel = false,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const hasValue = value && value.length > 0

    return (
        <div className={`w-full ${className}`}>
            {label && !floatingLabel && (
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {floatingLabel ? (
                    <div className="floating-label-container">
                        <input
                            type={inputType}
                            value={value}
                            onChange={onChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder=" "
                            disabled={disabled}
                            className={`
                                floating-input input-focus-glow
                                ${isPassword ? 'pr-10' : ''} 
                                ${success ? 'pr-10' : ''}
                                ${error ? 'border-red-500 focus:border-red-500 shake' : ''}
                                ${success ? 'border-green-500 focus:border-green-500' : ''}
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            {...props}
                        />
                        <label className="floating-label">
                            {label}
                            {required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                    </div>
                ) : (
                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`
                            input input-focus-glow
                            w-full 
                            ${isPassword || success || loading ? 'pr-10' : ''} 
                            ${error ? 'border-red-500 focus:border-red-500 shake' : ''}
                            ${success ? 'border-green-500 focus:border-green-500' : ''}
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        {...props}
                    />
                )}

                {/* Success Icon */}
                {success && !loading && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400"
                    >
                        <i className="ri-check-line text-xl"></i>
                    </motion.div>
                )}

                {/* Loading Icon */}
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                        <i className="ri-loader-4-line animate-spin"></i>
                    </div>
                )}

                {/* Password Toggle */}
                {isPassword && !loading && (
                    <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <i className={`ri-eye${showPassword ? '-off' : ''}-line`}></i>
                    </motion.button>
                )}

                {/* Focus Ring Animation */}
                <AnimatePresence>
                    {isFocused && !error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                                boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1), 0 0 20px rgba(139, 92, 246, 0.2)'
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 text-sm text-red-400 flex items-center gap-1"
                    >
                        <i className="ri-error-warning-line"></i>
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Helper Text */}
            {helperText && !error && (
                <p className="mt-2 text-sm text-slate-400">{helperText}</p>
            )}
        </div>
    )
}

export default Input
