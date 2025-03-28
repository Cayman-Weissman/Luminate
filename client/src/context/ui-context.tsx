import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isDarkMode: true,
  isSidebarOpen: false,
  toggleDarkMode: () => {},
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
});

export const useUI = () => useContext(UIContext);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const setSidebarOpen = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  const value = {
    isDarkMode,
    isSidebarOpen,
    toggleDarkMode,
    toggleSidebar,
    setSidebarOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
