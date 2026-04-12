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
import { getNextQuotationNumber, saveQuotation, getSettings } from "../lib/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";

interface QuotationFormProps {
  onSave: (quotation: Bill) => void;
}

export function QuotationForm({ onSave }: QuotationFormProps) {
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

  const [companyName, setCompanyName] = React.useState(settings.companyName || "F.Z ELECTRIC SERVICE'S");

  const [items, setItems] = React.useState<Item[]>([
    { id: uuidv4(), name: "", quantity: 0, price: 0, total: 0 },
  ]);

  const [notes, setNotes] = React.useState("");
  const quotationNumber = React.useMemo(() => getNextQuotationNumber(), []);

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

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    if (!customer.name) {
      toast.error("Please enter customer name");
      return;
    }

    if (items.some((item) => !item.name || item.price < 0)) {
      toast.error("Please fill all item details correctly");
      return;
    }

    const quotation: Bill = {
      id: uuidv4(),
      billNumber: quotationNumber,
      date: new Date().toISOString(),
      customer,
      items,
      subtotal: total,
      tax: 0,
      total,
      receivedAmount: 0,
      balanceDue: total,
      status: 'pending',
      notes,
      companyName,
    };

    saveQuotation(quotation);
    onSave(quotation);
    toast.success("Quotation saved successfully!");
  };

  const handleExport = async (type: 'pdf' | 'image' | 'print') => {
    if (!billRef.current) return;
    
    const loadingToast = toast.loading(`Preparing ${type}...`);
    setIsExporting(true);
    
    try {
      if (type === 'print') {
        window.print();
        setIsExporting(false);
        toast.dismiss(loadingToast);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const fileName = `Quotation_${quotationNumber}_${customer.name.replace(/\s+/g, "_")}`;

      if (type === 'image') {
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
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}.png`;
        link.click();
        toast.success("Image saved successfully!");
      } else if (type === 'pdf') {
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
        pdf.save(`${fileName}.pdf`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between no-export">
        <h2 className="text-xl font-black text-purple-600">New Quotation</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "rounded-xl gap-2 cursor-pointer")}>
              <FileDown className="w-4 h-4" /> Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileText className="w-4 h-4" /> Save as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('image')} className="gap-2">
                <ImageIcon className="w-4 h-4" /> Save as Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('print')} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 rounded-xl gap-2 shadow-lg shadow-purple-100">
            <Save className="w-4 h-4" /> Save Quotation
          </Button>
        </div>
      </div>

      <Card ref={billRef} className={cn("border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden bg-white print-content", isExporting && "export-mode")}>
        <CardContent className="p-0">
          {/* Business Header */}
          <div className="p-4 text-center space-y-1 border-b border-slate-100">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="text-2xl font-black tracking-wider text-purple-600 uppercase text-center border-none bg-transparent focus:ring-0 h-auto p-0"
            />
            {settings.ownerName && (
              <p className="text-slate-700 font-bold text-sm">{settings.ownerName}</p>
            )}
            <p className="text-slate-500 font-medium text-xs">{settings.address || "Gujranwala Pakistan"}</p>
            <div className="flex items-center justify-center gap-4 text-slate-900 font-bold tracking-widest text-base">
              <span>{settings.phone || "03246043916"}</span>
            </div>
            <div className="pt-1">
              <span className="bg-purple-600 text-white px-4 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">Quotation</span>
            </div>
          </div>

          {/* Customer & Bill Info */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            <div className="p-4 border-r border-slate-100 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BILLED TO</Label>
              <Input
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="border-slate-200 rounded-xl h-9 text-base font-bold focus:ring-purple-600"
              />
              <Input
                placeholder="Mobile Number"
                value={customer.mobile}
                onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                className="border-slate-200 rounded-xl h-8 text-sm focus:ring-purple-600"
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">QUOTATION NO.</Label>
                <p className="text-xl font-black text-purple-600">{quotationNumber}</p>
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</Label>
                <p className="text-base font-bold text-slate-900">{format(new Date(), "dd MMM yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10">ITEM</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-center">QTY</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-center">RATE</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-10 text-right pr-6">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30 border-b border-slate-50">
                    <TableCell className="py-3">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="border-slate-200 rounded-lg h-9 focus:ring-purple-600"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-16 mx-auto text-center border-slate-200 rounded-lg h-9 focus:ring-purple-600"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                        className="w-24 mx-auto text-center border-slate-200 rounded-lg h-9 focus:ring-purple-600"
                      />
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-900">
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
          <div className="p-4 text-center border-b border-slate-100 no-export">
            <p className="text-xs text-slate-400 font-medium">Enter daba ke naya row add karo</p>
          </div>

          {/* Summary Section */}
          <div className="p-12 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-purple-600">Total Amount</span>
              <span className="text-3xl font-black text-purple-600">
                {getCurrencySymbol(settings.currency)}
                {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 p-8 text-center border-t border-slate-100">
            <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Valid for 15 days from date of issue</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
