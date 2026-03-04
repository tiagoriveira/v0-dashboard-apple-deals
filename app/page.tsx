import { Dashboard } from '@/components/dashboard'
import { getOfertas } from '@/lib/api'

export default async function Home() {
  const ofertas = await getOfertas()
  return <Dashboard ofertasIniciais={ofertas} />
}
