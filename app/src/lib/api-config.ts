/**
 * Central API Configuration for MatchPoint
 * Dynamically resolves the API base URL depending on the environment.
 */

const getApiBaseUrl = (): string => {
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  
  if (typeof window !== 'undefined') {
    const win = window as any;
    
    // 1. Immediate User Agent detection (works instantly at module load time!)
    const isAndroidUA = /android/i.test(navigator.userAgent);
    
    // 2. Capacitor native platform detection (fallback / dynamic check)
    const isCapacitor = !!win.Capacitor;
    const isAndroidCapacitor = isCapacitor && win.Capacitor.getPlatform && win.Capacitor.getPlatform() === 'android';
    
    const isAndroid = isAndroidUA || isAndroidCapacitor;
    
    // In Android emulator/device, localhost/127.0.0.1 points to the device itself.
    // We redirect to 10.0.2.2 to reach the developer host machine's local server.
    if (isAndroid && (rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1'))) {
      return 'http://10.0.2.2:8080';
    }
  }
  return rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
};

export const API_BASE_URL = getApiBaseUrl();
