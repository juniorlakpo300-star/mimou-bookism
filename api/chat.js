export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Méthode non autorisée. Utilisez POST.'
    })
  }

  try {
    const { message } = req.body || {}

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message manquant.'
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('GEMINI_API_KEY est absente des variables Vercel.')
      return res.status(500).json({
        error: 'La clé Gemini n’est pas configurée sur le serveur.'
      })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `Tu es Lia, l'assistante intelligente de MIMOU BOOKISM.

Tu aides les utilisateurs à découvrir les livres disponibles sur la plateforme, à choisir des lectures et à comprendre comment utiliser MIMOU BOOKISM.

Réponds toujours en français, avec des réponses claires, naturelles et utiles. Sois concise sauf si l'utilisateur demande une explication détaillée.

Ne prétends jamais avoir accès à une information que tu n'as pas.`
              }
            ]
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Erreur Gemini:', data)
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini a retourné une erreur.'
      })
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim()

    if (!reply) {
      return res.status(502).json({
        error: 'Gemini n’a pas retourné de réponse.'
      })
    }

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Erreur /api/chat:', error)

    return res.status(500).json({
      error: 'Une erreur interne est survenue avec Lia.'
    })
  }
}
