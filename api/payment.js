import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function json(res, status, body) {
  return res.status(status).json(body)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Méthode non autorisée.' })

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return json(res, 401, { error: 'Tu dois être connecté.' })

    if (!process.env.CINETPAY_API_KEY || !process.env.CINETPAY_SITE_ID || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 500, { error: 'Le paiement n’est pas encore configuré sur le serveur.' })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData.user) return json(res, 401, { error: 'Session invalide.' })

    const { bookId } = req.body || {}
    if (!bookId) return json(res, 400, { error: 'Livre manquant.' })

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id,title,price,is_free')
      .eq('id', bookId)
      .single()

    if (bookError || !book) return json(res, 404, { error: 'Livre introuvable.' })
    if (book.is_free) return json(res, 400, { error: 'Ce livre est gratuit.' })

    const amount = Math.round(Number(book.price || 0))
    if (!Number.isFinite(amount) || amount <= 0) return json(res, 400, { error: 'Prix du livre invalide.' })
    if (amount % 5 !== 0) return json(res, 400, { error: 'Le prix doit être un multiple de 5 FCFA pour ce paiement.' })

    const { data: existing } = await supabaseAdmin
      .from('purchases')
      .select('id,status')
      .eq('user_id', userData.user.id)
      .eq('book_id', book.id)
      .eq('status', 'PAID')
      .maybeSingle()

    if (existing) return json(res, 409, { error: 'Tu as déjà acheté ce livre.', alreadyPaid: true })

    const transactionId = `MB${Date.now()}${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`
    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`

    const { error: purchaseError } = await supabaseAdmin.from('purchases').insert({
      user_id: userData.user.id,
      book_id: book.id,
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      status: 'PENDING'
    })

    if (purchaseError) throw purchaseError

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId,
        amount,
        currency: 'XOF',
        description: `Achat du livre ${book.title}`.slice(0, 250),
        notify_url: `${origin}/api/payment-notify`,
        return_url: `${origin}/paiement?transaction=${encodeURIComponent(transactionId)}&book=${encodeURIComponent(book.id)}`,
        channels: 'ALL',
        lang: 'FR',
        metadata: JSON.stringify({ purchase_id: transactionId, book_id: book.id, user_id: userData.user.id })
      })
    })

    const result = await response.json()
    const successCode = String(result.code) === '201'
    if (!response.ok || !successCode || !result.data?.payment_url) {
      await supabaseAdmin.from('purchases').update({ status: 'FAILED' }).eq('transaction_id', transactionId)
      return json(res, 502, { error: result.message || 'Impossible de créer le paiement.' })
    }

    return json(res, 200, {
      paymentUrl: result.data.payment_url,
      transactionId,
      bookId: book.id
    })
  } catch (error) {
    console.error('payment error', error)
    return json(res, 500, { error: error.message || 'Erreur serveur.' })
  }
}
