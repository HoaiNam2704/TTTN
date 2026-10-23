"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/auth.service";

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthStorage = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("email");
  };

  const loadUserFromStorage = () => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      const userRole = localStorage.getItem("userRole");
      const email = localStorage.getItem("email");

      // Token is required — drop stale profile keys left after expiry/logout.
      if (!accessToken) {
        if (userId || username || userRole || email) {
          clearAuthStorage();
        }
        setUser(null);
      } else if (userId && username) {
        setUser({
          userId,
          username,
          email: email || "",
          role: userRole || "USER",
        });
      } else {
        clearAuthStorage();
        setUser(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserFromStorage();
    }, 0);
    
    // Support cross-tab syncing and manual local storage updates
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "accessToken" ||
        e.key === "userId" ||
        e.key === "username" ||
        e.key === "userRole" ||
        e.key === "email"
      ) {
        loadUserFromStorage();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Failed to call logout API", error);
    } finally {
      if (typeof window !== "undefined") {
        clearAuthStorage();
        setUser(null);
        setIsLoading(false);
        window.location.href = "/login";
      }
    }
  };

  const refreshUser = () => {
    loadUserFromStorage();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
