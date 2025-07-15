import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received form data:', body);
    
    // Validate the request body
    const validatedData = contactFormSchema.parse(body);
    
    // Get Discord webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    console.log('Using webhook URL:', webhookUrl?.substring(0, 20) + '...');
    
    if (!webhookUrl) {
      console.error('Discord webhook URL not found in environment variables');
      throw new Error('Discord webhook URL not configured');
    }

    // First try a simple message to test the webhook
    const testMessage = {
      content: `New contact form submission from ${validatedData.name}`,
      embeds: [{
        title: '📬 New Contact Form Submission',
        color: 0x385780,
        fields: [
          {
            name: '👤 Name',
            value: validatedData.name,
            inline: true
          },
          {
            name: '📧 Email',
            value: validatedData.email,
            inline: true
          },
          {
            name: '💬 Message',
            value: validatedData.message
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    console.log('Sending Discord message:', JSON.stringify(testMessage, null, 2));

    // Send to Discord webhook with better error handling
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      const responseText = await response.text();
      console.log('Discord API response status:', response.status);
      console.log('Discord API response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Discord API response body:', responseText);

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${responseText}`);
      }

      return NextResponse.json({ success: true });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    }
  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
} 