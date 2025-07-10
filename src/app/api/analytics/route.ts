import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1392761855226810418/r3OzgKM7U3ZuOsg-Pv96Qt4QrLtDGGQSIH68jiJqw8XIvSJ00QKF23MgJ3NYz7qJx79_';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown Device';
    const referer = headersList.get('referer') || 'Direct Visit';
    
    // Get detailed device info from user agent
    const deviceInfo = getDeviceInfo(userAgent);
    
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
              `Platform: ${platform}`,
              `CPU Cores: ${cores || 'Unknown'}`,
              `Memory: ${memory ? Math.round(memory) + 'GB' : 'Unknown'}`,
              `Touch Points: ${maxTouchPoints}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🌐 Network & Browser',
            value: [
              `Connection: ${networkType}`,
              networkInfo ? `Speed: ${networkInfo.downlink}` : '',
              networkInfo ? `Latency: ${networkInfo.rtt}` : '',
              networkInfo?.saveData ? '(Data Saver On)' : '',
              `Browser: ${browserInfo.name} ${browserInfo.version}`,
              `Engine: ${browserInfo.engine}`,
              `Languages: ${languages || language}`
            ].filter(Boolean).join('\n'),
            inline: true
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

function getDeviceInfo(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let brand = 'Unknown';
  let model = 'Unknown';
  let type = 'Desktop';
  let os = 'Unknown';

  // Detect OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'MacOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect device type
  if (ua.includes('mobile')) {
    type = 'Mobile';
    // Detect common mobile brands
    if (ua.includes('iphone')) {
      brand = 'Apple';
      model = 'iPhone';
    } else if (ua.includes('samsung')) {
      brand = 'Samsung';
      if (ua.includes('sm-')) {
        model = ua.split('sm-')[1].split(' ')[0].toUpperCase();
      }
    } else if (ua.includes('huawei')) {
      brand = 'Huawei';
    } else if (ua.includes('xiaomi')) {
      brand = 'Xiaomi';
    } else if (ua.includes('oppo')) {
      brand = 'OPPO';
    } else if (ua.includes('vivo')) {
      brand = 'Vivo';
    }
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    type = 'Tablet';
    if (ua.includes('ipad')) {
      brand = 'Apple';
      model = 'iPad';
    }
  } else {
    if (ua.includes('macintosh')) {
      brand = 'Apple';
      model = 'Mac';
    } else if (ua.includes('windows')) {
      brand = 'PC';
      model = 'Windows';
    }
  }

  return { type, brand, model, os };
} 