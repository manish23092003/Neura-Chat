// AI-Powered Email Validation Utility
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        return { isValid: false, message: '', suggestion: null };
    }

    // Basic format validation
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Invalid email format', suggestion: null };
    }

    // Common typo detection
    const commonTypos = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmil.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'outlok.com': 'outlook.com',
        'outloo.com': 'outlook.com',
        'hotmial.com': 'hotmail.com',
        'hotmal.com': 'hotmail.com',
        'iclou.com': 'icloud.com',
        'icoud.com': 'icloud.com',
    };

    const domain = email.split('@')[1];
    const suggestedDomain = commonTypos[domain];

    if (suggestedDomain) {
        const suggestedEmail = email.replace(domain, suggestedDomain);
        return {
            isValid: true,
            message: 'Did you mean this email?',
            suggestion: suggestedEmail
        };
    }

    // Popular email providers
    const popularDomains = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
        'icloud.com', 'protonmail.com', 'aol.com', 'mail.com'
    ];

    const isPopularDomain = popularDomains.includes(domain);

    return {
        isValid: true,
        message: isPopularDomain ? '' : 'Unusual email domain',
        suggestion: null,
        warning: !isPopularDomain
    };
};

// Email suggestion component data
export const getEmailSuggestion = (email) => {
    const validation = validateEmail(email);
    return validation.suggestion;
};
