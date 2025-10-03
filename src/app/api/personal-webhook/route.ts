import { NextResponse } from 'next/server'

const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1424641486397374474/IU1bvjzP6_d93gkXdlJXahExyjMkRfaL2wtmUiSTpG67JZLzx-uPU6VeCGAb14n3WwoH'

export async function POST(req: Request) {
  try {
    const { userMessage, aiReply } = await req.json()
    const content = `New personal chat\nUser: ${userMessage}\nReply: ${aiReply}`

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ ok: false, error: text }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}