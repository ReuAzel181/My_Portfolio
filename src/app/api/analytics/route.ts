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
function getDeviceInfo(userAgent: string, systemInfo: any) {
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

    // Get GPU info if available
    const gpuInfo = systemInfo?.capabilities?.gpu;
    const gpuVendor = gpuInfo?.vendor?.toLowerCase() || '';
    const gpuRenderer = gpuInfo?.renderer?.toLowerCase() || '';

    // Detect PC manufacturers from GPU and system info
    if (brand === 'Unknown' && !device.type) {
      // Check GPU info for brand hints
      if (gpuRenderer.includes('nvidia') && gpuRenderer.includes('laptop')) {
        if (gpuRenderer.includes('machenike')) {
          brand = 'Machenike';
          model = 'Gaming Laptop';
        }
      }

      // Check common PC manufacturers
      const manufacturers = {
        'machenike': 'Machenike',
        'lenovo': 'Lenovo',
        'dell': 'Dell',
        'hp': 'HP',
        'hewlett-packard': 'HP',
        'asus': 'ASUS',
        'acer': 'Acer',
        'msi': 'MSI',
        'razer': 'Razer',
        'gigabyte': 'Gigabyte',
        'samsung': 'Samsung',
        'toshiba': 'Toshiba',
        'fujitsu': 'Fujitsu',
        'huawei': 'Huawei',
        'microsoft': 'Microsoft'
      };

      // Check user agent and vendor info
      for (const [keyword, brandName] of Object.entries(manufacturers)) {
        if (ua.includes(keyword) || 
            systemInfo?.capabilities?.vendor?.toLowerCase().includes(keyword) ||
            gpuVendor.includes(keyword) || 
            gpuRenderer.includes(keyword)) {
          brand = brandName;
          model = 'PC';
          break;
        }
      }

      // If still unknown, try to get more specific
      if (brand === 'Unknown') {
        if (os.name === 'Windows') {
          // Check if gaming laptop based on GPU
          if (gpuRenderer.includes('nvidia') && gpuRenderer.includes('laptop')) {
            brand = 'Gaming Laptop';
            model = `${gpuRenderer.split('nvidia')[1].split('laptop')[0].trim()} GPU`;
          } else {
            brand = 'PC';
            model = 'Windows PC';
          }
        } else if (os.name === 'Mac OS') {
          brand = 'Apple';
          model = 'Mac';
        }
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

    // Get additional hardware details
    const hardwareInfo = {
      gpu: gpuInfo ? `${gpuInfo.vendor} ${gpuInfo.renderer}` : 'Unknown',
      cores: systemInfo?.capabilities?.hardwareConcurrency || 'Unknown',
      memory: systemInfo?.capabilities?.deviceMemory ? `${systemInfo.capabilities.deviceMemory}GB` : 'Unknown',
      battery: systemInfo?.capabilities?.battery ? 'Available' : 'N/A',
      bluetooth: systemInfo?.capabilities?.bluetooth ? 'Available' : 'N/A',
      touchscreen: systemInfo?.capabilities?.maxTouchPoints > 0 ? 'Yes' : 'No'
    };

    return {
      type: device.type || 'Desktop',
      brand,
      model,
      os: `${os.name || 'Unknown'} ${os.version || ''}`.trim(),
      browser: `${browser.name || 'Unknown'} ${browser.version || ''}`.trim(),
      cpu: cpu.architecture || 'Unknown',
      hardware: hardwareInfo,
      windowManager: systemInfo?.windowManager || 'Unknown',
      theme: systemInfo?.systemTheme || 'Unknown'
    };
  } catch (error) {
    console.error('Error parsing device info:', error);
    return {
      type: 'Unknown',
      brand: 'Unknown',
      model: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
      cpu: 'Unknown',
      hardware: {
        gpu: 'Unknown',
        cores: 'Unknown',
        memory: 'Unknown',
        battery: 'N/A',
        bluetooth: 'N/A',
        touchscreen: 'No'
      },
      windowManager: 'Unknown',
      theme: 'Unknown'
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

    // Get location info
    console.log('Fetching location info for IP:', ip);
    const locationInfo = await getLocationInfo(ip);
    console.log('Location info result:', locationInfo);
    
    const visitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    // Format system info for display
    const formatSystemInfo = (info: any) => {
      if (!info) return 'Not Available';

      const sections = [];

      // Hardware Info
      if (info.hardware) {
        const hw = info.hardware;
        sections.push(
          '💻 Hardware:',
          `CPU: ${hw.cores} cores`,
          `Memory: ${hw.memory}GB`,
          `GPU: ${info.gpu?.renderer || 'Unknown'}`,
          `Primary Input: ${hw.primaryInput}`,
          `Audio Support: ${Object.entries(hw.audioCodecs)
            .filter(([, supported]) => supported)
            .map(([codec]) => codec.toUpperCase())
            .join(', ')}`,
          `Video Support: ${Object.entries(hw.videoCodecs)
            .filter(([, supported]) => supported)
            .map(([codec]) => codec.toUpperCase())
            .join(', ')}`
        );
      }

      // Screen Info
      if (info.screen) {
        const screen = info.screen;
        sections.push(
          '🖥️ Display:',
          `Resolution: ${screen.resolution}`,
          `Available: ${screen.availWidth}x${screen.availHeight}`,
          `Color Depth: ${screen.colorDepth}`,
          `Color Gamut: ${screen.colorGamut}`,
          `Refresh Rate: ${screen.refreshRate}Hz`,
          `HDR: ${screen.prefersDarkMode ? 'Yes' : 'No'}`,
          `Reduced Motion: ${screen.prefersReducedMotion ? 'Yes' : 'No'}`,
          `High Contrast: ${screen.prefersContrast ? 'Yes' : 'No'}`
        );
      }

      // Browser Capabilities
      if (info.browser) {
        const browser = info.browser;
        sections.push(
          '🌐 Browser Capabilities:',
          `Security Context: ${browser.hasSecureContext ? 'Secure' : 'Insecure'}`,
          `Storage Quota: ${formatBytes(browser.storageQuota?.quota || 0)}`,
          `Storage Used: ${formatBytes(browser.storageQuota?.usage || 0)}`,
          `Media Devices: ${formatMediaDevices(browser.mediaDevices)}`,
          `Permissions: ${formatPermissions(browser.permissions)}`
        );
      }

      // System Environment
      sections.push(
        '🔧 System Environment:',
        `Locale: ${info.locale}`,
        `Time Zone: ${info.timeZone}`,
        `Platform: ${info.platform}`,
        `Window Manager: ${info.windowManager}`,
        `Theme: ${info.systemTheme}`
      );

      // Battery Status
      if (info.batteryInfo) {
        const battery = info.batteryInfo;
        sections.push(
          '🔋 Battery:',
          `Status: ${battery.charging ? 'Charging' : 'Discharging'}`,
          `Level: ${Math.round(battery.level * 100)}%`,
          battery.charging ? 
            `Time until full: ${formatTime(battery.chargingTime)}` :
            `Time remaining: ${formatTime(battery.dischargingTime)}`
        );
      }

      // Performance Metrics
      if (info.performance?.metrics) {
        const perf = info.performance.metrics;
        sections.push(
          '⚡ Performance:',
          `DNS Lookup: ${perf.dnsLookup}ms`,
          `TCP Connection: ${perf.tcpConnection}ms`,
          `TLS Setup: ${perf.tlsNegotiation}ms`,
          `Server Response: ${perf.serverResponse}ms`,
          `Content Download: ${perf.contentDownload}ms`,
          `DOM Interactive: ${perf.domInteractive}ms`,
          `Page Load: ${perf.totalPageLoad}ms`
        );
      }

      // Installed Fonts (truncated)
      if (info.fonts?.length) {
        sections.push(
          '🔤 Fonts:',
          info.fonts.slice(0, 5).join(', ') + 
          (info.fonts.length > 5 ? ` (and ${info.fonts.length - 5} more...)` : '')
        );
      }

      return sections.join('\n');
    };

    // Helper function to format bytes
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    // Helper function to format time
    const formatTime = (seconds: number) => {
      if (seconds === Infinity) return 'Unknown';
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    // Helper function to format media devices
    const formatMediaDevices = (devices: any) => {
      if (!devices) return 'None';
      return [
        devices.audioInputs && `${devices.audioInputs} mic(s)`,
        devices.audioOutputs && `${devices.audioOutputs} speaker(s)`,
        devices.videoInputs && `${devices.videoInputs} camera(s)`
      ].filter(Boolean).join(', ');
    };

    // Helper function to format permissions
    const formatPermissions = (permissions: any) => {
      if (!permissions) return 'None';
      return Object.entries(permissions)
        .filter(([, state]) => state === 'granted')
        .map(([name]) => name)
        .join(', ');
    };

    // Create Discord message with enhanced details
    const message = {
      content: 'New analytics event received!',
      embeds: [{
        title: body.session.newVisit ? '🌟 New Portfolio Visitor!' : '👋 Returning Visitor!',
        color: body.session.newVisit ? 0x00ff00 : 0x0099ff,
        fields: [
          {
            name: '📱 System Information',
            value: [
              '💻 Hardware:',
              `CPU: ${body.systemInfo?.hardware?.cores || 'Unknown'} cores`,
              `Memory: ${body.systemInfo?.hardware?.memory || 'Unknown'}GB`,
              `GPU: ${body.systemInfo?.gpu?.renderer || 'Unknown'}`,
              `Primary Input: ${body.systemInfo?.hardware?.primaryInput || 'Unknown'}`,
              `Audio Support: ${Object.entries(body.systemInfo?.hardware?.audioCodecs || {})
                .filter(([, supported]) => supported)
                .map(([codec]) => codec.toUpperCase())
                .join(', ')}`,
              `Video Support: ${Object.entries(body.systemInfo?.hardware?.videoCodecs || {})
                .filter(([, supported]) => supported)
                .map(([codec]) => codec.toUpperCase())
                .join(', ')}`,
              '\n🖥️ Display:',
              `Resolution: ${body.systemInfo?.screen?.resolution || 'Unknown'}`,
              `Available: ${body.systemInfo?.screen?.availWidth || 0}x${body.systemInfo?.screen?.availHeight || 0}`,
              `Color Depth: ${body.systemInfo?.screen?.colorDepth || 'Unknown'}`,
              `Color Gamut: ${body.systemInfo?.screen?.colorGamut || 'Unknown'}`,
              `Refresh Rate: ${body.systemInfo?.screen?.refreshRate || 'Unknown'}Hz`,
              `HDR: ${body.systemInfo?.screen?.prefersDarkMode ? 'Yes' : 'No'}`,
              `Reduced Motion: ${body.systemInfo?.screen?.prefersReducedMotion ? 'Yes' : 'No'}`,
              `High Contrast: ${body.systemInfo?.screen?.prefersContrast ? 'Yes' : 'No'}`,
              '\n🌐 Browser Capabilities:',
              `Security Context: ${body.systemInfo?.browser?.hasSecureContext ? 'Secure' : 'Insecure'}`,
              `Storage Quota: ${formatBytes(body.systemInfo?.browser?.storageQuota?.quota || 0)}`,
              `Storage Used: ${formatBytes(body.systemInfo?.browser?.storageQuota?.usage || 0)}`,
              `Media Devices: ${formatMediaDevices(body.systemInfo?.browser?.mediaDevices)}`,
              `Permissions: ${Object.entries(body.systemInfo?.browser?.permissions || {})
                .filter(([, state]) => state === 'granted')
                .map(([name]) => name)
                .join(', ')}`,
              '\n🔧 System Environment:',
              `Locale: ${body.systemInfo?.locale || 'Unknown'}`,
              `Time Zone: ${body.systemInfo?.timeZone || 'Unknown'}`,
              `Platform: ${body.systemInfo?.platform || 'Unknown'}`,
              `Theme: ${body.systemInfo?.theme || 'Unknown'}`,
              body.systemInfo?.battery ? [
                '\n🔋 Battery:',
                `Status: ${body.systemInfo.battery.charging ? 'Charging' : 'Discharging'}`,
                `Level: ${Math.round((body.systemInfo.battery.level || 0) * 100)}%`,
                body.systemInfo.battery.charging ? 
                  `Time until full: ${formatTime(body.systemInfo.battery.chargingTime)}` :
                  `Time remaining: ${formatTime(body.systemInfo.battery.dischargingTime)}`
              ].join('\n') : '',
              body.systemInfo?.performance ? [
                '\n⚡ Performance:',
                `DNS Lookup: ${body.systemInfo.performance.dnsLookup}ms`,
                `TCP Connection: ${body.systemInfo.performance.tcpConnection}ms`,
                `TLS Setup: ${body.systemInfo.performance.tlsNegotiation}ms`,
                `Server Response: ${body.systemInfo.performance.serverResponse}ms`,
                `Content Download: ${body.systemInfo.performance.contentDownload}ms`,
                `DOM Interactive: ${body.systemInfo.performance.domInteractive}ms`,
                `Page Load: ${body.systemInfo.performance.totalPageLoad}ms`
              ].join('\n') : ''
            ].filter(Boolean).join('\n').slice(0, 1024),
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
              '\nPrevious Visits:',
              body.session.previousVisits
                .slice(-3)
                .map((visit: any) => 
                  `• ${new Date(visit.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Manila' })} - ${visit.page}`
                )
                .join('\n')
            ].join('\n'),
            inline: false
          },
          {
            name: '🔍 Session Activity',
            value: [
              `Duration: ${formatTime((Date.now() - body.session.startTime) / 1000)}`,
              '\nInteractions:',
              `Clicks: ${body.session.interactions.clicks || 0}`,
              `Scrolls: ${body.session.interactions.scrolls || 0}`,
              `Keystrokes: ${body.session.interactions.keystrokes || 0}`,
              `Mouse Movements: ${body.session.interactions.mouseMovements || 0}`
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