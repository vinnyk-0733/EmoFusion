import { useCallback } from 'react';
import { motion } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageContainer from './MessageContainer';
import ChatInput from './ChatInput';
import { useChatContext, useThemeContext, useCameraContext } from '@/context/AppContext';

const detectEmotionFromText = (text) => {
  const lowerText = text.toLowerCase();
  if (/happy|joy|great|amazing|love|wonderful|excited|fantastic/.test(lowerText)) return 'happy';
  if (/sad|unhappy|depressed|down|cry|miserable|lonely/.test(lowerText)) return 'sad';
  if (/angry|mad|furious|annoyed|frustrated|irritated/.test(lowerText)) return 'angry';
  if (/scared|afraid|fear|anxious|worried|nervous|panic/.test(lowerText)) return 'fear';
  if (/surprised|shocked|amazed|wow|unexpected/.test(lowerText)) return 'surprise';
  if (/disgusted|gross|awful|horrible|nasty/.test(lowerText)) return 'disgust';
  return 'neutral';
};

const ChatContainer = () => {
  const { theme, setTheme } = useThemeContext();
  const { messages, isTyping, currentEmotion, mentalState, emotionConfidence, sendMessage, loadMoreMessages, isConnected, isConnecting, connect } = useChatContext();
  const { captureFrame } = useCameraContext();

  const handleSendMessage = useCallback((content) => {
    const textEmotion = detectEmotionFromText(content);
    const frame = captureFrame?.();
    sendMessage(content, frame);
  }, [sendMessage, captureFrame]);

  const handleReconnect = useCallback(() => { connect?.(); }, [connect]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col glass-card rounded-3xl overflow-hidden shadow-card">
      <ChatHeader emotion={currentEmotion} mentalState={mentalState} emotionConfidence={emotionConfidence} theme={theme} onThemeChange={setTheme} isConnected={isConnected} isConnecting={isConnecting} onReconnect={handleReconnect} />
      <MessageContainer messages={messages} isTyping={isTyping} onLoadMore={loadMoreMessages} />
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </motion.div>
  );
};

export default ChatContainer;
