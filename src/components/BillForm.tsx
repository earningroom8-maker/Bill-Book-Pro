import * as React from "react";
import { Plus, Trash2, Save, FileText, ArrowLeft, MoreVertical, FileDown, Image as ImageIcon, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item, Customer, Bill, AppSettings } from "../types";
import { getNextBillNumber, saveBill, getSettings } from "../lib/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { exportToImage, exportToPDF, printElement } from "../lib/export";

interface BillFormProps {
  onSave: (bill: Bill) => void;
}

export function BillForm({ onSave }: BillFormProps) {
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

  const [customer, setCustomer] = React.useState<Customer>({
    name: "",
    mobile: "",
    address: "",
  });

  const [items, setItems] = React.useState<Item[]>([
    { id: uuidv4(), name: "", quantity: 0, price: 0, total: 0 },
  ]);

  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);
  const [notes, setNotes] = React.useState("");
  const billNumber = React.useMemo(() => getNextBillNumber(), []);

  const addItem = () => {
    setItems([...items, { id: uuidv4(), name: "", quantity: 0, price: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "price") {
            updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.price);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === items.length - 1) {
      e.preventDefault();
      addItem();
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal; // Simplified as per image (no explicit tax shown in example)
  const balanceDue = total - receivedAmount;

  const handleSave = () => {
    if (!customer.name) {
      toast.error("Please enter customer name");
      return;
    }

    if (items.some((item) => !item.name || item.price < 0)) {
      toast.error("Please fill all item details correctly");
      return;
    }

    const newBill: Bill = {
      id: uuidv4(),
      billNumber,
      date: new Date().toISOString(),
      customer,
      items,
      subtotal,
      tax: 0,
      total,
      receivedAmount,
      balanceDue,
      status: balanceDue === 0 ? 'paid' : 'pending',
      notes,
    };

    saveBill(newBill);
    toast.success("Bill saved successfully!");
    onSave(newBill);
  };

  const handleExport = async (type: 'pdf' | 'image' | 'print') => {
    if (!billRef.current) return;
    
    // Check if customer name is entered before exporting
    if (!customer.name) {
      toast.error("Please enter customer name before exporting");
      return;
    }

    const loadingToast = toast.loading(`Preparing ${type}...`);
    setIsExporting(true);
    
    try {
      if (type === 'print') {
        printElement();
        setIsExporting(false);
        toast.dismiss(loadingToast);
        return;
      }

      // Wait a bit for state to update and UI to re-render without borders
      await new Promise(resolve => setTimeout(resolve, 100));

      const fileName = `Bill_${billNumber}_${customer.name.replace(/\s+/g, "_")}`;

      if (type === 'image') {
        await exportToImage(billRef.current, fileName);
        toast.success("Image saved successfully!");
      } else if (type === 'pdf') {
        await exportToPDF(billRef.current, fileName);
        toast.success("PDF saved successfully!");
      }
      
      setIsExporting(false);
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Export Error:", error);
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.error(`Failed to generate ${type}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-900">New Invoice</h2>
            <p className="text-sm text-slate-500 font-medium">{format(new Date(), "dd MMM yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl gap-2 shadow-lg shadow-blue-100">
            <Save className="w-4 h-4" /> Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-slate-400 hover:bg-slate-100 rounded-xl")}>
              <MoreVertical className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-slate-100">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 py-2.5 rounded-lg cursor-pointer">
                <FileDown className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Save as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('image')} className="gap-2 py-2.5 rounded-lg cursor-pointer">
                <ImageIcon className="w-4 h-4 text-green-600" />
                <span className="font-medium">Save as Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('print')} className="gap-2 py-2.5 rounded-lg cursor-pointer">
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="font-medium">Print Bill</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card ref={billRef} className={cn("border border-slate-200 dark:border-slate-800 shadow-sm rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 print-content", isExporting && "export-mode")}>
        <CardContent className="p-0">
          {/* Business Header */}
          <div className="p-8 text-center space-y-2 border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-3xl font-black tracking-wider text-blue-600 uppercase">
              {settings.companyName || "F.Z ELECTRIC SERVICE'S"}
            </h1>
            {settings.ownerName && (
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{settings.ownerName}</p>
            )}
            <p className="text-slate-500 dark:text-slate-400 font-medium">{settings.address || "Gujranwala Pakistan"}</p>
            <div className="flex items-center justify-center gap-4 text-slate-900 dark:text-white font-bold tracking-widest">
              <a href={`tel:${settings.phone || "03246043916"}`} className="hover:text-blue-600 transition-colors">
                {settings.phone || "03246043916"}
              </a>
              {settings.showGST && settings.gstNumber && (
                <span className="text-blue-600">GST: {settings.gstNumber}</span>
              )}
            </div>
            {settings.showEmail && settings.email && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{settings.email}</p>
            )}
          </div>

          {/* Customer & Bill Info */}
          <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800">
            <div className="p-6 border-r border-slate-100 dark:border-slate-800 space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BILLED TO</Label>
              <Input
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="border-slate-200 dark:border-slate-700 rounded-lg h-10 font-bold text-lg focus:ring-blue-600 bg-white dark:bg-slate-800 dark:text-white"
              />
              <Input
                placeholder="Mobile Number"
                type="tel"
                value={customer.mobile}
                onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                className="border-slate-200 dark:border-slate-700 rounded-lg h-8 text-sm focus:ring-blue-600 bg-white dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BILL NO.</Label>
                <p className="text-2xl font-black text-blue-600">{billNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</Label>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{format(new Date(), "dd MMM yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10">ITEM</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-center">QTY</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-center">RATE</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-right pr-6">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800/50">
                    <TableCell className="py-3">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="border-slate-200 dark:border-slate-700 rounded-lg h-9 focus:ring-[#F97316] focus:border-[#F97316] bg-white dark:bg-slate-800 dark:text-white"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-16 mx-auto text-center border-slate-200 dark:border-slate-700 rounded-lg h-9 focus:ring-[#F97316] focus:border-[#F97316] bg-white dark:bg-slate-800 dark:text-white"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                        className="w-24 mx-auto text-center border-slate-200 dark:border-slate-700 rounded-lg h-9 focus:ring-[#F97316] focus:border-[#F97316] bg-white dark:bg-slate-800 dark:text-white"
                      />
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {getCurrencySymbol(settings.currency)}
                          {item.total.toLocaleString()}
                        </span>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 no-export"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Helper Text */}
          <div className="p-4 text-center border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium no-export">Enter daba ke naya row add karo</p>
          </div>

          {/* Summary Section */}
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">Total</span>
              <span className="text-2xl font-black text-blue-600">
                {getCurrencySymbol(settings.currency)}
                {total.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">Received</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">
                  {getCurrencySymbol(settings.currency)}
                </span>
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right border-slate-200 dark:border-slate-700 rounded-xl h-10 bg-green-50/30 dark:bg-green-900/10 focus:ring-green-500 focus:border-green-500 font-bold dark:text-white"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl flex justify-between items-center border border-blue-100 dark:border-blue-900/30">
              <span className="text-lg font-black text-blue-800 dark:text-blue-300">Balance Due</span>
              <span className="text-xl font-black text-blue-600">
                {getCurrencySymbol(settings.currency)}
                {balanceDue.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
