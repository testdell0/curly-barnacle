import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkPasswordStrength, type PasswordContext } from '@/lib/passwordValidation'

interface Props {
  password: string
  context?: PasswordContext
}

export function PasswordStrengthMeter({ password, context }: Props) {
  if (!password) return null

  const { score, label, barColor, textColor, checks } = checkPasswordStrength(password, context)

  return (
    <div className="mt-2 space-y-2">
      {/* Segmented strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-200',
                n <= score ? barColor : 'bg-gray-200',
              )}
            />
          ))}
        </div>
        <span className={cn('text-xs font-semibold w-16 text-right shrink-0', textColor)}>
          {label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Req met={checks.length}        label="8+ characters" />
        <Req met={checks.uppercase}     label="Uppercase (A–Z)" />
        <Req met={checks.lowercase}     label="Lowercase (a–z)" />
        <Req met={checks.number}        label="Number (0–9)" />
        <Req met={checks.special}       label="Special character" />
        <Req met={checks.noPersonalInfo} label="No personal info" />
      </div>
    </div>
  )
}

function Req({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={cn('flex items-center gap-1 text-xs', met ? 'text-green-600' : 'text-gray-400')}>
      {met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </div>
  )
}
