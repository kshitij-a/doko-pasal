'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ["Men's Wear", "Women's Wear", "Kids' Wear"]
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', '2-3Y', '4-5Y', '6-7Y', '8-9Y']

export default function AdminProducts() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [previewImages, setPreviewImages] = useState([])
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: "Men's Wear",
    sizes: [], stock: '', image_urls: []
  })

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

  const toggleSize = (size) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size]
    }))
  }

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category: "Men's Wear", sizes: [], stock: '', image_urls: [] })
    setPreviewImages([])
    setEditId(null)
    setShowForm(false)
    setMessage({ text: '', type: '' })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    if (files.length > 5) {
      setMessage({ text: '❌ Maximum 5 images allowed per product', type: 'error' })
      return
    }

    setUploading(true)
    setMessage({ text: '⏳ Uploading images...', type: 'info' })

    const uploadedUrls = []
    const previews = []

    for (const file of files) {
      // Create preview
      const reader = new FileReader()
      reader.onload = (ev) => previews.push(ev.target.result)
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/\s/g, '_')}`
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

      if (error) {
        setMessage({ text: `❌ Upload failed: ${error.message}`, type: 'error' })
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      uploadedUrls.push(urlData.publicUrl)
    }

    setTimeout(() => {
      setPreviewImages(prev => [...prev, ...previews])
    }, 500)

    setForm(f => ({ ...f, image_urls: [...(f.image_urls || []), ...uploadedUrls] }))
    setMessage({ text: `✅ ${files.length} image(s) uploaded successfully!`, type: 'success' })
    setUploading(false)
  }

  const removeImage = (index) => {
    setForm(f => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      sizes: product.sizes || [],
      stock: product.stock,
      image_urls: product.image_urls || (product.image_url ? [product.image_url] : [])
    })
    setPreviewImages(product.image_urls || (product.image_url ? [product.image_url] : []))
    setEditId(product.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(products.filter(p => p.id !== id))
    setMessage({ text: '✅ Product deleted.', type: 'success' })
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      setMessage({ text: '❌ Name, Price and Category are required.', type: 'error' })
      return
    }
    setSaving(true)
    setMessage({ text: '', type: '' })

    const imageUrls = form.image_urls || []
    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseInt(form.price),
      category: form.category,
      sizes: form.sizes,
      stock: parseInt(form.stock) || 0,
      image_url: imageUrls[0] || null,
      image_urls: imageUrls
    }

    if (editId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editId)
      if (error) setMessage({ text: '❌ Error: ' + error.message, type: 'error' })
      else { setMessage({ text: '✅ Product updated!', type: 'success' }); fetchProducts() }
    } else {
      const { error } = await supabase.from('products').insert(productData)
      if (error) setMessage({ text: '❌ Error: ' + error.message, type: 'error' })
      else { setMessage({ text: '✅ Product added!', type: 'success' }); fetchProducts(); resetForm(); setShowForm(false) }
    }
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 fixed left-0 top-0 flex flex-col z-50">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl">🧺</div>
              <div>
                <p className="font-bold text-white">Doko Pasal</p>
                <p className="text-xs text-red-400 font-semibold tracking-widest">ADMIN</p>
              </div>
            </div>
          </div>
          <nav className="p-4 flex-1 space-y-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/products', label: 'Products', icon: '👔' },
              { href: '/admin/orders', label: 'All Orders', icon: '📦' },
              { href: '/admin/messages', label: 'Messages', icon: '💬' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition font-medium">
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 text-sm transition">
              🏪 View Store
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <div className="ml-64 flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Products</h1>
              <p className="text-gray-400 mt-1">{products.length} products in your store</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true) }}
              className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold transition flex items-center gap-2">
              ➕ Add New Product
            </button>
          </div>

          {/* ADD/EDIT FORM */}
          {showForm && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-5">
                {editId ? '✏️ Edit Product' : '➕ Add New Product'}
              </h2>

              {message.text && (
                <div className={`px-4 py-3 rounded-xl mb-5 text-sm font-semibold ${
                  message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>{message.text}</div>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Daura Suruwal"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Price (Rs.) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    placeholder="e.g. 1500"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                    {CATEGORIES.map(c => <option key={c} className="bg-gray-800">{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    placeholder="e.g. 20"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Describe this product..." rows={3}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
                </div>

                {/* IMAGE UPLOAD */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Product Images (up to 5 photos)
                  </label>

                  {/* Upload Button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition group">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-300 font-semibold group-hover:text-blue-400 transition">
                      {uploading ? 'Uploading...' : 'Click to upload photos'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">JPG, PNG, WEBP — Max 5 images</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {/* Image Previews */}
                  {form.image_urls && form.image_urls.length > 0 && (
                    <div className="flex gap-3 mt-4 flex-wrap">
                      {form.image_urls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Product ${i+1}`}
                            className="w-24 h-24 object-cover rounded-xl border border-gray-600" />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                              Main
                            </span>
                          )}
                          <button onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SIZES */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Available Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map(size => (
                      <button key={size} type="button" onClick={() => toggleSize(size)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                          form.sizes.includes(size)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-500'
                        }`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving || uploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? '✅ Update Product' : '➕ Add Product'}
                </button>
                <button onClick={resetForm}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-3 rounded-xl font-bold transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PRODUCTS LIST */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">All Products ({products.length})</h2>
            </div>
            {loading ? (
              <div className="text-center py-16 text-gray-400">⏳ Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">👔</div>
                <p className="text-gray-400">No products yet. Add your first one!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {products.map(product => (
                  <div key={product.id} className="flex items-center gap-4 p-5 hover:bg-gray-800/40 transition">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center text-3xl">
                      {product.image_url || (product.image_urls && product.image_urls[0])
                        ? <img src={product.image_url || product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                        : product.category === "Men's Wear" ? '👔' : product.category === "Women's Wear" ? '👗' : '🧒'}
                    </div>

                    {/* Multiple image count */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate">{product.name}</h3>
                        {product.image_urls && product.image_urls.length > 1 && (
                          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                            {product.image_urls.length} photos
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{product.category} • Stock: {product.stock}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {product.sizes?.map(s => (
                          <span key={s} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right mr-4">
                      <p className="text-xl font-extrabold text-red-400">Rs. {product.price?.toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(product)}
                        className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600/40 transition">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)}
                        className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-600/40 transition">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}