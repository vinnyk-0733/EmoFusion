import { createContext, useContext } from 'react';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { useCamera } from '@/hooks/useCamera';

const ChatContext = createContext(null);
const ThemeContext = createContext(null);
const CameraContext = createContext(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChatContext must be used within ChatProvider');
  return context;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (!context) throw new Error('useCameraContext must be used within CameraProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const chat = useChat();
  const theme = useTheme();
  const camera = useCamera();

  return (
    <ChatContext.Provider value={chat}>
      <ThemeContext.Provider value={theme}>
        <CameraContext.Provider value={camera}>
          {children}
        </CameraContext.Provider>
      </ThemeContext.Provider>
    </ChatContext.Provider>
  );
};
