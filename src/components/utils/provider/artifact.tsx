import { createContext, useState, useContext, ReactNode } from 'react';

interface ArtifactContextType {
  showHtml: boolean;
  setShowHtml: React.Dispatch<React.SetStateAction<boolean>>;
  isRightColumnCollapsed: boolean;
  toggleRightColumn: (override?: boolean) => void; // Added toggleRightColumn
}

const ArtifactContext = createContext<ArtifactContextType>({
  showHtml: true,
  setShowHtml: () => {},
  isRightColumnCollapsed: true,
  toggleRightColumn: () => {}, // Default function for toggleRightColumn
});

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = useState(true);

  const [showHtml, setShowHtml] = useState<boolean>(true);
  const toggleRightColumn = (override?: boolean) => {
    if (typeof override === 'boolean') {
      console.log(`Setting right column collapsed state to: ${override}`);
      setIsRightColumnCollapsed(override);
    } else {
      const newState = !isRightColumnCollapsed;
      console.log(`Toggling right column collapsed state to: ${newState}`);
      setIsRightColumnCollapsed(newState);
    }
  };


  return (
    <ArtifactContext.Provider value={{ 
      showHtml, 
      setShowHtml, 
      isRightColumnCollapsed, 
      toggleRightColumn 
    }}>
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifactContext() {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error('useArtifactContext must be used within an ArtifactProvider');
  }
  return context;
}
