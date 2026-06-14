import React, { useState, useEffect } from "react";
import { AuthState, ClientAccount, UserRole } from "./types";
import AdminPanel from "./components/AdminPanel";
import SettingsTab from "./components/SettingsTab";
import AILiveStudio from "./components/AILiveStudio";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { 
  Users, Settings2, LogOut, Sparkles, LayoutGrid, Building2, 
  Store, ShieldAlert, Award, AlertCircle, RefreshCw, BarChart3, HelpCircle,
  Menu, X, Radio, Lock, ShieldCheck
} from "lucide-react";

export default function App() {
  // 1. Core Primary Screen/Tab State
  const [activeTab, setActiveTab] = useState<"studio" | "clients" | "settings">("studio");
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Admin System Lock and Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("ramadan_admin_unlocked") === "true";
  });
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [loginError, setLoginError] = useState("");

  // 3. Load clients from Supabase (with LocalStorage fallback)
  useEffect(() => {
    async function initClients() {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from("clients")
            .select("*")
            .order("createdAt", { ascending: false });

          if (error) {
            console.error("Supabase load error:", error);
            // fallback
            const saved = localStorage.getItem("el_wakil_clients");
            if (saved) setClients(JSON.parse(saved));
          } else {
            setClients((data as ClientAccount[]) || []);
          }
        } catch (err) {
          console.error("Supabase connection catch error:", err);
          // fallback
          const saved = localStorage.getItem("el_wakil_clients");
          if (saved) setClients(JSON.parse(saved));
        }
      } else {
        // Safe fallback without Supabase configured
        const saved = localStorage.getItem("el_wakil_clients");
        if (saved) {
          try {
            setClients(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
      // Elegant aesthetic delay
      setTimeout(() => setIsLoading(false), 800);
    }
    initClients();
  }, []);

  // Sync state to local storage maintained as backup
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem("el_wakil_clients", JSON.stringify(clients));
    }
  }, [clients]);

  // Admin lock authentication handles
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Predefined secure PIN from previous setup is "159753" or General Master Pass
    if (adminPinInput === "159753" || adminPinInput === "admin" || adminPinInput === "ramadan") {
      setIsAdminAuthenticated(true);
      localStorage.setItem("ramadan_admin_unlocked", "true");
      setShowAdminLoginModal(false);
      setAdminPinInput("");
      setLoginError("");
      setActiveTab("clients"); // directly switch to licenses
    } else {
      setLoginError("كود الدخول الفني غير صحيح! يرجى التحقق وإعادة المحاولة.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("ramadan_admin_unlocked");
    setActiveTab("studio");
  };

  // Client updates by Admin
  const handleAddClient = async (newClient: ClientAccount) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("clients")
          .insert([newClient]);
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase insert error:", err);
        alert(`فشل الحفظ في سحابة Supabase: ${err.message || err}`);
      }
    }
    const updated = [newClient, ...clients];
    setClients(updated);
    localStorage.setItem("el_wakil_clients", JSON.stringify(updated));
  };

  const handleUpdateClientStatus = async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("clients")
          .update({ status })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase update error:", err);
        alert(`فشل تحديث الحالة في سحابة Supabase: ${err.message || err}`);
      }
    }
    const updated = clients.map(c => c.id === id ? { ...c, status } : c);
    setClients(updated);
    localStorage.setItem("el_wakil_clients", JSON.stringify(updated));
  };

  const handleDeleteClient = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase delete error:", err);
        alert(`فشل إزالة العميل من سحابة Supabase: ${err.message || err}`);
      }
    }
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem("el_wakil_clients", JSON.stringify(updated));
  };

  // Render loading screen if loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.1)_0%,_rgba(15,23,42,1)_70%)] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex flex-col items-center">
          {/* Neon spinning circle */}
          <div className="w-16 h-16 rounded-full border-4 border-[#334155] border-t-[#38bdf8] animate-spin mb-6 shadow-[0_0_15px_rgba(56,189,248,0.3)]"></div>
          <Sparkles className="w-6 h-6 text-[#38bdf8] absolute top-5 animate-pulse" />
          
          <h2 className="text-xl font-extrabold text-white mb-2 tracking-wide font-sans">Ibn Ramadan AI Live</h2>
          <p className="text-xs text-[#38bdf8] font-bold mb-4">جاري تحميل استوديو البث والربط السحابي الذكي...</p>
          
          <div className="text-[10.5px] text-[#94a3b8] max-w-sm leading-relaxed font-sans bg-[#1e293b]/60 border border-[#334155] px-4 py-2 rounded-xl">
            {isSupabaseConfigured 
              ? "● متصل بقاعدة بيانات Supabase Cloud السحابية بنجاح" 
              : "⚠️ تشغيل بالوضع المحلي المباشر (توليد ومعالجة محلية ذكية)"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.06)_0%,_rgba(15,23,42,1)_80%)] text-[#94a3b8] flex flex-col font-sans select-none" id="app-wrapper-frame">
      
      {/* Ibn Ramadan AI Live Custom Header */}
      <header className="border-b border-[#334155] bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_30px_rgba(58,189,248,0.03)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4 text-right">
            {/* Hamburger button visible only on mobile screens */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center justify-center shadow-md"
              aria-label="القائمة الجانبية"
              id="hamburger-toggle-button"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-[#38bdf8]" /> : <Menu className="w-5 h-5 text-[#38bdf8]" />}
            </button>

            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Radio className="w-6 h-6 text-[#38bdf8] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight">Ibn Ramadan AI Live</h1>
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.15)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  STREAM READY
                </span>
              </div>
              <p className="text-[11px] text-[#38bdf8] font-bold mt-0.5">المنظومة الاحترافية لإدارة البثوث وصناعة التفاعل اللحظي</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Mode Indicator */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-white">استوديو البث المفتوح</p>
              <span className="text-[10px] text-[#38bdf8] font-bold mt-0.5 block">
                {isSupabaseConfigured ? "سحابي متصل ●" : "الوضع المحلي النشط ⚡"}
              </span>
            </div>

            {isAdminAuthenticated ? (
              <button
                onClick={handleAdminLogout}
                className="px-4 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 border border-rose-900/40 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                title="تسجيل خروج الإدارة"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">قفل لوحة الإدارة</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLoginModal(true)}
                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>دخول الإدارة</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Primary Workspace Space Setup with responsive grids */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Right Columns: Sidebar Navigation elements */}
        <nav className={`lg:col-span-3 space-y-4 lg:block ${isSidebarOpen ? "block animate-fadeIn" : "hidden"}`} id="collapsible-mobile-sidebar">
          
          <div className="p-4 bg-[#1e293b] border border-[#334155] rounded-[20px] shadow-[0_4px_20px_rgba(56,189,248,0.02)] space-y-2 text-right">
            <span className="text-[10.5px] font-black tracking-wider text-[#94a3b8] block mr-1 mb-2 uppercase">
              أقسام النظام الأساسية
            </span>

            {/* AI Live Studio Button (Default) */}
            <button
              onClick={() => { setActiveTab("studio"); setIsSidebarOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 border ${
                activeTab === "studio"
                  ? "bg-[#38bdf8] text-[#0f172a] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)] font-extrabold scale-[1.03]"
                  : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:text-white"
              }`}
            >
              <Radio className="w-4 h-4 shrink-0" />
              <span className="flex-1">لوحة البث والإنتاج (AI Live Studio)</span>
            </button>

            {/* Admin Controls (Only if Authenticated) */}
            {isAdminAuthenticated && (
              <button
                onClick={() => { setActiveTab("clients"); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 border ${
                  activeTab === "clients"
                    ? "bg-[#38bdf8] text-[#0f172a] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)] font-extrabold scale-[1.03]"
                    : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="flex-1">لوحة تراخيص العملاء (القديمة)</span>
              </button>
            )}

            {/* Joint Configuration and Logs control */}
            <button
              onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 border ${
                activeTab === "settings"
                  ? "bg-[#38bdf8] text-[#0f172a] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.3)] font-extrabold scale-[1.03]"
                  : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:text-white"
              }`}
            >
              <Settings2 className="w-4 h-4 shrink-0" />
              <span className="flex-1">نبض الإعدادات الفنية للاستوديو</span>
            </button>

          </div>

          {/* Technical Info Foot Card */}
          <div className="p-4 bg-[#1e293b] border border-[#334155] rounded-[20px] shadow-[0_4px_20px_rgba(56,189,248,0.01)] text-[11px] leading-relaxed text-[#94a3b8] space-y-2.5 text-right">
            <div className="flex items-center justify-end gap-1.5 font-bold text-white">
              <span>Ibn Ramadan AI Live v5.0</span>
              <Award className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <p>
              تمت الترقية بنجاح إلى إصدار البث المباشر (OBS Mode). يتكامل بنعومة فائقة مع أي شاشة كروما خضراء لتسهيل دمج النصوص الإعلانية.
            </p>
          </div>

        </nav>

        {/* Left Columns: Main View Router area */}
        <main className="lg:col-span-9 space-y-6">
          
          {activeTab === "studio" && (
            <AILiveStudio />
          )}

          {activeTab === "clients" && isAdminAuthenticated && (
            <AdminPanel 
              clients={clients} 
              onAddClient={handleAddClient} 
              onUpdateClientStatus={handleUpdateClientStatus} 
              onDeleteClient={handleDeleteClient} 
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab />
          )}

        </main>

      </div>

      {/* Admin Unlock Gateway Modal Popup */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-3xl max-w-md w-full text-right space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <button 
                onClick={() => { setShowAdminLoginModal(false); setLoginError(""); setAdminPinInput(""); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                إغلاق
              </button>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#38bdf8]" />
                <span>التحقق من هوية المسؤول الفني</span>
              </h3>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              يرجى إدخال رمز الدخول السري الفني المرتبط بإدارة منظمة ابن رمضان لفتح بوابة التراخيص.
            </p>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">رمز الدخول الفني (PIN / Password):</label>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="أدخل الرمز السري هنا..."
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-center text-white text-sm font-bold tracking-widest focus:outline-none focus:border-[#38bdf8]"
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {loginError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAdminLoginModal(false); setLoginError(""); setAdminPinInput(""); }}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700 cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#38bdf8] text-[#0f172a] text-xs font-extrabold rounded-xl hover:bg-sky-400 shadow-[0_2px_8px_rgba(58,189,248,0.2)] cursor-pointer"
                >
                  تأكيد والتحرك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aesthetic Footer signature */}
      <footer className="border-t border-[#334155] bg-[#0f172a] py-8 mt-auto text-center text-xs text-[#94a3b8] space-y-2">
        <p className="font-sans">
          جميع الحقوق البرمجية والتصميمية محفوظة لـ <span className="text-white font-extrabold font-sans">Ibn Ramadan AI Live</span> © 2026
        </p>
        <p className="text-[10px] text-slate-500 max-w-xl mx-auto leading-relaxed">
          إصدار البث الرقمي المتكامل المصقول بصرياً ليلائم برامج البث والدمج الاحترافي لـ OBS و vMix وتيك توك لايف ستوديو بجودة بصرية فائقة.
        </p>
      </footer>

    </div>
  );
}
