import * as React from "react";
import { User, Lock, Mail, ArrowRight, ShieldCheck, Building2, MapPin, Globe, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { saveSettings, getSettings } from "../lib/storage";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

interface AuthProps {
  onLogin: (user: any) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [country, setCountry] = React.useState("Pakistan");
  const [currency, setCurrency] = React.useState("PKR");
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
      toast.success(`Welcome, ${result.user.displayName}!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && (!name || !companyName || !address))) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onLogin(result.user);
        toast.success(`Welcome back!`);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        
        // Save initial settings
        const currentSettings = getSettings();
        saveSettings({
          ...currentSettings,
          companyName,
          address,
          country,
          currency,
          ownerName: name,
          email: email
        });

        onLogin(result.user);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200 dark:shadow-none">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">BillBook Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Professional Billing & Team Management</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 dark:border dark:border-slate-800">
          <CardHeader className="pb-2 pt-8 px-8">
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="font-medium dark:text-slate-400">
              {isLogin ? "Enter your credentials to access your dashboard" : "Join us to start managing your business efficiently"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            placeholder="John Doe"
                            className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Company Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            placeholder="F.Z Electric Services"
                            className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Business Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          placeholder="Gujranwala, Pakistan"
                          className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Country</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                          <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] dark:bg-slate-800 dark:border-slate-700">
                              <SelectItem value="Pakistan" className="dark:text-white dark:focus:bg-slate-700">Pakistan</SelectItem>
                              <SelectItem value="India" className="dark:text-white dark:focus:bg-slate-700">India</SelectItem>
                              <SelectItem value="USA" className="dark:text-white dark:focus:bg-slate-700">USA</SelectItem>
                              <SelectItem value="UK" className="dark:text-white dark:focus:bg-slate-700">UK</SelectItem>
                              <SelectItem value="UAE" className="dark:text-white dark:focus:bg-slate-700">UAE</SelectItem>
                              <SelectItem value="Saudi Arabia" className="dark:text-white dark:focus:bg-slate-700">Saudi Arabia</SelectItem>
                              <SelectItem value="Canada" className="dark:text-white dark:focus:bg-slate-700">Canada</SelectItem>
                              <SelectItem value="Australia" className="dark:text-white dark:focus:bg-slate-700">Australia</SelectItem>
                              <SelectItem value="Germany" className="dark:text-white dark:focus:bg-slate-700">Germany</SelectItem>
                              <SelectItem value="France" className="dark:text-white dark:focus:bg-slate-700">France</SelectItem>
                              <SelectItem value="Japan" className="dark:text-white dark:focus:bg-slate-700">Japan</SelectItem>
                              <SelectItem value="China" className="dark:text-white dark:focus:bg-slate-700">China</SelectItem>
                              <SelectItem value="Brazil" className="dark:text-white dark:focus:bg-slate-700">Brazil</SelectItem>
                              <SelectItem value="South Africa" className="dark:text-white dark:focus:bg-slate-700">South Africa</SelectItem>
                              <SelectItem value="Turkey" className="dark:text-white dark:focus:bg-slate-700">Turkey</SelectItem>
                              <SelectItem value="Italy" className="dark:text-white dark:focus:bg-slate-700">Italy</SelectItem>
                              <SelectItem value="Spain" className="dark:text-white dark:focus:bg-slate-700">Spain</SelectItem>
                              <SelectItem value="Russia" className="dark:text-white dark:focus:bg-slate-700">Russia</SelectItem>
                              <SelectItem value="Mexico" className="dark:text-white dark:focus:bg-slate-700">Mexico</SelectItem>
                              <SelectItem value="Indonesia" className="dark:text-white dark:focus:bg-slate-700">Indonesia</SelectItem>
                              <SelectItem value="Nigeria" className="dark:text-white dark:focus:bg-slate-700">Nigeria</SelectItem>
                              <SelectItem value="Egypt" className="dark:text-white dark:focus:bg-slate-700">Egypt</SelectItem>
                              <SelectItem value="Vietnam" className="dark:text-white dark:focus:bg-slate-700">Vietnam</SelectItem>
                              <SelectItem value="Thailand" className="dark:text-white dark:focus:bg-slate-700">Thailand</SelectItem>
                              <SelectItem value="Malaysia" className="dark:text-white dark:focus:bg-slate-700">Malaysia</SelectItem>
                              <SelectItem value="Singapore" className="dark:text-white dark:focus:bg-slate-700">Singapore</SelectItem>
                              <SelectItem value="New Zealand" className="dark:text-white dark:focus:bg-slate-700">New Zealand</SelectItem>
                              <SelectItem value="Bangladesh" className="dark:text-white dark:focus:bg-slate-700">Bangladesh</SelectItem>
                              <SelectItem value="Sri Lanka" className="dark:text-white dark:focus:bg-slate-700">Sri Lanka</SelectItem>
                              <SelectItem value="Nepal" className="dark:text-white dark:focus:bg-slate-700">Nepal</SelectItem>
                              <SelectItem value="Afghanistan" className="dark:text-white dark:focus:bg-slate-700">Afghanistan</SelectItem>
                              <SelectItem value="Iran" className="dark:text-white dark:focus:bg-slate-700">Iran</SelectItem>
                              <SelectItem value="Iraq" className="dark:text-white dark:focus:bg-slate-700">Iraq</SelectItem>
                              <SelectItem value="Kuwait" className="dark:text-white dark:focus:bg-slate-700">Kuwait</SelectItem>
                              <SelectItem value="Qatar" className="dark:text-white dark:focus:bg-slate-700">Qatar</SelectItem>
                              <SelectItem value="Oman" className="dark:text-white dark:focus:bg-slate-700">Oman</SelectItem>
                              <SelectItem value="Bahrain" className="dark:text-white dark:focus:bg-slate-700">Bahrain</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Currency</label>
                        <div className="relative">
                          <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white">
                              <SelectValue placeholder="Select Currency" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] dark:bg-slate-800 dark:border-slate-700">
                              <SelectItem value="PKR" className="dark:text-white dark:focus:bg-slate-700">PKR (₨)</SelectItem>
                              <SelectItem value="INR" className="dark:text-white dark:focus:bg-slate-700">INR (₹)</SelectItem>
                              <SelectItem value="USD" className="dark:text-white dark:focus:bg-slate-700">USD ($)</SelectItem>
                              <SelectItem value="GBP" className="dark:text-white dark:focus:bg-slate-700">GBP (£)</SelectItem>
                              <SelectItem value="EUR" className="dark:text-white dark:focus:bg-slate-700">EUR (€)</SelectItem>
                              <SelectItem value="AED" className="dark:text-white dark:focus:bg-slate-700">AED (د.إ)</SelectItem>
                              <SelectItem value="SAR" className="dark:text-white dark:focus:bg-slate-700">SAR (﷼)</SelectItem>
                              <SelectItem value="CAD" className="dark:text-white dark:focus:bg-slate-700">CAD ($)</SelectItem>
                              <SelectItem value="AUD" className="dark:text-white dark:focus:bg-slate-700">AUD ($)</SelectItem>
                              <SelectItem value="JPY" className="dark:text-white dark:focus:bg-slate-700">JPY (¥)</SelectItem>
                              <SelectItem value="CNY" className="dark:text-white dark:focus:bg-slate-700">CNY (¥)</SelectItem>
                              <SelectItem value="TRY" className="dark:text-white dark:focus:bg-slate-700">TRY (₺)</SelectItem>
                              <SelectItem value="RUB" className="dark:text-white dark:focus:bg-slate-700">RUB (₽)</SelectItem>
                              <SelectItem value="MXN" className="dark:text-white dark:focus:bg-slate-700">MXN ($)</SelectItem>
                              <SelectItem value="IDR" className="dark:text-white dark:focus:bg-slate-700">IDR (Rp)</SelectItem>
                              <SelectItem value="NGN" className="dark:text-white dark:focus:bg-slate-700">NGN (₦)</SelectItem>
                              <SelectItem value="EGP" className="dark:text-white dark:focus:bg-slate-700">EGP (E£)</SelectItem>
                              <SelectItem value="VND" className="dark:text-white dark:focus:bg-slate-700">VND (₫)</SelectItem>
                              <SelectItem value="THB" className="dark:text-white dark:focus:bg-slate-700">THB (฿)</SelectItem>
                              <SelectItem value="MYR" className="dark:text-white dark:focus:bg-slate-700">MYR (RM)</SelectItem>
                              <SelectItem value="SGD" className="dark:text-white dark:focus:bg-slate-700">SGD ($)</SelectItem>
                              <SelectItem value="NZD" className="dark:text-white dark:focus:bg-slate-700">NZD ($)</SelectItem>
                              <SelectItem value="BDT" className="dark:text-white dark:focus:bg-slate-700">BDT (৳)</SelectItem>
                              <SelectItem value="LKR" className="dark:text-white dark:focus:bg-slate-700">LKR (Rs)</SelectItem>
                              <SelectItem value="NPR" className="dark:text-white dark:focus:bg-slate-700">NPR (₨)</SelectItem>
                              <SelectItem value="CHF" className="dark:text-white dark:focus:bg-slate-700">CHF (Fr)</SelectItem>
                              <SelectItem value="SEK" className="dark:text-white dark:focus:bg-slate-700">SEK (kr)</SelectItem>
                              <SelectItem value="KWD" className="dark:text-white dark:focus:bg-slate-700">KWD (د.ك)</SelectItem>
                              <SelectItem value="QAR" className="dark:text-white dark:focus:bg-slate-700">QAR (ر.ق)</SelectItem>
                              <SelectItem value="OMR" className="dark:text-white dark:focus:bg-slate-700">OMR (ر.ع.)</SelectItem>
                              <SelectItem value="BHD" className="dark:text-white dark:focus:bg-slate-700">BHD (.د.ب)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-100 dark:shadow-none mt-4 group">
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                {!loading && <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 font-bold">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full h-12 border-slate-200 dark:border-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
