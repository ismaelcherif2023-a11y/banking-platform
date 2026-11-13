/** Contrats partagés avec le backend Spring Boot. */

export interface AuthResponse {
  token: string;
  accountNumber: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Account {
  number: string;
  ownerName: string;
  email: string;
  balance: number;
  currency: string;
  /** Date d'ouverture du compte (ISO 8601). */
  createdAt: string;
  /** Date de dernière connexion réussie (ISO 8601), si connue. */
  lastLoginAt: string | null;
}

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  label: string | null;
  status: TransferStatus;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTransferRequest {
  toAccount: string;
  amount: number;
  label?: string;
}

/** Erreur RFC 7807 renvoyée par le backend (ProblemDetail). */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}
