// AI-Powered Password Analysis Utility

// Common weak passwords database (subset)
const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

// Calculate password entropy
const calculateEntropy = (password) => {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    return password.length * Math.log2(charsetSize);
};

// Analyze password strength
export const analyzePassword = (password) => {
    if (!password) {
        return {
            score: 0,
            strength: 'None',
            color: 'gray',
            percentage: 0,
            feedback: [],
            requirements: getRequirements(password),
            entropy: 0,
            isCommon: false,
            estimatedCrackTime: '0 seconds'
        };
    }

    let score = 0;
    const feedback = [];
    const requirements = getRequirements(password);

    // Check length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Check character variety
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add both uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
        score += 1;
    } else {
        feedback.push('Include at least one number');
    }

    if (/[^a-zA-Z\d]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add special characters (!@#$%^&*)');
    }

    // Check for common passwords
    const isCommon = commonPasswords.includes(password.toLowerCase());
    if (isCommon) {
        score = Math.max(0, score - 3);
        feedback.push('⚠️ This is a commonly used password');
    }

    // Check for patterns
    if (/(.)\1{2,}/.test(password)) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid repeating characters');
    }

    if (/^[0-9]+$/.test(password)) {
        score = Math.max(0, score - 2);
        feedback.push('Don\'t use only numbers');
    }

    if (/^[a-zA-Z]+$/.test(password)) {
        score = Math.max(0, score - 1);
        feedback.push('Mix letters with numbers and symbols');
    }

    // Calculate entropy
    const entropy = calculateEntropy(password);

    // Estimate crack time
    const estimatedCrackTime = estimateCrackTime(entropy);

    // Determine strength level
    const strengthLevels = [
        { min: 0, max: 2, label: 'Weak', color: 'red' },
        { min: 3, max: 3, label: 'Fair', color: 'orange' },
        { min: 4, max: 4, label: 'Good', color: 'yellow' },
        { min: 5, max: 5, label: 'Strong', color: 'green' },
        { min: 6, max: 10, label: 'Very Strong', color: 'emerald' }
    ];

    const strengthLevel = strengthLevels.find(level => score >= level.min && score <= level.max) || strengthLevels[0];

    return {
        score,
        strength: strengthLevel.label,
        color: strengthLevel.color,
        percentage: Math.min((score / 6) * 100, 100),
        feedback: feedback.slice(0, 3), // Limit to 3 suggestions
        requirements,
        entropy: Math.round(entropy),
        isCommon,
        estimatedCrackTime
    };
};

// Get password requirements checklist
const getRequirements = (password) => {
    return [
        {
            label: 'At least 8 characters',
            met: password.length >= 8,
            icon: 'ri-text'
        },
        {
            label: 'Uppercase & lowercase letters',
            met: /[a-z]/.test(password) && /[A-Z]/.test(password),
            icon: 'ri-font-size'
        },
        {
            label: 'At least one number',
            met: /\d/.test(password),
            icon: 'ri-hashtag'
        },
        {
            label: 'Special character (!@#$%^&*)',
            met: /[^a-zA-Z\d]/.test(password),
            icon: 'ri-asterisk'
        }
    ];
};

// Estimate time to crack password
const estimateCrackTime = (entropy) => {
    // Assuming 1 billion guesses per second
    const guessesPerSecond = 1e9;
    const possibleCombinations = Math.pow(2, entropy);
    const seconds = possibleCombinations / (2 * guessesPerSecond);

    if (seconds < 1) return 'Instantly';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    return `${Math.round(seconds / 31536000)} years`;
};

// Generate strong password suggestion
export const generateStrongPassword = (length = 16) => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};
