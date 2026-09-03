import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' })

  try {
    const { bucket, path } = req.body || {}
    if (!bucket || !path) return res.status(400).json({ error: 'Bucket et chemin requis.' })
    if (!['books', 'covers'].includes(bucket)) return res.status(400).json({ error: 'Bucket invalide.' })

    const cleanPath = String(path).replace(/^\/+/, '')
    if (!cleanPath || cleanPath.includes('..')) return res.status(400).json({ error: 'Chemin invalide.' })

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(cleanPath)

    if (error) throw error

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(cleanPath)

    return res.status(200).json({
      path: cleanPath,
      token: data.token,
      url: publicData.publicUrl
    })
  } catch (error) {
    console.error('upload-url:', error)
    return res.status(500).json({ error: error?.message || 'Impossible de préparer l’envoi du fichier.' })
  }
}
