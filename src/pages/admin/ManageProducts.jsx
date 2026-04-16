import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmActionModal from '../../components/ConfirmActionModal';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    newCategory: '',
    image: '',
    variations: '',
    inStock: true,
    discount: '',         // Percentage discount (0-100)
    deliveryFree: true,   // true = free, false = paid
    deliveryCharge: '',   // custom amount if paid
  });
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'products'));
      const productsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(productsList);

      // Extract unique categories
      const cats = [...new Set(productsList.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectAll = (e) => {
    setSelectedItems(e.target.checked ? products.map(p => p.id) : []);
  };

  const handleSelect = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openDeleteModal = (type, id = null) => setDeleteModal({ isOpen: true, type, id });
  const closeDeleteModal = () => setDeleteModal({ isOpen: false, type: '', id: null });

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (deleteModal.type === 'multiple') {
        await Promise.all(selectedItems.map(id => deleteDoc(doc(db, 'products', id))));
        setSelectedItems([]);
        showToast('Selected products deleted successfully.');
      }
      closeDeleteModal();
      await fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete. Check Firestore rules.', 'error');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);
    try {
      const { id } = productToDelete;
      await deleteDoc(doc(db, 'products', id));
      // Cloudinary images remain hosted unless deleted via backend API with signature, so we just remove the Firestore document reference
      showToast('Item successfully deleted.');
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Error deleting item.', 'error');
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  const handleToggleStock = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'products', id), { inStock: newStatus });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: newStatus } : p));
      showToast(`Product marked as ${newStatus ? 'In Stock' : 'Sold Out'}`, 'success');
    } catch (err) {
      console.error('Update error:', err);
      showToast('Failed to update stock status.', 'error');
    }
  };

  const handleCopyLink = (productId) => {
    const link = `${window.location.origin}/product/${productId}`;
    navigator.clipboard.writeText(link)
      .then(() => showToast('Product link copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy helpLink:', err);
        showToast('Link copying failed.', 'error');
      });
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return 'https://via.placeholder.com/400x400.png?text=Resin+Art';
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
      const result = await res.json();
      return result.secure_url;
    } catch {
      return 'https://via.placeholder.com/400x400.png?text=Resin+Art';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingImage(true);

    let imageUrl = formData.image;
    if (imageFile) imageUrl = await uploadImageToCloudinary(imageFile);
    if (!imageUrl) imageUrl = 'https://via.placeholder.com/400x400.png?text=Resin+Art';

    // Resolve final category
    const finalCategory = showNewCategory
      ? formData.newCategory.trim()
      : formData.category;

    // Resolve delivery charge
    const deliveryChargeValue = formData.deliveryFree
      ? 0
      : parseFloat(formData.deliveryCharge) || 0;

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        category: finalCategory,
        image: imageUrl,
        variations: formData.variations.split(',').map(v => v.trim()).filter(v => v),
        inStock: formData.inStock,
        discount: Number(formData.discount) || 0,
        deliveryCharge: deliveryChargeValue,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        // Instant local state update — no refetch needed
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...productData } : p));
        showToast('✅ Product updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        // Instantly append new product to the list
        const newProduct = { id: docRef.id, ...productData };
        setProducts(prev => [...prev, newProduct]);
        // Update categories dropdown if new category was added
        if (finalCategory && !categories.includes(finalCategory)) {
          setCategories(prev => [...prev, finalCategory]);
        }
        showToast('✅ Product added to catalog!');
      }

      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save product. Check Firestore rules.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (product) => {
    const isCategoryExisting = categories.includes(product.category);
    setShowNewCategory(!isCategoryExisting && !!product.category);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: isCategoryExisting ? product.category : '',
      newCategory: !isCategoryExisting ? (product.category || '') : '',
      image: product.image,
      variations: product.variations ? product.variations.join(', ') : '',
      inStock: product.inStock !== false, // default true if undefined
      discount: product.discount || '',
      deliveryType: product.deliveryCharge > 0 ? 'charged' : 'free',
      deliveryFree: !(product.deliveryCharge > 0),
      deliveryCharge: product.deliveryCharge > 0 ? String(product.deliveryCharge) : '',
    });
    setEditingId(product.id);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImageFile(null);
    setShowNewCategory(false);
    setFormData({ name: '', price: '', description: '', category: '', newCategory: '', image: '', variations: '', inStock: true, discount: '', deliveryFree: true, deliveryCharge: '' });
  };

  return (
    <div className="animate-fade-in-up space-y-8">

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl border transition-all animate-fade-in-up max-w-sm w-[90vw] ${
          toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-700'
            : 'bg-white border-red-200 text-red-600'
        }`}>
          <span className="text-2xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <p className="font-bold text-sm flex-1">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-rose-400 hover:text-rose-600 transition-colors ml-2 font-black">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-rose-100 pb-6">
        <div className="w-full">
          <h2 className="text-3xl sm:text-4xl font-black text-rose-950 tracking-tight">Masterpiece Catalog</h2>
          <p className="text-rose-600 font-medium text-sm sm:text-base">Manage your handcrafted resin creations</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {selectedItems.length > 0 && (
            <button onClick={() => openDeleteModal('multiple')} className="flex-1 lg:flex-none justify-center px-5 py-3.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2">
              🗑️ Delete ({selectedItems.length})
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex-1 lg:flex-none justify-center px-6 py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl font-black text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all active:scale-95 flex items-center gap-2 outline-none">
            <span className="text-xl leading-none">+</span> Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/95 border border-white rounded-[2rem] shadow-[0_20px_60px_rgba(255,228,230,0.8)] backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full filter blur-[80px] pointer-events-none"></div>
        <div className="overflow-x-auto relative z-10 w-full rounded-[2rem]">
          {/* Desktop Table - Hidden on Mobile */}
          <table className="hidden md:table w-full min-w-[700px] text-left border-collapse">
            <thead className="bg-rose-50 border-b border-rose-200">
              <tr>
                <th className="px-5 py-5 w-10">
                  <input type="checkbox" checked={products.length > 0 && selectedItems.length === products.length} onChange={handleSelectAll} disabled={products.length === 0} className="w-5 h-5 rounded border-rose-300 accent-pink-500 cursor-pointer" />
                </th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Image</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Details</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Price</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Category</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Delivery</th>
                <th className="px-5 py-5 text-xs font-black text-rose-500 uppercase tracking-widest text-right whitespace-nowrap">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center"><div className="flex justify-center items-center gap-3 text-rose-600 font-bold"><div className="w-6 h-6 border-4 border-rose-300 border-t-transparent rounded-full animate-spin"></div>Loading...</div></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-rose-500 font-medium">No products found. Add your first resin creation!</td></tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className={`hover:bg-rose-50/50 transition-colors group ${selectedItems.includes(product.id) ? 'bg-pink-50/40' : ''}`}>
                    <td className="px-5 py-4 text-center"><input type="checkbox" checked={selectedItems.includes(product.id)} onChange={() => handleSelect(product.id)} className="w-5 h-5 rounded border-rose-300 accent-pink-500 cursor-pointer" /></td>
                    <td className="px-5 py-4"><img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-xl shadow-sm border border-rose-100 group-hover:scale-105 transition-transform" /></td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <h4 className="font-bold text-rose-950 truncate">{product.name}</h4>
                      <p className="text-xs text-rose-800/60 truncate">{product.description}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`font-black tracking-wider ${product.discount > 0 ? 'text-rose-400 line-through text-xs' : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500'}`}>Rs. {parseFloat(product.price).toFixed(0)}</span>
                    {product.discount > 0 && <span className="font-black text-rose-600">Rs. {Math.floor(product.price * (1 - product.discount / 100))}</span>}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap"><span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-md text-xs font-bold uppercase tracking-wider">{product.category || 'General'}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleToggleStock(product.id, product.inStock !== false)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.inStock !== false ? 'bg-emerald-500' : 'bg-rose-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.inStock !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`ml-2 text-xs font-bold ${product.inStock !== false ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {product.inStock !== false ? 'In Stock' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {product.deliveryCharge > 0
                        ? <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold">Rs. {product.deliveryCharge}</span>
                        : <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold">Free</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => handleCopyLink(product.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold mr-4 transition-colors"
                        title="Copy Live Link"
                      >
                        Link
                      </button>
                      <button onClick={() => handleEdit(product)} className="text-sky-600 hover:text-sky-800 font-bold mr-4 transition-colors">Edit</button>
                      <button 
                        onClick={() => setProductToDelete({id: product.id, imageUrl: product.image})}
                        className="text-red-500 hover:text-red-700 font-bold transition-colors"
                      >Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card Layout - Hidden on Desktop */}
          <div className="md:hidden divide-y divide-rose-100">
            {loading ? (
              <div className="px-6 py-12 text-center text-rose-600 font-bold flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-4 border-rose-300 border-t-transparent rounded-full animate-spin"></div>
                Syncing Inventory...
              </div>
            ) : products.length === 0 ? (
              <div className="px-6 py-12 text-center text-rose-500 font-medium">No masterpieces found.</div>
            ) : (
              products.map(product => (
                <div key={product.id} className={`p-4 flex flex-col gap-4 animate-fade-in-up ${selectedItems.includes(product.id) ? 'bg-pink-50/30' : ''}`}>
                  <div className="flex gap-4">
                    <div className="relative">
                      <img src={product.image} alt={product.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-sm border border-rose-100" />
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(product.id)} 
                        onChange={() => handleSelect(product.id)} 
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full border-rose-300 accent-pink-500 shadow-sm" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-rose-950 text-base leading-tight truncate">{product.name}</h4>
                        <span className="shrink-0 px-2.5 py-1 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">{product.category || 'General'}</span>
                      </div>
                      
                      <div className="mt-2 flex flex-col">
                        <span className={`font-black text-sm ${product.discount > 0 ? 'text-rose-300 line-through text-[10px]' : 'text-rose-600'}`}>Rs. {parseFloat(product.price).toFixed(0)}</span>
                        {product.discount > 0 && <span className="font-black text-rose-600 text-sm">Rs. {Math.floor(product.price * (1 - product.discount / 100))}</span>}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleStock(product.id, product.inStock !== false)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${product.inStock !== false ? 'bg-emerald-500' : 'bg-rose-300'}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${product.inStock !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${product.inStock !== false ? 'text-emerald-600' : 'text-rose-400'}`}>
                              {product.inStock !== false ? 'Live' : 'Sold'}
                            </span>
                         </div>
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => handleCopyLink(product.id)}
                             className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 hover:scale-105 transition-all outline-none"
                             title="Copy Live Link"
                           >
                             Link
                           </button>
                           <button onClick={() => handleEdit(product)} className="text-[10px] font-black text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">Edit</button>
                           <button 
                             onClick={() => setProductToDelete({id: product.id, imageUrl: product.image})}
                             className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                           >Delete</button>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-40">
          <div className="bg-white border border-white rounded-[2rem] p-5 sm:p-8 md:p-10 w-full max-w-2xl shadow-[0_30px_60px_rgba(255,228,230,0.9)] max-h-[92vh] overflow-y-auto custom-scrollbar relative animate-fade-in-up">

            <button onClick={closeModal} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full p-2 transition-colors z-20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-xl sm:text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight">
              {editingId ? 'Refine Masterpiece' : 'New Masterpiece'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-1">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-bold placeholder-rose-200 text-sm" placeholder="E.g. Golden Flow Clock" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-1">Price</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-bold placeholder-rose-200 text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-rose-400 mb-2 uppercase tracking-widest pl-1">Disc %</label>
                    <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} min="0" max="100" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-bold placeholder-rose-200 text-sm" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Category Combobox */}
              <div>
                <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-1">Category</label>
                {!showNewCategory ? (
                  <div className="flex gap-3">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="flex-1 bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100 transition-all font-bold shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="">-- Select a Category --</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="px-4 py-3 bg-rose-50 border border-rose-200 hover:bg-pink-50 hover:border-pink-300 rounded-xl text-rose-600 font-bold text-sm transition-all whitespace-nowrap outline-none"
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="newCategory"
                      value={formData.newCategory}
                      onChange={handleInputChange}
                      required
                      className="flex-1 bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100 transition-all font-bold placeholder-rose-300 shadow-inner"
                      placeholder="E.g. Keychains, Trays, Coasters..."
                    />
                    {categories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowNewCategory(false); setFormData(p => ({ ...p, newCategory: '' })); }}
                        className="px-4 py-3 bg-rose-50 border border-rose-200 hover:bg-pink-50 hover:border-pink-300 rounded-xl text-rose-600 font-bold text-sm transition-all whitespace-nowrap outline-none"
                      >
                        Pick Existing
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="3" className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100 transition-all font-bold placeholder-rose-300 shadow-inner" placeholder="E.g. Handcrafted with premium resin, gold flakes & dried flowers. UV-sealed for long-lasting shine." />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-1">Variations (Comma Separated)</label>
                <input type="text" name="variations" value={formData.variations} onChange={handleInputChange} className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-3 text-rose-900 focus:outline-none focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100 transition-all font-bold placeholder-rose-300 shadow-inner" placeholder="E.g. Pink Glitter, Blue Ocean, Gold Flakes, Floral" />
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formData.inStock} onChange={(e) => setFormData(p => ({ ...p, inStock: e.target.checked }))} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.inStock ? 'bg-emerald-500' : 'bg-rose-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.inStock ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div>
                    <div className={`font-black uppercase tracking-wider ${formData.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>{formData.inStock ? 'In Stock' : 'Sold Out'}</div>
                    <div className="text-xs text-rose-800/60 font-medium">Control whether customers can buy this.</div>
                  </div>
                </label>
              </div>

              {/* Delivery Charges — per product */}
              <div>
                <label className="block text-[10px] font-black text-rose-400 mb-3 uppercase tracking-widest pl-1">Logistics / Delivery</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, deliveryFree: true, deliveryCharge: '' }))}
                    className={`py-3.5 sm:py-4 rounded-xl font-black text-sm border-2 transition-all outline-none flex items-center justify-center gap-3 ${
                      formData.deliveryFree
                        ? 'bg-rose-950 border-rose-950 text-white shadow-lg'
                        : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50 font-bold'
                    }`}
                  >
                    <span className="text-xl">🎁</span>
                    Free Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, deliveryFree: false }))}
                    className={`py-3.5 sm:py-4 rounded-xl font-black text-sm border-2 transition-all outline-none flex items-center justify-center gap-3 ${
                      !formData.deliveryFree
                        ? 'bg-rose-950 border-rose-950 text-white shadow-lg'
                        : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50 font-bold'
                    }`}
                  >
                    <span className="text-xl">🚚</span>
                    Paid Shipping
                  </button>
                </div>
                {/* Amount input — visible only when Paid is selected */}
                {!formData.deliveryFree && (
                  <div className="mt-4 relative animate-fade-in-up">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-rose-300 text-sm pointer-events-none uppercase">PKR</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.deliveryCharge}
                      onChange={(e) => setFormData(p => ({ ...p, deliveryCharge: e.target.value }))}
                      placeholder="E.g. 150"
                      className="w-full bg-rose-50/50 border border-rose-100 rounded-xl pl-14 pr-4 py-3 text-rose-900 focus:outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all font-bold placeholder-rose-200 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-rose-500 mb-2 uppercase tracking-widest pl-1">Product Image (Cloudinary)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="w-full bg-white/60 border border-dashed border-rose-300 rounded-xl px-4 py-4 text-rose-600 focus:outline-none transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-pink-100 file:text-pink-600 hover:file:bg-pink-200 shadow-inner" />
                {!imageFile && formData.image && !formData.image.includes('placeholder') && (
                  <div className="mt-3 p-2 bg-rose-50 rounded-xl border border-rose-100 inline-block shadow-sm">
                    <img src={formData.image} alt="Current" className="w-16 h-16 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploadingImage} className="w-full py-4 mt-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl font-black text-lg shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all hover:-translate-y-0.5 text-white disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 outline-none">
                {uploadingImage ? (
                  <><span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>Publishing...</>
                ) : (
                  editingId ? 'Update Product' : 'Add to Catalog'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border border-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-md shadow-[0_30px_60px_rgba(255,228,230,0.9)] relative animate-fade-in-up text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-100/50 rounded-full mix-blend-multiply filter blur-[50px] pointer-events-none"></div>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100 relative z-10">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-2xl font-black mb-3 text-rose-950 tracking-tight relative z-10">Confirm Delete</h3>
            <p className="text-rose-800/80 mb-10 font-medium relative z-10 px-4 leading-relaxed">
              Are you sure you want to permanently remove <span className="font-bold text-red-500">{deleteModal.type === 'single' ? 'this product' : `these ${selectedItems.length} products`}</span>? This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <button onClick={closeDeleteModal} className="px-8 py-4 bg-white border border-rose-200 hover:bg-rose-50 rounded-full font-bold text-rose-600 transition-all outline-none w-full sm:w-auto shadow-sm">No, Keep It</button>
              <button onClick={confirmDelete} className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-full font-black text-white shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.4)] transition-all hover:-translate-y-1 outline-none w-full sm:w-auto">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal 
        isOpen={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Masterpiece?"
        message="Are you sure you want to completely erase this product? This action cannot be undone."
        confirmText="Delete Product"
        confirmColor="red"
      />
    </div>
  );
}
