export type Categoria =
  | 'Todos'
  | 'iPhone'
  | 'MacBook'
  | 'iPad'
  | 'AirPods'
  | 'Apple Watch'
  | 'iMac'
  | 'Mac Mini'

export interface Oferta {
  id: string
  titulo: string
  categoria: Exclude<Categoria, 'Todos'>
  preco: number
  preco_original: number | null
  desconto_pct: number | null
  vendedor: string
  vendidos: number
  link: string
}
