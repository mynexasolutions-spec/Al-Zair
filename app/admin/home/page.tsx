'use client';

import {
  Boxes,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Quote,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  defaultHomepageContent,
  FeaturedProductItem,
  HomeGalleryItem,
  HomepageContent,
  TestimonialItem,
} from '@/data/homepageContent';

export default function AdminHomePageEditor() {
  const [activeTab, setActiveTab] = useState<'hero' | 'products' | 'testimonials' | 'gallery'>('hero');
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FeaturedProductItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', image: '' });

  // 2. Testimonial Modal State
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    initials: '',
    rating: 5,
    quote: '',
  });

  // 3. Gallery Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<HomeGalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    image: '',
    alt: '',
  });

  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Homepage Content from Database / API
  const fetchHomeContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/home', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.data) {
        setContent(data.data);
      }
    } catch (err) {
      showToast('Loaded defaults', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Content Directly to API & DB
  const persistContentToDb = async (newContent: HomepageContent, successMsg?: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setContent(newContent);
        showToast(successMsg || 'Saved successfully to Database!');
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Manual Save Handler for Hero Section or General Sync
  const handleSaveToDb = () => {
    persistContentToDb(content, 'Homepage changes saved successfully to Database & Live Website!');
  };

  // ==================== CLOUDINARY UPLOAD HELPER ====================
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Cloudinary upload failed');
    }

    return data.url;
  };

  // Upload Hero Image
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget('hero');
    try {
      const url = await uploadImageToCloudinary(file);
      const updatedHero = { ...content.hero, image: url };
      const updatedContent = { ...content, hero: updatedHero };
      await persistContentToDb(updatedContent, 'Hero image uploaded & saved!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload hero image', 'error');
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  // ==================== HERO SECTION HANDLERS ====================
  const handleHeroChange = (field: keyof typeof content.hero, value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  // ==================== 1. OUR PRODUCTS (CATEGORY) MODAL HANDLERS ====================
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', image: '' });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (item: FeaturedProductItem) => {
    setEditingCategory(item);
    setCategoryForm({ name: item.name, image: item.image });
    setCategoryModalOpen(true);
  };

  const handleCategoryModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget('category-modal');
    try {
      const url = await uploadImageToCloudinary(file);
      setCategoryForm((prev) => ({ ...prev, image: url }));
      showToast('Category image uploaded to Cloudinary!');
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveCategoryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const targetLink = `/products?category=${encodeURIComponent(categoryForm.name.trim())}`;
    let updatedProducts: FeaturedProductItem[] = [];

    if (editingCategory) {
      updatedProducts = content.featured_products.map((item) =>
        item.id === editingCategory.id
          ? { ...item, name: categoryForm.name.trim(), image: categoryForm.image, link: targetLink }
          : item
      );
    } else {
      const newItem: FeaturedProductItem = {
        id: Date.now().toString(),
        name: categoryForm.name.trim(),
        image: categoryForm.image || '/images/dates.jpg',
        link: targetLink,
      };
      updatedProducts = [...content.featured_products, newItem];
    }

    const updatedContent = { ...content, featured_products: updatedProducts };
    setCategoryModalOpen(false);
    await persistContentToDb(
      updatedContent,
      editingCategory ? `Updated category "${categoryForm.name}"!` : `Added new category "${categoryForm.name}"!`
    );
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    const updatedProducts = content.featured_products.filter((item) => item.id !== id);
    const updatedContent = { ...content, featured_products: updatedProducts };
    await persistContentToDb(updatedContent, `Deleted category "${name}"`);
  };

  // ==================== 2. TESTIMONIALS MODAL HANDLERS ====================
  const handleOpenAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      name: '',
      initials: '',
      rating: 5,
      quote: '',
    });
    setTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (item: TestimonialItem) => {
    setEditingTestimonial(item);
    setTestimonialForm({
      name: item.name,
      initials: item.initials || item.name.substring(0, 2).toUpperCase(),
      rating: item.rating || 5,
      quote: item.quote,
    });
    setTestimonialModalOpen(true);
  };

  const handleSaveTestimonialModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || !testimonialForm.quote.trim()) return;

    const calculatedInitials =
      testimonialForm.initials.trim() ||
      testimonialForm.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    let updatedTestimonials: TestimonialItem[] = [];
    const trimmedName = testimonialForm.name.trim();

    if (editingTestimonial) {
      updatedTestimonials = content.testimonials.map((item) =>
        item.id === editingTestimonial.id
          ? {
              ...item,
              name: trimmedName,
              initials: calculatedInitials,
              rating: Number(testimonialForm.rating),
              quote: testimonialForm.quote.trim(),
            }
          : item
      );
    } else {
      // Check if a testimonial with this name already exists
      const existingIndex = content.testimonials.findIndex(
        (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      const newItem: TestimonialItem = {
        id: Date.now().toString(),
        name: trimmedName,
        initials: calculatedInitials,
        rating: Number(testimonialForm.rating),
        quote: testimonialForm.quote.trim(),
      };

      if (existingIndex >= 0) {
        // Update existing testimonial instead of adding duplicate
        updatedTestimonials = content.testimonials.map((item, idx) =>
          idx === existingIndex ? { ...item, ...newItem, id: item.id } : item
        );
      } else {
        updatedTestimonials = [...content.testimonials, newItem];
      }
    }

    // Ensure all testimonials are unique by name
    const seen = new Set<string>();
    const uniqueTestimonials = updatedTestimonials.filter((t) => {
      const key = t.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const updatedContent = { ...content, testimonials: uniqueTestimonials };
    setTestimonialModalOpen(false);
    await persistContentToDb(
      updatedContent,
      editingTestimonial ? `Updated review from ${testimonialForm.name}!` : `Saved testimonial from ${testimonialForm.name}!`
    );
  };

  const handleDeleteTestimonial = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete review from "${name}"?`)) return;
    const updatedTestimonials = content.testimonials.filter((item) => item.id !== id);
    const updatedContent = { ...content, testimonials: updatedTestimonials };
    await persistContentToDb(updatedContent, `Deleted review from "${name}"`);
  };

  // ==================== 3. GALLERY MODAL HANDLERS ====================
  const handleOpenAddGallery = () => {
    setEditingGallery(null);
    setGalleryForm({
      image: '',
      alt: '',
    });
    setGalleryModalOpen(true);
  };

  const handleOpenEditGallery = (item: HomeGalleryItem) => {
    setEditingGallery(item);
    setGalleryForm({
      image: item.image,
      alt: item.alt,
    });
    setGalleryModalOpen(true);
  };

  const handleGalleryModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget('gallery-modal');
    try {
      const url = await uploadImageToCloudinary(file);
      setGalleryForm((prev) => ({ ...prev, image: url }));
      showToast('Gallery image uploaded to Cloudinary!');
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveGalleryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image.trim()) return;

    let updatedGallery: HomeGalleryItem[] = [];

    if (editingGallery) {
      updatedGallery = content.home_gallery.map((item) =>
        item.id === editingGallery.id
          ? {
              ...item,
              image: galleryForm.image.trim(),
              alt: galleryForm.alt.trim() || 'Alzair Premium Dates',
            }
          : item
      );
    } else {
      const newItem: HomeGalleryItem = {
        id: Date.now().toString(),
        image: galleryForm.image.trim(),
        alt: galleryForm.alt.trim() || 'Alzair Premium Dates',
      };
      updatedGallery = [...content.home_gallery, newItem];
    }

    const updatedContent = { ...content, home_gallery: updatedGallery };
    setGalleryModalOpen(false);
    await persistContentToDb(
      updatedContent,
      editingGallery ? 'Updated gallery photo!' : 'Added new photo to gallery!'
    );
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery photo?')) return;
    const updatedGallery = content.home_gallery.filter((img) => img.id !== id);
    const updatedContent = { ...content, home_gallery: updatedGallery };
    await persistContentToDb(updatedContent, 'Deleted photo from gallery');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-xs font-bold shadow-2xl animate-in slide-in-from-bottom ${
            toastMsg.type === 'success'
              ? 'border-[#c49a4a]/40 bg-[#171512] text-[#d6b15e]'
              : 'border-rose-500/40 bg-rose-950 text-rose-300'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#c49a4a]">
              Live Home Page Content Management
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Home Page Editor</h1>
          <p className="text-xs text-white/50">
            Edit and customize the Hero, Categories, Testimonials, and Gallery sections in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <ExternalLink size={14} />
            <span>View Live Site</span>
          </Link>

          <button
            onClick={fetchHomeContent}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            title="Refresh database data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleSaveToDb}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#c49a4a] px-5 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shadow-lg shadow-[#c49a4a]/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'hero', label: '1. Hero Section', icon: Flame },
          { id: 'products', label: '2. Our Products (Categories)', icon: Boxes },
          { id: 'testimonials', label: '3. Client Testimonials', icon: MessageSquare },
          { id: 'gallery', label: '4. Small Gallery', icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? 'bg-[#c49a4a] text-[#12100d] shadow-md shadow-[#c49a4a]/20'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#c49a4a]" />
          <span className="ml-3 text-sm text-white/60">Loading homepage data from Database...</span>
        </div>
      )}

      {/* ==================== 1. HERO SECTION TAB ==================== */}
      {!loading && activeTab === 'hero' && (
        <div className="rounded-2xl border border-white/10 bg-[#12110e] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Hero Header Section</h2>
              <p className="text-xs text-white/50">
                Update the main banner text, CTA buttons, and high-resolution hero image.
              </p>
            </div>
            <span className="rounded-full border border-[#c49a4a]/30 bg-[#c49a4a]/10 px-3 py-1 text-[10px] font-bold text-[#d6b15e]">
              Hero Banner
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Eyebrow Subtitle (Small Top Badge)
              </label>
              <input
                type="text"
                value={content.hero.eyebrow}
                onChange={(e) => handleHeroChange('eyebrow', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Main Hero Headline Title
              </label>
              <input
                type="text"
                value={content.hero.title}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white/70 mb-1.5 font-semibold">
                Hero Description Paragraph
              </label>
              <textarea
                rows={3}
                value={content.hero.description}
                onChange={(e) => handleHeroChange('description', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Button 1 Text
              </label>
              <input
                type="text"
                value={content.hero.button1Text}
                onChange={(e) => handleHeroChange('button1Text', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Button 1 URL Link
              </label>
              <input
                type="text"
                value={content.hero.button1Link}
                onChange={(e) => handleHeroChange('button1Link', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Button 2 Text
              </label>
              <input
                type="text"
                value={content.hero.button2Text}
                onChange={(e) => handleHeroChange('button2Text', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1.5 font-semibold">
                Button 2 URL Link
              </label>
              <input
                type="text"
                value={content.hero.button2Link}
                onChange={(e) => handleHeroChange('button2Link', e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
              />
            </div>

            {/* Hero Image & Direct Cloudinary Upload */}
            <div className="md:col-span-2">
              <label className="block text-white/70 mb-1.5 font-semibold">
                Hero Image (Upload to Cloudinary or URL)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={content.hero.image}
                  onChange={(e) => handleHeroChange('image', e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-[#c49a4a]"
                />

                <input
                  type="file"
                  ref={heroFileInputRef}
                  onChange={handleHeroImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadingTarget === 'hero'}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#c49a4a] px-4 py-3 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shrink-0 shadow-md shadow-[#c49a4a]/20"
                >
                  {uploadingTarget === 'hero' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} />
                      <span>Upload New Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              {content.hero.image && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-white/10 bg-black">
                    <Image src={content.hero.image} alt="Hero preview" fill className="object-cover" />
                  </div>
                  <span className="text-[11px] text-white/40 truncate max-w-sm">
                    {content.hero.image}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. OUR PRODUCTS SECTION TAB (WITH POPUP MODAL) ==================== */}
      {!loading && activeTab === 'products' && (
        <div className="rounded-2xl border border-white/10 bg-[#12110e] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">
                Our Products (Homepage Category Circles)
              </h2>
              <p className="text-xs text-white/50">
                Manage the circular category items displayed in &quot;A Treat For Every Taste&quot;
              </p>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1.5 rounded-xl bg-[#c49a4a] px-4 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shadow-md shadow-[#c49a4a]/20"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.featured_products.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[#c49a4a]/40 transition group"
              >
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#c49a4a]/60 bg-black shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                  <span className="text-[11px] text-[#c49a4a] block mt-0.5 font-mono truncate">
                    {item.link || `/products?category=${encodeURIComponent(item.name)}`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditCategory(item)}
                    className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-[#c49a4a] transition"
                    title="Edit Category"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(item.id, item.name)}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 3. CLIENT TESTIMONIALS TAB (WITH POPUP MODAL) ==================== */}
      {!loading && activeTab === 'testimonials' && (
        <div className="rounded-2xl border border-white/10 bg-[#12110e] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Client Reviews & Testimonials</h2>
              <p className="text-xs text-white/50">
                Manage customer feedback displayed on &quot;Loved By Our Customers&quot;
              </p>
            </div>
            <button
              onClick={handleOpenAddTestimonial}
              className="flex items-center gap-1.5 rounded-xl bg-[#c49a4a] px-4 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shadow-md shadow-[#c49a4a]/20"
            >
              <Plus size={15} />
              <span>Add Testimonial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.testimonials.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-5 hover:border-[#c49a4a]/40 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c49a4a]/20 text-[#d6b15e] font-bold text-xs border border-[#c49a4a]/40">
                        {t.initials || t.name.charAt(0)}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{t.name}</h4>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < (t.rating || 5)
                                  ? 'fill-[#c49a4a] text-[#c49a4a]'
                                  : 'text-white/20'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTestimonial(t)}
                        className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-[#c49a4a] transition"
                        title="Edit Review"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(t.id, t.name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 italic leading-relaxed line-clamp-3">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 4. SMALL GALLERY TAB (WITH POPUP MODAL) ==================== */}
      {!loading && activeTab === 'gallery' && (
        <div className="rounded-2xl border border-white/10 bg-[#12110e] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Homepage Small Gallery</h2>
              <p className="text-xs text-white/50">
                Manage the photo carousel displayed in &quot;A Glimpse Of Our Goodness&quot;
              </p>
            </div>
            <button
              onClick={handleOpenAddGallery}
              className="flex items-center gap-1.5 rounded-xl bg-[#c49a4a] px-4 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] transition shadow-md shadow-[#c49a4a]/20"
            >
              <Plus size={15} />
              <span>Add Gallery Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.home_gallery.map((img) => (
              <div
                key={img.id}
                className="group relative flex flex-col rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#c49a4a]/40 transition overflow-hidden"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#c49a4a]/30 bg-black">
                  <Image src={img.image} alt={img.alt} fill className="object-cover group-hover:scale-105 transition duration-500" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-white/80 font-medium truncate flex-1 pr-2">
                    {img.alt || 'Alzair Photo'}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditGallery(img)}
                      className="p-1 rounded text-white/70 hover:text-[#c49a4a] transition"
                      title="Edit Photo"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 transition"
                      title="Delete Photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== POPUP MODAL: CATEGORY FORM ==================== */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#14120e] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes size={18} className="text-[#c49a4a]" />
                <span>{editingCategory ? 'Edit Product Category' : 'Add New Category'}</span>
              </h2>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stuffed Dates, Dates Laddu, Gift Packs"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Category Image (Upload or URL) *
                </label>
                <div className="flex items-center gap-3">
                  {categoryForm.image && categoryForm.image.trim() !== '' ? (
                    <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-[#c49a4a]/60 bg-black shrink-0">
                      <Image
                        src={categoryForm.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5 text-white/30 shrink-0">
                      <ImageIcon size={18} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Image URL or upload..."
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 p-2.5 text-white outline-none focus:border-[#c49a4a]"
                    />

                    <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c49a4a] px-3.5 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] cursor-pointer transition shrink-0">
                      {uploadingTarget === 'category-modal' ? (
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
                        onChange={handleCategoryModalImageUpload}
                        disabled={uploadingTarget === 'category-modal'}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c49a4a] px-6 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] shadow-md shadow-[#c49a4a]/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== POPUP MODAL: TESTIMONIAL FORM ==================== */}
      {testimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#14120e] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Quote size={18} className="text-[#c49a4a]" />
                <span>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</span>
              </h2>
              <button
                onClick={() => setTestimonialModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonialModal} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ayesha Khan"
                    value={testimonialForm.name}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                    Initials (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. AK (auto-generated if empty)"
                    value={testimonialForm.initials}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, initials: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                  />
                </div>
              </div>

              {/* Star Rating Interactive Selector */}
              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Star Rating (1 - 5 Stars) *
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}
                      className="p-1 transition hover:scale-125"
                    >
                      <Star
                        size={20}
                        className={
                          star <= testimonialForm.rating
                            ? 'fill-[#c49a4a] text-[#c49a4a]'
                            : 'text-white/20'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-[#c49a4a]">
                    {testimonialForm.rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review / Quote */}
              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Client Review / Quote *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the client review or feedback..."
                  value={testimonialForm.quote}
                  onChange={(e) =>
                    setTestimonialForm({ ...testimonialForm, quote: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTestimonialModalOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c49a4a] px-6 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] shadow-md shadow-[#c49a4a]/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTestimonial ? 'Save Changes' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== POPUP MODAL: GALLERY PHOTO FORM ==================== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#14120e] p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-[#c49a4a]" />
                <span>{editingGallery ? 'Edit Gallery Photo' : 'Add Gallery Photo'}</span>
              </h2>
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryModal} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Gallery Photo (Upload or URL) *
                </label>
                <div className="flex items-center gap-3">
                  {galleryForm.image && galleryForm.image.trim() !== '' ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-[#c49a4a]/60 bg-black shrink-0">
                      <Image
                        src={galleryForm.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-white/30 shrink-0">
                      <ImageIcon size={20} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Photo URL or upload..."
                      value={galleryForm.image}
                      onChange={(e) => setGalleryForm({ ...galleryForm, image: e.target.value })}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 p-2.5 text-white outline-none focus:border-[#c49a4a]"
                    />

                    <label className="flex items-center justify-center gap-1.5 rounded-xl bg-[#c49a4a] px-3.5 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] cursor-pointer transition shrink-0">
                      {uploadingTarget === 'gallery-modal' ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} />
                          <span>Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGalleryModalImageUpload}
                        disabled={uploadingTarget === 'gallery-modal'}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white/80 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Photo Caption / Alt Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alzair Premium Dates Gift Box"
                  value={galleryForm.alt}
                  onChange={(e) => setGalleryForm({ ...galleryForm, alt: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:border-[#c49a4a]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c49a4a] px-6 py-2.5 text-xs font-bold text-[#12100d] hover:bg-[#d6b15e] shadow-md shadow-[#c49a4a]/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingGallery ? 'Save Changes' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
