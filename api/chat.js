export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' })
  }

  try {
    const { message } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message manquant.' })
    }

    const cleanMessage = message.trim().slice(0, 1200)
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message vide.' })
    }

    // Les salutations n'ont pas besoin d'un appel IA : réponse immédiate.
    const normalized = cleanMessage
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[!?.,;:]+/g, '')
      .trim()

    const greetings = new Set([
      'bonjour', 'bonsoir', 'salut', 'hello', 'hey', 'coucou', 'bjr', 'slt'
    ])

    if (greetings.has(normalized)) {
      return res.status(200).json({
        reply: 'Bonjour 👋 ! Comment puis-je t’aider aujourd’hui ?'
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY absente.')
      return res.status(500).json({ error: 'La clé Gemini n’est pas configurée sur le serveur.' })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Tu es Lia, l'assistante de MIMOU BOOKISM. Tu tutoies toujours l'utilisateur. Réponds uniquement en français. Sois naturelle, chaleureuse et concise. Pour une question simple, réponds en 1 à 3 phrases. Pour une recommandation, donne des suggestions utiles. N'invente jamais une information sur la plateforme ou les livres.`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.4
          }
        })
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Erreur Gemini:', data)
      return res.status(response.status).json({
        error: data?.error?.message || `Gemini a retourné une erreur (${response.status}).`
      })
    }

    const parts = data?.candidates?.[0]?.content?.parts || []
    const reply = parts
      .map(part => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()

    if (!reply) {
      console.error('Réponse Gemini vide:', JSON.stringify(data))
      return res.status(502).json({ error: 'Lia n’a pas reçu de réponse complète.' })
    }

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Erreur /api/chat:', error)
    return res.status(500).json({
      error: error?.message || 'Une erreur interne est survenue avec Lia.'
    })
  }
}
