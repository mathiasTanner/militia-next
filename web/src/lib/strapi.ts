type NextFetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] }
  cache?: RequestCache
};

// Local dev (browser & server):
//   NEXT_PUBLIC_API_URL=http://localhost:1337
// Production (server):
//   INTERNAL_STRAPI_URL=http://127.0.0.1:4001
// Production (client):
//   same-origin '/api/...'

const isBrowser = typeof window !== 'undefined';

const API_BASE =
  process.env.NODE_ENV !== 'production'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337')
    : (isBrowser
        ? '' // client → same-origin (proxy will route /api to Strapi)
        : (process.env.INTERNAL_STRAPI_URL ?? 'http://127.0.0.1:4001') // server → talk to Strapi directly
      );

export async function fetchStrapi(path: string, opts?: NextFetchInit) {
  const url = `${API_BASE}${path}`; // e.g. '/api/posts?...'
  const res = await fetch(url, { next: { revalidate: 60 }, ...opts });
  if (!res.ok) throw new Error(`Strapi error ${res.status}`);
  return res.json();
}
