/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { BillForm } from "./components/BillForm";
import { BillHistory } from "./components/BillHistory";
import { QuotationForm } from "./components/QuotationForm";
import { QuotationHistory } from "./components/QuotationHistory";
import { BillPreview } from "./components/BillPreview";
import { Notepad } from "./components/Notepad";
import { TeamManagement } from "./components/TeamManagement";
import { MaterialManagement } from "./components/MaterialManagement";
import { Settings } from "./components/Settings";
import { Auth } from "./components/Auth";
import { Bill } from "./types";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Receipt, History, Plus, StickyNote, TrendingUp, IndianRupee, ArrowLeft, ChevronRight, FileText, ClipboardList, Users, Settings as SettingsIcon, CheckCircle2, Clock, Contact, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getBills, getSettings, getNotes, setupSync } from "./lib/storage";
import { auth, onAuthStateChanged, User } from "./lib/firebase";
import { App as CapApp } from "@capacitor/app";
import { toast } from "sonner";

export default function App() {
  const [activeBill, setActiveBill] = React.useState<Bill | null>(null);
  const [view, setView] = React.useState("dashboard");
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [isBillDialogOpen, setIsBillDialogOpen] = React.useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = React.useState(false);
  const [stats, setStats] = React.useState({
    pendingBills: 0,
    paidBills: 0,
    contacts: 0
  });
  const [settings, setSettings] = React.useState(getSettings());

  const [lastBackPress, setLastBackPress] = React.useState(0);
  
  // Refs for back button listener to avoid stale closures
  const viewRef = React.useRef(view);
  const activeBillRef = React.useRef(activeBill);
  const isBillDialogOpenRef = React.useRef(isBillDialogOpen);
  const isQuotationDialogOpenRef = React.useRef(isQuotationDialogOpen);
  const lastBackPressRef = React.useRef(lastBackPress);

  React.useEffect(() => {
    viewRef.current = view;
    activeBillRef.current = activeBill;
    isBillDialogOpenRef.current = isBillDialogOpen;
    isQuotationDialogOpenRef.current = isQuotationDialogOpen;
    lastBackPressRef.current = lastBackPress;
  }, [view, activeBill, isBillDialogOpen, isQuotationDialogOpen, lastBackPress]);

  const calculateStats = () => {
    const bills = getBills();
    const notes = getNotes();
    
    const pending = bills.filter(b => b.status === 'pending').length;
    const paid = bills.filter(b => b.status === 'paid').length;
    
    // Count unique contacts from notes (by phone number)
    const uniqueContacts = new Set(notes.map(n => n.phoneNumber)).size;
    
    setStats({
      pendingBills: pending,
      paidBills: paid,
      contacts: uniqueContacts
    });
  };

  React.useEffect(() => {
    let syncUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isOffline = localStorage.getItem("billbook_offline_mode") === "true";
      
      if (isOffline) {
        setUser({
          uid: "offline-user",
          displayName: "Offline User",
          email: "offline@billbook.pro",
          isOffline: true
        } as any);
        setIsAuthReady(true);
        return;
      }

      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        syncUnsubscribe = setupSync(currentUser.uid);
      } else if (syncUnsubscribe) {
        syncUnsubscribe();
        syncUnsubscribe = null;
      }
    });

    const settings = getSettings();
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    calculateStats();
    
    const handleStorageChange = () => {
      calculateStats();
      setSettings(getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bill-updated', handleStorageChange);
    window.addEventListener('note-updated', handleStorageChange);
    
    // Handle Android Back Button
    const backButtonListener = CapApp.addListener('backButton', () => {
      if (activeBillRef.current) {
        setActiveBill(null);
        return;
      }

      if (isBillDialogOpenRef.current) {
        setIsBillDialogOpen(false);
        return;
      }

      if (isQuotationDialogOpenRef.current) {
        setIsQuotationDialogOpen(false);
        return;
      }

      // Check for custom events (Material/Team/Note forms)
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs.length > 0) {
        // Try to find and click the close button or dispatch an event
        const closeButtons = document.querySelectorAll('button[aria-label="Close"], .close-button');
        if (closeButtons.length > 0) {
          (closeButtons[closeButtons.length - 1] as HTMLElement).click();
          return;
        }
      }

      if (viewRef.current !== "dashboard") {
        setView("dashboard");
      } else {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapApp.exitApp();
        } else {
          setLastBackPress(now);
          toast.info("Press back again to exit app");
        }
      }
    });
    
    return () => {
      unsubscribe();
      backButtonListener.then(l => l.remove());
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bill-updated', handleStorageChange);
      window.removeEventListener('note-updated', handleStorageChange);
    };
  }, []);

  const handleBillSaved = (bill: Bill) => {
    setActiveBill(bill);
    setIsBillDialogOpen(false);
    setIsQuotationDialogOpen(false);
    calculateStats();
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onLogin={(u) => setUser(u)} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="flex-grow relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "dashboard" && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setView("dashboard")}
                className="mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              {view === "dashboard" ? (
                <>
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                    <Receipt className="text-white w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {settings.companyName ? (
                      <>
                        {settings.companyName.split(' ')[0]}
                        <span className="text-blue-600">
                          {settings.companyName.split(' ').slice(1).join(' ')}
                        </span>
                      </>
                    ) : (
                      <>
                        BillBook<span className="text-blue-600">Pro</span>
                      </>
                    )}
                  </h1>
                </>
              ) : (
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {view === "bill" ? "Bill" : 
                   view === "note" ? "Note" : 
                   view === "quotation" ? "Quotation" : 
                   view === "material" ? "Material List" :
                   view === "team" ? "Team" :
                   "Settings"}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("team")}
              className={cn(
                "rounded-full transition-colors",
                view === "team" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("settings")}
              className={cn(
                "rounded-full transition-colors",
                view === "settings" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex flex-col items-end ml-2">
              <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-none">{user.displayName || user.email}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pb-24">
          <AnimatePresence mode="wait">
            {view === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setView("bill")}
                    className="group relative bg-white dark:bg-slate-900/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 sm:gap-4 transition-all hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-sm sm:text-xl font-black text-blue-600 dark:text-blue-400 truncate">Bill</h2>
                  </button>

                  <button
                    onClick={() => setView("note")}
                    className="group relative bg-white dark:bg-slate-900/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 sm:gap-4 transition-all hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-900 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <StickyNote className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-sm sm:text-xl font-black text-amber-600 dark:text-amber-400 truncate">Note</h2>
                  </button>

                  <button
                    onClick={() => setView("quotation")}
                    className="group relative bg-white dark:bg-slate-900/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 sm:gap-4 transition-all hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-900 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-sm sm:text-xl font-black text-purple-600 dark:text-purple-400 truncate">Quotation</h2>
                  </button>

                  <button
                    onClick={() => setView("material")}
                    className="group relative bg-white dark:bg-slate-900/80 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 sm:gap-4 transition-all hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-900 hover:-translate-y-1"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-sm sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">Material</h2>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Customer Contacts</p>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.contacts}</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 relative z-10">
                      <Contact className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Pending Bills</p>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.pendingBills}</span>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 relative z-10">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Paid Bills</p>
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.paidBills}</span>
                    </div>
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 relative z-10">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : view === "bill" ? (
              <motion.div
                key="bill-history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BillHistory onView={setActiveBill} />
              </motion.div>
            ) : view === "note" ? (
              <motion.div
                key="notepad"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Notepad />
              </motion.div>
            ) : view === "quotation" ? (
              <motion.div
                key="quotation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuotationHistory onView={setActiveBill} />
              </motion.div>
            ) : view === "material" ? (
              <motion.div
                key="material"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MaterialManagement />
              </motion.div>
            ) : view === "team" ? (
              <motion.div
                key="team"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TeamManagement />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Settings onLogout={async () => {
                  try {
                    localStorage.removeItem("billbook_offline_mode");
                    await auth.signOut();
                  } catch (e) {
                    console.error("Sign out error:", e);
                  }
                  setView("dashboard");
                  setUser(null);
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Action Button - Only visible inside sections, except Settings */}
        {view !== "dashboard" && view !== "settings" && (
          <div className="fixed bottom-8 right-8 z-40">
            {view === "bill" ? (
              <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
                <DialogTrigger 
                  render={
                    <Button size="icon" className="w-16 h-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-transform hover:scale-110 active:scale-95">
                      <Plus className="w-8 h-8 text-white" />
                    </Button>
                  }
                />
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Bill</DialogTitle>
                  </DialogHeader>
                  <BillForm onSave={handleBillSaved} />
                </DialogContent>
              </Dialog>
            ) : view === "quotation" ? (
              <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
                <DialogTrigger 
                  render={
                    <Button size="icon" className="w-16 h-16 rounded-full shadow-2xl bg-purple-600 hover:bg-purple-700 transition-transform hover:scale-110 active:scale-95">
                      <Plus className="w-8 h-8 text-white" />
                    </Button>
                  }
                />
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Quotation</DialogTitle>
                  </DialogHeader>
                  <QuotationForm onSave={handleBillSaved} />
                </DialogContent>
              </Dialog>
            ) : view === "material" ? (
              <Button 
                size="icon" 
                className="w-16 h-16 rounded-full shadow-2xl bg-emerald-600 hover:bg-emerald-700 transition-transform hover:scale-110 active:scale-95"
                onClick={() => {
                  const event = new CustomEvent('open-material-form');
                  window.dispatchEvent(event);
                }}
              >
                <Plus className="w-8 h-8 text-white" />
              </Button>
            ) : view === "team" ? (
              <Button 
                size="icon" 
                className="w-16 h-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-transform hover:scale-110 active:scale-95"
                onClick={() => {
                  const event = new CustomEvent('open-team-form');
                  window.dispatchEvent(event);
                }}
              >
                <Plus className="w-8 h-8 text-white" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                className="w-16 h-16 rounded-full shadow-2xl bg-amber-500 hover:bg-amber-600 transition-transform hover:scale-110 active:scale-95"
                onClick={() => {
                  const event = new CustomEvent('open-note-form');
                  window.dispatchEvent(event);
                }}
              >
                <Plus className="w-8 h-8 text-white" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer - Only visible on dashboard */}
      {view === "dashboard" && (
        <footer className="relative z-10 py-6 text-center text-slate-400 text-xs border-t border-slate-200/50 bg-white/30 backdrop-blur-sm">
          <p>© {new Date().getFullYear()} {settings.companyName || "BillBook Pro"}. All data is stored locally on your device.</p>
        </footer>
      )}

      {/* Bill Preview Modal */}
      {activeBill && (
        <BillPreview bill={activeBill} onClose={() => setActiveBill(null)} />
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

