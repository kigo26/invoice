import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Invoice, InvoiceStatus } from './types';
import { calculateInvoice, formatCurrency, formatDate, SEED_INVOICES } from './utils';
import StatsDashboard from './components/StatsDashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceDetail from './components/InvoiceDetail';
import { Download, Upload, RotateCcw, Receipt, AlertCircle, Sparkles, CheckCircle2, Info, LogOut, User as UserIcon, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout, auth, testConnection } from './lib/auth';
import { User } from 'firebase/auth';
import { AppUser, UserRole } from './types';
import { getUserProfile, assignUserRole } from './lib/auth';
import { subscribeToInvoices, saveInvoiceToDb, deleteInvoiceFromDb, updateInvoiceInDb, subscribeToUsers, purgeInvoicesFromDb } from './lib/db';
import RoleSelector from './components/RoleSelector';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import DeliveryDashboard from './components/DeliveryDashboard';

const LOCAL_STORAGE_KEY = 'invoice_tracker_invoices_data';

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [preselectedRole, setPreselectedRole] = useState<UserRole>('ADMIN');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isSettingRole, setIsSettingRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Custom toast notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden file input ref for JSON imports
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth
  useEffect(() => {
    // Basic connectivity probe
    testConnection();

    initAuth(
      async (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        
        try {
          const profile = await getUserProfile(authUser.uid);
          if (profile) {
            setAppUser(profile);
          } else {
            setShowRoleSelector(true);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setUser(null);
        setAppUser(null);
        setAccessToken(null);
        setShowRoleSelector(false);
        setIsLoading(false);
      }
    );
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (appUser && (appUser.role === 'ADMIN' || appUser.isAuthorized || appUser.role === 'DELIVERY')) {
      const unsubscribeInvoices = subscribeToInvoices((data) => {
        setInvoices(data);
      });
      
      const unsubscribeUsers = subscribeToUsers((data) => {
        setUsersList(data);
      });

      return () => {
        unsubscribeInvoices();
        unsubscribeUsers();
      };
    } else {
      setInvoices([]);
      setUsersList([]);
    }
  }, [appUser]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Handle invoice saving (creation/modification)
  const handleSaveInvoice = async (savedInvoice: Invoice) => {
    try {
      await saveInvoiceToDb(savedInvoice);
      showToast(`Invoice ${savedInvoice.id} sync successful.`, 'success');
      
      setIsFormOpen(false);
      setEditingInvoice(null);

      if (selectedInvoice && selectedInvoice.id === savedInvoice.id) {
        setSelectedInvoice(savedInvoice);
      }
    } catch (err) {
      showToast('Failed to sync invoice to cloud.', 'error');
    }
  };

  // Handle invoice deletion with confirmation modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDeleteInvoice = (id: string) => {
    setDeletingId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deletingId) return;
    const filterId = deletingId;
    try {
      await deleteInvoiceFromDb(filterId);
      showToast(`Invoice ${filterId} has been purged.`, 'info');
      setDeletingId(null);

      if (selectedInvoice && selectedInvoice.id === filterId) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      showToast('Failed to delete invoice from cloud.', 'error');
    }
  };

  // Quick Status modifier
  const handleQuickStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    try {
      await updateInvoiceInDb(id, { status: newStatus });
      showToast(`Status -> ${newStatus}.`, 'success');

      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: newStatus });
      }
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  // Export to standard JSON
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(invoices, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Invoices backup file downloaded successfully.', 'success');
    } catch (err) {
      showToast('Failed to export invoices database.', 'error');
    }
  };

  // Import from JSON
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultStr = event.target?.result as string;
        const parsed = JSON.parse(resultStr);

        if (!Array.isArray(parsed)) {
          showToast('Invalid backup file formatting: Expected array dataset.', 'error');
          return;
        }

        // Validate basic keys of imported array to safeguard data structures
        const isValid = parsed.every((item: any) => {
          return (
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.clientName === 'string' &&
            Array.isArray(item.items)
          );
        });

        if (!isValid) {
          showToast('Corrupted metadata layout inside imported backup.', 'error');
          return;
        }

        // Merge or replace (we will replace for clean restoration, or prepend new ones)
        Promise.all(parsed.map((inv: Invoice) => saveInvoiceToDb(inv)))
          .then(() => {
            showToast(`Successfully restored ${parsed.length} invoices.`, 'success');
          })
          .catch(() => {
            showToast('Failed to restore invoices to cloud.', 'error');
          });
        
        // Clear input select
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        showToast('Syntax parsing error reading target JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Restore System to Zero
  const handleRestoreSystem = () => {
    purgeInvoicesFromDb()
      .then(() => {
        showToast('System restored. Ledger is now empty.', 'info');
      })
      .catch(() => {
        showToast('Failed to restore ledger.', 'error');
      });
    setSelectedInvoice(null);
  };

  const handleLogin = async () => {
    // We call googleSignIn immediately to preserve the user-click gesture context for the browser's popup blocker.
    // We don't set loading state BEFORE the call to avoid a re-render that might disrupt the gesture.
    try {
      const result = await googleSignIn();
      if (result) {
        setIsLoggingIn(true);
        setUser(result.user);
        setAccessToken(result.accessToken);
        
        // Check for profile
        const profile = await getUserProfile(result.user.uid);
        if (profile) {
          setAppUser(profile);
          showToast(`Welcome back, ${profile.displayName}`, 'success');
        } else {
          // Use preselected role if available, otherwise show selector
          if (preselectedRole) {
            handleRoleSelect(preselectedRole);
          } else {
            setShowRoleSelector(true);
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        showToast('Login blocked. Please allow popups for this site.', 'error');
      } else if (err.code === 'auth/unauthorized-domain') {
        showToast('Domain not authorized. Please check your Firebase settings.', 'error');
      } else {
        showToast('Login failed. Please try again.', 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) return;
    setIsSettingRole(true);
    try {
      const profile = await assignUserRole(user, role);
      setAppUser(profile);
      setShowRoleSelector(false);
      showToast(`Role assigned: ${role}.`, 'success');
    } catch (err) {
      showToast('Failed to assign role.', 'error');
    } finally {
      setIsSettingRole(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAppUser(null);
      setAccessToken(null);
      setShowRoleSelector(false);
      showToast('Logged out successfully.', 'info');
    } catch (err) {
      showToast('Logout failed.', 'error');
    }
  };

  const isAdmin = appUser?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">Initializing Ledger...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        isLoggingIn={isLoggingIn} 
        onRolePreselect={setPreselectedRole}
        preselectedRole={preselectedRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] select-none font-sans text-[#E0E0E0] antialiased flex flex-col">
      {/* Header Panel - Sticky / Fixed at top */}
      <header className="bg-[#0C0C0C] border-b border-[#1F1F1F] sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & title brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Receipt size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none flex items-center gap-1.5">
                Liliprovisions Ltd
              </h1>
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                Pristine Ledger & Credit Index
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            
            {/* Standard backup actions */}
            {isAdmin && (
              <>
                <button
                  id="export-backup-btn"
                  title="Export Ledger (JSON)"
                  type="button"
                  onClick={handleExportData}
                  className="cursor-pointer px-3 py-1.5 bg-[#141414] hover:bg-[#1C1C1C] text-zinc-300 hover:text-white border border-[#1F1F1F] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Backup</span>
                </button>

                <button
                  id="import-backup-btn"
                  title="Import Ledger (JSON)"
                  type="button"
                  onClick={handleImportClick}
                  className="cursor-pointer px-3 py-1.5 bg-[#141414] hover:bg-[#1C1C1C] text-zinc-300 hover:text-white border border-[#1F1F1F] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Upload size={13} />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="hidden animate-none"
                />

                <button
                  id="reset-seeds-btn"
                  title="Restore System to Zero"
                  type="button"
                  onClick={handleRestoreSystem}
                  className="cursor-pointer px-3 py-1.5 bg-[#141414] hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-[#1F1F1F] hover:border-rose-500/20 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Restore</span>
                </button>

                <div className="h-6 w-[1px] bg-[#1F1F1F] mx-1"></div>

                <button
                  id="user-mgmt-btn"
                  title="Authority Control"
                  type="button"
                  onClick={() => setIsUserMgmtOpen(true)}
                  className="cursor-pointer px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Shield size={13} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Authorized Personnel</span>
                </button>
              </>
            )}

            <div className="h-6 w-[1px] bg-[#1F1F1F] mx-1"></div>

            {appUser ? (
              <div className="flex items-center gap-3 ml-1">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[11px] font-bold text-white leading-none text-right">{appUser.displayName}</span>
                  <span className={`text-[9px] font-mono mt-0.5 px-1.5 py-0.5 rounded-sm border ${
                    appUser.role === 'ADMIN' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5' :
                    appUser.role === 'DELIVERY' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                    'text-amber-400 border-amber-400/20 bg-amber-400/5'
                  }`}>
                    {appUser.role}
                  </span>
                </div>
                {appUser.photoURL ? (
                  <img src={appUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-[#1F1F1F]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center border border-[#1F1F1F]">
                    <UserIcon size={14} className="text-zinc-500" />
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-[#1C1C1C] text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="gsi-material-button ml-1" 
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in</span>
                </div>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8 w-full no-print">
        
        {appUser && (appUser.role === 'ADMIN' || appUser.isAuthorized || appUser.role === 'DELIVERY') ? (
          appUser.role === 'DELIVERY' ? (
            <DeliveryDashboard 
              invoices={invoices} 
              appUser={appUser} 
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onQuickStatusChange={handleQuickStatusChange}
            />
          ) : (
            <>
              {/* Real-time stats section */}
              <StatsDashboard invoices={invoices} />

              {/* Invoice List Panel */}
              <div className="flex-1 min-h-0">
                <InvoiceList
                  invoices={invoices}
                  appUser={appUser}
                  onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                  onEditInvoice={(inv) => {
                    setEditingInvoice(inv);
                    setIsFormOpen(true);
                  }}
                  onDeleteInvoice={confirmDeleteInvoice}
                  onQuickStatusChange={handleQuickStatusChange}
                  onCreateInvoiceTrigger={() => {
                    setEditingInvoice(null);
                    setIsFormOpen(true);
                  }}
                />
              </div>
            </>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="max-w-md w-full bg-[#141414] border border-[#1F1F1F] rounded-3xl p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Access Restricted</h2>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                  Your identity has been verified as <span className="text-zinc-300">[{appUser?.role}]</span>, but you have not yet been granted authorization by a system administrator.
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                >
                  Exit Session
                </button>
              </div>
              <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-tighter">Please notify Liliprovisions management to approve your node access.</p>
            </div>
          </div>
        )}

      </main>

      {/* Authority Control Drawer */}
      <AnimatePresence>
        {isUserMgmtOpen && (
          <UserManagement onClose={() => setIsUserMgmtOpen(false)} />
        )}
      </AnimatePresence>

      {/* Slide Drawer: Selected Invoice Detailed Document */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetail
            key="details-drawer"
            invoice={selectedInvoice}
            accessToken={accessToken}
            appUser={appUser}
            onClose={() => setSelectedInvoice(null)}
            onEdit={() => {
              setEditingInvoice(selectedInvoice);
              setIsFormOpen(true);
            }}
            onStatusChange={(statusVal) => handleQuickStatusChange(selectedInvoice.id, statusVal)}
            onUpdate={handleSaveInvoice}
          />
        )}
      </AnimatePresence>

      {/* Slide Drawer: Invoice Editor Form (Create/Edit modes) */}
      <AnimatePresence>
        {isFormOpen && (
          <InvoiceForm
            key="form-drawer"
            invoice={editingInvoice}
            existingInvoices={invoices}
            deliveryUsers={usersList.filter(u => u.role === 'DELIVERY')}
            onSave={handleSaveInvoice}
            onClose={() => {
              setIsFormOpen(false);
              setEditingInvoice(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Role Selection Overlay */}
      {showRoleSelector && (
        <RoleSelector onSelect={handleRoleSelect} isProcessing={isSettingRole} />
      )}

      {/* Interactive Custom Confirm Deletion Panel overlay inside standard client view */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print" id="delete-confirmation-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141414] border border-[#1F1F1F] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-[#EBF0F5]"
            >
              <div className="flex items-center gap-3 text-rose-450">
                <AlertCircle size={22} className="shrink-0 text-rose-500" />
                <h3 className="text-base font-bold text-white">Confirm Ledger Removal</h3>
              </div>
              
              <p className="text-sm text-zinc-400 leading-relaxed">
                Are you sure you want to delete invoice <strong className="font-mono text-white">{deletingId}</strong>? 
                This action is irreversible and will purge item data from local records.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="cancel-delete-btn"
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="cursor-pointer border border-[#1F1F1F] bg-[#0C0C0C] hover:bg-[#1C1C1C] text-zinc-300 text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-action-btn"
                  type="button"
                  onClick={handleExecuteDelete}
                  className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-all shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating sliding beautiful Toasts and info updates */}
      <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-2 max-w-sm w-full no-print">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 bg-[#141414] ${
                toast.type === 'success' ? 'border-emerald-500/20 text-white' :
                toast.type === 'error' ? 'border-rose-500/20 text-white' :
                'border-[#1F1F1F] text-white'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
                {toast.type === 'info' && <Info size={18} className="text-indigo-400" />}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-white mb-0.5">
                  {toast.type === 'success' ? 'Ledger Action Successful' :
                   toast.type === 'error' ? 'System Alert' : 'System Notice'}
                </p>
                <p className="text-zinc-400 leading-normal">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Printable Area - Injected outside main view flow exclusively during printing */}
      {selectedInvoice && (
        <div className="hidden print-only print-container">
          {/* Detailed Printable invoice block mapped cleanly */}
          <div className="bg-white p-6 max-w-2xl mx-auto">
            {/* Standard printed layout duplication simply fallback */}
            <div className="flex items-center justify-between pb-6 border-b border-light-grey mb-6">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Liliprovisions Ltd</h1>
                <p className="text-xs text-slate-400">VAT: US-8921104-B</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold tracking-widest text-slate-700">INVOICE PREVIEW</h2>
                <p className="text-xs font-semibold font-mono">{selectedInvoice.id}</p>
              </div>
            </div>

            <table className="w-full text-left font-sans text-xs mb-8">
              <thead>
                <tr className="border-b border-grey text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray">
                {selectedInvoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
