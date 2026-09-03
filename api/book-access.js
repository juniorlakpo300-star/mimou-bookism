import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const send = (res, status, body) => res.status(status).json(body)

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Méthode non autorisée.' })

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!token) return send(res, 401, { error: 'Tu dois être connecté.' })

    const { data: userData } = await admin.auth.getUser(token)
    const user = userData?.user
    if (!user) return send(res, 401, { error: 'Session invalide.' })

    const { bookId } = req.body || {}
    if (!bookId) return send(res, 400, { error: 'Livre manquant.' })

    const { data: book, error: bookError } = await admin
      .from('books')
      .select('id,title,is_free,owner_id,file_path,book_url,file_url')
      .eq('id', bookId)
      .single()

    if (bookError || !book) return send(res, 404, { error: 'Livre introuvable.' })

    if (!book.is_free) {
      const { data: purchase } = await admin
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .eq('status', 'PAID')
        .maybeSingle()

      if (!purchase) return send(res, 403, { error: 'Livre payant : achat requis.', requiresPurchase: true })
    }

    // file_path est le chemin Storage recommandé pour les nouveaux livres.
    if (book.file_path) {
      const { data, error } = await admin.storage.from('books').createSignedUrl(book.file_path, 3600)
      if (error || !data?.signedUrl) throw error || new Error('Impossible de créer le lien de lecture.')
      return send(res, 200, { url: data.signedUrl, expiresIn: 3600 })
    }

    // Compatibilité avec les anciens livres déjà publiés.
    if (book.is_free && (book.file_url || book.book_url)) {
      return send(res, 200, { url: book.file_url || book.book_url, legacy: true })
    }

    return send(res, 404, { error: 'Fichier du livre introuvable.' })
  } catch (error) {
    console.error('book-access error', error)
    return send(res, 500, { error: 'Impossible d’ouvrir le livre.' })
  }
}
