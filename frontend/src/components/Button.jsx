import React from 'react'
import LoadingSpinner from './LoadingSpinner'

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon = null,
    onClick,
    type = 'button',
    className = ''
}) => {
    const baseClasses = 'btn font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
        primary: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-purple-500/50',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-white shadow-md',
        outline: 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white hover:border-purple-500',
        ghost: 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md'
    }

    const sizeClasses = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg'
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {loading ? (
                <>
                    <LoadingSpinner size="small" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    )
}

export default Button
