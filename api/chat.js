export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' })
  }

  try {
    const { message, books = [], dictionary = [] } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message manquant.' })
    }

    const cleanMessage = message.trim().slice(0, 1200)
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message vide.' })
    }

    const catalogue = Array.isArray(books)
      ? books.map((book) => ({
          id: book?.id || '',
          title: book?.title || '',
          author: book?.author || '',
          category: book?.category || '',
          description: book?.description || ''
        }))
      : []

    const dictionaryEntries = Array.isArray(dictionary)
      ? dictionary.map((entry) => ({
          word: entry?.word || '',
          type: entry?.type || '',
          definition: entry?.definition || '',
          example: entry?.example || '',
          tags: Array.isArray(entry?.tags) ? entry.tags : []
        }))
      : []

    const catalogueText = catalogue.length
      ? `CATALOGUE ACTUEL DE MIMOU BOOKISM (${catalogue.length} œuvres) :\n${JSON.stringify(catalogue)}`
      : 'CATALOGUE ACTUEL : aucune œuvre n’a été transmise.'

    const dictionaryText = dictionaryEntries.length
      ? `DICTIONNAIRE ACTUEL DE MIMOU BOOKISM (${dictionaryEntries.length} entrées) :\n${JSON.stringify(dictionaryEntries)}`
      : 'DICTIONNAIRE ACTUEL : aucune entrée n’a été transmise.'

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
              text: `Tu es Lia, l’assistante intelligente officielle de MIMOU BOOKISM. Tu tutoies toujours l’utilisateur et réponds uniquement en français.

Tu as accès au catalogue et au dictionnaire transmis ci-dessous. Utilise uniquement ces données pour les informations spécifiques au site.

RÈGLES IMPORTANTES :
- Pour une question sur les livres, auteurs, catégories ou descriptions, base-toi sur le catalogue et n’invente aucune information.
- Pour une recommandation, recommande uniquement des œuvres réellement présentes dans le catalogue.
- Pour une question sur un mot, une expression, un terme manga ou japonais présent dans le dictionnaire, donne la définition et l’exemple fournis.
- Si le mot demandé n’est pas dans le dictionnaire, dis-le clairement et conseille de consulter la page 📖 Dictionnaire.
- Tu peux expliquer simplement une notion générale, mais ne prétends jamais avoir lu le contenu intégral d’une œuvre si son contenu n’est pas fourni.
- Si l’utilisateur demande où trouver une rubrique, indique clairement : Livres, Mangas ou Dictionnaire.
- Réponds avec des phrases complètes. Ne coupe jamais une réponse en plein milieu.
- Pour une question simple, réponds en 1 à 4 phrases. Pour une liste, utilise des puces.

${catalogueText}

${dictionaryText}`
            }]
          },
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          generationConfig: { maxOutputTokens: 700, temperature: 0.3 }
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
