import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Try to create ephemeral token (may not be available for all API keys)
    // For Realtime API, we can use the API key directly if ephemeral tokens aren't supported
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiry: 3600, // 1 hour
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          return NextResponse.json({ token: data.token })
        }
      }
      
      // If token endpoint doesn't exist or fails, log the error but continue to fallback
      const errorText = await response.text()
      console.log('Ephemeral token endpoint not available, using API key directly:', response.status, errorText)
    } catch (fetchError) {
      console.log('Ephemeral token endpoint error (using fallback):', fetchError)
    }

    // Return API key for Realtime API WebRTC connection
    // The WebRTC approach uses the API key directly with Authorization header in POST request
    console.log('Returning API key for Realtime API WebRTC connection')
    return NextResponse.json({ value: process.env.OPENAI_API_KEY })
  } catch (error) {
    console.error('Error in token route:', error)
    // Final fallback - always return API key if all else fails in development
    if (process.env.OPENAI_API_KEY) {
      console.warn('Using API key fallback after error - not recommended for production')
      return NextResponse.json({ value: process.env.OPENAI_API_KEY })
    }
    return NextResponse.json(
      { error: 'Failed to create token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

