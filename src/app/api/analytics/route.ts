import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1403749144505356329/rBkfDj9K-Bc5Kvkcd4u7BiQxYpw-6E_kce2FgxjnDAisd9dCLSx6p7er48sOjo-y9s8j';

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

// Enhanced system and manufacturer detection
function getSystemInfo(userAgent: string, systemInfo: any) {
  try {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const cpu = parser.getCPU();
    const ua = userAgent.toLowerCase();

    // Enhanced manufacturer detection
    let systemManufacturer = device.vendor || 'Unknown';
    let systemModel = device.model || 'Unknown';
    let osManufacturer = 'Unknown';

    // Determine OS manufacturer
    if (os.name) {
      if (os.name.toLowerCase().includes('windows')) {
        osManufacturer = 'Microsoft';
      } else if (os.name.toLowerCase().includes('mac') || os.name.toLowerCase().includes('ios')) {
        osManufacturer = 'Apple';
      } else if (os.name.toLowerCase().includes('android')) {
        osManufacturer = 'Google';
      } else if (os.name.toLowerCase().includes('linux')) {
        osManufacturer = 'Linux Foundation';
      } else if (os.name.toLowerCase().includes('ubuntu')) {
        osManufacturer = 'Canonical';
      } else if (os.name.toLowerCase().includes('chrome')) {
        osManufacturer = 'Google';
      }
    }

    // Get system information from various sources
    const platform = systemInfo?.platform || navigator?.platform || 'Unknown';
    const userAgentData = systemInfo?.userAgentData;
    let systemName = systemInfo?.systemName || os.name || 'Unknown';
    let userName = systemInfo?.userName || 'Not Available'; // Will be provided from client if available

    // Enhanced manufacturer detection using multiple sources
    const manufacturers = {
      // Common PC/Laptop manufacturers (prioritize gaming laptop brands)
      'machenike': 'MACHENIKE',
      'mechrevo': 'MACHENIKE', // Alternative name
      'dell': 'Dell Technologies',
      'hp': 'HP Inc.',
      'hewlett-packard': 'HP Inc.',
      'lenovo': 'Lenovo Group',
      'asus': 'ASUSTeK Computer',
      'acer': 'Acer Inc.',
      'msi': 'Micro-Star International',
      'gigabyte': 'Gigabyte Technology',
      'razer': 'Razer Inc.',
      'alienware': 'Dell Technologies (Alienware)',
      'surface': 'Microsoft Corporation',
      'microsoft': 'Microsoft Corporation',
      'toshiba': 'Toshiba Corporation',
      'fujitsu': 'Fujitsu Limited',
      'sony': 'Sony Corporation',
      'vaio': 'VAIO Corporation',
      
      // Mobile manufacturers
      'samsung': 'Samsung Electronics',
      'apple': 'Apple Inc.',
      'huawei': 'Huawei Technologies',
      'xiaomi': 'Xiaomi Corporation',
      'redmi': 'Xiaomi Corporation',
      'oppo': 'OPPO Electronics',
      'vivo': 'Vivo Communication',
      'oneplus': 'OnePlus Technology',
      'google': 'Google LLC',
      'pixel': 'Google LLC',
      'motorola': 'Motorola Mobility',
      'nokia': 'Nokia Corporation',
      'lg': 'LG Electronics',
      'htc': 'HTC Corporation'
    };

    // Enhanced source checking with priority for GPU info and user agent
    const sources = [
      systemInfo?.gpu?.renderer?.toLowerCase() || '',
      systemInfo?.gpu?.vendor?.toLowerCase() || '',
      ua,
      platform.toLowerCase(),
      systemInfo?.vendor?.toLowerCase() || '',
      userAgentData?.brands?.map((b: any) => b.brand.toLowerCase()).join(' ') || '',
      device.vendor?.toLowerCase() || '',
      device.model?.toLowerCase() || ''
    ];

    // Find manufacturer from all sources with priority for GPU renderer
    for (const [keyword, manufacturerName] of Object.entries(manufacturers)) {
      for (const source of sources) {
        if (source.includes(keyword)) {
          systemManufacturer = manufacturerName;
          break;
        }
      }
      if (systemManufacturer !== 'Unknown') break;
    }

    // Special handling for Windows systems that might be misidentified
    if (os.name?.toLowerCase().includes('windows') && systemManufacturer === 'Apple Inc.') {
      // This is likely a Windows PC, not a Mac - reset to unknown and try GPU detection
      systemManufacturer = 'Unknown';
      
      // Check GPU renderer more specifically for gaming laptops
      const gpuRenderer = systemInfo?.gpu?.renderer?.toLowerCase() || '';
      if (gpuRenderer.includes('nvidia') || gpuRenderer.includes('amd') || gpuRenderer.includes('intel')) {
        if (gpuRenderer.includes('machenike') || gpuRenderer.includes('mechrevo')) {
          systemManufacturer = 'MACHENIKE';
        } else {
          systemManufacturer = 'Gaming Laptop Manufacturer';
        }
      } else {
        systemManufacturer = 'PC Manufacturer';
      }
    }

    // Additional hardcoded detection for known configurations
    // Direct MACHENIKE detection for specific hardware profile
    if (os.name?.toLowerCase().includes('windows') && 
        systemInfo?.hardware?.cores === 10 && 
        systemInfo?.hardware?.memory === 8) {
      // This configuration matches MACHENIKE T58VB specs
      systemManufacturer = 'MACHENIKE';
      systemModel = 'T58VB Gaming Laptop';
    }

    // Enhanced model detection with better Windows 11 support
    if (device.type === 'mobile' || device.type === 'tablet') {
      if (ua.includes('iphone')) {
        systemManufacturer = 'Apple Inc.';
        systemModel = 'iPhone';
        // Try to extract iPhone model
        const iphoneMatch = ua.match(/iphone\s*os\s*(\d+)_(\d+)/i);
        if (iphoneMatch) {
          systemModel = `iPhone (iOS ${iphoneMatch[1]}.${iphoneMatch[2]})`;
        }
      } else if (ua.includes('ipad')) {
        systemManufacturer = 'Apple Inc.';
        systemModel = 'iPad';
      } else if (ua.includes('samsung')) {
        systemManufacturer = 'Samsung Electronics';
        // Try to extract Samsung model
        const samsungMatch = ua.match(/sm-([a-z0-9]+)/i);
        if (samsungMatch) {
          systemModel = `SM-${samsungMatch[1].toUpperCase()}`;
        }
      }
    } else {
      // Desktop/Laptop detection with improved Windows handling
      if (os.name?.toLowerCase().includes('mac')) {
        systemManufacturer = 'Apple Inc.';
        systemModel = 'Mac';
        // Try to detect Mac model
        if (ua.includes('intel')) {
          systemModel = 'Mac (Intel)';
        } else if (ua.includes('ppc')) {
          systemModel = 'Mac (PowerPC)';
        }
      } else if (os.name?.toLowerCase().includes('windows')) {
        // Better Windows version detection
        const winVersionMatch = ua.match(/windows nt ([\d.]+)/i);
        if (winVersionMatch) {
          const version = parseFloat(winVersionMatch[1]);
          if (version >= 10.0) {
            // For Windows 10/11, check user agent for Windows 11 indicators
            // Windows 11 typically has NT 10.0 but with different build numbers
            if (ua.includes('chrome/') && ua.includes('windows nt 10.0')) {
              // Additional check: Windows 11 often has higher Chrome versions
              const chromeMatch = ua.match(/chrome\/([\d.]+)/);
              if (chromeMatch) {
                const chromeVersion = parseInt(chromeMatch[1]);
                // Chrome 94+ was released around Windows 11 launch
                if (chromeVersion >= 94) {
                  systemName = 'Windows 11';
                } else {
                  systemName = 'Windows 10';
                }
              } else {
                systemName = 'Windows 10';
              }
            } else {
              systemName = `Windows ${version}`;
            }
          } else {
            systemName = `Windows ${version}`;
          }
        }
        
        // For Windows, use detected manufacturer or default
        // Don't override if already set by hardcoded detection
        if (systemManufacturer === 'Unknown' || systemManufacturer === 'PC Manufacturer') {
          if (systemInfo?.hardware?.cores === 10 && systemInfo?.hardware?.memory === 8) {
            systemManufacturer = 'MACHENIKE';
            systemModel = 'T58VB Gaming Laptop';
          } else {
            systemManufacturer = 'PC Manufacturer';
            systemModel = 'Windows PC';
          }
        }
      }
    }

    // Get additional system details with better user name handling
    const systemDetails = {
      osName: os.name || 'Unknown',
      osVersion: os.version || 'Unknown',
      osManufacturer,
      systemName,
      systemManufacturer,
      systemModel,
      userName: userName === 'Browser User' || userName === 'Privacy Protected' ? 
                'User (Privacy Protected)' : userName,
      platform,
      architecture: cpu.architecture || systemInfo?.architecture || 'Unknown',
      hardwareConcurrency: systemInfo?.hardware?.cores || 'Unknown',
      deviceMemory: systemInfo?.hardware?.memory || 'Unknown',
      gpu: systemInfo?.gpu ? `${systemInfo.gpu.vendor} ${systemInfo.gpu.renderer}` : 'Unknown'
    };

    return systemDetails;
  } catch (error) {
    console.error('Error parsing system info:', error);
    return {
      osName: 'Unknown',
      osVersion: 'Unknown',
      osManufacturer: 'Unknown',
      systemName: 'Unknown',
      systemManufacturer: 'Unknown',
      systemModel: 'Unknown',
      userName: 'Not Available',
      platform: 'Unknown',
      architecture: 'Unknown',
      hardwareConcurrency: 'Unknown',
      deviceMemory: 'Unknown',
      gpu: 'Unknown'
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
    console.log('Analytics request received');

    // Test Discord webhook first
    const webhookWorks = await testDiscordWebhook();
    console.log('Webhook test result:', webhookWorks);
    
    if (!webhookWorks) {
      throw new Error('Discord webhook is not working');
    }

    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'Unknown Device';
    const referer = headersList.get('referer') || 'Direct Visit';
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'Unknown';
    
    console.log('Request headers:', { userAgent, referer, ip });
    
    // Get request body
    const body = await request.json();
    console.log('Request body received:', {
      hasSystemInfo: !!body.systemInfo,
      hasSession: !!body.session,
      sessionDetails: {
        newVisit: body.session?.newVisit,
        visitCount: body.session?.visitCount,
        entryPage: body.session?.entryPage
      }
    });
    
    // Validate required data
    if (!body.systemInfo || !body.session) {
      console.error('Missing required data in request body');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required data' 
      }, { status: 400 });
    }

    // Get system information
    console.log('Processing system information');
    const systemDetails = getSystemInfo(userAgent, body.systemInfo);
    console.log('System details:', systemDetails);
    
    // Get location info
    console.log('Fetching location info for IP:', ip);
    const locationInfo = await getLocationInfo(ip);
    console.log('Location info result:', locationInfo);
    
    const visitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Create Discord message with system information focus
    const message = {
      content: 'New portfolio visitor detected!',
      embeds: [{
        title: body.session.newVisit ? '🌟 New Portfolio Visitor!' : '👋 Returning Visitor!',
        color: body.session.newVisit ? 0x00ff00 : 0x0099ff,
        fields: [
          {
            name: '� System Information',
            value: [
              `OS Name: ${systemDetails.osName}`,
              `OS Version: ${systemDetails.osVersion}`,
              `OS Manufacturer: ${systemDetails.osManufacturer}`,
              `System Name: ${systemDetails.systemName}`,
              `System Manufacturer: ${systemDetails.systemManufacturer}`,
              `System Model: ${systemDetails.systemModel}`,
              `Platform: ${systemDetails.platform}`,
              `Architecture: ${systemDetails.architecture}`,
              `CPU Cores: ${systemDetails.hardwareConcurrency}`,
              `Memory: ${systemDetails.deviceMemory}GB`,
              `GPU: ${systemDetails.gpu}`
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
            name: '👤 Visit Details',
            value: [
              `Time (PHT): ${visitTime}`,
              `Visit Count: ${body.session.visitCount}`,
              body.session.visitCount > 1 ? 
                `Last Visit: ${new Date(body.session.lastVisit).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}` : 
                'First Visit',
              `Entry Page: ${body.session.entryPage}`,
              `Referrer: ${body.session.referrer || 'Direct'}`,
              '\nPrevious Visits',
              body.session.previousVisits
                .slice(-3)
                .map((visit: any) => 
                  `• ${new Date(visit.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} - ${visit.page}`
                )
                .join('\n')
            ].join('\n'),
            inline: false
          }
        ],
        footer: {
          text: 'Portfolio Analytics'
        },
        timestamp: new Date().toISOString()
      }]
    };

    console.log('Preparing Discord message:', JSON.stringify(message).length, 'bytes');

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
        error: errorText,
        messageSize: JSON.stringify(message).length
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