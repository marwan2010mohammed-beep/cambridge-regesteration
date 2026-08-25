/**
 * Validation utilities for Cambridge IGCSE Candidate Registration
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
  normalized?: string;
  domain?: string;
  isPopularProvider?: boolean;
}

const POPULAR_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'mail.com',
  'cambridge.org',
  'cambridgeinternational.org',
];

const KNOWN_TYPO_MAP: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmel.com': 'gmail.com',
  'gmael.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmail.com.': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.cm': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmale.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlok.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'icould.com': 'icloud.com',
  'iclud.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.con': 'icloud.com',
  'protonmial.com': 'protonmail.com',
  'protonmle.com': 'proton.me',
  'proton.co': 'proton.me',
};

const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'trashmail.com',
  'dispostable.com',
  'yopmail.com',
  'sharklasers.com',
  'getnada.com',
  'temp-mail.org',
];

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Validates candidate email address with real-time domain checking and typo detection
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Candidate email address is required.',
    };
  }

  // Basic email structure validation regex
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

  const normalized = trimmed.toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Invalid email address format.',
    };
  }

  const [username, domain] = parts;

  // Check domain structure
  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: 'Email domain must include a top-level extension (e.g. .com, .org, .edu).',
    };
  }

  if (domain.includes('..')) {
    return {
      isValid: false,
      error: 'Email domain cannot contain consecutive dots.',
    };
  }

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'Top-level domain extension must be at least 2 characters long.',
    };
  }

  // Disposable domain check
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: 'Disposable or temporary email providers are not permitted for official examination records.',
    };
  }

  // Check domain typo & suggestion logic
  let suggestedDomain: string | null = null;

  if (KNOWN_TYPO_MAP[domain]) {
    suggestedDomain = KNOWN_TYPO_MAP[domain];
  } else if (!POPULAR_DOMAINS.includes(domain)) {
    // Check common TLD typos first
    if (domain.endsWith('.con')) {
      suggestedDomain = domain.replace(/\.con$/, '.com');
    } else if (domain.endsWith('.cmo')) {
      suggestedDomain = domain.replace(/\.cmo$/, '.com');
    } else if (domain.endsWith('.cm') && !domain.endsWith('.com')) {
      suggestedDomain = domain.replace(/\.cm$/, '.com');
    } else if (domain.endsWith('.ed')) {
      suggestedDomain = domain.replace(/\.ed$/, '.edu');
    } else if (domain.endsWith('.og')) {
      suggestedDomain = domain.replace(/\.og$/, '.org');
    } else {
      // Levenshtein distance check against popular domains
      let closestMatch = '';
      let minDistance = Infinity;

      for (const popular of POPULAR_DOMAINS) {
        const dist = getLevenshteinDistance(domain, popular);
        if (dist > 0 && dist <= 2 && dist < minDistance) {
          minDistance = dist;
          closestMatch = popular;
        }
      }

      if (closestMatch && minDistance <= 2) {
        suggestedDomain = closestMatch;
      }
    }
  }

  const isPopularProvider = POPULAR_DOMAINS.includes(domain);

  if (suggestedDomain && suggestedDomain !== domain) {
    const suggestion = `${username}@${suggestedDomain}`;
    return {
      isValid: true,
      warning: `Possible email domain typo detected: "${domain}". Did you mean "${suggestion}"?`,
      suggestion,
      normalized,
      domain,
      isPopularProvider: false,
    };
  }

  return {
    isValid: true,
    normalized,
    domain,
    isPopularProvider,
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
