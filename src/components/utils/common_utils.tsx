export const getDeviceType = () => {
  if (typeof navigator === 'undefined') {
    return "Unknown";
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "iOS";
  }

  if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
    return "Mac";
  }

  return "Other";
};

export const CORRECTION = 'correction';
export const INTERRUPT = 'interrupt';
export const ASSISTANT = 'assistant';
export const USER = 'user';
export const PAUSE = 'pause';
export const NOTEXT = 'notext';
export const GENERATING_IMAGE = "generating_image";
export const STOP = "101e0198-ab6e-41f7-bd30-0649c2132bc1";
export const RETHINKING_MESSAGE = "rethinking";
