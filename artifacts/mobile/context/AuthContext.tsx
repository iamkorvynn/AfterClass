import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { customFetch, setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  major: string;
  graduationYear: number;
  profilePicture?: string | null;
  bio?: string | null;
  campusDomain: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  pendingEmail: string | null;
  sendMagicLink: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Determine the API base URL depending on the development platform
const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "android") {
    // Android emulator loops back to host dev server at 10.0.2.2
    return "http://10.0.2.2:5000";
  }
  // iOS simulator or web
  return "http://localhost:5000";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // 1. Configure the API client connection parameters on mount
      const baseUrl = getApiBaseUrl();
      setBaseUrl(baseUrl);
      
      setAuthTokenGetter(async () => {
        return await AsyncStorage.getItem("@campuspulse_access_token");
      });

      // 2. Hydrate session from storage
      try {
        const storedUser = await AsyncStorage.getItem("@campuspulse_user_profile");
        const accessToken = await AsyncStorage.getItem("@campuspulse_access_token");
        
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Silent fail: local storage empty or corrupted
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const sendMagicLink = async (email: string) => {
    // POST /auth/register
    await customFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setPendingEmail(email);
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    if (!pendingEmail) return false;
    
    try {
      // POST /auth/verify
      const response = await customFetch<any>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email: pendingEmail, token: code }),
      });

      const { accessToken, refreshToken, user: profile } = response;
      
      // Store session securely
      await AsyncStorage.setItem("@campuspulse_access_token", accessToken);
      await AsyncStorage.setItem("@campuspulse_refresh_token", refreshToken);
      await AsyncStorage.setItem("@campuspulse_user_profile", JSON.stringify(profile));

      setUser(profile);
      setIsAuthenticated(true);
      setPendingEmail(null);
      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@campuspulse_access_token");
    await AsyncStorage.removeItem("@campuspulse_refresh_token");
    await AsyncStorage.removeItem("@campuspulse_user_profile");
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    // PUT /profiles/me
    const updatedProfile = await customFetch<UserProfile>("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    await AsyncStorage.setItem("@campuspulse_user_profile", JSON.stringify(updatedProfile));
    setUser(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, pendingEmail, sendMagicLink, verifyCode, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
