export const CORRECTION = 'correction';
export const INTERRUPT = 'interrupt';
export const ASSISTANT = 'assistant';
export const USER = 'user';
export const PAUSE = 'pause';
export const NOTEXT = 'notext';
export const GENERATING_IMAGE = "generating_image";
export const STOP = "101e0198-ab6e-41f7-bd30-0649c2132bc1";
export const RETHINKING_MESSAGE = "rethinking";


// Device types
export const ANDROID_PHONE = "Android Phone";
export const ANDROID_TABLET = "Android Tablet";
export const IPHONE = "iPhone";
export const IPAD = "iPad";
export const MAC = "Mac";
export const WINDOWS = "Windows";
export const OTHER = "Other";


export const getDeviceType = () => {
  if (typeof navigator === 'undefined') {
    return OTHER;
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  const deviceType = {
    androidPhone: /android/i.test(userAgent) && /mobile/i.test(userAgent),
    androidTablet: /android/i.test(userAgent) && !/mobile/i.test(userAgent),
    iPhone: /iPhone/i.test(userAgent) && !(window as any).MSStream,
    iPad: /iPad/i.test(userAgent) && !(window as any).MSStream,
    mac: /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent),
    windows: /Win32|Win64|Windows|WinCE/.test(userAgent)
  };

  if (deviceType.androidPhone) {
    return ANDROID_PHONE;
  }

  if (deviceType.androidTablet) {
    return ANDROID_TABLET;
  }

  if (deviceType.iPhone) {
    return IPHONE;
  }

  if (deviceType.iPad) {
    return IPAD;
  }

  if (deviceType.mac) {
    return MAC;
  }

  if (deviceType.windows) {
    return WINDOWS;
  }

  return OTHER;
};
