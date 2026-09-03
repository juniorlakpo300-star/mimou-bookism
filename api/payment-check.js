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

    const { transactionId } = req.body || {}
    if (!transactionId) return send(res, 400, { error: 'Transaction manquante.' })

    const { data: purchase, error: purchaseError } = await admin
      .from('purchases')
      .select('id,user_id,book_id,transaction_id,status')
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (purchaseError || !purchase) return send(res, 404, { error: 'Achat introuvable.' })
    if (purchase.status === 'PAID') return send(res, 200, { status: 'PAID', bookId: purchase.book_id })

    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId
      })
    })

    const result = await response.json()
    const status = String(result.data?.status || '').toUpperCase()

    if (status === 'ACCEPTED') {
      await admin.from('purchases').update({
        status: 'PAID',
        payment_method: result.data?.payment_method || null,
        paid_at: new Date().toISOString()
      }).eq('id', purchase.id)

      return send(res, 200, { status: 'PAID', bookId: purchase.book_id })
    }

    if (['REFUSED', 'CANCELLED', 'FAILED'].includes(status)) {
      await admin.from('purchases').update({ status: 'FAILED' }).eq('id', purchase.id)
      return send(res, 200, { status: 'FAILED', bookId: purchase.book_id })
    }

    return send(res, 200, { status: 'PENDING', bookId: purchase.book_id })
  } catch (error) {
    console.error('payment-check error', error)
    return send(res, 500, { error: 'Impossible de vérifier le paiement.' })
  }
}
