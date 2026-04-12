import * as React from "react";
import { Plus, Trash2, Save, ClipboardList, Search, FileDown, Printer, Image as ImageIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MaterialList, AppSettings } from "../types";
import { saveMaterialList, getMaterialLists, deleteMaterialList, getSettings } from "../lib/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MaterialManagement() {
  const [lists, setLists] = React.useState<MaterialList[]>([]);
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [listToDelete, setListToDelete] = React.useState<string | null>(null);
  const [activeList, setActiveList] = React.useState<MaterialList | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const exportRef = React.useRef<HTMLDivElement>(null);
  const settings = React.useMemo<AppSettings>(() => getSettings(), []);

  // Form state
  const [title, setTitle] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [items, setItems] = React.useState<Material[]>([
    { id: uuidv4(), name: "", quantity: 0, unit: "", price: 0, total: 0 },
  ]);

  const loadLists = () => {
    setLists(getMaterialLists());
  };

  React.useEffect(() => {
    loadLists();
    
    const handleOpenForm = () => setIsDialogOpen(true);
    window.addEventListener('open-material-form', handleOpenForm);
    window.addEventListener('material-updated', loadLists);
    return () => {
      window.removeEventListener('open-material-form', handleOpenForm);
      window.removeEventListener('material-updated', loadLists);
    };
  }, []);

  const addItem = () => {
    setItems([...items, { id: uuidv4(), name: "", quantity: 0, unit: "", price: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Material, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    if (!title) {
      toast.error("Please enter a title for the material list");
      return;
    }

    const newList: MaterialList = {
      id: uuidv4(),
      title,
      customerName,
      date: new Date().toISOString(),
      items,
      total: 0,
    };

    saveMaterialList(newList);
    toast.success("Material list saved!");
    setIsDialogOpen(false);
    setTitle("");
    setCustomerName("");
    setItems([{ id: uuidv4(), name: "", quantity: 0, unit: "", price: 0, total: 0 }]);
  };

  const handleDelete = (id: string) => {
    deleteMaterialList(id);
    toast.success("List deleted");
  };

  const handleExport = async (type: 'pdf' | 'image' | 'print', list: MaterialList) => {
    setActiveList(list);
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!exportRef.current) return;
    
    const loadingToast = toast.loading(`Preparing ${type}...`);
    setIsExporting(true);
    
    try {
      if (type === 'print') {
        window.print();
        setIsExporting(false);
        toast.dismiss(loadingToast);
        return;
      }

      const fileName = `MaterialList_${list.title.replace(/\s+/g, "_")}`;

      if (type === 'image') {
        const dataUrl = await domtoimage.toPng(exportRef.current, {
          quality: 1,
          bgcolor: "#ffffff",
          width: exportRef.current.offsetWidth * 2,
          height: exportRef.current.offsetHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left',
            width: exportRef.current.offsetWidth + 'px',
            height: exportRef.current.offsetHeight + 'px'
          }
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}.png`;
        link.click();
      } else if (type === 'pdf') {
        const dataUrl = await domtoimage.toPng(exportRef.current, {
          quality: 1,
          bgcolor: "#ffffff",
          width: exportRef.current.offsetWidth * 2,
          height: exportRef.current.offsetHeight * 2,
          style: {
            transform: 'scale(2)',
            transformOrigin: 'top left',
            width: exportRef.current.offsetWidth + 'px',
            height: exportRef.current.offsetHeight + 'px'
          }
        });
        
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [exportRef.current.offsetWidth, exportRef.current.offsetHeight],
        });
        
        pdf.addImage(dataUrl, "PNG", 0, 0, exportRef.current.offsetWidth, exportRef.current.offsetHeight);
        pdf.save(`${fileName}.pdf`);
      }
      
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.success(`${type.toUpperCase()} generated successfully!`);
    } catch (error) {
      console.error("Export Error:", error);
      setIsExporting(false);
      toast.dismiss(loadingToast);
      toast.error(`Failed to generate ${type}`);
    }
  };

  const filteredLists = lists.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase())
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
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search material lists..."
            className="pl-12 h-12 bg-white border-none shadow-md rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
            <div className="bg-white dark:bg-slate-900 min-h-full">
              {/* Pad Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 text-center space-y-2">
                <h1 className="text-3xl font-black tracking-wider text-emerald-600 uppercase">
                  {settings.companyName || "F.Z ELECTRIC SERVICE'S"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{settings.address || "Gujranwala Pakistan"}</p>
                <div className="flex items-center justify-center gap-6 text-slate-900 dark:text-white font-bold tracking-widest text-sm">
                  <span>{settings.phone || "03246043916"}</span>
                </div>
                <div className="pt-2">
                  <span className="bg-emerald-600 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Material List</span>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CUSTOMER NAME</Label>
                      <Input 
                        placeholder="e.g. John Doe" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-lg font-bold focus:ring-emerald-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LIST TITLE / PROJECT</Label>
                      <Input 
                        placeholder="e.g. House Wiring Materials" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xl font-black focus:ring-emerald-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">DATE</Label>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{format(new Date(), "dd MMM yyyy")}</p>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 pl-8">MATERIAL NAME</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 text-center">QTY</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 text-center">UNIT</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-12 text-right pr-8">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800/50">
                          <TableCell className="pl-8 py-4">
                            <Input 
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, "name", e.target.value)}
                              className="border-none bg-transparent focus:ring-0 font-bold text-slate-900 dark:text-white p-0 h-auto"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <Input 
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-16 mx-auto text-center border-none bg-transparent focus:ring-0 font-bold text-slate-900 dark:text-white p-0 h-auto"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <Input 
                              placeholder="unit"
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                              className="w-16 mx-auto text-center border-none bg-transparent focus:ring-0 text-slate-500 dark:text-slate-400 text-xs uppercase p-0 h-auto"
                            />
                          </TableCell>
                          <TableCell className="pr-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {items.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  className="h-8 w-8 text-slate-300 hover:text-red-500 rounded-full"
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
                  <Button variant="ghost" className="w-full h-12 text-slate-400 hover:text-emerald-600 rounded-none border-t border-slate-100 dark:border-slate-800" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" /> Add More Items
                  </Button>
                </div>

                <div className="pt-8 flex justify-end gap-4">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-8">Cancel</Button>
                  <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-lg shadow-emerald-100 dark:shadow-none">
                    <Save className="w-4 h-4 mr-2" /> Save Material List
                  </Button>
                </div>
              </div>

              {/* Pad Footer */}
              <div className="p-8 text-center border-t border-slate-100 dark:border-slate-800 mt-8">
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">This is a material list for project planning</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLists.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No material lists found</p>
          </div>
        ) : (
          filteredLists.map((list) => (
            <Card key={list.id} className="group overflow-hidden border-slate-200 hover:border-emerald-200 transition-all hover:shadow-md rounded-2xl bg-white">
              <CardContent className="p-0">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      {list.customerName && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{list.customerName}</p>
                      )}
                      <h3 className="text-lg font-black text-emerald-600">{list.title}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(list.date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">{list.items.length} Items</span>
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 rounded-full cursor-pointer")}>
                        <FileDown className="w-4 h-4 text-slate-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleExport('pdf', list)} className="gap-2">
                          <FileDown className="w-4 h-4" /> Save as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('image', list)} className="gap-2">
                          <ImageIcon className="w-4 h-4" /> Save as Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('print', list)} className="gap-2">
                          <Printer className="w-4 h-4" /> Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={() => setListToDelete(list.id)} className="h-8 w-8 rounded-full text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Export Template (Hidden) */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={exportRef} className="w-[800px] bg-white p-12 text-slate-900 font-sans">
          <div className="text-center space-y-2 pb-8 border-b border-slate-100">
            <h1 className="text-4xl font-black tracking-wider text-emerald-600 uppercase">
              {settings.companyName || "F.Z ELECTRIC SERVICE'S"}
            </h1>
            <p className="text-slate-500 font-medium">{settings.address || "Gujranwala Pakistan"}</p>
            <div className="flex items-center justify-center gap-6 text-slate-900 font-bold tracking-widest text-lg">
              <span>{settings.phone || "03246043916"}</span>
            </div>
            <div className="pt-4">
              <span className="bg-emerald-600 text-white px-6 py-1 rounded-full text-xs font-black tracking-widest uppercase">Material List</span>
            </div>
          </div>

          <div className="py-8 flex justify-between items-end border-b border-slate-100">
            <div className="space-y-4">
              {activeList?.customerName && (
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">CUSTOMER NAME</h3>
                  <p className="text-xl font-bold text-slate-900">{activeList.customerName}</p>
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">PROJECT / TITLE</h3>
                <p className="text-3xl font-black text-slate-900">{activeList?.title}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">DATE</h3>
              <p className="text-xl font-bold text-slate-900">{activeList && format(new Date(activeList.date), "dd MMM yyyy")}</p>
            </div>
          </div>

          <table className="w-full mt-8">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-8 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">MATERIAL NAME</th>
                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">QTY</th>
                <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">UNIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeList?.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-5 px-8 font-bold text-slate-900">{item.name}</td>
                  <td className="py-5 px-4 text-center font-medium text-slate-600">{item.quantity}</td>
                  <td className="py-5 px-4 text-center font-medium text-slate-500 text-xs uppercase">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 pt-12 text-center border-t border-slate-100">
            <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">This is a material list for project planning.</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={listToDelete !== null}
        onOpenChange={(open) => !open && setListToDelete(null)}
        title="Delete Material List"
        description="Are you sure you want to delete this material list? This action cannot be undone."
        onConfirm={() => listToDelete && handleDelete(listToDelete)}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}
