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

  try {
    const { fileName, fileBase64, bucket, contentType } = req.body
    const buffer = Buffer.from(fileBase64.split(',')[1] || fileBase64, 'base64')

    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType,
      upsert: true
    })
    if (error) throw error

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return res.status(200).json({ url: data.publicUrl })

  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}