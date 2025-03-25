import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of our context
interface UserContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

// Create context with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
  value: UserContextType;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, value }) => {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};