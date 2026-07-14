import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { analysisId, topic, summary } = await request.json()

  if (!analysisId || !summary) {
    return NextResponse.json({ error: 'Missing analysisId or summary' }, { status: 400 })
  }

  const prompt = `Create a clean, professional illustrative image representing this concept from a LinkedIn post analysis about ${topic}:

${summary}

Style: modern, minimal, editorial illustration suitable for a professional tech blog. Blue color tones. No text or words in the image.`

  const geminiRes = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    return NextResponse.json({ error: `Gemini API failed: ${errText}` }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  const parts = geminiData.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: any) => p.inlineData)

  if (!imagePart) {
    return NextResponse.json({ error: 'Gemini did not return an image' }, { status: 502 })
  }

  const base64Data = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType ?? 'image/png'
  const extension = mimeType.split('/')[1] ?? 'png'
  const imageBuffer = Buffer.from(base64Data, 'base64')

  const fileName = `${analysisId}-${Date.now()}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('analysis-images')
    .upload(fileName, imageBuffer, { contentType: mimeType, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('analysis-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
}