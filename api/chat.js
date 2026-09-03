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
      console.error('GEMINI_API_KEY absente.')
      return res.status(500).json({ error: 'La clé Gemini n’est pas configurée sur le serveur.' })
    }

    const cleanMessage = message.trim().slice(0, 1200)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Tu es Lia, l'assistante de MIMOU BOOKISM. Tu tutoies toujours l'utilisateur. Réponds en français, naturellement, chaleureusement et très brièvement. Pour une salutation, une seule phrase. Pour une question simple, 1 à 3 phrases. Aide surtout avec les livres, les recommandations et l'utilisation de MIMOU BOOKISM. Ne prétends jamais avoir accès à une information que tu n'as pas.`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          generationConfig: { maxOutputTokens: 180, temperature: 0.5 }
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

    const reply = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim()

    if (!reply) {
      return res.status(502).json({ error: 'Lia n’a pas reçu de réponse.' })
    }

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Erreur /api/chat:', error)
    return res.status(500).json({ error: error?.message || 'Une erreur interne est survenue avec Lia.' })
  }
}
