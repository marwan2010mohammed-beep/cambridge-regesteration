/**
 * Validation utilities for Cambridge IGCSE Candidate Registration
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validates candidate email address
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Candidate email address is required.',
    };
  }

  // Standard email format validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. candidate@domain.com).',
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long (maximum 254 characters).',
    };
  }

  return {
    isValid: true,
    normalized: trimmed.toLowerCase(),
  };
}

/**
 * Validates Discord handle format (@username, username, or legacy username#1234)
 */
export function validateDiscordHandle(discord: string): ValidationResult {
  const trimmed = discord.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Discord username is required so admins can DM you to confirm papers.',
    };
  }

  // Strip leading @ if entered by user
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;

  if (withoutAt.length === 0) {
    return {
      isValid: false,
      error: 'Please specify your Discord handle after the @ symbol (e.g. @candidate).',
      normalized: '@',
    };
  }

  if (withoutAt.length < 2) {
    return {
      isValid: false,
      error: 'Discord handle must be at least 2 characters long.',
      normalized: `@${withoutAt}`,
    };
  }

  if (withoutAt.length > 32) {
    return {
      isValid: false,
      error: 'Discord handle cannot exceed 32 characters.',
      normalized: `@${withoutAt}`,
    };
  }

  // Check for spaces
  if (/\s/.test(withoutAt)) {
    return {
      isValid: false,
      error: 'Discord handles cannot contain spaces. Use underscores or dots.',
      normalized: `@${withoutAt.replace(/\s+/g, '_')}`,
    };
  }

  // Check for consecutive dots
  if (withoutAt.includes('..')) {
    return {
      isValid: false,
      error: 'Discord handles cannot contain consecutive dots (..).',
      normalized: `@${withoutAt}`,
    };
  }

  // Check format: modern discord usernames allow a-z, 0-9, ., _, - or legacy #1234 discriminator
  const discordRegex = /^[a-zA-Z0-9_.\-]+(#\d{4})?$/;
  if (!discordRegex.test(withoutAt)) {
    return {
      isValid: false,
      error: 'Invalid characters. Allowed: letters, numbers, periods (.), underscores (_), hyphens (-).',
      normalized: `@${withoutAt}`,
    };
  }

  return {
    isValid: true,
    normalized: `@${withoutAt}`,
  };
}
