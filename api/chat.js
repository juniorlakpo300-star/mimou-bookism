export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' })
  }

  try {
    const { message, books = [] } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message manquant.' })
    }

    const cleanMessage = message.trim().slice(0, 1200)
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message vide.' })
    }

    const normalized = cleanMessage
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[!?.,;:]+/g, '')
      .trim()

    const greetings = new Set(['bonjour', 'bonsoir', 'salut', 'hello', 'hey', 'coucou', 'bjr', 'slt'])
    if (greetings.has(normalized)) {
      return res.status(200).json({ reply: 'Bonjour 👋 ! Comment puis-je t’aider aujourd’hui ?' })
    }

    const catalogue = Array.isArray(books)
      ? books.slice(0, 100).map((book) => ({
          id: book?.id || '',
          title: book?.title || '',
          author: book?.author || '',
          category: book?.category || '',
          description: book?.description || '',
          cover_url: book?.cover_url || ''
        }))
      : []

    const catalogueText = catalogue.length
      ? `CATALOGUE ACTUEL DE MIMOU BOOKISM (${catalogue.length} livres) :\n${JSON.stringify(catalogue)}`
      : 'CATALOGUE ACTUEL : aucun livre n’a été transmis.'

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
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
              text: `Tu es Lia, l’assistante de MIMOU BOOKISM. Tu tutoies toujours l’utilisateur et réponds uniquement en français. Tu connais le catalogue fourni ci-dessous. Utilise uniquement les informations de ce catalogue pour parler des livres disponibles. Si l’utilisateur demande une recommandation, choisis parmi les livres du catalogue et explique brièvement pourquoi. Si aucun livre ne correspond, dis-le honnêtement. Ne prétends jamais avoir lu le contenu intégral d’un livre si son contenu n’est pas fourni. Réponds naturellement et brièvement, généralement en 1 à 4 phrases.\n\n${catalogueText}`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
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

    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()

    if (!reply) {
      return res.status(502).json({ error: 'Lia n’a pas reçu de réponse complète.' })
    }

    return res.status(200).json({ reply })
  } catch (error) {
    console.error('Erreur /api/chat:', error)
    return res.status(500).json({ error: error?.message || 'Une erreur interne est survenue avec Lia.' })
  }
}
