const UPPERCASE_RE = /[A-Z]/
const LOWERCASE_RE = /[a-z]/
const NUMBER_RE    = /[0-9]/
const SPECIAL_RE   = /[!@#$%^&*()\-_=+[\]{};:',.<>/?\\`~|]/

export interface PasswordContext {
  username?:  string
  email?:     string
  firstName?: string
  lastName?:  string
}

export interface PasswordChecks {
  length:        boolean
  uppercase:     boolean
  lowercase:     boolean
  number:        boolean
  special:       boolean
  noPersonalInfo: boolean
}

export interface PasswordStrength {
  score:     number   // 0–5
  label:     string
  barColor:  string   // tailwind class
  textColor: string   // tailwind class
  checks:    PasswordChecks
}

export function checkPasswordStrength(password: string, ctx?: PasswordContext): PasswordStrength {
  const lower = password.toLowerCase()

  const checks: PasswordChecks = {
    length:        password.length >= 8,
    uppercase:     UPPERCASE_RE.test(password),
    lowercase:     LOWERCASE_RE.test(password),
    number:        NUMBER_RE.test(password),
    special:       SPECIAL_RE.test(password),
    noPersonalInfo: true,
  }

  if (ctx && password.length >= 3) {
    const tokens = [ctx.username, ctx.firstName, ctx.lastName, ctx.email?.split('@')[0]]
      .filter((t): t is string => !!t && t.length >= 3)
      .map((t) => t.toLowerCase())
    if (tokens.some((t) => lower.includes(t))) checks.noPersonalInfo = false
  }

  const base  = [checks.length, checks.uppercase, checks.lowercase, checks.number, checks.special]
    .filter(Boolean).length
  const score = checks.noPersonalInfo ? base : Math.max(0, base - 2)

  const label =
    score <= 1 ? 'Very Weak' :
    score === 2 ? 'Weak'      :
    score === 3 ? 'Fair'      :
    score === 4 ? 'Good'      : 'Strong'

  const barColor =
    score <= 1 ? 'bg-red-500'    :
    score === 2 ? 'bg-orange-400' :
    score === 3 ? 'bg-yellow-400' :
    score === 4 ? 'bg-blue-500'   : 'bg-green-500'

  const textColor =
    score <= 1 ? 'text-red-600'    :
    score === 2 ? 'text-orange-600' :
    score === 3 ? 'text-yellow-600' :
    score === 4 ? 'text-blue-600'   : 'text-green-600'

  return { score, label, barColor, textColor, checks }
}

/** Returns an array of unmet requirement strings. Empty = valid. */
export function getPasswordErrors(password: string, ctx?: PasswordContext): string[] {
  if (!password) return ['Password is required']
  const { checks } = checkPasswordStrength(password, ctx)
  const errors: string[] = []
  if (!checks.length)        errors.push('At least 8 characters required')
  if (!checks.uppercase)     errors.push('At least 1 uppercase letter (A–Z)')
  if (!checks.lowercase)     errors.push('At least 1 lowercase letter (a–z)')
  if (!checks.number)        errors.push('At least 1 number (0–9)')
  if (!checks.special)       errors.push('At least 1 special character (!@#$%^&* etc.)')
  if (!checks.noPersonalInfo) errors.push('Must not contain your name, username, or email')
  return errors
}
