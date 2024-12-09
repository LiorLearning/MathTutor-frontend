// next.config.js
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/api/proxy',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      }
    ];
  },
};
// GET http://127.0.0.1:8000/proxy?url=https://mathtutor-images.s3.us-east-1.amazonaws.com/audio/jessica.mp3 net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep

// Uncaught (in promise) DataCloneError: Failed to execute 'postMessage' on 'Worker': SharedArrayBuffer transfer requires self.crossOriginIsolated.
// at iframe.main.fc837ba8.js:1:78426
// at new Promise (<anonymous>)
// at _0x22b8be (iframe.main.fc837ba8.js:1:77727)
// at Object.apply (iframe.main.fc837ba8.js:1:75697)
// at _0x1e9be3.init (iframe.main.fc837ba8.js:4:38574)