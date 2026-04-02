import type { Product, ProductCreate } from '../types/product'

const BASE = '/api/v1'

async function handleJson<T>(r: Response): Promise<T> {
  const text = await r.text()
  try {
    return JSON.parse(text) as T
  } catch {
    // If server returns non-JSON (e.g., 204), just return
    throw new Error(`Invalid JSON: ${text}`)
  }
}

export async function listProducts(): Promise<Product[]> {
  const r = await fetch(`${BASE}/products`, { method: 'GET', headers: { 'Accept': 'application/json' } })
  if (!r.ok) throw new Error(`Failed to fetch products: ${r.status} ${r.statusText}`)
  const body = await handleJson<{ data: Product[] }>(r)
  return body.data
}

export async function getProduct(id: string): Promise<Product> {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })
  if (!r.ok) throw new Error(`Failed to fetch product: ${r.status} ${r.statusText}`)
  const body = await handleJson<{ data: Product }>(r)
  return body.data
}

export async function createProduct(p: ProductCreate): Promise<Product> {
  const r = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ ...p }),
  })
  if (!r.ok) throw new Error(`Failed to create product: ${r.status} ${r.statusText}`)
  const body = await handleJson<{ data: Product }>(r)
  return body.data
}

export async function updateProduct(id: string, p: ProductCreate): Promise<Product> {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(p),
  })
  if (!r.ok) throw new Error(`Failed to update product: ${r.status} ${r.statusText}`)
  const body = await handleJson<{ data: Product }>(r)
  return body.data
}

export async function deleteProduct(id: string): Promise<void> {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  })
  if (!r.ok) throw new Error(`Failed to delete product: ${r.status} ${r.statusText}`)
  // Assume 204 No Content or empty body; nothing to return
}
