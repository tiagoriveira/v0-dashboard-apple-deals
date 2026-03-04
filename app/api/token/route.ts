import { NextResponse } from 'next/server'

// Cache em memória do access token (reutilizado do lib/api.ts via imports)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
    const now = Date.now()

    if (cachedToken && now < cachedToken.expiresAt) {
        return cachedToken.token
    }

    const clientId = process.env.ML_CLIENT_ID
    const clientSecret = process.env.ML_CLIENT_SECRET
    const refreshToken = process.env.ML_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Variáveis ML não configuradas')
    }

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
        cache: 'no-store',
    })

    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Falha ao renovar token: ${res.status} ${body}`)
    }

    const data: { access_token: string; expires_in: number } = await res.json()
    cachedToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in - 300) * 1000,
    }

    return cachedToken.token
}

export async function GET() {
    try {
        const token = await getAccessToken()
        return NextResponse.json({ access_token: token })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
