import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Maintenance</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #020617;
          color: #ffffff;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        h1 { font-size: 2.4rem; }
        p { opacity: 0.8; }
      </style>
    </head>
    <body>
      <div>
        <h1>🚧 Maintenance Mode</h1>
        <p>We are updating the system.<br/>Please come back later.</p>
      </div>
    </body>
  </html>
  `
  
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html' }
  })
}

export const config = {
  matcher: '/:path*'
}
