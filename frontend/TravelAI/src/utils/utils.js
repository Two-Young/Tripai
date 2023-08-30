var base64js = require('base64-js');

export const arrayBufferToBase64 = buffer => {
  var binary = '';
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return base64js.fromByteArray(bytes);
};
