import * as React from "react";
import { Search, Eye, Trash2, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bill, AppSettings } from "../types";
import { getBills, deleteBill, updateBillStatus, getSettings } from "../lib/storage";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface BillHistoryProps {
  onView: (bill: Bill) => void;
}

export function BillHistory({ onView }: BillHistoryProps) {
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [search, setSearch] = React.useState("");
  const [billToDelete, setBillToDelete] = React.useState<string | null>(null);
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

  const loadBills = () => {
    setBills(getBills());
  };

  React.useEffect(() => {
    loadBills();
    
    const handleUpdate = () => loadBills();
    window.addEventListener('bill-updated', handleUpdate);
    return () => window.removeEventListener('bill-updated', handleUpdate);
  }, []);

  const handleDelete = (id: string) => {
    deleteBill(id);
    loadBills();
    window.dispatchEvent(new CustomEvent('bill-updated'));
    toast.success("Bill deleted successfully");
  };

  const handleMarkAsPaid = (id: string) => {
    updateBillStatus(id, 'paid');
    loadBills();
    toast.success("Bill marked as paid");
  };

  const filteredBills = bills.filter((bill) => 
    bill.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    bill.billNumber.includes(search) ||
    bill.customer.mobile.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search by customer name, bill number, or mobile..."
          className="pl-12 h-14 bg-white border-none shadow-md text-lg rounded-2xl focus-visible:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-blue-600">#{bill.billNumber}</TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(bill.date), "dd MMM yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          {bill.customer.name}
                        </div>
                        <span className="text-[10px] text-slate-500 ml-5">{bill.customer.mobile}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-900">
                        {getCurrencySymbol(settings.currency)}{bill.total.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          bill.status === 'paid' 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {bill.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsPaid(bill.id)}
                            className="text-green-600 hover:bg-green-50"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(bill)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBillToDelete(bill.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={billToDelete !== null}
        onOpenChange={(open) => !open && setBillToDelete(null)}
        title="Delete Bill"
        description="Are you sure you want to delete this bill? This action cannot be undone."
        onConfirm={() => billToDelete && handleDelete(billToDelete)}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}
