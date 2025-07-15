import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import UAParser from 'ua-parser-js';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1392761855226810418/r3OzgKM7U3ZuOsg-Pv96Qt4QrLtDGGQSIH68jiJqw8XIvSJ00QKF23MgJ3NYz7qJx79_';

// Enhanced device detection using UAParser
function getDeviceInfo(userAgent: string) {
  const parser = new (UAParser as any)(userAgent);
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
}

// Get location from IP
async function getLocationInfo(ip: string) {
  try {
    // Use HTTPS for the IP API
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,query`);
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
    
    const visitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Get request body for network info
    const body = await request.json();
    const { 
      networkType,
      networkInfo,
      screenInfo,
      browserInfo,
      language,
      languages,
      platform,
      memory,
      cores,
      maxTouchPoints,
      timeZone,
      timeZoneOffset,
      features,
      performance,
      session
    } = body;

    console.log('Request body:', { networkType, browserInfo, platform, session });

    // Format performance metrics if available
    const performanceText = performance ? [
      `DNS Lookup: ${performance.dnsLookup}ms`,
      `TCP Connection: ${performance.tcpConnection}ms`,
      `Server Response: ${performance.serverResponse}ms`,
      `Page Load: ${performance.pageLoad}ms`,
      `DOM Interactive: ${performance.domInteractive}ms`,
      `First Paint: ${performance.firstPaint}ms`,
      `First Contentful Paint: ${performance.firstContentfulPaint}ms`
    ].join('\n') : 'Not Available';

    // Create Discord message with enhanced details
    const message = {
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
              `Resolution: ${screenInfo.resolution}`,
              `Color Depth: ${screenInfo.colorDepth}`,
              `Orientation: ${screenInfo.orientation}`,
              `Pixel Ratio: ${screenInfo.pixelRatio}x`,
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
          },
          {
            name: '⚡ Performance Metrics',
            value: performanceText,
            inline: false
          }
        ],
        footer: {
          text: 'Portfolio Analytics'
        },
        timestamp: new Date().toISOString()
      }]
    };

    console.log('Sending Discord message:', message);

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