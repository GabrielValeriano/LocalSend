import { Radio } from 'lucide-react'

// Círculo con ícono y ondas que salen del centro (igual que en el celular).
export function LogoAnimado({ activo }: { activo: boolean }) {
  return (
    <div className="logo-animado">
      {activo && [0, 1, 2].map((i) => (
        <span key={i} className="logo-animado__onda" style={{ animationDelay: `${i * 0.8}s` }} />
      ))}
      <div className={`logo-animado__centro ${activo ? '' : 'logo-animado__centro--apagado'}`}>
        <Radio size={44} />
      </div>
    </div>
  )
}
