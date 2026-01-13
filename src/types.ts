export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Company {
  id: string;
  name: string;
  companyNumber?: string;
  contactDetails: {
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  };
  assignedTo: string;
  assignedBy: string;
  contactDate: string;
  meetingDate: string;
  status: 'pending' | 'closed' | 'escalated';
  escalatedTo?: string;
  notes?: string;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  companies: Company[];
  users: User[];
}