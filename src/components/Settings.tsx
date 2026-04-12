import * as React from "react";
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Coins, 
  Moon, 
  Sun, 
  Save, 
  Camera,
  Eye,
  EyeOff,
  Percent,
  LogOut,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings } from "../types";
import { getSettings, saveSettings } from "../lib/storage";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import { deleteUser } from "firebase/auth";

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const [settings, setSettings] = React.useState<AppSettings>(getSettings());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const user = auth.currentUser;

  const isOffline = localStorage.getItem("billbook_offline_mode") === "true";

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await deleteUser(user);
      toast.success("Account deleted successfully");
      // The user is automatically signed out by Firebase on deletion
      // We call onLogout to ensure the parent app state is updated
      onLogout();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("For security reasons, please log out and log back in before deleting your account.");
      } else {
        toast.error(error.message || "Failed to delete account");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Settings saved successfully");
    
    // Apply dark mode if needed
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Apply dark mode immediately if that's what changed
      if (key === 'darkMode') {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return newSettings;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your business profile and app preferences</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-12 shadow-lg shadow-blue-100 dark:shadow-none gap-2">
          <Save className="w-5 h-5" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <Card className="md:col-span-1 border-none shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-bold dark:text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-white">{user?.displayName || settings.ownerName || "Owner Name"}</h3>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">{settings.companyName || "No Company Set"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-lg rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Building2 className="w-5 h-5 text-blue-600" />
                Business Details
              </CardTitle>
              <CardDescription className="dark:text-slate-400">This information will appear on your bills</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="business name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Owner Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={settings.ownerName}
                    onChange={(e) => updateSetting('ownerName', e.target.value)}
                    placeholder="name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">GST / Tax Number</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={settings.gstNumber}
                    onChange={(e) => updateSetting('gstNumber', e.target.value)}
                    placeholder="24AAAAA0000A1Z5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    placeholder="phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    placeholder="email"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea 
                    className="w-full pl-10 pt-2.5 min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    placeholder="address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Sun className="w-5 h-5 text-amber-500" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                    {settings.darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.darkMode} 
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Globe className="w-5 h-5 text-emerald-600" />
                Localization & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Country</Label>
                  <Select value={settings.country} onValueChange={(v) => updateSetting('country', v)}>
                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="Pakistan">Pakistan</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="UAE">UAE</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="Turkey">Turkey</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Russia">Russia</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="Indonesia">Indonesia</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Egypt">Egypt</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                      <SelectItem value="Thailand">Thailand</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="New Zealand">New Zealand</SelectItem>
                      <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                      <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                      <SelectItem value="Nepal">Nepal</SelectItem>
                      <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                      <SelectItem value="Iran">Iran</SelectItem>
                      <SelectItem value="Iraq">Iraq</SelectItem>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 dark:text-slate-400">Currency</Label>
                  <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl dark:text-white">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="PKR">PKR (₨)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="SAR">SAR (﷼)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CNY">CNY (¥)</SelectItem>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                      <SelectItem value="RUB">RUB (₽)</SelectItem>
                      <SelectItem value="MXN">MXN ($)</SelectItem>
                      <SelectItem value="IDR">IDR (Rp)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="EGP">EGP (E£)</SelectItem>
                      <SelectItem value="VND">VND (₫)</SelectItem>
                      <SelectItem value="THB">THB (฿)</SelectItem>
                      <SelectItem value="MYR">MYR (RM)</SelectItem>
                      <SelectItem value="SGD">SGD ($)</SelectItem>
                      <SelectItem value="NZD">NZD ($)</SelectItem>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="LKR">LKR (Rs)</SelectItem>
                      <SelectItem value="NPR">NPR (₨)</SelectItem>
                      <SelectItem value="CHF">CHF (Fr)</SelectItem>
                      <SelectItem value="SEK">SEK (kr)</SelectItem>
                      <SelectItem value="KWD">KWD (د.ك)</SelectItem>
                      <SelectItem value="QAR">QAR (ر.ق)</SelectItem>
                      <SelectItem value="OMR">OMR (ر.ع.)</SelectItem>
                      <SelectItem value="BHD">BHD (.د.ب)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      <Percent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Show GST on Bills</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Enable tax calculations</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.showGST} 
                    onCheckedChange={(checked) => updateSetting('showGST', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                      {settings.showEmail ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Show Email on Bills</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Visible to customers</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.showEmail} 
                    onCheckedChange={(checked) => updateSetting('showEmail', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400">
                  {isOffline ? "Offline Session" : "Account Session"}
                </h3>
                <p className="text-sm text-red-600 dark:text-red-500/70">
                  {isOffline ? "Exit offline mode and return to login screen." : "Sign out from your current session on this device."}
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={onLogout}
                className="rounded-xl px-6 gap-2"
              >
                <LogOut className="w-4 h-4" /> {isOffline ? "Exit Offline Mode" : "Logout"}
              </Button>
            </CardContent>
          </Card>

          {!isOffline && (
            <Card className="border-none shadow-lg rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent>
                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Delete Account</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Permanently remove your account and all data.</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-xl"
                    >
                      Delete Account
                    </Button>
                  </div>
                ) : (
                  <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl space-y-4 border border-red-200 dark:border-red-800/50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-900 dark:text-red-300">Are you absolutely sure?</p>
                        <p className="text-xs text-red-700 dark:text-red-400/80">This action cannot be undone. All your bills, customers, and settings will be permanently deleted.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl"
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-white dark:bg-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
