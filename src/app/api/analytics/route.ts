import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1394523318765355111/DaQC8RZ4cIU5Nt6TPw-k9LAG_jPk-Z_5L4lXq6q6GCwt5G2uyqylVxzc6Xh2-3kC-obd';

// Test Discord webhook
async function testDiscordWebhook() {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message - Analytics webhook check'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook test failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Discord webhook test failed:', error);
    return false;
  }
}

// Enhanced device detection using UAParser
function getDeviceInfo(userAgent: string) {
  try {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const cpu = parser.getCPU();

    return {
      type: device.type || 'Desktop',
      brand: device.vendor || 'Unknown',
      model: device.model || os.name || 'Unknown',
      os: `${os.name || 'Unknown'} ${os.version || ''}`.trim(),
      browser: `${browser.name || 'Unknown'} ${browser.version || ''}`.trim(),
      cpu: cpu.architecture || 'Unknown'
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {
      type: 'Unknown',
      brand: 'Unknown',
      model: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
      cpu: 'Unknown'
    };
  }
}

// Get location from IP
async function getLocationInfo(ip: string) {
  if (!ip || ip === 'Unknown') {
    console.log('No IP address provided');
    return null;
  }

  try {
    // Use HTTPS for the IP API
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,query`);
    if (!response.ok) {
      throw new Error(`IP API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
        timezone: data.timezone,
        ip: data.query
      };
    }
    console.error('IP API Error:', data.message || 'Unknown error');
    return null;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Test Discord webhook first
    const webhookWorks = await testDiscordWebhook();
    if (!webhookWorks) {
      throw new Error('Discord webhook is not working');
    }

    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown Device';
    const referer = headersList.get('referer') || 'Direct Visit';
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Unknown';
    
    console.log('Processing analytics request:', { userAgent, referer, ip });
    
    // Get detailed device info from user agent
    const deviceInfo = getDeviceInfo(userAgent);
    console.log('Device info:', deviceInfo);
    
    // Get location info
    const locationInfo = await getLocationInfo(ip);
    console.log('Location info:', locationInfo);

    // Get request body for network info
    const body = await request.json();
    
    // Validate required fields
    if (!body) {
      throw new Error('No request body provided');
    }

    const { 
      networkType = 'Unknown',
      networkInfo = null,
      screenInfo = {},
      browserInfo = {},
      language = 'Unknown',
      languages = [],
      platform = 'Unknown',
      memory,
      cores,
      maxTouchPoints = 0,
      timeZone = 'Unknown',
      timeZoneOffset = 0,
      features = {},
      performance = null,
      session = { newVisit: true, visitCount: 1, lastVisit: null }
    } = body;

    console.log('Request body:', { networkType, browserInfo, platform, session });

    const visitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Create Discord message with enhanced details
    const message = {
      content: 'New analytics event received!',
      embeds: [{
        title: session.newVisit ? '🌟 New Portfolio Visitor!' : '👋 Returning Visitor!',
        color: session.newVisit ? 0x00ff00 : 0x0099ff,
        fields: [
          {
            name: '📱 Device Details',
            value: [
              `Type: ${deviceInfo.type}`,
              `Brand: ${deviceInfo.brand}`,
              `Model: ${deviceInfo.model}`,
              `OS: ${deviceInfo.os}`,
              `CPU: ${deviceInfo.cpu}`,
              `Platform: ${platform}`,
              `CPU Cores: ${cores || 'Unknown'}`,
              `Memory: ${memory ? Math.round(memory) + 'GB' : 'Unknown'}`,
              `Touch Points: ${maxTouchPoints}`
            ].join('\n'),
            inline: false
          },
          {
            name: '📍 Location',
            value: locationInfo ? [
              `City: ${locationInfo.city}`,
              `Region: ${locationInfo.region}`,
              `Country: ${locationInfo.country}`,
              `IP: ${locationInfo.ip}`,
              `Timezone: ${locationInfo.timezone}`
            ].join('\n') : 'Location Unknown',
            inline: false
          },
          {
            name: '🌐 Network & Browser',
            value: [
              `Connection: ${networkType}`,
              `Browser: ${deviceInfo.browser}`,
              `Engine: ${browserInfo?.engine || 'Unknown'}`,
              `Languages: ${languages?.join(', ') || language || 'Unknown'}`
            ].join('\n'),
            inline: false
          },
          {
            name: '🖥️ Display & Features',
            value: [
              `Resolution: ${screenInfo.resolution || 'Unknown'}`,
              `Color Depth: ${screenInfo.colorDepth || 'Unknown'}`,
              `Orientation: ${screenInfo.orientation || 'Unknown'}`,
              `Pixel Ratio: ${screenInfo.pixelRatio || 'Unknown'}x`,
              '\nFeature Support:',
              `WebGL: ${features.webGL ? '✅' : '❌'}`,
              `WebP: ${features.webP ? '✅' : '❌'}`,
              `Touch: ${features.touch ? '✅' : '❌'}`
            ].join('\n'),
            inline: true
          },
          {
            name: '⏰ Visit Details',
            value: [
              `Time (PHT): ${visitTime}`,
              `Time Zone: ${timeZone}`,
              `Visit Count: ${session.visitCount}`,
              session.visitCount > 1 ? `Last Visit: ${new Date(session.lastVisit).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}` : 'First Visit',
              `Referrer: ${referer}`
            ].join('\n'),
            inline: true
          }
        ],
        footer: {
          text: 'Portfolio Analytics'
        },
        timestamp: new Date().toISOString()
      }]
    };

    console.log('Sending Discord message');

    // Send to Discord webhook
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API Error:', {
        status: discordResponse.status,
        statusText: discordResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to send to Discord webhook: ${discordResponse.status} ${discordResponse.statusText}`);
    }

    console.log('Successfully sent to Discord');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to track analytics'
    }, { status: 500 });
  }
} 