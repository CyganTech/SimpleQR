# SimpleQR

SimpleQR is a lightweight, static web page for generating QR codes from URLs directly in the browser.

## Usage
1. Open `index.html` in your web browser (double-click the file or serve it with any static web server).
2. Enter a URL in the input field.
3. Select **Generate** to render the QR code.

## Alpine Linux deployment (Nginx)
Because the app is static, an Alpine Linux LXC/container or VM works well. The steps below assume
you are using OpenRC (the Alpine default) and serving with Nginx.

### 1) Install Nginx
```bash
apk add --no-cache nginx
rc-update add nginx default
```

### 2) Deploy the files
```bash
mkdir -p /var/www/localhost/htdocs/simpleqr
rsync -a --delete ./ /var/www/localhost/htdocs/simpleqr/
```

### 3) Add an Nginx site
Create `/etc/nginx/http.d/simpleqr.conf`:
```
server {
    listen 8080;
    server_name _;

    root /var/www/localhost/htdocs/simpleqr;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Restart Nginx:
```bash
rc-service nginx restart
```

### 4) (Optional) Expose the container
Map a host port to the container's `8080` (via your LXC host), then browse to
`http://<host>:<port>`.

## Nginx Proxy Manager configuration
Serve SimpleQR with the Alpine Nginx instance above, then let Nginx Proxy Manager (NPM) handle TLS
and external traffic.

### 1) Create a Proxy Host
In NPM, create a new **Proxy Host**:
- **Domain Names**: your desired hostname (for example, `qr.example.com`).
- **Scheme**: `http`
- **Forward Hostname / IP**: the Alpine host IP (or `127.0.0.1` if NPM runs on the same host).
- **Forward Port**: `8080`.

Optional: under **SSL**, request/enable a certificate and toggle **Force SSL**.

### 2) Update files
From the repo directory on the Alpine host:
```bash
rsync -a --delete ./ /var/www/localhost/htdocs/simpleqr/
```

## Passing real client IPs (Cloudflare → NPM → Nginx)
If your DNS is behind Cloudflare, your origin will see Cloudflare IPs unless you trust the
`CF-Connecting-IP` header. Configure NPM to pass real IPs through to the upstream:

1) In NPM, open your **Proxy Host** → **Advanced** and add:
```
real_ip_header CF-Connecting-IP;
real_ip_recursive on;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
```

2) Restart NPM so it reloads the configuration.

Note: Cloudflare periodically updates IP ranges. If you want to keep the list current, replace the
`set_real_ip_from` list with an include file that you refresh from
`https://www.cloudflare.com/ips/`. For example:
```
real_ip_header CF-Connecting-IP;
real_ip_recursive on;
include /etc/nginx/conf.d/cloudflare_real_ips.conf;
```
Then download the current IPv4/IPv6 ranges into that include file whenever Cloudflare publishes
updates.

## Google Tag setup
Add your Google tag (gtag.js) snippet to `index.html` so page views are tracked.

1) In Google Tag Manager or Google Analytics, create a tag and copy your measurement ID (for
   example, `G-XXXXXXX`).
2) Add the snippet below to the `<head>` of `index.html` and replace `G-XXXXXXX` with your ID:
```
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

## Dependencies
- The QR code renderer is provided by the [`qrcodejs`](https://www.npmjs.com/package/qrcodejs) library.
- It is loaded via CDN from `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js` in `index.html`, so the page requires network access when first loaded. If you need offline usage, download the library and update the script tag to point to a local copy.
