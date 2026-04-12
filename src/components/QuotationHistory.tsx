import * as React from "react";
import { Search, Trash2, Eye, FileText, Calendar, User, IndianRupee, MoreVertical, Download, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bill, AppSettings } from "../types";
import { getQuotations, deleteQuotation, getSettings } from "../lib/storage";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface QuotationHistoryProps {
  onView: (quotation: Bill) => void;
}

export function QuotationHistory({ onView }: QuotationHistoryProps) {
  const [quotations, setQuotations] = React.useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [quotationToDelete, setQuotationToDelete] = React.useState<string | null>(null);
  const settings = React.useMemo<AppSettings>(() => getSettings(), []);

  const loadQuotations = () => {
    setQuotations(getQuotations());
  };

  React.useEffect(() => {
    loadQuotations();
    window.addEventListener('quotation-updated', loadQuotations);
    return () => window.removeEventListener('quotation-updated', loadQuotations);
  }, []);

  const handleDelete = (id: string) => {
    deleteQuotation(id);
    loadQuotations();
    toast.success("Quotation deleted");
  };

  const filteredQuotations = quotations.filter(q => 
    q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-purple-600 bg-white dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuotations.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No quotations found</p>
          </div>
        ) : (
          filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900 transition-all hover:shadow-md rounded-2xl bg-white dark:bg-slate-900">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-5 flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">{quotation.billNumber}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{format(new Date(quotation.date), "dd MMM yyyy")}</span>
                      </div>
                      <h3 className="text-lg font-black text-purple-600 dark:text-purple-400">{quotation.customer.name}</h3>
                      {quotation.customer.mobile && (
                        <a href={`tel:${quotation.customer.mobile}`} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          {quotation.customer.mobile}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 md:py-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex items-center justify-between md:justify-end gap-8 bg-slate-50/30 dark:bg-slate-800/30 md:bg-transparent">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Amount</p>
                      <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                        {getCurrencySymbol(settings.currency)}
                        {quotation.total.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onView(quotation)}
                        className="rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full cursor-pointer")}>
                          <MoreVertical className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
                          <DropdownMenuItem onClick={() => onView(quotation)} className="gap-2 dark:focus:bg-slate-800">
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQuotationToDelete(quotation.id)} className="gap-2 text-red-600 focus:text-red-600 dark:focus:bg-slate-800">
                            <Trash2 className="w-4 h-4" /> Delete Quotation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={quotationToDelete !== null}
        onOpenChange={(open) => !open && setQuotationToDelete(null)}
        title="Delete Quotation"
        description="Are you sure you want to delete this quotation? This action cannot be undone."
        onConfirm={() => quotationToDelete && handleDelete(quotationToDelete)}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}
