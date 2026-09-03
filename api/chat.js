export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' })
  }

  try {
    const { message } = req.body || {}

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message manquant.' })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'La clé Gemini n’est pas configurée sur le serveur.' })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Tu es Lia, l'assistante intelligente de MIMOU BOOKISM.

Tu aides les utilisateurs à découvrir les livres disponibles sur la plateforme, à choisir des lectures et à comprendre comment utiliser MIMOU BOOKISM.

Réponds toujours en français, avec des réponses claires, naturelles et utiles. Sois concise sauf si l'utilisateur demande une explication détaillée.

Ne prétends jamais avoir accès à une information que tu n'as pas.`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: message }] }]
        })
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini a retourné une erreur.'
      })
    }

    if (!response.body) {
      return res.status(502).json({ error: 'Le service IA n’a pas fourni de flux.' })
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        const line = event.split('\n').find((item) => item.startsWith('data:'))
        if (!line) continue

        const jsonText = line.slice(5).trim()
        if (!jsonText || jsonText === '[DONE]') continue

        try {
          const data = JSON.parse(jsonText)
          const text = data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join('') || ''

          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`)
          }
        } catch {
          // Certains blocs peuvent être incomplets à la frontière des paquets.
        }
      }
    }

    res.end()
  } catch (error) {
    console.error('Erreur /api/chat:', error)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Une erreur interne est survenue avec Lia.' })
    }
    res.end()
  }
}
