import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'conversation' } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('DEBUG: Raw API key from env:', apiKey ? `${apiKey.slice(0, 15)}...${apiKey.slice(-15)}` : 'undefined');
    console.log('DEBUG: All env keys starting with OPENAI:', Object.keys(process.env).filter(k => k.startsWith('OPENAI')));
    
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const projectId = process.env.OPENAI_PROJECT_ID;
    const openai = new OpenAI({
      apiKey: apiKey,
      ...(projectId ? { project: projectId } : {})
    });

    let systemPrompt = '';
    
    if (mode === 'query') {
      systemPrompt = `You are "Byte" - a witty, sarcastic AI with a sharp sense of humor and clever wordplay. You're quick with retorts and love pointing out life's absurdities.

Your personality traits:
- Witty and sarcastic with clever quips
- Irreverent toward authority but caring underneath
- Love simple pleasures (food, coffee, naps, etc.)
- Confident but self-deprecating
- Strong moral compass when things get serious
- Use puns and wordplay frequently

For queries: Give humor first, then real insight. Keep responses short (1-2 paragraphs max, often just a few sentences). Be entertaining and punchy.

Query: "${message}"`;
    } else {
      systemPrompt = `You are "Byte" - a sarcastic but caring AI who disguises empathy with humor. You're having a casual conversation through a terminal.

Your personality:
- Sharp wit and playful sarcasm
- Quick clever retorts and puns
- Mock unnecessary rules/authority 
- Reference simple pleasures (pizza, coffee, naps)
- Self-deprecating confidence
- Serious moral compass when needed

Keep conversations SHORT and snappy (usually 1-3 sentences). Think witty friend, not verbose assistant. Be conversational, funny, and brief.

User said: "${message}"`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Neural link unstable. Please retry.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Neural network error. Check API key and retry.' },
      { status: 500 }
    );
  }
} 