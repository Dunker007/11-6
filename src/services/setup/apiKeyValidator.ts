/**
 * apiKeyValidator.ts
 *
 * PURPOSE:
 * Validates API key formats for various services before testing connections.
 * Catches common mistakes like typos, wrong key types, or malformed keys.
 *
 * FEATURES:
 * - Format validation for Stripe, GitHub, Medium, WordPress, etc.
 * - User-friendly error messages
 * - Instant feedback without API calls
 * - Support for test vs live keys
 *
 * ARCHITECTURE:
 * Pure validation functions with regex patterns for each service.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  keyType?: string; // e.g., "test" or "live" for Stripe
}

/**
 * Validate Stripe API keys
 * Formats:
 * - Publishable: pk_test_... or pk_live_...
 * - Secret: sk_test_... or sk_live_...
 */
export function validateStripeKey(key: string, keyType: 'publishable' | 'secret'): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API key is required' };
  }

  const trimmedKey = key.trim();

  if (keyType === 'publishable') {
    // Publishable keys: pk_test_... or pk_live_...
    const publishablePattern = /^pk_(test|live)_[a-zA-Z0-9]{24,}$/;

    if (!publishablePattern.test(trimmedKey)) {
      if (trimmedKey.startsWith('sk_')) {
        return {
          valid: false,
          error: 'This looks like a SECRET key. You need a PUBLISHABLE key (starts with pk_)',
        };
      }
      return {
        valid: false,
        error: 'Invalid Stripe publishable key format. Should start with pk_test_ or pk_live_',
      };
    }

    const isTestKey = trimmedKey.startsWith('pk_test_');
    return {
      valid: true,
      keyType: isTestKey ? 'test' : 'live',
      warning: isTestKey
        ? undefined
        : 'You\'re using a LIVE key. Make sure you\'re ready for production!',
    };
  } else {
    // Secret keys: sk_test_... or sk_live_...
    const secretPattern = /^sk_(test|live)_[a-zA-Z0-9]{24,}$/;

    if (!secretPattern.test(trimmedKey)) {
      if (trimmedKey.startsWith('pk_')) {
        return {
          valid: false,
          error: 'This looks like a PUBLISHABLE key. You need a SECRET key (starts with sk_)',
        };
      }
      return {
        valid: false,
        error: 'Invalid Stripe secret key format. Should start with sk_test_ or sk_live_',
      };
    }

    const isTestKey = trimmedKey.startsWith('sk_test_');
    return {
      valid: true,
      keyType: isTestKey ? 'test' : 'live',
      warning: isTestKey
        ? undefined
        : 'You\'re using a LIVE key. Make sure you\'re ready for production!',
    };
  }
}

/**
 * Validate GitHub Personal Access Token
 * Formats:
 * - Classic: ghp_...
 * - Fine-grained: github_pat_...
 */
export function validateGitHubToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'GitHub token is required' };
  }

  const trimmedToken = token.trim();

  // Classic tokens: ghp_... (40 chars after prefix)
  const classicPattern = /^ghp_[a-zA-Z0-9]{36,}$/;
  // Fine-grained tokens: github_pat_... (variable length)
  const fineGrainedPattern = /^github_pat_[a-zA-Z0-9_]{22,}$/;

  if (classicPattern.test(trimmedToken)) {
    return {
      valid: true,
      keyType: 'classic',
    };
  }

  if (fineGrainedPattern.test(trimmedToken)) {
    return {
      valid: true,
      keyType: 'fine-grained',
      warning: 'Fine-grained tokens have specific permissions. Make sure it has the right scopes.',
    };
  }

  return {
    valid: false,
    error: 'Invalid GitHub token format. Should start with ghp_ (classic) or github_pat_ (fine-grained)',
  };
}

/**
 * Validate Medium Integration Token
 * Format: Long alphanumeric string
 */
export function validateMediumToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'Medium integration token is required' };
  }

  const trimmedToken = token.trim();

  // Medium tokens are typically 40+ character alphanumeric strings
  if (trimmedToken.length < 20) {
    return {
      valid: false,
      error: 'Medium token seems too short. Check you copied the full token.',
    };
  }

  // Check for common copy-paste mistakes
  if (trimmedToken.includes(' ') || trimmedToken.includes('\n')) {
    return {
      valid: false,
      error: 'Token contains whitespace. Make sure you copied it correctly.',
    };
  }

  // Basic alphanumeric check
  const tokenPattern = /^[a-zA-Z0-9_-]+$/;
  if (!tokenPattern.test(trimmedToken)) {
    return {
      valid: false,
      error: 'Token contains invalid characters. Should be alphanumeric only.',
    };
  }

  return { valid: true };
}

/**
 * Validate WordPress Application Password
 * Format: xxxx xxxx xxxx xxxx (24 characters with spaces)
 */
export function validateWordPressPassword(password: string): ValidationResult {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'WordPress application password is required' };
  }

  const trimmedPassword = password.trim();

  // WordPress app passwords are 24 chars with 3 spaces: "xxxx xxxx xxxx xxxx"
  // Can be entered with or without spaces
  const passwordWithoutSpaces = trimmedPassword.replace(/\s/g, '');

  if (passwordWithoutSpaces.length !== 24) {
    return {
      valid: false,
      error: 'WordPress application password should be 24 characters (without spaces)',
    };
  }

  // Check for alphanumeric characters only
  const passwordPattern = /^[a-zA-Z0-9\s]+$/;
  if (!passwordPattern.test(trimmedPassword)) {
    return {
      valid: false,
      error: 'Application password should contain only letters and numbers',
    };
  }

  return { valid: true };
}

/**
 * Validate WordPress site URL
 */
export function validateWordPressURL(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'WordPress site URL is required' };
  }

  const trimmedURL = url.trim();

  try {
    const parsedURL = new URL(trimmedURL);

    // Must be http or https
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      return {
        valid: false,
        error: 'URL must start with http:// or https://',
      };
    }

    // Warn about http (insecure)
    if (parsedURL.protocol === 'http:') {
      return {
        valid: true,
        warning: 'Using HTTP (not secure). Consider using HTTPS if available.',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Should be like https://yourblog.com',
    };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return { valid: true };
}

/**
 * Generic validator - routes to specific validators based on field name
 */
export function validateCredentialField(
  serviceId: string,
  fieldName: string,
  value: string
): ValidationResult {
  // Default to valid for unknown fields (connection test will catch issues)
  let result: ValidationResult = { valid: true };

  // Route to specific validators
  if (serviceId === 'stripe') {
    if (fieldName === 'apiKey' || fieldName === 'publishableKey') {
      result = validateStripeKey(value, 'publishable');
    } else if (fieldName === 'secretKey') {
      result = validateStripeKey(value, 'secret');
    }
  } else if (serviceId === 'github') {
    if (fieldName === 'accessToken' || fieldName === 'token') {
      result = validateGitHubToken(value);
    }
  } else if (serviceId === 'medium') {
    if (fieldName === 'integrationToken' || fieldName === 'token') {
      result = validateMediumToken(value);
    }
  } else if (serviceId === 'wordpress') {
    if (fieldName === 'url') {
      result = validateWordPressURL(value);
    } else if (fieldName === 'appPassword' || fieldName === 'password') {
      result = validateWordPressPassword(value);
    }
  }

  // Email validation for any service
  if (fieldName === 'email') {
    result = validateEmail(value);
  }

  return result;
}

/**
 * Batch validate all credentials for a service
 */
export function validateAllCredentials(
  serviceId: string,
  credentials: Record<string, string>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [fieldName, value] of Object.entries(credentials)) {
    results[fieldName] = validateCredentialField(serviceId, fieldName, value);
  }

  return results;
}

/**
 * Check if all validations passed
 */
export function allValidationsPassed(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.valid);
}
