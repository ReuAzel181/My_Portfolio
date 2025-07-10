import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// You'll need to replace this with your Discord webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1392761855226810418/r3OzgKM7U3ZuOsg-Pv96Qt4QrLtDGGQSIH68jiJqw8XIvSJ00QKF23MgJ3NYz7qJx79_';

export async function POST() {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown Device';
    const referer = headersList.get('referer') || 'Direct Visit';
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'Unknown';

    // Get basic device info from user agent
    const isMobile = /mobile/i.test(userAgent);
    const isTablet = /tablet/i.test(userAgent);
    const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

    const visitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Create Discord message
    const message = {
      embeds: [{
        title: '🌟 New Portfolio Visitor!',
        color: 0x00ff00,
        fields: [
          {
            name: 'Device Type',
            value: deviceType,
            inline: true
          },
          {
            name: 'Visit Time (PHT)',
            value: visitTime,
            inline: true
          },
          {
            name: 'Referrer',
            value: referer,
            inline: true
          }
        ],
        footer: {
          text: 'Portfolio Analytics'
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Send to Discord
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
} 