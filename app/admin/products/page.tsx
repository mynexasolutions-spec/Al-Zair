'use client';

import {
  Boxes,
  Check,
  ChevronRight,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { allProducts, Product } from '@/data/catalog';

const defaultCategories = ['Dates', 'Dates Laddu', 'Stuffed Dates', 'Date Bites', 'Gift Packs'];
const productTypes = ['Premium Dates', 'Healthy Snacks', 'Gift Products'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Active form section tab inside modal
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'gallery' | 'details'>('basic');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State (All fields start completely blank for fresh input)
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    category: string;
    productType: string;
    price: number | string;
    originalPrice: number | string;
    discount: string;
    rating: number;
    reviews: number;
    image: string;
    galleryImages: string[];
    inStock: boolean;
    weight: string;
    shortDescription: string;
    description: string;
    ingredients: string;
    storage: string;
    shipping: string;
    couponCode: string;
    couponDiscount: string;
  }>({
    id: '',
    name: '',
    category: 'Dates',
    productType: 'Premium Dates',
    price: '',
    originalPrice: '',
    discount: '',
    rating: 4.8,
    reviews: 50,
    image: '',
    galleryImages: [], // Starts empty
    inStock: true,
    weight: '500g',
    shortDescription: '',
    description: '',
    ingredients: '',
    storage: '',
    shipping: '',
    couponCode: '',
    couponDiscount: '',
  });


  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // 1. Fetch Dynamic Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setCategories(json.data);
      }
    } catch {}
  };

  // 2. Fetch Live Products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setProducts(allProducts);
      }
    } catch {
      setProducts(allProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (p.category || '').toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    return matchesSearch && matchesCategory;
  });

  // Toggle Stock Status
  const toggleStock = async (product: Product) => {
    const updated = !product.inStock;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, inStock: updated } : p))
    );

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, inStock: updated }),
      });
      showToast(`Updated stock status for ${product.name}`);
    } catch {
      showToast(`Updated locally: ${product.name}`);
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setActiveFormTab('basic');
    setFormData({
      id: '',
      name: '',
      category: categories[0] || 'Dates',
      productType: 'Premium Dates',
      price: '', // Blank price
      originalPrice: '',
      discount: '',
      rating: 4.8,
      reviews: 50,
      image: '', // Blank
      galleryImages: [], // Starts with 0 slots
      inStock: true,
      weight: '500g',
      shortDescription: '',
      description: '',
      ingredients: '',
      storage: '',
      shipping: '',
      couponCode: '',
      couponDiscount: '',
    });
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setActiveFormTab('basic');
    const existingAdditionalImages =
      product.galleryImages && product.galleryImages.length > 0
        ? product.galleryImages.filter((img) => img && img.trim() && img !== product.image)
        : [];

    setFormData({
      id: product.id,
      name: product.name,
      category: product.category,
      productType: product.productType || 'Premium Dates',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      discount: product.discount || '',
      rating: product.rating || 4.8,
      reviews: product.reviews || 50,
      image: product.image || '',
      galleryImages: existingAdditionalImages,
      inStock: product.inStock,
      weight: product.weight || '500g',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      ingredients: product.ingredients || '',
      storage: product.storage || '',
      shipping: product.shipping || '',
      couponCode: product.couponCode || '',
      couponDiscount: product.couponDiscount || '',
    });
    setModalOpen(true);
  };


  // Upload to Cloudinary Helper
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append('file', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: data,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Upload failed');
    }

    return json.url;
  };

  // Upload Main Image
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget('main-image');
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        image: url,
      }));
      showToast('Main product image uploaded to Cloudinary!');
    } catch (err: any) {
      showToast(err?.message || 'Error uploading image');
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  // Upload Gallery Image Slot
  const handleGalleryImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(`gallery-${index}`);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => {
        const updated = [...prev.galleryImages];
        updated[index] = url;
        return { ...prev, galleryImages: updated };
      });
      showToast(`Image #${index + 1} uploaded to Cloudinary!`);
    } catch (err: any) {
      showToast(err?.message || 'Error uploading image');
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  // Add new gallery image slot (blank)
  const handleAddGallerySlot = () => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, ''],
    }));
  };

  // Remove gallery image slot
  const handleRemoveGallerySlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === '' || isNaN(Number(formData.price))) {
      showToast('Please provide a valid Product Name and Price');
      return;
    }

    setSaving(true);
    const id =
      formData.id ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      Date.now().toString();

    // Filter valid, non-empty gallery images
    const cleanGallery = formData.galleryImages.filter(
      (img) => img && typeof img === 'string' && img.trim() !== ''
    );
    const mainImage = formData.image || cleanGallery[0] || '/images/dates.jpg';
    const finalGallery = cleanGallery.length > 0 ? cleanGallery : [mainImage];

    let couponCode = formData.couponCode ? formData.couponCode.trim().toUpperCase() : undefined;
    let couponDiscount = formData.couponDiscount ? formData.couponDiscount.trim() : undefined;

    // If admin pasted/entered a coupon code (e.g. ALZ10-VTEG) into the discount box
    const isDiscountActuallyCode =
      Boolean(couponDiscount) &&
      !couponDiscount!.includes('%') &&
      !couponDiscount!.toLowerCase().includes('off') &&
      !couponDiscount!.includes(' ') &&
      couponDiscount!.length >= 3;

    if (isDiscountActuallyCode) {
      couponCode = couponDiscount!.toUpperCase();
      couponDiscount = undefined;
    }

    // Auto-generate human-friendly discount label (e.g. "10% OFF" or "15% OFF") if empty
    if (couponCode && (!couponDiscount || isDiscountActuallyCode)) {
      const match = couponCode.match(/(\d{1,2})/);
      couponDiscount = match && Number(match[1]) > 0 && Number(match[1]) <= 90 ? `${match[1]}% OFF` : '15% OFF';
    }

    const productPayload: Product = {
      id,
      name: formData.name.trim(),
      category: formData.category,
      productType: formData.productType,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      discount: formData.discount ? formData.discount.trim() : undefined,
      rating: Number(formData.rating) || 4.8,
      reviews: Number(formData.reviews) || 50,
      image: mainImage,
      galleryImages: finalGallery,
      inStock: Boolean(formData.inStock),
      weight: formData.weight || '500g',
      shortDescription: formData.shortDescription,
      description: formData.description,
      ingredients: formData.ingredients,
      storage: formData.storage,
      shipping: formData.shipping,
      couponCode,
      couponDiscount,
    };

    try {

      if (editingProduct) {
        // Update
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? productPayload : p)));
          showToast(`Updated "${productPayload.name}" with full product details!`);
        } else {
          throw new Error(json.error || 'Failed to update');
        }
      } else {
        // Create
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setProducts((prev) => [productPayload, ...prev]);
          showToast(`Created new product "${productPayload.name}"!`);
        } else {
          throw new Error(json.error || 'Failed to create');
        }
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  // Delete Product
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast(`Deleted ${name}`);
      } else {
        throw new Error(json.error || 'Failed to delete');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting product');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#c49a4a]/40 bg-[#171512] px-4 py-3 text-xs font-bold text-[#d6b15e] shadow-2xl animate-in slide-in-from-bottom">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Products Management</h1>
          <p className="text-xs text-white/50">
            Create and edit full product information, gallery photos (3–4 images), descriptions, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <ExternalLink size={14} />
            <span>View Catalog</span>
          </Link>

          <button
            onClick={() => {
              fetchCategories();
              fetchProducts();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-[#c49a4a] px-4 py-2 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shadow-lg shadow-[#c49a4a]/20"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#12110e] p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search products by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
          />
        </div>

        {/* Dynamic Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#c49a4a]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#171512] px-3 py-2 text-xs text-white outline-none focus:border-[#c49a4a]"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-white/10 bg-[#12110e] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-6 py-3.5">Product & Images</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Stock Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    <Loader2 size={24} className="mx-auto mb-2 animate-spin text-[#c49a4a]" />
                    <span>Loading products from database...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    No products found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const galleryCount = p.galleryImages?.length || 1;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                            {p.image ? (
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white/5 text-white/30">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-xs">{p.name}</p>
                              {galleryCount > 1 && (
                                <span className="rounded bg-[#c49a4a]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#d6b15e]">
                                  {galleryCount} Photos
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 font-mono">{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[#c49a4a]/10 px-2.5 py-1 text-[10px] font-bold text-[#d6b15e] border border-[#c49a4a]/30">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-baseline gap-1.5 font-bold">
                          <span className="text-white text-xs">₹{p.price}</span>
                          {p.originalPrice && (
                            <span className="text-[10px] text-white/40 line-through">
                              ₹{p.originalPrice}
                            </span>
                          )}
                          {p.discount && (
                            <span className="text-[9px] text-emerald-400">({p.discount})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStock(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                            p.inStock
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.inStock ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-[#c49a4a] transition"
                            title="View Live Product Page"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
                            title="Edit Full Product Info & Photos"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== COMPREHENSIVE ADD / EDIT PRODUCT MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#14120e] p-6 sm:p-8 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Boxes size={18} className="text-[#c49a4a]" />
                  <span>{editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}</span>
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  Configure all product page details, 3–4 gallery photos, and accordions.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-Tabs inside Modal */}
            <div className="flex items-center gap-2 border-b border-white/10 py-3 shrink-0">
              {[
                { id: 'basic', label: '1. Basic Info & Pricing', icon: Tag },
                { id: 'gallery', label: '2. Product Images', icon: ImageIcon },
                { id: 'details', label: '3. Description & Accordions', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#c49a4a] text-[#12100d]'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto pr-1 py-4 text-xs">
              {/* ==================== TAB 1: BASIC & PRICING ==================== */}
              {activeFormTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Safawi Dates Premium, Ajwa Royal Dates"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-[#1a1714] p-3 text-white outline-none focus:border-[#c49a4a]"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Product Type
                    </label>
                    <select
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-[#1a1714] p-3 text-white outline-none focus:border-[#c49a4a]"
                    >
                      {productTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price (Blank for admin entry!) */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 450"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Original / Strike Price */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Original / Strike Price (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 550"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Discount Tag */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Discount Badge Tag (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15% OFF, BESTSELLER"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Packaging / Weight */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Packaging / Weight Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 500g, 1kg Luxury Gift Box"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* In Stock & Custom Slug */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                    <input
                      type="checkbox"
                      id="inStockCheck"
                      checked={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#c49a4a]"
                    />
                    <label htmlFor="inStockCheck" className="text-white font-semibold cursor-pointer">
                      Available In Stock
                    </label>
                  </div>

                  {/* Coupon Code & Discount (Optional) */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Tag size={13} className="text-[#c49a4a]" />
                      <span>Promotional Coupon Code (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ALZAIR15, RAMADAN20, SPECIAL50"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a] font-mono text-xs uppercase"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      Display a 1-click &quot;Copy Coupon&quot; box on product details page.
                    </p>
                  </div>

                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Coupon Discount Offer Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15% OFF, ₹100 OFF on this item"
                      value={formData.couponDiscount}
                      onChange={(e) => setFormData({ ...formData, couponDiscount: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Product URL Slug / ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. safawi-dates-premium (auto-generated if empty)"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a] font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}


              {/* ==================== TAB 2: PRODUCT GALLERY (3–4 PHOTOS) ==================== */}
              {activeFormTab === 'gallery' && (
                <div className="space-y-6">
                  {/* Primary Featured Image */}
                  <div className="p-4 rounded-xl border border-[#c49a4a]/40 bg-[#c49a4a]/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#d6b15e] font-bold uppercase tracking-wider text-[11px]">
                        ★ Main Product Image (Card Display & Primary Photo) *
                      </label>
                      <span className="text-[10px] text-white/50">Primary</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {formData.image && formData.image.trim() !== '' ? (
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-[#c49a4a] bg-black shrink-0">
                          <Image
                            src={formData.image}
                            alt="Main Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-white/30 shrink-0">
                          <ImageIcon size={22} />
                        </div>
                      )}

                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Image URL or upload photo directly..."
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="flex-1 rounded-xl border border-white/15 bg-white/5 p-2.5 text-white outline-none focus:border-[#c49a4a]"
                        />

                        <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c49a4a] px-3.5 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] cursor-pointer transition shrink-0">
                          {uploadingTarget === 'main-image' ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={14} />
                              <span>Upload Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleMainImageUpload}
                            disabled={uploadingTarget === 'main-image'}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Additional Product Images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                          Additional Product Images
                        </h4>
                        <p className="text-[11px] text-white/50">
                          Add 3 to 4 product images. When customers view the product, they can switch between these photos.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddGallerySlot}
                        className="flex items-center gap-1.5 rounded-lg border border-[#c49a4a]/40 bg-[#c49a4a]/10 px-3 py-1.5 text-xs font-semibold text-[#d6b15e] hover:bg-[#c49a4a]/20 transition"
                      >
                        <Plus size={14} />
                        <span>Add Image</span>
                      </button>
                    </div>

                    {/* If 0 gallery images, show clean empty state */}
                    {formData.galleryImages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                        <ImageIcon size={24} className="mx-auto text-white/25 mb-1.5" />
                        <p className="text-xs text-white/50 font-medium">No additional images added</p>
                        <button
                          type="button"
                          onClick={handleAddGallerySlot}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#c49a4a]/20 border border-[#c49a4a]/40 px-3.5 py-1.5 text-xs font-semibold text-[#d6b15e] hover:bg-[#c49a4a]/30 transition"
                        >
                          <Plus size={14} />
                          <span>+ Add Image</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.galleryImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
                          >
                            {imgUrl && imgUrl.trim() !== '' ? (
                              <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-white/15 bg-black shrink-0">
                                <Image
                                  src={imgUrl}
                                  alt={`Product Image ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 text-white/30 shrink-0">
                                <ImageIcon size={18} />
                              </div>
                            )}

                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder={`Image #${idx + 1} URL or upload directly...`}
                                value={imgUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => {
                                    const updated = [...prev.galleryImages];
                                    updated[idx] = val;
                                    return { ...prev, galleryImages: updated };
                                  });
                                }}
                                className="flex-1 rounded-xl border border-white/15 bg-[#171512] p-2 text-white outline-none focus:border-[#c49a4a] text-xs"
                              />

                              <label className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer transition shrink-0">
                                {uploadingTarget === `gallery-${idx}` ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin text-[#c49a4a]" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={13} />
                                    <span>Upload</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleGalleryImageUpload(idx, e)}
                                  disabled={uploadingTarget === `gallery-${idx}`}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveGallerySlot(idx)}
                                className="flex items-center justify-center rounded-xl bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                                title="Delete Image Slot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleAddGallerySlot}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-1.5 text-xs text-[#d6b15e] hover:bg-white/10 transition"
                          >
                            <Plus size={13} />
                            <span>+ Add Image</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== TAB 3: DESCRIPTION & ACCORDIONS ==================== */}
              {activeFormTab === 'details' && (
                <div className="space-y-4">
                  {/* Short Description */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Short Tagline / Overview (Displays on banner)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Exquisite dark chewy dates with delicious natural sweetness and rich texture."
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Full Product Description */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Full Product Description (Displays under &quot;Description&quot; Accordion)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Detailed product story, texture, taste profile, and health benefits..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Ingredients (Displays under &quot;Ingredients&quot; Accordion)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Pure Natural Dates. No added sugar, no artificial preservatives."
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Storage Instructions */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Storage Instructions (Displays under &quot;Storage Instructions&quot; Accordion)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Store in a cool, dry place away from direct sunlight. Refrigerate after opening."
                      value={formData.storage}
                      onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>

                  {/* Shipping Info */}
                  <div>
                    <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Shipping Information (Displays under &quot;Shipping Information&quot; Accordion)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatched within 24 hours. Free standard delivery on all orders."
                      value={formData.shipping}
                      onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-5 border-t border-white/10 mt-6">
                <div className="flex items-center gap-2">
                  {activeFormTab === 'basic' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('gallery')}
                      className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                    >
                      <span>Next: Photos (3–4)</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  {activeFormTab === 'gallery' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('details')}
                      className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                    >
                      <span>Next: Details & Story</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#c49a4a] px-6 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] shadow-md shadow-[#c49a4a]/20 disabled:opacity-50 transition"
                  >
                    {saving ? 'Saving to Database...' : editingProduct ? 'Save All Changes' : 'Create Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
