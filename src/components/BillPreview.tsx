import * as React from "react";
import { Download, Printer, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bill, AppSettings } from "../types";
import { format } from "date-fns";
import { exportToImage, exportToPDF, printElement } from "../lib/export";
import { toast } from "sonner";
import { getSettings } from "../lib/storage";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

interface BillPreviewProps {
  bill: Bill;
  onClose: () => void;
}

export function BillPreview({ bill, onClose }: BillPreviewProps) {
  const billRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const settings = React.useMemo<AppSettings>(() => getSettings(), []);

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      PKR: '₨', INR: '₹', USD: '$', GBP: '£', EUR: '€', AED: 'د.إ',
      SAR: '﷼', CAD: '$', AUD: '$', JPY: '¥', CNY: '¥', TRY: '₺',
      RUB: '₽', MXN: '$', IDR: 'Rp', NGN: '₦', EGP: 'E£', VND: '₫',
      THB: '฿', MYR: 'RM', SGD: '$', NZD: '$', BDT: '৳', LKR: 'Rs',
      NPR: '₨', CHF: 'Fr', SEK: 'kr', KWD: 'د.ك', QAR: 'ر.ق',
      OMR: 'ر.ع.', BHD: '.د.ب', JOD: 'د.ا', LBP: 'ل.ل'
    };
    return symbols[currency] || '$';
  };

  const isQuotation = bill.billNumber.startsWith("Q-");
  const themeColor = isQuotation ? "text-purple-600" : "text-blue-600";
  const bgColor = isQuotation ? "bg-purple-600" : "bg-blue-600";

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    
    const loadingToast = toast.loading("Generating PDF...");
    setIsExporting(true);
    
    try {
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 200));

      const fileName = `Bill_${bill.billNumber}_${bill.customer.name.replace(/\s+/g, "_")}`;
      await exportToPDF(billRef.current, fileName);
      
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    }
  };

  const handleShareImage = async () => {
    if (!billRef.current) return;
    
    const loadingToast = toast.loading("Generating Image...");
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const fileName = `Bill_${bill.billNumber}`;
      await exportToImage(billRef.current, fileName);

      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Image Generation Error:", error);
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate image");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-xl shadow-2xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex flex-wrap gap-3 justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-none sm:rounded-t-xl sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Bill Preview</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2 dark:border-slate-700 dark:text-white">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button onClick={handleShareImage} variant="outline" size="sm" className="gap-2 dark:border-slate-700 dark:text-white">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button onClick={() => printElement()} variant="outline" size="sm" className="gap-2 hidden sm:flex dark:border-slate-700 dark:text-white">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-slate-100 dark:bg-slate-950">
          <div className="w-full flex justify-center">
            <div 
              ref={billRef}
              className={cn(
                "bg-white dark:bg-slate-900 p-4 sm:p-8 text-slate-900 dark:text-white font-sans shadow-lg origin-top transition-transform rounded-xl sm:rounded-2xl",
                isExporting && "export-mode"
              )}
              style={{ 
                width: '600px',
                maxWidth: '100%',
                transform: 'scale(var(--preview-scale, 1))'
              }}
            >
              <div className="text-center space-y-2 pb-6 border-b-2 border-slate-100 dark:border-slate-800">
                <h1 className={cn("text-3xl font-black tracking-tighter uppercase", themeColor)}>
                  {bill.companyName || settings.companyName || "F.Z ELECTRIC SERVICE'S"}
                </h1>
                {settings.ownerName && (
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-base tracking-tight">{settings.ownerName}</p>
                )}
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wide">{settings.address || "Gujranwala Pakistan"}</p>
                <div className="flex items-center justify-center gap-6 text-slate-900 dark:text-white font-bold tracking-widest text-sm">
                  <a href={`tel:${settings.phone || "03246043916"}`} className="hover:text-blue-600 transition-colors">
                    {settings.phone || "03246043916"}
                  </a>
                </div>
                <div className="pt-2">
                  <span className={cn("text-white px-6 py-1 rounded-full text-[11px] font-black tracking-[0.2em] uppercase shadow-sm", bgColor)}>
                    {isQuotation ? "Quotation" : "Invoice"}
                  </span>
                </div>
              </div>

              {/* Customer & Bill Info */}
              <div className="grid grid-cols-2 border-b-2 border-slate-100 dark:border-slate-800">
                <div className="p-6 border-r-2 border-slate-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">BILLED TO</h3>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{bill.customer.name}</p>
                    {bill.customer.mobile && (
                      <p className="text-sm font-bold text-blue-600 tracking-wide">{bill.customer.mobile}</p>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{isQuotation ? "QUOTATION NO." : "INVOICE NO."}</h3>
                    <p className={cn("text-2xl font-black tracking-tighter", themeColor)}>{bill.billNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">DATE</h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{format(new Date(bill.date), "dd MMMM yyyy")}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">ITEM DESCRIPTION</th>
                    <th className="py-3 px-2 text-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">QTY</th>
                    <th className="py-3 px-2 text-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">RATE</th>
                    <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                  {bill.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.name}</td>
                      <td className="py-4 px-2 text-center font-bold text-slate-600 dark:text-slate-400 text-sm">{item.quantity}</td>
                      <td className="py-4 px-2 text-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                        {getCurrencySymbol(settings.currency)}
                        {item.price.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                        {getCurrencySymbol(settings.currency)}
                        {item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Section */}
              <div className="p-8 space-y-5 bg-slate-50/30 dark:bg-slate-800/10">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {getCurrencySymbol(settings.currency)}
                    {bill.total.toLocaleString()}
                  </span>
                </div>
                
                {!isQuotation && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-base font-bold text-green-600 uppercase tracking-widest">Amount Received</span>
                      <span className="text-lg font-black text-green-600">
                        {getCurrencySymbol(settings.currency)}
                        {bill.receivedAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className={cn("p-5 rounded-3xl flex justify-between items-center border-2 shadow-sm", isQuotation ? "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30" : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30")}>
                      <span className={cn("text-lg font-black uppercase tracking-widest", isQuotation ? "text-purple-800 dark:text-purple-300" : "text-blue-800 dark:text-blue-300")}>Balance Due</span>
                      <span className={cn("text-2xl font-black", themeColor)}>
                        {getCurrencySymbol(settings.currency)}
                        {bill.balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
