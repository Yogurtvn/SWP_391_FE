import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const mockUsers: Array<User & { password: string }> = [
  {
    id: 'admin-001',
    email: 'admin@eyewear.com',
    password: 'admin123',
    fullName: 'Nguyễn Văn Admin',
    phone: '0901234567',
    role: 'admin',
  },
  {
    id: 'staff-001',
    email: 'staff@eyewear.com',
    password: 'staff123',
    fullName: 'Trần Thị Staff',
    phone: '0902234567',
    role: 'staff',
  },
  {
    id: 'customer-001',
    email: 'customer@example.com',
    password: 'customer123',
    fullName: 'Lê Văn Khách',
    phone: '0903234567',
    role: 'customer',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
