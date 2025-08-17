export function StatusBadge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color =
    tone === 'success' ? 'bg-green-100 text-green-800' :
    tone === 'warning' ? 'bg-yellow-100 text-yellow-800' :
    tone === 'danger' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${color}`}>{label}</span>
}


