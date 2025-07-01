/*-----------------------------------------------------------
  Cloudflare Worker – Hono proxy for the Cloudflare REST API for Kyno's website

  This is only used for the website anad not the mobile app.
  -----------------------------------------------------------
  • Any request that reaches the worker is proxied to
    https://api.cloudflare.com/client/v4/…

  • The incoming Authorization header (API-Token or API-Key)
    is forwarded unchanged.

  • On missing Authorization the worker answers 401.

  • Path & query-string are preserved:
      GET https://kp.xn--1-3fa.com/zones?per_page=50
      ⟶ GET https://api.cloudflare.com/client/v4/zones?per_page=50
-----------------------------------------------------------*/

import { Hono } from 'hono'
import { proxy } from 'hono/proxy'
import { cors } from 'hono/cors'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

const app = new Hono()

app.use(
	'*',
	cors({
	  origin: ['https://kyno.dev', 'http://localhost:3000'],
	})
)

app.all('*', async (c) => {
  // Validate credentials
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ message: 'Missing Authorization header.' }, 401)
  }

  // Proxy request
  const res = await proxy(
    `${CLOUDFLARE_API_BASE}/${c.req.path}`,
    {
      headers: {
        ...c.req.header(),
		"Access-Control-Allow-Origin": "kp.xn--1-3fa.com",
   	 	"Access-Control-Allow-Headers": "Content-Type, Authorization",
        Authorization: authHeader, 
      },
    }
  )
  res.headers.delete('Set-Cookie')
  return res
})

// Cloudflare entry-point
export default app