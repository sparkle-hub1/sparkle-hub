import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, orderBy, query, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { downloadImage } from '../../utils/file_utils';
import { sendOrderStatusEmail } from '../../utils/emailService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import sparkleLogo from '../../assets/sparkle.jpg';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfImageMap, setPdfImageMap] = useState({}); // base64 map for PDF image pre-loading

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'N/A'
      }));
      setOrders(ordersList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        orderStatus: newStatus
      });
      setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, orderStatus: newStatus } : o));

      // Trigger email for key lifecycle milestones
      const emailStatuses = ['Confirmed', 'Dispatched', 'Delivered'];
      if (emailStatuses.includes(newStatus) && selectedOrder.userEmail) {
        const customerName = selectedOrder.customerDetails?.name || 'Valued Customer';
        sendOrderStatusEmail(
          selectedOrder.userEmail,
          customerName,
          selectedOrder.id,
          selectedOrder.totalAmount || 0,
          newStatus
        ).catch(err => console.warn(`Lifecycle email (${newStatus}) failed (non-critical):`, err));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await deleteDoc(doc(db, 'orders', orderToDelete.id));
      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      setOrderToDelete(null);
      if (selectedOrder?.id === orderToDelete.id) {
          closeModal();
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      alert('Failed to delete order.');
    }
  };

  // Helper: convert any image URL to a base64 data URL to bypass CORS in html2canvas
  const toBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(url); // fallback to original if conversion fails
      img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    });
  };

  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    setIsGeneratingPdf(true);

    try {
      // Step 1: Pre-convert ALL images to base64 so html2canvas can render them
      const allImageUrls = [
        selectedOrder.paymentScreenshot,
        ...(selectedOrder.items || []).map(i => i.image),
        ...(selectedOrder.customPictures || []),
      ].filter(Boolean);

      const base64Map = {};
      await Promise.all(
        allImageUrls.map(async (url) => {
          base64Map[url] = await toBase64(url);
        })
      );
      setPdfImageMap(base64Map);

      // Step 2: Wait for React to re-render the template with base64 images
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Capture the professional template
      const element = document.getElementById('professional-invoice-template');
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sparkle_Hub_Order_${selectedOrder.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate professional PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
      setPdfImageMap({});
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Awaiting Payment': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Confirmed': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Packed': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'Dispatched': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b border-rose-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-rose-950 tracking-tight">Financial & Fulfillment Pipeline</h2>
          <p className="text-rose-600 font-medium">Verify transfers and dispatch masterpieces</p>
        </div>
        <button onClick={fetchOrders} className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-pink-600 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
          <span>🔄</span> Refresh Pipeline
        </button>
      </div>

      <div className="bg-white/95 border border-white rounded-[2rem] shadow-[0_20px_60px_rgba(255,228,230,0.8)] backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full filter blur-[80px] pointer-events-none"></div>
        <div className="overflow-x-auto relative z-10 w-full rounded-[2rem]">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead className="bg-rose-50 border-b border-rose-200">
              <tr>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Order Ref</th>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Client info</th>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Placed On</th>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Total Value</th>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Pipeline Status</th>
                <th className="px-6 py-5 text-xs font-black text-rose-500 uppercase tracking-widest text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100 bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-rose-600 font-bold">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-6 h-6 border-4 border-rose-300 border-t-transparent rounded-full animate-spin"></div>
                      Rendering Pipeline...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-rose-500 font-medium">No transactions available in the database.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-rose-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-rose-900 bg-rose-50 px-2 py-1 rounded border border-rose-100">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-rose-950 truncate max-w-[150px]">{order.customerDetails?.name || 'Guest'}</p>
                      <p className="text-xs text-rose-600 truncate max-w-[150px]">{order.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-rose-800/80 text-sm whitespace-nowrap">{order.date}</td>
                    <td className="px-6 py-4 font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 whitespace-nowrap">${order.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border inline-flex items-center gap-1.5 ${getStatusColor(order.orderStatus)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {order.orderStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openModal(order)} 
                          className="px-4 py-2 bg-rose-100/50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded-lg text-sm font-bold transition-all shadow-sm group-hover:shadow-md outline-none"
                        >
                          Verify & Manage
                        </button>
                        <button 
                          onClick={() => setOrderToDelete(order)}
                          className="p-2 text-rose-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Order"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-rose-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-4xl shadow-[0_30px_60px_rgba(255,228,230,0.9)] max-h-[90vh] overflow-y-auto custom-scrollbar relative animate-fade-in-up">
            
            <button onClick={closeModal} className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full p-2 transition-colors z-20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pr-16 gap-6">
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 tracking-tight mb-1">
                  Requisition Details
                </h3>
                <p className="font-mono text-sm font-bold text-rose-500">REF: {selectedOrder.id}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100 shadow-sm transition-all flex items-center gap-2 group disabled:opacity-50"
                >
                   {isGeneratingPdf ? (
                     <>
                       <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                       Exporting...
                     </>
                   ) : (
                     <>
                       <span className="text-base group-hover:scale-110 transition-transform">📄</span> Print / Download PDF
                     </>
                   )}
                </button>
                <span className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border inline-flex items-center gap-2 shadow-sm ${getStatusColor(selectedOrder.orderStatus)}`}>
                   <span className="w-2 h-2 rounded-full bg-current"></span>
                   Current State: {selectedOrder.orderStatus}
                </span>
              </div>
            </div>

            <div id="order-details-content" className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100 shadow-inner">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 border-b border-rose-100 pb-2">Client Identity & Dispatch Routing</h4>
                  <p className="font-black text-rose-950 text-xl">{selectedOrder.customerDetails?.name || 'Guest'}</p>
                  <p className="text-rose-600 font-bold text-sm mt-1">{selectedOrder.userEmail}</p>
                  <p className="text-rose-600 font-bold text-sm mt-1">{selectedOrder.customerDetails?.phone}</p>
                  <div className="mt-4 p-5 bg-white rounded-2xl border border-rose-100 shadow-sm leading-relaxed text-sm text-rose-800/80 font-bold">
                    {selectedOrder.customerDetails?.address}
                  </div>
                </div>

                <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100 shadow-inner flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-rose-100 pb-2">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Financial Proof</h4>
                    {selectedOrder.paymentScreenshot && (
                      <button 
                        onClick={() => downloadImage(selectedOrder.paymentScreenshot, `Payment_${selectedOrder.id}.png`)}
                        className="text-[10px] font-black text-rose-500 bg-white border border-rose-200 px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                         Download Proof
                      </button>
                    )}
                  </div>
                  {selectedOrder.paymentScreenshot ? (
                    <div className="flex-1 bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex items-center justify-center p-2 group relative cursor-pointer">
                      <img src={selectedOrder.paymentScreenshot} alt="Payment Receipt" className="max-h-56 object-contain rounded-xl group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <a href={selectedOrder.paymentScreenshot} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-rose-600 rounded-lg font-bold shadow-md transform translate-y-4 group-hover:translate-y-0 transition-all border border-rose-100">
                          View Full Screen
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-rose-100 shadow-sm p-6 text-center border-dashed">
                      {selectedOrder.orderStatus === 'Awaiting Payment' ? (
                         <>
                           <span className="text-3xl mb-2">⏳</span>
                           <span className="text-yellow-600 font-bold">Awaiting Transaction Proof</span>
                           <span className="text-xs text-yellow-500 font-medium mt-1">Customer has not uploaded the receipt yet.</span>
                         </>
                      ) : (
                         <span className="text-rose-400 font-bold">No receipt uploaded for this order.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-rose-100 rounded-[2.5rem] p-8 mb-8 shadow-sm">
                <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-6 border-b border-rose-50 pb-2">Masterpieces Commissioned</h4>
                <div className="space-y-6">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-rose-50/30 p-4 rounded-2xl border border-rose-50 transition-colors hover:bg-rose-50">
                      <div className="flex items-center gap-5">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white" />
                        <div>
                          <p className="font-black text-rose-950 text-base">{item.name}</p>
                          <p className="text-sm text-rose-600 font-bold mt-1">
                            Qty: <span className="font-black text-rose-950">{item.quantity}</span>
                            {item.variation && <span className="ml-4 font-black text-pink-700 bg-pink-100 px-3 py-1.5 rounded-xl border border-pink-200 shadow-sm text-xs">{item.variation}</span>}
                          </p>
                        </div>
                      </div>
                      <p className="font-black text-rose-950 text-xl">PKR {(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-rose-100 flex flex-col gap-2 items-end">
                  <div className="flex justify-between w-full max-w-[200px] text-xs font-bold text-rose-400 uppercase">
                      <span>Subtotal</span>
                      <span>PKR {(selectedOrder.totalAmount - (selectedOrder.deliveryCharges || 0)).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[200px] text-xs font-bold text-rose-400 uppercase">
                      <span>Delivery</span>
                      <span>PKR {(selectedOrder.deliveryCharges || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between w-full mt-4 pt-4 border-t border-rose-50 items-center">
                    <span className="font-black uppercase tracking-widest text-rose-500 text-sm">Grand Total Authenticated</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 tracking-tight">PKR {selectedOrder.totalAmount?.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.customPictures && selectedOrder.customPictures.length > 0 && (
                <div className="bg-white border border-rose-100 rounded-[2.5rem] p-8 shadow-sm">
                   <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-6 border-b border-rose-50 pb-2">Client Reference Media</h4>
                   <div className="flex flex-wrap gap-6 mt-4">
                     {selectedOrder.customPictures.map((pic, idx) => (
                        <div key={idx} className="relative group w-40 h-40 rounded-3xl overflow-hidden shadow-sm border border-rose-100 cursor-pointer shrink-0">
                          <img src={pic} alt="Reference" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                            <a href={pic} target="_blank" rel="noreferrer" className="w-24 py-1.5 bg-white text-rose-600 rounded-lg font-bold shadow-md text-[10px] border border-rose-100 text-center">
                              View HD
                            </a>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(pic, `Ref_${idx+1}_${selectedOrder.id}.png`);
                              }}
                              className="w-24 py-1.5 bg-rose-500 text-white rounded-lg font-bold shadow-md text-[10px] hover:bg-rose-600 transition-colors"
                            >
                               Download
                            </button>
                          </div>
                        </div>
                     ))}
                   </div>
                </div>
              )}
            </div>

            {/* Lifecycle Dispatch Controls */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-[2rem] border border-pink-200 shadow-inner">
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 border-b border-rose-200/50 pb-2">Lifecycle Controller Workflow</h4>
              
              <div className="flex flex-wrap gap-4">
                {selectedOrder.orderStatus === 'Awaiting Payment' && (
                  <div className="flex-1 py-4 bg-yellow-50 text-yellow-600 rounded-xl font-bold shadow-sm border border-yellow-200 flex items-center justify-center text-center cursor-not-allowed">
                     ⏳ Awaiting Customer Upload...
                  </div>
                )}
                
                {selectedOrder.orderStatus === 'Pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus('Confirmed')} 
                      disabled={updating}
                      className="flex-1 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                      Authenticate Payment & Confirm
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Rejected')} 
                      disabled={updating}
                      className="flex-none px-6 py-4 bg-white border border-red-200 hover:bg-red-50 text-red-500 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      Reject Fraudulent
                    </button>
                  </>
                )}
                
                {selectedOrder.orderStatus === 'Confirmed' && (
                  <button 
                    onClick={() => handleUpdateStatus('Packed')} 
                    disabled={updating}
                    className="flex-1 py-4 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    Initiate Packing Sequence
                  </button>
                )}
                
                {selectedOrder.orderStatus === 'Packed' && (
                  <button 
                    onClick={() => handleUpdateStatus('Dispatched')} 
                    disabled={updating}
                    className="flex-1 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    Dispatch via Courier
                  </button>
                )}
                
                {selectedOrder.orderStatus === 'Dispatched' && (
                  <button 
                    onClick={() => handleUpdateStatus('Delivered')} 
                    disabled={updating}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    Mark as Delivered Successfully
                  </button>
                )}

                {['Delivered', 'Rejected'].includes(selectedOrder.orderStatus) && (
                  <div className="flex-1 flex items-center justify-center py-4 bg-white border border-rose-100 rounded-xl text-rose-500 font-bold shadow-sm">
                    Lifecycle Locked at {selectedOrder.orderStatus} state.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🚀 Professional Hidden PDF Template (Excluded from Interactive UI) */}
      {selectedOrder && (
        <div 
          id="professional-invoice-template" 
          style={{ 
            position: 'absolute', 
            top: '-9999px', 
            left: '-9999px',
            width: '800px', 
            backgroundColor: '#ffffff', 
            color: '#000000', 
            padding: '80px', /* Consistent padding all around */
            paddingBottom: '150px', /* Extra heavy padding-bottom for grand totals */
            fontFamily: "'Inter', sans-serif" 
          }}
        >
          {/* Header Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', borderBottom: '3px solid #fce7f3', paddingBottom: '30px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img src={sparkleLogo} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #fb7185' }} />
                <div>
                   <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0', color: '#be123c', letterSpacing: '-1px' }}>Sparkle Hub</h1>
                   <p style={{ fontSize: '12px', fontWeight: '700', margin: '5px 0 0', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '2px' }}>Official Requisition Slip</p>
                </div>
             </div>
             <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#f43f5e', margin: '0 0 5px' }}>ORDER REFERENCE</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#000', margin: '0', fontFamily: 'monospace' }}>{selectedOrder.id}</p>
             </div>
          </div>

          {/* Client & Payment Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
             <div style={{ backgroundColor: '#fff1f2', padding: '30px', borderRadius: '30px', border: '1px solid #ffe4e6' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#f43f5e', margin: '0 0 15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Recipient Identity</h3>
                <p style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 10px', color: '#1a1a1a' }}>{selectedOrder.customerDetails?.name}</p>
                <p style={{ fontSize: '14px', margin: '0 0 5px', color: '#4c0519', fontWeight: '600' }}>{selectedOrder.userEmail}</p>
                <p style={{ fontSize: '14px', margin: '0', color: '#4c0519', fontWeight: '900' }}>{selectedOrder.customerDetails?.phone}</p>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '15px', fontSize: '13px', color: '#4c0519', lineHeight: '1.6', fontWeight: '500', border: '1px solid #fecdd3' }}>
                   {selectedOrder.customerDetails?.address}
                </div>
             </div>

             <div style={{ backgroundColor: '#f0fdf4', padding: '30px', borderRadius: '30px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#166534', margin: '0 0 15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Verification Proof</h3>
                {selectedOrder.paymentScreenshot ? (
                  <img 
                    src={pdfImageMap[selectedOrder.paymentScreenshot] || selectedOrder.paymentScreenshot} 
                    alt="Payment" 
                    style={{ width: '100%', height: '160px', objectFit: 'contain', borderRadius: '15px', backgroundColor: '#fff', padding: '5px' }} 
                  />
                ) : (
                  <p style={{ fontSize: '12px', color: '#166534', fontWeight: '700', padding: '40px 0' }}>No Receipt Uploaded</p>
                )}
                <p style={{ fontSize: '10px', marginTop: '15px', color: '#166534', fontWeight: '800', textTransform: 'uppercase' }}>Current State: {selectedOrder.orderStatus}</p>
             </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '60px' }}>
             <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#f43f5e', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Masterpieces Commissioned</h3>
             <div style={{ border: '2px solid #fff1f2', borderRadius: '30px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead>
                      <tr style={{ backgroundColor: '#fff1f2', textAlign: 'left' }}>
                         <th style={{ padding: '20px', fontSize: '11px', fontWeight: '900', color: '#be123c' }}>ITEM DESCRIPTION</th>
                         <th style={{ padding: '20px', fontSize: '11px', fontWeight: '900', color: '#be123c', textAlign: 'center' }}>QTY</th>
                         <th style={{ padding: '20px', fontSize: '11px', fontWeight: '900', color: '#be123c', textAlign: 'right' }}>PRICE</th>
                      </tr>
                   </thead>
                   <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                         <tr key={idx} style={{ borderBottom: '1px solid #fff1f2' }}>
                            <td style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                               <img 
                                 src={pdfImageMap[item.image] || item.image} 
                                 alt="Product" 
                                 style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} 
                               />
                               <div>
                                  <p style={{ fontSize: '14px', fontWeight: '900', margin: '0', color: '#1a1a1a' }}>{item.name}</p>
                                  {item.variation && <p style={{ fontSize: '10px', fontWeight: '800', margin: '5px 0 0', color: '#be123c', backgroundColor: '#fce7f3', padding: '2px 8px', borderRadius: '50px', display: 'inline-block' }}>{item.variation}</p>}
                               </div>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center', fontWeight: '900', fontSize: '15px' }}>{item.quantity}</td>
                            <td style={{ padding: '20px', textAlign: 'right', fontWeight: '900', fontSize: '15px', color: '#000' }}>PKR {(item.price * item.quantity).toFixed(0)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Totals Block (Moved up for visibility) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '40px 0', borderTop: '4px solid #fce7f3', marginBottom: '40px' }}>
             <div style={{ width: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                   <span style={{ fontSize: '13px', fontWeight: '800', color: '#9d174d' }}>ITEM SUBTOTAL</span>
                   <span style={{ fontSize: '16px', fontWeight: '900' }}>PKR {(selectedOrder.totalAmount - (selectedOrder.deliveryCharges || 0)).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                   <span style={{ fontSize: '13px', fontWeight: '800', color: '#be123c' }}>DELIVERY CHARGES</span>
                   <span style={{ fontSize: '16px', fontWeight: '900', color: (selectedOrder.deliveryCharges || 0) === 0 ? '#16a34a' : '#000' }}>
                      {(selectedOrder.deliveryCharges || 0) === 0 ? 'FREE' : `PKR ${selectedOrder.deliveryCharges.toFixed(0)}`}
                   </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '25px', backgroundColor: '#be123c', borderRadius: '30px', color: '#fff', boxShadow: '0 10px 20px rgba(190, 18, 60, 0.2)' }}>
                   <span style={{ fontSize: '14px', fontWeight: '900' }}>GRAND TOTAL</span>
                   <span style={{ fontSize: '24px', fontWeight: '900' }}>PKR {selectedOrder.totalAmount?.toFixed(0)}</span>
                </div>
             </div>
          </div>

          {/* Reference Media Gallery (Simplified for PDF Capture) */}
          {selectedOrder.customPictures && selectedOrder.customPictures.length > 0 && (
            <div style={{ marginBottom: '60px' }}>
               <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#f43f5e', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Specifications (Reference Media)</h3>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {selectedOrder.customPictures.map((pic, idx) => (
                     <div key={idx} style={{ width: '160px', height: '160px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #ffe4e6' }}>
                        <img 
                          src={pdfImageMap[pic] || pic} 
                          alt="Ref" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        />
                     </div>
                  ))}
               </div>
            </div>
          )}
          
          <p style={{ marginTop: '80px', textAlign: 'center', fontSize: '10px', fontWeight: '800', color: '#be123c', textTransform: 'uppercase', letterSpacing: '2px' }}>This is a system-generated official requisition of Sparkle Hub.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal 
        isOpen={orderToDelete !== null}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteOrder}
        title="Delete Order Permanently?"
        message={`Are you sure you want to delete order REF ${orderToDelete?.id}? This action is irreversible and will remove all associated requisition data from the database.`}
        confirmText="Yes, Delete Permanently"
        confirmColor="red"
      />
    </div>
  );
}
