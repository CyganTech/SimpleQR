# SimpleQR

SimpleQR is a lightweight, static web page for generating QR codes from URLs directly in the browser.

## Usage
1. Open `index.html` in your web browser.
2. Enter a URL in the input field.
3. Select **Generate** to render the QR code.

## Dependencies
- The QR code renderer is provided by the [`qrcodejs`](https://www.npmjs.com/package/qrcodejs) library.
- It is loaded via CDN from `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js` in `index.html`, so the page requires network access when first loaded. If you need offline usage, download the library and update the script tag to point to a local copy.
