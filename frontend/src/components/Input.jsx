import React, { useState } from 'react'

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
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`input w-full ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500' : ''
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                        <i className={`ri-eye${showPassword ? '-off' : ''}-line`}></i>
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="mt-1 text-sm text-slate-400">{helperText}</p>
            )}
        </div>
    )
}

export default Input
