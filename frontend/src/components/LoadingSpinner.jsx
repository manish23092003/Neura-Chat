import React from 'react'

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }

  return (
    <div className={`inline-block ${sizeClasses[size]} border-t-transparent border-purple-500 rounded-full spin ${className}`}></div>
  )
}

export default LoadingSpinner
