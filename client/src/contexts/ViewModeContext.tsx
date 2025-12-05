import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ViewMode = "desktop" | "tablet" | "mobile";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  getGridCols: (defaultCols?: number) => string;
  getFormCols: () => string;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("apo-360-view-mode");
    return (saved as ViewMode) || "desktop";
  });

  useEffect(() => {
    localStorage.setItem("apo-360-view-mode", viewMode);
  }, [viewMode]);

  const getGridCols = (defaultCols: number = 5): string => {
    switch (viewMode) {
      case "desktop":
        return "grid-cols-5";
      case "tablet":
        return "grid-cols-3";
      case "mobile":
        return "grid-cols-2";
      default:
        return `grid-cols-${defaultCols}`;
    }
  };

  const getFormCols = (): string => {
    switch (viewMode) {
      case "desktop":
        return "grid-cols-2";
      case "tablet":
        return "grid-cols-2";
      case "mobile":
        return "grid-cols-1";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, getGridCols, getFormCols }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
