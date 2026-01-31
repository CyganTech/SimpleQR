# SimpleQR

SimpleQR is a lightweight, static web page for generating QR codes from URLs directly in the browser.

## Usage
1. Open `index.html` in your web browser.
2. Enter a URL in the input field.
3. Select **Generate** to render the QR code.

## Alpine Linux LXC container (Nginx)
Yes. Because the app is static, an Alpine Linux LXC container works well. The steps below assume
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
Map a host port to the container's `8080` (via your LXC host), then browse to `http://<host>:<port>`.

## Reliable Ubuntu VM deployment (Nginx Proxy Manager)
This app is static, so the most reliable setup is to serve the files directly with Nginx and let your
Nginx Proxy Manager instance route traffic to it.

### 1) Place the files on the VM
```bash
sudo mkdir -p /var/www/simpleqr
sudo rsync -a --delete ./ /var/www/simpleqr/
sudo chown -R www-data:www-data /var/www/simpleqr
```

### 2) Add a local Nginx site
Create `/etc/nginx/sites-available/simpleqr`:
```
server {
    listen 8080;
    server_name _;

    root /var/www/simpleqr;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/simpleqr /etc/nginx/sites-enabled/simpleqr
sudo nginx -t
sudo systemctl reload nginx
```

### 3) Proxy with Nginx Proxy Manager
In Nginx Proxy Manager, create a new Proxy Host:
- **Domain Names**: your desired hostname (for example, `qr.example.com`).
- **Scheme**: `http`
- **Forward Hostname / IP**: `127.0.0.1`
- **Forward Port**: `8080`

Optional: under **SSL**, request/enable a certificate and toggle **Force SSL**.

### 4) Updating the app
From the repo directory on the VM:
```bash
git pull
sudo rsync -a --delete ./ /var/www/simpleqr/
```

## Dependencies
- The QR code renderer is provided by the [`qrcodejs`](https://www.npmjs.com/package/qrcodejs) library.
- It is loaded via CDN from `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js` in `index.html`, so the page requires network access when first loaded. If you need offline usage, download the library and update the script tag to point to a local copy.
