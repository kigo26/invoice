import { Invoice, InvoiceStatus, AppUser, AuditLog } from '../types';
import { calculateInvoice, formatCurrency, formatDate } from '../utils';
import { X, Printer, Edit2, Mail, Calendar, CheckSquare, Clock, AlertTriangle, FileText, CheckCircle, FileSpreadsheet, ExternalLink, Loader2, RefreshCw, Camera, Trash2 as TrashIcon, Truck, Download, History, User, Eye, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createSupplierSheet, syncInvoiceFromSheet } from '../lib/googleSheets';
import { useState, ChangeEvent, useEffect } from 'react';
import CameraCapture from './CameraCapture';
import { subscribeToAuditLogs } from '../lib/db';

interface InvoiceDetailProps {
  key?: string;
  invoice: Invoice;
  accessToken: string | null;
  appUser: AppUser | null;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: InvoiceStatus) => void;
  onUpdate: (invoice: Invoice) => void;
}

export default function InvoiceDetail({ invoice, accessToken, appUser, onClose, onEdit, onStatusChange, onUpdate }: InvoiceDetailProps) {
  const { subtotal, taxAmount, total } = calculateInvoice(invoice);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(invoice.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${invoice.spreadsheetId}` : null);
  const [viewMode, setViewMode] = useState<'invoice' | 'delivery' | 'supply' | 'reconciliation'>('invoice');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((logs) => {
      // Filter logs for this specific invoice
      const relevantLogs = logs.filter(log => log.targetId === invoice.id);
      setAuditLogs(relevantLogs);
    });
    return () => unsubscribe();
  }, [invoice.id]);

  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'super_admin';
  const isDelivery = appUser?.role === 'delivery';
  const isSupplier = appUser?.role === 'supplier';

  const [isUploading, setIsUploading] = useState(false);
  const [activeCamera, setActiveCamera] = useState<'supplier' | 'delivery' | null>(null);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'supplier' | 'delivery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const updatedInvoice = { 
          ...invoice, 
          [type === 'supplier' ? 'supplierPhotoUrl' : 'deliveryPhotoUrl']: base64String 
        };
        onUpdate(updatedInvoice);
        setIsUploading(false);
      };
      // Simple compression/resizing could be added here, but for now we take the image
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload failed:', error);
      setIsUploading(false);
    }
  };

  const removePhoto = (type: 'supplier' | 'delivery') => {
    const updatedInvoice = { 
      ...invoice, 
      [type === 'supplier' ? 'supplierPhotoUrl' : 'deliveryPhotoUrl']: undefined 
    };
    onUpdate(updatedInvoice);
  };

  const handleCapture = (imageDataUrl: string) => {
    if (!activeCamera) return;
    const updatedInvoice = { 
      ...invoice, 
      [activeCamera === 'supplier' ? 'supplierPhotoUrl' : 'deliveryPhotoUrl']: imageDataUrl 
    };
    onUpdate(updatedInvoice);
    setActiveCamera(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-document-card');
    if (!element) return;

    setIsGeneratingPDF(true);
    try {
      // Capture the element as a canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#141414',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`LiliProvisions_Invoice_${invoice.id.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateSheet = async () => {
    if (!accessToken) return;
    setIsGeneratingSheet(true);
    try {
      const { id, url } = await createSupplierSheet(invoice, accessToken);
      setSheetUrl(url);
      
      // Update invoice with spreadsheetId
      onUpdate({ ...invoice, spreadsheetId: id });
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to generate sheet:', error);
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handleSyncFromSheet = async () => {
    if (!accessToken || !invoice.spreadsheetId) return;
    setIsSyncing(true);
    try {
      const { items: updatedWeights } = await syncInvoiceFromSheet(invoice.spreadsheetId, accessToken);
      
      // Merge updated weights back into invoice items
      const updatedItems = invoice.items.map(item => {
        const update = updatedWeights.find(u => u.description === item.description);
        if (update) {
          return {
            ...item,
            supplyWeight: update.supplyWeight ?? item.supplyWeight,
            deliveryWeight: update.deliveryWeight ?? item.deliveryWeight,
          };
        }
        return item;
      });

      onUpdate({ ...invoice, items: updatedItems });
      
    } catch (error) {
      console.error('Failed to sync from sheet:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const statusIcons: Record<InvoiceStatus, any> = {
    Paid: CheckCircle,
    Pending: Clock,
    Overdue: AlertTriangle,
    Draft: FileText,
    'Out for Delivery': Truck,
    Delivered: CheckCircle,
    READY_FOR_PICKUP: Package,
  };

  const statusColors: Record<InvoiceStatus, string> = {
    Paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Overdue: 'text-rose-450 bg-rose-500/10 border-rose-500/20',
    Draft: 'text-zinc-400 bg-[#1C1C1C] border-[#1F1F1F]',
    'Out for Delivery': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    Delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    READY_FOR_PICKUP: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  const StatusIcon = statusIcons[invoice.status];

  return (
    <div id="invoice-detail-backdrop" className={`fixed inset-0 z-50 flex justify-end no-print ${isPreviewMode ? 'bg-[#050505]' : ''}`}>
      {/* Background Dim Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity ${isPreviewMode ? 'hidden' : ''}`}
      />

      {/* Slide drawer container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className={`relative ${isPreviewMode ? 'w-full h-full' : 'w-full max-w-3xl'} bg-[#0A0A0A] h-screen shadow-2xl flex flex-col overflow-hidden transition-all duration-500`}
      >
        {/* Actions header bar - Hidden when executing system print or in Preview Mode */}
        <div className={`px-6 py-4 bg-[#141414] border-b border-[#1F1F1F] flex flex-wrap items-center justify-between gap-4 no-print ${isPreviewMode ? 'hidden' : 'flex'}`}>
          <div className="flex items-center gap-3">
            <button
              id="back-list-btn"
              type="button"
              onClick={onClose}
              className="cursor-pointer border border-[#1F1F1F] bg-[#0C0C0C] hover:bg-[#1C1C1C] text-zinc-300 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <X size={14} /> Close
            </button>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[invoice.status]}`}>
              <StatusIcon size={14} />
              <span>{invoice.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0C0C0C] p-0.5 rounded-lg border border-[#1F1F1F] mr-2">
              <button
                type="button"
                onClick={() => setViewMode('invoice')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === 'invoice' ? 'bg-[#1C1C1C] text-indigo-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setViewMode('delivery')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === 'delivery' ? 'bg-[#1C1C1C] text-indigo-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Delivery Note
              </button>
              {(isAdmin || isSupplier) && (
                <button
                  type="button"
                  onClick={() => setViewMode('supply')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    viewMode === 'supply' ? 'bg-[#1C1C1C] text-indigo-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Supply Note
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setViewMode('reconciliation')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    viewMode === 'reconciliation' ? 'bg-[#1C1C1C] text-indigo-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Reconciliation
                </button>
              )}
            </div>

            {/* Quick Status toggle buttons */}
            <div className="flex items-center bg-[#0C0C0C] p-0.5 rounded-lg border border-[#1F1F1F] mr-2">
              {(['Draft', 'Pending', 'READY_FOR_PICKUP', 'Out for Delivery', 'Delivered', 'Paid'] as InvoiceStatus[]).map((st) => (
                <button
                  key={st}
                  id={`status-toggle-${st.toLowerCase().replace(/ /g, '-')}`}
                  type="button"
                  onClick={() => onStatusChange(st)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    invoice.status === st
                      ? 'bg-[#1C1C1C] text-indigo-400 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              id="quick-edit-detail-btn"
              type="button"
              onClick={onEdit}
              className="cursor-pointer border border-[#1F1F1F] bg-[#0C0C0C] hover:bg-[#1C1C1C] text-[#E0E0E0] hover:text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm animate-none"
            >
              <Edit2 size={13} className="text-indigo-405" /> Edit
            </button>
            
            <button
              id="print-invoice-btn"
              type="button"
              onClick={handlePrint}
              className="cursor-pointer bg-[#141414] hover:bg-[#1C1C1C] text-zinc-300 font-bold text-xs px-3.5 py-2 rounded-lg border border-[#1F1F1F] transition-colors flex items-center gap-1.5 shadow-sm animate-none"
            >
              <Printer size={13} /> Print
            </button>

            <button
              id="download-pdf-btn"
              type="button"
              disabled={isGeneratingPDF}
              onClick={handleDownloadPDF}
              className="cursor-pointer bg-[#1C1C1C] hover:bg-[#252525] text-indigo-400 font-bold text-xs px-3.5 py-2 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              <span>PDF</span>
            </button>

            <button
              id="live-preview-toggle-btn"
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className="cursor-pointer bg-[#141414] hover:bg-[#1C1C1C] text-indigo-400 font-bold text-xs px-3.5 py-2 rounded-lg border border-indigo-500/20 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={13} /> Preview
            </button>

            {/* Email Invoice Button */}
            {(() => {
              const { total } = calculateInvoice(invoice);
              const subject = encodeURIComponent(`Invoice Summary: ${invoice.id}`);
              const directLink = `${window.location.origin}/?invoiceId=${invoice.id}`;
              const body = encodeURIComponent(
                `Invoice Details:\n\n` +
                `Invoice ID: ${invoice.id}\n` +
                `Client: ${invoice.clientName}\n` +
                `Issue Date: ${formatDate(invoice.issueDate)}\n` +
                `Status: ${invoice.status}\n` +
                `Total Amount: ${formatCurrency(total)}\n\n` +
                `View Record Online: ${directLink}\n\n` +
                `Thank you for your business!`
              );
              const mailtoLink = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;

              return (
                <a
                  id="email-invoice-btn"
                  href={mailtoLink}
                  className="cursor-pointer bg-white hover:bg-zinc-200 text-black font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm animate-none"
                >
                  <Mail size={13} /> Email Invoice
                </a>
              );
            })()}

            {isAdmin && accessToken && (
              <div className="flex items-center gap-2">
                {invoice.spreadsheetId && (
                  <button
                    type="button"
                    onClick={handleSyncFromSheet}
                    disabled={isSyncing}
                    className="cursor-pointer bg-[#1C1C1C] hover:bg-[#252525] text-indigo-400 font-bold text-xs px-3.5 py-2 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCw size={13} />
                    )}
                    <span className="hidden sm:inline">Sync weights</span>
                  </button>
                )}
                <button
                  id="generate-sheet-btn"
                  type="button"
                  onClick={handleGenerateSheet}
                  disabled={isGeneratingSheet}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed group relative"
                >
                {isGeneratingSheet ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={13} />
                )}
                <span className="hidden sm:inline">Delivery Log Sheet</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-[9px] text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700 pointer-events-none whitespace-nowrap">Admin Only</span>
              </button>
            </div>
          )}

          {!isAdmin && sheetUrl && accessToken && (
            <a 
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer bg-[#1C1C1C] hover:bg-indigo-600/10 text-indigo-400 font-bold text-xs px-3.5 py-2 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1.5 shadow-md"
            >
              <FileSpreadsheet size={13} />
              <span>Fill Weight Log</span>
              <ExternalLink size={11} className="ml-0.5 opacity-50" />
            </a>
          )}
        </div>
      </div>

        {/* Preview Mode Exit Floating Bar */}
        {isPreviewMode && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] no-print">
            <div className="bg-[#141414]/80 backdrop-blur-md border border-[#1F1F1F] rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl">
              <div className="flex items-center gap-2 pr-4 border-r border-[#1F1F1F]">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest text-[#E0E0E0]">Live Preview Mode</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  {isGeneratingPDF ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Download PDF
                </button>
                
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-[#1F1F1F] hover:bg-[#252525] text-white rounded-full text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Printer size={12} />
                  Print
                </button>

                <button
                  onClick={() => setIsPreviewMode(false)}
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-full text-xs font-extrabold transition-all ml-2"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Banner if sheet generated - Limited to Admin */}
        <AnimatePresence>
          {accessToken && sheetUrl && !isPreviewMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center justify-between text-[11px] text-emerald-400 font-medium no-print"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={14} />
                <span>Admin: Delivery log sheet generated. Share this link with the provider.</span>
              </div>
              <a 
                href={sheetUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 underline hover:text-emerald-300"
              >
                View Sheet <ExternalLink size={10} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable content section */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 flex items-start justify-center transition-all duration-300 ${isPreviewMode ? 'bg-zinc-950 pt-24 pb-24' : 'bg-[#0A0A0A]'}`}>
          
          {/* Print container representation */}
          <div 
            id="invoice-document-card"
            className={`bg-[#141414] w-full max-w-2xl p-8 rounded-2xl border border-[#1F1F1F] text-[#E0E0E0] shadow-2xl relative print-container transition-all duration-500 ${isPreviewMode ? 'shadow-indigo-500/5 border-zinc-800' : ''}`}
          >
            {/* Document Header */}
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 pb-6 border-b border-[#1F1F1F]/60">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-white font-bold tracking-tight text-lg">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/10">
                    L
                  </div>
                  <span>Liliprovisions Ltd</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono font-medium">
                  PIN: P051674312Q
                </div>
              </div>

              <div className="md:text-right space-y-0.5">
                <h1 className="text-lg font-bold uppercase tracking-widest text-[#E0E0E0] font-mono">
                  {viewMode === 'invoice' ? 'Invoice' : 
                   viewMode === 'delivery' ? 'Delivery Note' : 
                   viewMode === 'supply' ? 'Supplier Supply Note' : 
                   'Weight Reconciliation Report'}
                </h1>
                <p className="text-sm font-semibold text-indigo-400 font-mono">{invoice.id}</p>
              </div>
            </div>

            {/* Billing Profile Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 pb-6 text-sm">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-widest font-mono">Billed From</span>
                <div className="font-bold text-white">Liliprovisions Ltd</div>
                <div className="text-xs text-zinc-400 leading-relaxed">
                  Masanduku Park,Shop 5<br />
                  Utawala, Nairobi, Kenya<br />
                  <span className="font-mono text-zinc-500">accounts@liliprovisions.co.ke</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-widest font-mono">Billed To</span>
                <div className="font-bold text-white">{invoice.clientName}</div>
                <div className="text-xs text-zinc-400 leading-relaxed">
                  {invoice.clientEmail}<br />
                  Net 30 Billing Protocol<br />
                  Electronic Settlement Requested
                </div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl mb-6 text-xs">
              <div>
                <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Date Issued</span>
                <span className="font-semibold text-white font-mono">{formatDate(invoice.issueDate)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Due Date</span>
                <span className="font-semibold text-white font-mono">{formatDate(invoice.dueDate)}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Terms</span>
                <span className="font-semibold text-white">Net 30 Days</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Status</span>
                <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
                  invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                  invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/15' :
                  invoice.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' : 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/15'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Line items details table */}
            {(viewMode === 'invoice' || viewMode === 'delivery' || viewMode === 'supply') && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center w-16">Qty</th>
                      { (viewMode === 'supply' || viewMode === 'delivery') && (
                         <th className="py-2.5 text-right w-24">Meat KGs</th>
                      )}
                      {viewMode === 'invoice' && (
                        <>
                          <th className="py-2.5 text-right w-24">Unit Price</th>
                          <th className="py-2.5 text-right w-28">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]/50">
                    {invoice.items.map((item, index) => (
                      <tr key={item.id || index} className="text-zinc-350">
                        <td className="py-3 items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{item.description}</span>
                            {viewMode === 'delivery' && (
                              <div className="mt-1 flex items-center gap-1.5">
                                {(() => {
                                  const supply = item.supplyWeight || 0;
                                  const delivery = item.deliveryWeight || 0;
                                  
                                  if (supply > 0 && delivery > 0) {
                                    const variance = Math.abs(supply - delivery);
                                    if (variance > 0.5 || (variance / supply) > 0.02) {
                                      return (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-rose-500/10 text-rose-450 border border-rose-500/20">
                                          <AlertTriangle size={8} /> Discrepancy Detected
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle size={8} /> Delivered
                                      </span>
                                    );
                                  }
                                  
                                  if (supply > 0) {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <Truck size={8} /> In-Transit
                                      </span>
                                    );
                                  }
                                  
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                      <Clock size={8} /> Pending Load
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono text-zinc-400">
                          {item.quantity}
                        </td>
                        { (viewMode === 'supply' || viewMode === 'delivery') && (
                          <td className="py-3 text-right font-mono text-zinc-500 italic">
                            {viewMode === 'supply' ? (item.supplyWeight ? `${item.supplyWeight} KG` : '_______ KGs') : 
                             viewMode === 'delivery' ? (item.deliveryWeight ? `${item.deliveryWeight} KG` : '_______ KGs') : 
                             '_______ KGs'}
                          </td>
                        )}
                        {viewMode === 'invoice' && (
                          <>
                            <td className="py-3 text-right font-mono text-zinc-400">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-white">
                              {formatCurrency(item.quantity * item.price)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reconciliation Comparison Table */}
            {isAdmin && viewMode === 'reconciliation' && (
              <div className="overflow-x-auto mb-6">
                <div className="mb-4 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 text-[11px] text-zinc-400 leading-relaxed italic">
                  Note: Meat products typically experience natural moisture loss (shrinkage) during transport and handling. Discrepancies below 2% are considered within standard tolerance.
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-right w-24">Supply (KG)</th>
                      <th className="py-2.5 text-right w-24">Delivery (KG)</th>
                      <th className="py-2.5 text-right w-24">Variance</th>
                      <th className="py-2.5 text-right w-20">% Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]/50">
                    {invoice.items.map((item, index) => {
                      const supply = item.supplyWeight || 0;
                      const delivery = item.deliveryWeight || 0;
                      const variance = supply - delivery;
                      const percentLoss = supply > 0 ? (variance / supply) * 100 : 0;
                      
                      return (
                        <tr key={item.id || index} className="text-zinc-350">
                          <td className="py-3 font-semibold text-white">
                            {item.description}
                          </td>
                          <td className="py-3 text-right font-mono text-emerald-400">
                            {supply > 0 ? supply.toFixed(2) : '-'}
                          </td>
                          <td className="py-3 text-right font-mono text-indigo-300">
                            {delivery > 0 ? delivery.toFixed(2) : '-'}
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${variance > 0.5 ? 'text-rose-400' : variance < 0 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                            {variance !== 0 ? variance.toFixed(2) : '0.00'}
                          </td>
                          <td className={`py-3 text-right font-mono text-[10px] ${percentLoss > 2 ? 'text-rose-400' : 'text-zinc-500'}`}>
                            {percentLoss > 0 ? `${percentLoss.toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalSupply = invoice.items.reduce((acc, item) => acc + (item.supplyWeight || 0), 0);
                      const totalDelivery = invoice.items.reduce((acc, item) => acc + (item.deliveryWeight || 0), 0);
                      const totalVariance = totalSupply - totalDelivery;
                      const avgLoss = totalSupply > 0 ? (totalVariance / totalSupply) * 100 : 0;
                      
                      return (
                        <tr className="border-t border-[#1F1F1F] font-bold">
                          <td className="py-3 text-white uppercase tracking-wider text-[10px]">Total Aggregate</td>
                          <td className="py-3 text-right font-mono text-emerald-400">{totalSupply.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-indigo-300">{totalDelivery.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-rose-400">{totalVariance.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-zinc-300">{avgLoss.toFixed(1)}%</td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            )}

            {/* Mathematical calculations table */}
            {viewMode === 'invoice' && (
              <div className="flex justify-end pt-4 border-t border-[#1F1F1F]">
                <div className="w-56 space-y-1.5 text-xs text-zinc-400 font-mono">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (16%):</span>
                    <span className="text-white font-semibold">+{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2.5 border-t border-[#1F1F1F] font-sans text-white">
                    <span className="font-bold">Total Due:</span>
                    <span className="font-bold text-base text-indigo-400 font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Confirmation Section */}
            {(invoice.supplierUID || invoice.supplierName || invoice.supplierEmail || viewMode === 'supply') && (
              <div className="mt-8 pt-6 border-t border-[#1F1F1F] grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-1.5">Supply Status</span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white bg-[#0C0C0C] p-3 rounded-lg border border-[#1F1F1F]">
                      <Package size={14} className="text-emerald-400" />
                      <span>{invoice.supplierConfirmedAt ? 'Confirmed Ready by Supplier' : 'Awaiting Supplier Documentation'}</span>
                    </div>
                  </div>
                  
                  {(invoice.supplierName || invoice.supplierEmail) && (
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-1.5">Verified By Supplier</span>
                      <div className="text-xs text-white font-bold">{invoice.supplierName || 'Anonymous Supplier Node'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{invoice.supplierEmail}</div>
                      {invoice.supplierConfirmedAt && (
                        <div className="text-[9px] text-zinc-600 font-mono mt-1 italic">Timestamp: {new Date(invoice.supplierConfirmedAt).toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>

                {viewMode === 'supply' && (
                  <div className="flex flex-col justify-end space-y-4">
                    <div className="border-b border-[#1F1F1F] pb-1">
                      <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-8">Supplier Dispatch (Authorized Stamp)</span>
                      <div className="h-0.5 w-full bg-zinc-800"></div>
                    </div>
                    <div className="text-[10px] text-zinc-500 italic">This document confirms KGs listed were verified at slaughter.</div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Details Section */}
            {(invoice.deliveryUID || invoice.deliveryPerson || invoice.deliveryNote || viewMode === 'delivery') && (
              <div className="mt-8 pt-6 border-t border-[#1F1F1F] grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-1.5">Delivery Status</span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white bg-[#0C0C0C] p-3 rounded-lg border border-[#1F1F1F]">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span>Ready for dispatch / Delivered</span>
                    </div>
                  </div>
                  
                  {(invoice.deliveryName || invoice.deliveryPerson) && (
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-1.5">Delivered By</span>
                      <div className="text-xs text-white font-bold">{invoice.deliveryName || invoice.deliveryPerson}</div>
                      {invoice.deliveryEmail && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{invoice.deliveryEmail}</div>
                      )}
                    </div>
                  )}
                </div>

                {viewMode === 'delivery' && (
                  <div className="flex flex-col justify-end space-y-4">
                    <div className="border-b border-[#1F1F1F] pb-1">
                      <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-8">Received By (Signature)</span>
                      <div className="h-0.5 w-full bg-zinc-800"></div>
                    </div>
                    <div className="text-[10px] text-zinc-500 italic">Please verify quantities upon receipt.</div>
                  </div>
                )}
              </div>
            )}

            {/* Supplier Specific Instructions & Scale Photo */}
            {viewMode === 'supply' && (
              <div className="space-y-6 mt-8">
                {invoice.supplierNote && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <span className="block text-[9px] uppercase font-bold text-emerald-400 tracking-wider font-mono mb-1.5">Supplier Specific Instructions</span>
                    <p className="text-xs text-[#E0E0E0] leading-relaxed italic">"{invoice.supplierNote}"</p>
                  </div>
                )}

                <div className="p-6 bg-[#0C0C0C] border border-dashed border-[#1F1F1F] rounded-2xl flex flex-col items-center gap-4">
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono mb-1">Weighing Scale Documentation</span>
                    <p className="text-[10px] text-zinc-600 italic">Please upload a clear photo of the scale readout for this batch.</p>
                  </div>

                  {invoice.supplierPhotoUrl ? (
                    <div className="relative group w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-[#1F1F1F]">
                      <img src={invoice.supplierPhotoUrl} alt="Supplier Scale" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {(isSupplier || isAdmin) && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => removePhoto('supplier')}
                            className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 hover:bg-rose-500/40 transition-all"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    (isSupplier || isAdmin) && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <button
                          onClick={() => setActiveCamera('supplier')}
                          className="flex-1 cursor-pointer flex flex-col items-center gap-2 py-6 border-2 border-dashed border-indigo-500/20 rounded-xl hover:bg-indigo-500/5 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <Camera size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Take Photo</span>
                        </button>
                        
                        <label className="flex-1 cursor-pointer flex flex-col items-center gap-2 py-6 border-2 border-dashed border-zinc-500/20 rounded-xl hover:bg-zinc-500/5 transition-all group">
                          <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, 'supplier')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Delivery Photo Section */}
            {viewMode === 'delivery' && (
              <div className="space-y-6 mt-8">
                <div className="p-6 bg-[#0C0C0C] border border-dashed border-[#1F1F1F] rounded-2xl flex flex-col items-center gap-4">
                  <div className="text-center">
                    <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono mb-1">Final Weight Verification (Scale Photo)</span>
                    <p className="text-[10px] text-zinc-600 italic">Documentation of final weight at point of delivery.</p>
                  </div>

                  {invoice.deliveryPhotoUrl ? (
                    <div className="relative group w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-[#1F1F1F]">
                      <img src={invoice.deliveryPhotoUrl} alt="Delivery Scale" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {(isDelivery || isAdmin) && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => removePhoto('delivery')}
                            className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 hover:bg-rose-500/40 transition-all"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    (isDelivery || isAdmin) && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <button
                          onClick={() => setActiveCamera('delivery')}
                          className="flex-1 cursor-pointer flex flex-col items-center gap-2 py-6 border-2 border-dashed border-emerald-500/20 rounded-xl hover:bg-emerald-500/5 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Camera size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Capture</span>
                        </button>
                        
                        <label className="flex-1 cursor-pointer flex flex-col items-center gap-2 py-6 border-2 border-dashed border-zinc-500/20 rounded-xl hover:bg-zinc-500/5 transition-all group">
                          <div className="w-10 h-10 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, 'delivery')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Custom Delivery Note for Client */}
            {invoice.deliveryNote && (
              <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                 <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider font-mono mb-1.5">Delivery Note from Driver</span>
                 <p className="text-xs text-[#E0E0E0] leading-relaxed italic">"{invoice.deliveryNote}"</p>
              </div>
            )}

            {/* Custom Notes */}
            {invoice.notes && viewMode === 'invoice' && (
              <div className="mt-8 pt-4 border-t border-[#1F1F1F]">
                <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-1.5">Notes & Terms</span>
                <p className="text-xs text-zinc-450 leading-relaxed font-sans italic bg-[#0C0C0C]/50 p-4 rounded-xl border border-[#1F1F1F]">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Print Footer Disclaimer watermarks */}
            <div className="mt-12 text-center text-[10px] text-zinc-500 border-t border-[#1F1F1F] pt-4 flex items-center justify-between font-mono">
              <span>Liliprovisions Ltd Ledger</span>
              <span>Thank you for your business!</span>
            </div>
          </div>

          {/* Audit Trail Section */}
          {!isPreviewMode && (
            <div className="w-full max-w-2xl mt-8 mb-12">
              <div className="flex items-center gap-2 mb-4 px-2">
                <History size={16} className="text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#E0E0E0] font-mono">Ledger Audit Trail</h3>
              </div>
              
              <div className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-2xl overflow-hidden divide-y divide-[#1F1F1F]">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, idx) => (
                    <div key={log.id} className="p-4 hover:bg-white/[0.01] transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                              log.action === 'STATUS_CHANGE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                              log.action === 'INVOICE_CREATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                            }`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono italic">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                            {log.details || 'No detailed log provided for this heartbeat.'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-zinc-500">
                            <User size={10} className="text-zinc-600" />
                            <span className="font-bold">Actor:</span>
                            <span className="font-mono">{log.actorName}</span>
                            <span className="text-zinc-700 ml-1">UID: {log.actorId.slice(0, 6)}...</span>
                          </div>
                        </div>
                        
                        {idx === 0 && (
                          <div className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/40 animate-pulse" title="Latest Activity" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-[#141414] border border-dashed border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto">
                      <Clock size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">No history recorded</p>
                    <p className="text-[10px] text-zinc-600 italic">This record was initialized before the current audit protocol was established.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 px-2 flex items-center gap-2 text-[10px] text-zinc-600 font-mono italic">
                <AlertTriangle size={10} />
                <span>Immutable Ledger: Audit logs are read-only and preserved for security compliance.</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {activeCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setActiveCamera(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
