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