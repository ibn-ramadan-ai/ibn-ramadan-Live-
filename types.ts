export type UserRole = "ADMIN" | "CLIENT";

export interface ClientFeatures {
  scripts: boolean;
  marketing: boolean;
  finance: boolean;
  cs: boolean;
  bi_portal: boolean;
}

export interface ClientAccount {
  id: string;
  username: string;
  password: string;
  companyName: string;
  brandName: string;
  category: string;
  subscription: "BASIC" | "GOLD" | "ELITE";
  status: "ACTIVE" | "SUSPENDED";
  expiryDate: string;
  features: ClientFeatures;
  createdAt: string;
}

export interface AuthState {
  user: {
    role: UserRole;
    clientId?: string;
    name: string;
  } | null;
}
