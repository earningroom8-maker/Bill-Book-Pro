import * as React from "react";
import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bill, AppSettings } from "../types";
import { format } from "date-fns";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { getSettings } from "../lib/storage";

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
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await domtoimage.toPng(billRef.current, {
        quality: 1,
        bgcolor: "#ffffff",
        width: billRef.current.offsetWidth * 2,
        height: billRef.current.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: billRef.current.offsetWidth + 'px',
          height: billRef.current.offsetHeight + 'px'
        }
      });
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [billRef.current.offsetWidth, billRef.current.offsetHeight],
      });
      
      pdf.addImage(dataUrl, "PNG", 0, 0, billRef.current.offsetWidth, billRef.current.offsetHeight);
      pdf.save(`Bill_${bill.billNumber}_${bill.customer.name.replace(/\s+/g, "_")}.pdf`);
      
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-800">Bill Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
            <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-slate-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
          <div 
            ref={billRef}
            className={cn("bg-white dark:bg-slate-900 mx-auto p-12 w-[800px] text-slate-900 dark:text-white font-sans", isExporting && "export-mode")}
            style={{ width: '794px' }} // A4 width at 96 DPI
          >
            <div className="text-center space-y-2 pb-8 border-b border-slate-100 dark:border-slate-800">
              <h1 className={cn("text-4xl font-black tracking-wider uppercase", themeColor)}>
                {bill.companyName || settings.companyName || "F.Z ELECTRIC SERVICE'S"}
              </h1>
              {settings.ownerName && (
                <p className="text-slate-700 dark:text-slate-300 font-bold">{settings.ownerName}</p>
              )}
              <p className="text-slate-500 dark:text-slate-400 font-medium">{settings.address || "Gujranwala Pakistan"}</p>
              <div className="flex items-center justify-center gap-6 text-slate-900 dark:text-white font-bold tracking-widest text-lg">
                <a href={`tel:${settings.phone || "03246043916"}`} className="hover:text-blue-600 transition-colors">
                  {settings.phone || "03246043916"}
                </a>
                {settings.showGST && settings.gstNumber && (
                  <span className={themeColor}>GST: {settings.gstNumber}</span>
                )}
              </div>
              {settings.showEmail && settings.email && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">{settings.email}</p>
              )}
              <div className="pt-2">
                <span className={cn("text-white px-6 py-1 rounded-full text-xs font-black tracking-widest uppercase", bgColor)}>
                  {isQuotation ? "Quotation" : "Bill"}
                </span>
              </div>
            </div>

            {/* Customer & Bill Info */}
            <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-8 border-r border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">BILLED TO</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{bill.customer.name}</p>
                {bill.customer.mobile && (
                  <a href={`tel:${bill.customer.mobile}`} className="text-blue-600 font-bold hover:underline">
                    {bill.customer.mobile}
                  </a>
                )}
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isQuotation ? "QUOTATION NO." : "BILL NO."}</h3>
                  <p className={cn("text-3xl font-black", themeColor)}>{bill.billNumber}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</h3>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{format(new Date(bill.date), "dd MMM yyyy")}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-8 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">ITEM</th>
                  <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">QTY</th>
                  <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">RATE</th>
                  <th className="py-4 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {bill.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-5 px-8 font-bold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="py-5 px-4 text-center font-medium text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-5 px-4 text-center font-medium text-slate-600 dark:text-slate-400">
                      {getCurrencySymbol(settings.currency)}
                      {item.price.toLocaleString()}
                    </td>
                    <td className="py-5 px-8 text-right font-black text-slate-900 dark:text-white">
                      {getCurrencySymbol(settings.currency)}
                      {item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Section */}
            <div className="p-12 space-y-8">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">Total</span>
                <span className={cn("text-3xl font-black", themeColor)}>
                  {getCurrencySymbol(settings.currency)}
                  {bill.total.toLocaleString()}
                </span>
              </div>
              
              {!isQuotation && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">Received</span>
                    <span className="text-2xl font-black text-green-600">
                      {getCurrencySymbol(settings.currency)}
                      {bill.receivedAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className={cn("p-6 rounded-3xl flex justify-between items-center border", isQuotation ? "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30" : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30")}>
                    <span className={cn("text-xl font-black", isQuotation ? "text-purple-800 dark:text-purple-300" : "text-blue-800 dark:text-blue-300")}>Balance Due</span>
                    <span className={cn("text-2xl font-black", themeColor)}>
                      {getCurrencySymbol(settings.currency)}
                      {bill.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-20 pt-12 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
