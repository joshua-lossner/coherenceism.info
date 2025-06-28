import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB' // Default voice

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    // Clean text for speech (remove markdown, separators, etc.)
    const cleanText = text
      .replace(/━+/g, '') // Remove separator lines
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .trim()

    if (!cleanText || cleanText.length < 3) {
      return NextResponse.json({ error: 'No valid text to synthesize' }, { status: 400 })
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      return NextResponse.json({ error: 'Speech synthesis failed' }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error: any) {
    console.error('Speech API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 