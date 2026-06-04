import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState, SignupRequest } from "../types/banking";

const AuthContext = createContext<AuthState | undefined>(undefined);

const ACCESS_TOKEN = "accessToken";
const USER_KEY = "user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    localStorage.setItem(ACCESS_TOKEN, data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(data.user);
    setIsAuthenticated(true);

    return true;
  };
  const signup = async (userData: SignupRequest): Promise<boolean> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData), // 👈 clean and simple
      });

      if (!res.ok) return false;

      const data = await res.json();

      setUser(data);
      // setIsAuthenticated(true);

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    return res.ok;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // call backend to get real user
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          localStorage.removeItem("accessToken");
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const userData = await res.json();

        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);



  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(USER_KEY);

    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup, 
        logout,
        verifyPin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};