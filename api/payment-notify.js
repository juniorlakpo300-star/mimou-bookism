import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Méthode non autorisée.' })

  try {
    const body = req.method === 'POST' ? (req.body || {}) : req.query
    const transactionId = body.cpm_trans_id || body.transaction_id
    if (!transactionId) return res.status(200).json({ received: true })

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
      }).eq('transaction_id', transactionId)
    } else if (['REFUSED', 'CANCELLED', 'FAILED'].includes(status)) {
      await admin.from('purchases').update({ status: 'FAILED' }).eq('transaction_id', transactionId)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('payment-notify error', error)
    // Le webhook doit rester joignable : CinetPay pourra renvoyer la notification.
    return res.status(200).json({ received: true })
  }
}
