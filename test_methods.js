const YtDlpWrap = require('yt-dlp-wrap');
const wrapper = new YtDlpWrap();
console.log('Methods on wrapper:', Object.getOwnPropertyNames(Object.getPrototypeOf(wrapper)));
console.log('Methods on class:', Object.getOwnPropertyNames(YtDlpWrap));
