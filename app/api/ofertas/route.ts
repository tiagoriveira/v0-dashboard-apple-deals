import { NextResponse } from 'next/server'
import { getOfertas } from '@/lib/api'

export async function GET() {
  try {
    const ofertas = await getOfertas()
    return NextResponse.json({ ofertas })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[API /ofertas]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
