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
    
    // Validate the request body
    const validatedData = contactFormSchema.parse(body);
    
    // Get Discord webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    // Format message for Discord
    const discordMessage = {
      embeds: [{
        title: '📬 New Contact Form Submission',
        color: 0x385780, // Your theme color
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

    // Send to Discord webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      throw new Error('Failed to send message to Discord');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
} 