export const ROLES = {
  ADMIN: "ADMIN",
  ITIS: "ITIS",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
