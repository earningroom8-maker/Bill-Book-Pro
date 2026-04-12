export interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  name: string;
  mobile: string;
  address: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customer: Customer;
  items: Item[];
  subtotal: number;
  tax: number;
  total: number;
  receivedAmount: number;
  balanceDue: number;
  status: 'pending' | 'paid';
  notes?: string;
  companyName?: string;
}

export interface Note {
  id: string;
  customerName: string;
  phoneNumber: string;
  content: string;
  date: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  joinedDate: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  date: string; // ISO string (YYYY-MM-DD)
  status: 'present' | 'absent';
  checkIn?: string; // HH:mm format
  checkOut?: string; // HH:mm format
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface MaterialList {
  id: string;
  title: string;
  customerName?: string;
  date: string;
  items: Material[];
  total: number;
}

export interface AppSettings {
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  country: string;
  currency: string;
  showGST: boolean;
  showEmail: boolean;
  darkMode: boolean;
}
