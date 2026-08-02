"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("current_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const getUsers = (): User[] => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : [];
  };

  const register = (name: string, email: string, password: string) => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) return false;

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("current_user", JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const login = (email: string, password: string) => {
    const users = getUsers();
    const found = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return false;

    localStorage.setItem("current_user", JSON.stringify(found));
    setUser(found);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("current_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
