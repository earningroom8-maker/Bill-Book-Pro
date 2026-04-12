import * as React from "react";
import { UserPlus, Phone, Calendar, Trash2, CheckCircle2, XCircle, Search, Clock, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamMember, Attendance } from "../types";
import { saveTeamMember, getTeamMembers, deleteTeamMember, saveAttendance, getAttendance } from "../lib/storage";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TeamManagement() {
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [search, setSearch] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newMember, setNewMember] = React.useState({ name: "", phone: "" });
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [memberToDelete, setMemberToDelete] = React.useState<string | null>(null);

  const loadData = () => {
    setMembers(getTeamMembers());
    setAttendance(getAttendance());
  };

  React.useEffect(() => {
    loadData();
    
    const handleOpenForm = () => setIsAddDialogOpen(true);
    window.addEventListener('open-team-form', handleOpenForm);
    return () => window.removeEventListener('open-team-form', handleOpenForm);
  }, []);

  const handleAddMember = () => {
    if (!newMember.name || !newMember.phone) {
      toast.error("Please fill all fields");
      return;
    }

    const member: TeamMember = {
      id: uuidv4(),
      name: newMember.name,
      phone: newMember.phone,
      joinedDate: new Date().toISOString(),
    };

    saveTeamMember(member);
    setNewMember({ name: "", phone: "" });
    setIsAddDialogOpen(false);
    loadData();
    toast.success("Team member added successfully");
  };

  const handleDeleteMember = (id: string) => {
    deleteTeamMember(id);
    loadData();
    toast.success("Member removed");
  };

  const toggleAttendance = (memberId: string, currentStatus: 'present' | 'absent' | undefined) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    const currentTime = format(new Date(), "HH:mm");
    
    const record: Attendance = {
      id: uuidv4(),
      memberId,
      date: selectedDate,
      status: newStatus,
      checkIn: newStatus === 'present' ? currentTime : undefined,
    };
    saveAttendance(record);
    loadData();
  };

  const updateTime = (memberId: string, type: 'checkIn' | 'checkOut', time: string) => {
    const existing = attendance.find(a => a.memberId === memberId && a.date === selectedDate);
    if (!existing) return;

    const updated: Attendance = {
      ...existing,
      [type]: time
    };
    saveAttendance(updated);
    loadData();
  };

  const getAttendanceRecord = (memberId: string) => {
    return attendance.find(a => a.memberId === memberId && a.date === selectedDate);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search team members..."
            className="pl-12 h-12 bg-white border-none shadow-md rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Input
            type="date"
            className="h-12 bg-white border-none shadow-md rounded-2xl w-full md:w-48"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[360px] rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900">Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Full Name</label>
                  <Input
                    placeholder="Enter name"
                    className="h-10 bg-slate-50 border-none rounded-lg text-sm"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Phone Number</label>
                  <Input
                    placeholder="Enter phone"
                    type="tel"
                    className="h-10 bg-slate-50 border-none rounded-lg text-sm"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleAddMember}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm"
                >
                  Save Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-black text-slate-900">Team Attendance</CardTitle>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-2 py-0.5 text-[10px]">
              {format(new Date(selectedDate), "EEEE, dd MMM yyyy")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="pl-6 h-10 text-xs">Member Name</TableHead>
                <TableHead className="h-10 text-xs">Phone</TableHead>
                <TableHead className="text-center h-10 text-xs">Attendance & Time</TableHead>
                <TableHead className="text-right pr-6 h-10 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="w-10 h-10 text-slate-200" />
                      <p className="text-sm font-medium">No team members found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const record = getAttendanceRecord(member.id);
                  const status = record?.status;
                  return (
                    <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 font-bold text-slate-900 text-sm py-3">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline font-medium">
                            {member.phone}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              size="xs"
                              variant={status === 'present' ? "default" : "outline"}
                              className={status === 'present' ? "bg-green-600 hover:bg-green-700 h-7 text-[10px]" : "border-slate-200 h-7 text-[10px]"}
                              onClick={() => toggleAttendance(member.id, status)}
                            >
                              {status === 'present' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                              Present
                            </Button>
                            <Button
                              size="xs"
                              variant={status === 'absent' ? "destructive" : "outline"}
                              className={status === 'absent' ? "h-7 text-[10px]" : "border-slate-200 h-7 text-[10px]"}
                              onClick={() => toggleAttendance(member.id, status)}
                            >
                              {status === 'absent' ? <XCircle className="w-3 h-3 mr-1" /> : null}
                              Absent
                            </Button>
                          </div>
                          
                          {status === 'present' && (
                            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-1">
                                <LogIn className="w-3 h-3 text-blue-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">In:</span>
                                <Input
                                  type="time"
                                  className="w-20 h-6 text-[10px] bg-white border-slate-200 rounded-md px-1"
                                  value={record.checkIn || ""}
                                  onChange={(e) => updateTime(member.id, 'checkIn', e.target.value)}
                                />
                              </div>
                              <div className="w-px h-3 bg-slate-200" />
                              <div className="flex items-center gap-1">
                                <LogOut className="w-3 h-3 text-orange-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Out:</span>
                                <Input
                                  type="time"
                                  className="w-20 h-6 text-[10px] bg-white border-slate-200 rounded-md px-1"
                                  value={record.checkOut || ""}
                                  onChange={(e) => updateTime(member.id, 'checkOut', e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setMemberToDelete(member.id)}
                          className="text-slate-400 hover:text-red-600 rounded-full"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={memberToDelete !== null}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
        title="Remove Team Member"
        description="Are you sure you want to remove this team member? This will also delete all their attendance records."
        onConfirm={() => memberToDelete && handleDeleteMember(memberToDelete)}
        variant="destructive"
        confirmText="Remove"
      />
    </div>
  );
}
