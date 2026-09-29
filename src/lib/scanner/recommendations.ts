import { CodeSnippet } from './types';

export const FIX_SNIPPETS: Record<string, CodeSnippet[]> = {
  hsts: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess or httpd.conf)',
      code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`,
    },
    {
      technology: 'cloudflare',
      title: 'Cloudflare SSL/TLS Settings',
      code: `Enable "HTTP Strict Transport Security (HSTS)" in SSL/TLS -> Edge Certificates.
Set Max-Age to 12 months, enable "Include Subdomains" and "Preload".`,
    },
    {
      technology: 'nextjs',
      title: 'Next.js (next.config.mjs)',
      code: `const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
export default nextConfig;`,
    },
  ],
  csp: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess)',
      code: `Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';"`,
    },
    {
      technology: 'nextjs',
      title: 'Next.js (next.config.mjs)',
      code: `const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};`,
    },
  ],
  xContentTypeOptions: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header X-Content-Type-Options "nosniff" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess)',
      code: `Header always set X-Content-Type-Options "nosniff"`,
    },
    {
      technology: 'express',
      title: 'Express.js (Helmet)',
      code: `const helmet = require('helmet');
app.use(helmet.noSniff());`,
    },
  ],
  xFrameOptions: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header X-Frame-Options "DENY" always;
# Or allow your own domain only:
# add_header X-Frame-Options "SAMEORIGIN" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess)',
      code: `Header always set X-Frame-Options "DENY"`,
    },
    {
      technology: 'express',
      title: 'Express.js',
      code: `app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});`,
    },
  ],
  referrerPolicy: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess)',
      code: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
    },
  ],
  permissionsPolicy: [
    {
      technology: 'nginx',
      title: 'Nginx Configuration',
      code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;`,
    },
    {
      technology: 'apache',
      title: 'Apache (.htaccess)',
      code: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"`,
    },
  ],
  serverTokens: [
    {
      technology: 'nginx',
      title: 'Nginx (nginx.conf)',
      code: `# Inside http block
server_tokens off;`,
    },
    {
      technology: 'apache',
      title: 'Apache (httpd.conf)',
      code: `ServerTokens Prod
ServerSignature Off`,
    },
    {
      technology: 'express',
      title: 'Express.js',
      code: `app.disable('x-powered-by');`,
    },
  ],
  cookies: [
    {
      technology: 'express',
      title: 'Express Session / Cookie Flag Fix',
      code: `app.use(session({
  secret: 'your-secret',
  cookie: {
    secure: true,       // Force HTTPS
    httpOnly: true,     // Block client JS access
    sameSite: 'lax',    // CSRF protection
    maxAge: 86400000    // 1 day expiration
  }
}));`,
    },
    {
      technology: 'nextjs',
      title: 'Next.js Set-Cookie Response',
      code: `// In Next.js route handler:
cookies().set({
  name: 'auth_session',
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});`,
    },
  ],
  securityTxt: [
    {
      technology: 'nginx',
      title: 'Publish RFC 9116 security.txt',
      code: `# Create file at /.well-known/security.txt
Contact: mailto:security@yourdomain.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Policy: https://yourdomain.com/security-policy`,
    },
  ],
  dnsCaa: [
    {
      technology: 'cloudflare',
      title: 'DNS CAA Record Creation',
      code: `Type: CAA
Name: @
Tag: issue
Value: "letsencrypt.org"

Type: CAA
Name: @
Tag: issuewild
Value: ";"  # Or "letsencrypt.org" to allow wildcards`,
    },
  ],
};
