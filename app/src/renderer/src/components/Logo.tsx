export default function Logo({ size = 56 }: { size?: number }) {
  return (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="14" fill="#1e1e1e" /><rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="#007acc" strokeWidth="2" />
    <g strokeWidth="2.4" strokeLinecap="round"><line x1="16" y1="26" x2="16" y2="47" stroke="#ef5350" /><line x1="27" y1="20" x2="27" y2="43" stroke="#26a69a" /><line x1="38" y1="15" x2="38" y2="38" stroke="#26a69a" /><line x1="49" y1="10" x2="49" y2="31" stroke="#26a69a" /></g>
    <rect x="12" y="31" width="8" height="12" rx="1.5" fill="#ef5350" /><rect x="23" y="25" width="8" height="14" rx="1.5" fill="#26a69a" /><rect x="34" y="19" width="8" height="14" rx="1.5" fill="#26a69a" /><rect x="45" y="14" width="8" height="12" rx="1.5" fill="#26a69a" />
    <line x1="9" y1="52" x2="55" y2="52" stroke="#007acc" strokeWidth="2" />
  </svg>
  )
}
