'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

const CATEGORIES = ["All", "Men's Wear", "Women's Wear", "Kids' Wear"]
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', '2-3Y', '4-5Y', '6-7Y', '8-9Y', '0-1Y', '1-2Y', '2-3Y', '0-3M', '3-6M', '6-12M', '5-6Y', '7-8Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y']
const PER_PAGE = 20

export default function AdminProducts() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', description: '', price: '', sale_price: '', category: "Men's Wear",
    sizes: [] as string[], stock: '', image_urls: [] as string[]
  })

  // Filters & Search
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchProducts()
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  // Filtered products
  const filtered = products.filter(p => {
    if (category !== 'All' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'price-high') return b.price - a.price
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size]
    }))
  }

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', sale_price: '', category: "Men's Wear", sizes: [], stock: '', image_urls: [] })
    setPreviewImages([])
    setEditId(null)
  }

  const handleImageUpload = async (e: any) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of files) {
      const ext = (file as File).name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data } = await supabase.storage.from('product-images').upload(fileName, file as File)
      if (data) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
        if (urlData?.publicUrl) urls.push(urlData.publicUrl)
      }
    }
    setForm(f => ({ ...f, image_urls: [...f.image_urls, ...urls] }))
    setPreviewImages(prev => [...prev, ...urls])
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) { setMessage({ text: 'Name and price are required', type: 'error' }); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseInt(form.price) || 0,
      sale_price: form.sale_price ? parseInt(form.sale_price) : null,
      category: form.category,
      sizes: form.sizes,
      stock: parseInt(form.stock) || 0,
      image_url: form.image_urls[0] || null,
      image_urls: form.image_urls,
    }
    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId)
      if (error) setMessage({ text: error.message, type: 'error' })
      else { setMessage({ text: 'Product updated!', type: 'success' }); setShowForm(false); resetForm() }
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, id: crypto.randomUUID() })
      if (error) setMessage({ text: error.message, type: 'error' })
      else { setMessage({ text: 'Product created!', type: 'success' }); setShowForm(false); resetForm() }
    }
    setSaving(false)
    fetchProducts()
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleEdit = (product: any) => {
    setForm({
      name: product.name, description: product.description || '',
      price: String(product.price), sale_price: product.sale_price ? String(product.sale_price) : '',
      category: product.category, sizes: product.sizes || [],
      stock: String(product.stock), image_urls: product.image_urls || [product.image_url].filter(Boolean)
    })
    setPreviewImages(product.image_urls || [product.image_url].filter(Boolean))
    setEditId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', id)
    setMessage({ text: 'Product deleted', type: 'success' })
    fetchProducts()
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const lowStock = products.filter(p => p.stock < 5).length

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">{products.length} products · {lowStock} low stock</p>
        </div>
        <button className="btn-admin-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>

      {/* Toast */}
      {message.text && (
        <div className="admin-toast" style={{ background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: message.type === 'error' ? 'var(--admin-red)' : 'var(--admin-green)', border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 280px' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="admin-search" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: '100%' }} />
        </div>
        <select className="admin-input" style={{ width: 160, padding: '9px 12px' }} value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="admin-input" style={{ width: 160, padding: '9px 12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="price-high">Price: High to Low</option>
          <option value="price-low">Price: Low to High</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => { setShowForm(false); resetForm() }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'auto', padding: 32 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ font: '600 20px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Product Name *</label>
                <input className="admin-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Classic Cotton T-Shirt" />
              </div>
              <div>
                <label className="admin-label">Category *</label>
                <select className="admin-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Stock</label>
                <input className="admin-input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="admin-label">Price (Rs.) *</label>
                <input className="admin-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="999" />
              </div>
              <div>
                <label className="admin-label">Sale Price (Rs.)</label>
                <input className="admin-input" type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="Optional" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Description</label>
                <textarea className="admin-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." style={{ resize: 'vertical' }} />
              </div>
            </div>

            {/* Sizes */}
            <div style={{ marginBottom: 16 }}>
              <label className="admin-label">Sizes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_SIZES.map(size => (
                  <button key={size} onClick={() => toggleSize(size)} style={{
                    padding: '5px 12px', borderRadius: 6, border: '1px solid',
                    borderColor: form.sizes.includes(size) ? 'var(--admin-accent)' : 'var(--admin-border)',
                    background: form.sizes.includes(size) ? 'var(--admin-accent-dim)' : 'transparent',
                    color: form.sizes.includes(size) ? 'var(--admin-accent)' : 'var(--admin-text-soft)',
                    font: '500 12px var(--admin-font-ui)', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{size}</button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div style={{ marginBottom: 24 }}>
              <label className="admin-label">Product Images</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {previewImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                <label style={{
                  width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--admin-border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--admin-text-muted)', fontSize: 11, gap: 2,
                  transition: 'border-color 0.2s',
                }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  {uploading ? '...' : 'Add'}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-admin-ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</button>
              <button className="btn-admin-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading products...</div>
        ) : paged.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📦</div>
            <h3>No products found</h3>
            <p>{search || category !== 'All' ? 'Try adjusting your filters' : 'Add your first product to get started'}</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--admin-surface-2)' }}>
                        {product.image_url ? (
                          <img src={product.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 18 }}>📦</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ font: '500 14px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{product.name}</div>
                      <div style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        {product.sizes?.slice(0, 3).join(', ')}{product.sizes?.length > 3 ? ` +${product.sizes.length - 3}` : ''}
                      </div>
                    </td>
                    <td style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-soft)' }}>{product.category}</td>
                    <td>
                      {product.sale_price ? (
                        <div>
                          <span style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-accent)' }}>Rs. {product.sale_price.toLocaleString()}</span>
                          <span style={{ font: '400 12px var(--admin-font-mono)', color: 'var(--admin-text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>Rs. {product.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>Rs. {product.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        font: '500 13px var(--admin-font-mono)',
                        color: product.stock === 0 ? 'var(--admin-red)' : product.stock < 5 ? 'var(--admin-yellow)' : 'var(--admin-text)',
                      }}>{product.stock}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleEdit(product)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--admin-accent)'; e.currentTarget.style.color = 'var(--admin-accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-soft)' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(product.id, product.name)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--admin-red)'; e.currentTarget.style.color = 'var(--admin-red)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-soft)' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--admin-border)' }}>
                <span style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-admin-ghost" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1
                    return <button key={p} onClick={() => setPage(p)} style={{
                      width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                      font: '500 13px var(--admin-font-mono)',
                      background: page === p ? 'var(--admin-accent)' : 'transparent',
                      color: page === p ? 'white' : 'var(--admin-text-muted)',
                    }}>{p}</button>
                  })}
                  <button className="btn-admin-ghost" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
