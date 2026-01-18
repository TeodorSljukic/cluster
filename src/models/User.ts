export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string; // hashed
  role: "admin" | "user";
  displayName?: string;
  organization?: string;
  location?: string;
  role_custom?: string;
  interests?: string;
  profilePicture?: string;
  coverImage?: string;
  about?: string;
  headline?: string; // e.g., "Software Engineer at Company"
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  website?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  lastActivity?: Date;
  status?: "online" | "away" | "offline";
  createdAt: Date;
  updatedAt: Date;
}

export interface Experience {
  _id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  _id?: string;
  school: string;
  degree?: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}
