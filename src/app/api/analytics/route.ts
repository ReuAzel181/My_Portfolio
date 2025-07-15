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

// Enhanced device detection using UAParser and additional checks
function getDeviceInfo(userAgent: string) {
  try {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const cpu = parser.getCPU();
    const ua = userAgent.toLowerCase();

    // Enhanced brand detection
    let brand = device.vendor || 'Unknown';
    let model = device.model || 'Unknown';

    // Detect PC manufacturers
    if (brand === 'Unknown' && !device.type) {
      if (ua.includes('lenovo')) {
        brand = 'Lenovo';
      } else if (ua.includes('dell')) {
        brand = 'Dell';
      } else if (ua.includes('hp') || ua.includes('hewlett-packard')) {
        brand = 'HP';
      } else if (ua.includes('asus')) {
        brand = 'ASUS';
      } else if (ua.includes('acer')) {
        brand = 'Acer';
      } else if (ua.includes('msi')) {
        brand = 'MSI';
      } else if (os.name === 'Windows') {
        brand = 'PC';
        model = 'Windows PC';
      } else if (os.name === 'Mac OS') {
        brand = 'Apple';
        model = 'Mac';
      }
    }

    // Enhanced mobile detection
    if (device.type === 'mobile' || device.type === 'tablet') {
      if (ua.includes('iphone')) {
        brand = 'Apple';
        model = 'iPhone';
      } else if (ua.includes('ipad')) {
        brand = 'Apple';
        model = 'iPad';
      } else if (ua.includes('samsung')) {
        brand = 'Samsung';
        if (ua.includes('sm-')) {
          model = ua.split('sm-')[1].split(' ')[0].toUpperCase();
        }
      } else if (ua.includes('huawei')) {
        brand = 'Huawei';
      } else if (ua.includes('xiaomi') || ua.includes('redmi')) {
        brand = 'Xiaomi';
      } else if (ua.includes('oppo')) {
        brand = 'OPPO';
      } else if (ua.includes('vivo')) {
        brand = 'Vivo';
      } else if (ua.includes('oneplus')) {
        brand = 'OnePlus';
      } else if (ua.includes('pixel')) {
        brand = 'Google';
        model = 'Pixel';
      }
    }

    return {
      type: device.type || 'Desktop',
      brand,
      model,
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

// Get location from IP using multiple fallback services
async function getLocationInfo(ip: string) {
  if (!ip || ip === 'Unknown') {
    console.log('No IP address provided');
    return null;
  }

  // Try multiple IP geolocation services
  const services = [
    {
      url: `https://ipapi.co/${ip}/json/`,
      transform: (data: any) => ({
        city: data.city,
        region: data.region,
        country: data.country_name,
        timezone: data.timezone,
        ip: data.ip
      })
    },
    {
      url: `https://ipwho.is/${ip}`,
      transform: (data: any) => ({
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone.id,
        ip: data.ip
      })
    },
    {
      url: `https://ipinfo.io/${ip}/json`,
      transform: (data: any) => ({
        city: data.city,
        region: data.region,
        country: data.country,
        timezone: data.timezone,
        ip: data.ip
      })
    }
  ];

  for (const service of services) {
    try {
      console.log(`Trying to get location from ${service.url}`);
      const response = await fetch(service.url);
      
      if (!response.ok) {
        console.log(`Service ${service.url} failed with status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.error || data.status === 'fail') {
        console.log(`Service ${service.url} returned error:`, data);
        continue;
      }

      const locationData = service.transform(data);
      console.log('Successfully got location data:', locationData);
      return locationData;
    } catch (error) {
      console.error(`Error with service ${service.url}:`, error);
      continue;
    }
  }

  console.error('All location services failed');
  return null;
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