import * as React from "react";
import { Plus, Trash2, Save, StickyNote, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Note } from "../types";
import { saveNote, getNotes, deleteNote } from "../lib/storage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function Notepad() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [customerName, setCustomerName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [content, setContent] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [noteToDelete, setNoteToDelete] = React.useState<string | null>(null);

  const loadNotes = () => {
    setNotes(getNotes());
  };

  React.useEffect(() => {
    loadNotes();
    
    const handleOpenForm = () => setIsDialogOpen(true);
    window.addEventListener('open-note-form', handleOpenForm);
    return () => window.removeEventListener('open-note-form', handleOpenForm);
  }, []);

  const handleSave = () => {
    if (!customerName || !content) {
      toast.error("Please enter customer name and note content");
      return;
    }

    const newNote: Note = {
      id: uuidv4(),
      customerName,
      phoneNumber,
      content,
      date: new Date().toISOString(),
    };

    saveNote(newNote);
    toast.success("Note saved successfully!");
    loadNotes();
    setIsDialogOpen(false);
    window.dispatchEvent(new Event('note-updated'));
    
    // Reset form
    setCustomerName("");
    setPhoneNumber("");
    setContent("");
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    loadNotes();
    toast.success("Note deleted successfully");
    window.dispatchEvent(new Event('note-updated'));
  };

  const filteredNotes = notes.filter((note) => 
    note.customerName.toLowerCase().includes(search.toLowerCase()) ||
    note.phoneNumber.includes(search) ||
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar at Top */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search notes by customer, phone, or content..."
          className="pl-12 h-14 bg-white dark:bg-slate-900 border-none shadow-md text-lg rounded-2xl focus-visible:ring-amber-500 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* New Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <StickyNote className="w-5 h-5 text-amber-500" />
              Add New Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="note-customer" className="dark:text-slate-400">Customer Name</Label>
                <Input
                  id="note-customer"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-phone" className="dark:text-slate-400">Phone Number</Label>
                <Input
                  id="note-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content" className="dark:text-slate-400">Note</Label>
              <textarea
                id="note-content"
                className="w-full min-h-[150px] p-3 rounded-md border bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                <Save className="w-4 h-4" /> Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="border-none shadow-md bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{note.customerName}</CardTitle>
                  <a href={`tel:${note.phoneNumber}`} className="text-xs text-blue-600 hover:underline font-medium">{note.phoneNumber}</a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNoteToDelete(note.id)}
                  className="text-slate-400 hover:text-red-600 -mt-1 -mr-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4 line-clamp-6">{note.content}</p>
                <div className="flex items-center justify-end pt-2 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    {format(new Date(note.date), "dd MMM yyyy, hh:mm a")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={noteToDelete !== null}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={() => noteToDelete && handleDelete(noteToDelete)}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}
