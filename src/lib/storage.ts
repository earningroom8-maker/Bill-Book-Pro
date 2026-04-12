import { Bill, Note, MaterialList, TeamMember, Attendance, AppSettings } from "../types";
import { db, auth, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, handleFirestoreError, OperationType } from "./firebase";

const STORAGE_KEY = "billbook_bills";
const QUOTATIONS_KEY = "billbook_quotations";
const NOTES_KEY = "billbook_notes";
const MATERIALS_KEY = "billbook_materials";
const TEAM_KEY = "billbook_team";
const ATTENDANCE_KEY = "billbook_attendance";
const SETTINGS_KEY = "billbook_settings";

// Helper to get current user ID
const getUid = () => auth.currentUser?.uid;

// Firestore Sync Helpers
export const saveBill = async (bill: Bill) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "bills", bill.id), { ...bill, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "bills");
    }
  }
  // Local fallback
  const bills = getBills();
  const updatedBills = [bill, ...bills.filter(b => b.id !== bill.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
};

export const getBills = (): Bill[] => {
  const billsJson = localStorage.getItem(STORAGE_KEY);
  if (!billsJson) return [];
  try {
    const bills: Bill[] = JSON.parse(billsJson);
    return bills.map(bill => ({
      ...bill,
      status: bill.status || (bill.balanceDue === 0 ? 'paid' : 'pending')
    }));
  } catch (error) {
    console.error("Error parsing bills", error);
    return [];
  }
};

export const updateBillStatus = async (id: string, status: 'pending' | 'paid') => {
  const uid = getUid();
  if (uid) {
    try {
      await updateDoc(doc(db, "bills", id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bills/${id}`);
    }
  }
  const bills = getBills();
  const updatedBills = bills.map(b => b.id === id ? { ...b, status } : b);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
  window.dispatchEvent(new Event('bill-updated'));
};

export const deleteBill = async (id: string) => {
  const uid = getUid();
  if (uid) {
    try {
      await deleteDoc(doc(db, "bills", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bills/${id}`);
    }
  }
  const bills = getBills();
  const updatedBills = bills.filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
};

export const saveQuotation = async (quotation: Bill) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "quotations", quotation.id), { ...quotation, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "quotations");
    }
  }
  const quotations = getQuotations();
  const updatedQuotations = [quotation, ...quotations.filter(q => q.id !== quotation.id)];
  localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(updatedQuotations));
  window.dispatchEvent(new Event('quotation-updated'));
};

export const getQuotations = (): Bill[] => {
  const quotationsJson = localStorage.getItem(QUOTATIONS_KEY);
  if (!quotationsJson) return [];
  try {
    return JSON.parse(quotationsJson);
  } catch (error) {
    console.error("Error parsing quotations", error);
    return [];
  }
};

export const deleteQuotation = async (id: string) => {
  const uid = getUid();
  if (uid) {
    try {
      await deleteDoc(doc(db, "quotations", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `quotations/${id}`);
    }
  }
  const quotations = getQuotations();
  const updatedQuotations = quotations.filter((q) => q.id !== id);
  localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(updatedQuotations));
};

export const getNextQuotationNumber = (): string => {
  const quotations = getQuotations();
  if (quotations.length === 0) return "Q-1001";
  const lastQuotation = quotations[0];
  const lastNumber = parseInt(lastQuotation.billNumber.replace("Q-", ""));
  return `Q-${(lastNumber + 1).toString()}`;
};

export const getNextBillNumber = (): string => {
  const bills = getBills();
  if (bills.length === 0) return "1001";
  const lastBill = bills[0];
  const lastNumber = parseInt(lastBill.billNumber);
  return (lastNumber + 1).toString();
};

export const saveNote = async (note: Note) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "notes", note.id), { ...note, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "notes");
    }
  }
  const notes = getNotes();
  const updatedNotes = [note, ...notes.filter(n => n.id !== note.id)];
  localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
};

export const getNotes = (): Note[] => {
  const notesJson = localStorage.getItem(NOTES_KEY);
  if (!notesJson) return [];
  try {
    return JSON.parse(notesJson);
  } catch (error) {
    console.error("Error parsing notes", error);
    return [];
  }
};

export const deleteNote = async (id: string) => {
  const uid = getUid();
  if (uid) {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${id}`);
    }
  }
  const notes = getNotes();
  const updatedNotes = notes.filter((n) => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
};

export const saveMaterialList = async (list: MaterialList) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "materialLists", list.id), { ...list, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "materialLists");
    }
  }
  const lists = getMaterialLists();
  const updatedLists = [list, ...lists.filter(l => l.id !== list.id)];
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(updatedLists));
  window.dispatchEvent(new Event('material-updated'));
};

export const getMaterialLists = (): MaterialList[] => {
  const listsJson = localStorage.getItem(MATERIALS_KEY);
  if (!listsJson) return [];
  try {
    return JSON.parse(listsJson);
  } catch (error) {
    console.error("Error parsing material lists", error);
    return [];
  }
};

export const deleteMaterialList = async (id: string) => {
  const uid = getUid();
  if (uid) {
    try {
      await deleteDoc(doc(db, "materialLists", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `materialLists/${id}`);
    }
  }
  const lists = getMaterialLists();
  const updatedLists = lists.filter((l) => l.id !== id);
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(updatedLists));
  window.dispatchEvent(new Event('material-updated'));
};

export const saveTeamMember = async (member: TeamMember) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "teamMembers", member.id), { ...member, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "teamMembers");
    }
  }
  const members = getTeamMembers();
  const updatedMembers = [member, ...members.filter(m => m.id !== member.id)];
  localStorage.setItem(TEAM_KEY, JSON.stringify(updatedMembers));
};

export const getTeamMembers = (): TeamMember[] => {
  const membersJson = localStorage.getItem(TEAM_KEY);
  if (!membersJson) return [];
  try {
    return JSON.parse(membersJson);
  } catch (error) {
    console.error("Error parsing team members", error);
    return [];
  }
};

export const deleteTeamMember = async (id: string) => {
  const uid = getUid();
  if (uid) {
    try {
      await deleteDoc(doc(db, "teamMembers", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teamMembers/${id}`);
    }
  }
  const members = getTeamMembers();
  const updatedMembers = members.filter((m) => m.id !== id);
  localStorage.setItem(TEAM_KEY, JSON.stringify(updatedMembers));
  
  const attendance = getAttendance();
  const updatedAttendance = attendance.filter((a) => a.memberId !== id);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
};

export const saveAttendance = async (record: Attendance) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "attendance", record.id), { ...record, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "attendance");
    }
  }
  const attendance = getAttendance();
  const filtered = attendance.filter(a => !(a.memberId === record.memberId && a.date === record.date));
  const updatedAttendance = [record, ...filtered];
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
};

export const getAttendance = (): Attendance[] => {
  const attendanceJson = localStorage.getItem(ATTENDANCE_KEY);
  if (!attendanceJson) return [];
  try {
    return JSON.parse(attendanceJson);
  } catch (error) {
    console.error("Error parsing attendance", error);
    return [];
  }
};

export const getSettings = (): AppSettings => {
  const settingsJson = localStorage.getItem(SETTINGS_KEY);
  const defaultSettings: AppSettings = {
    companyName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    country: "Pakistan",
    currency: "PKR",
    showGST: true,
    showEmail: true,
    darkMode: false,
  };

  if (!settingsJson) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(settingsJson) };
  } catch (error) {
    console.error("Error parsing settings", error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  const uid = getUid();
  if (uid) {
    try {
      await setDoc(doc(db, "settings", uid), { ...settings, uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${uid}`);
    }
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Real-time Sync Setup
export const setupSync = (uid: string) => {
  const collections = [
    { path: "bills", key: STORAGE_KEY },
    { path: "quotations", key: QUOTATIONS_KEY },
    { path: "notes", key: NOTES_KEY },
    { path: "materialLists", key: MATERIALS_KEY },
    { path: "teamMembers", key: TEAM_KEY },
    { path: "attendance", key: ATTENDANCE_KEY }
  ];

  const unsubscribes = collections.map(({ path, key }) => {
    const q = query(collection(db, path), where("uid", "==", uid));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new Event(`${path.replace(/s$/, '')}-updated`));
      window.dispatchEvent(new Event('storage'));
    }, (error) => {
      console.error(`Sync error for ${path}:`, error);
    });
  });

  // Settings sync
  const settingsUnsubscribe = onSnapshot(doc(db, "settings", uid), (snapshot) => {
    if (snapshot.exists()) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot.data()));
      window.dispatchEvent(new Event('storage'));
    }
  });

  return () => {
    unsubscribes.forEach(unsub => unsub());
    settingsUnsubscribe();
  };
};

