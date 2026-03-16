import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Brain, Heart, MessageSquare, BarChart3, Volume2, VolumeX, Wind, MoreHorizontal, Lightbulb, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import SettingsDrawer from '@/components/SettingsDrawer';
import ConversationHistory from '@/components/ConversationHistory';
import VoiceChatInput from '@/components/VoiceChatInput';
import EmotionDashboard from '@/components/EmotionDashboard';
import SwipeableChatMessage from '@/components/SwipeableChatMessage';
import QuickReplies from '@/components/QuickReplies';
import BreathingExercise from '@/components/BreathingExercise';
import CameraFeed from '@/components/CameraFeed';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import BottomNav from '@/components/BottomNav';
import ScrollToBottomButton from '@/components/ScrollToBottomButton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/useTheme';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useCamera } from '@/hooks/useCamera';
import { useWebSocketChat } from '@/hooks/useWebSocketChat';
import { useAccessibility } from '@/context/AccessibilityContext';
import CustomCursor from '@/components/CustomCursor';
import RobotMascot from '@/components/RobotMascot';
import MiniAILogo from '@/components/MiniAILogo';

const EMOTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  neutral: '😐',
  disgust: '🤢',
};

const Index = () => {
  const [input, setInput] = useState('');
  // const [isTyping, setIsTyping] = useState(false); // Handled by chat hook
  const [emotion, setEmotion] = useState('neutral');
  const [activeTab, setActiveTab] = useState('chat');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Liked state is now stored on each message.liked in DB
  const [mobileTab, setMobileTab] = useState('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef(null);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [newestMessageId, setNewestMessageId] = useState(null);
  const { theme, setTheme } = useTheme();
  const { settings } = useAccessibility();
  const messagesEndRef = useRef(null);
  const lastAssistantMsgRef = useRef(null);

  const camera = useCamera(2000);
  const chat = useWebSocketChat();

  // Sync detected emotion from chat (fusion) or camera (fallback)
  useEffect(() => {
    if (chat.currentEmotion && chat.currentEmotion !== 'neutral') {
      setEmotion(chat.currentEmotion);
    } else if (camera.detectedEmotion) {
      setEmotion(camera.detectedEmotion.emotion);
    }
  }, [chat.currentEmotion, camera.detectedEmotion]);

  // Restore history on load if chat is empty


  // Connect on mount
  // Moved connection logic to the activeConversation effect to prevent creating duplicate empty chats on load
  // useEffect(() => {
  //   chat.connect();
  // }, []);

  const {
    conversations,
    activeConversationId,
    activeConversation,
    startNewConversation,
    addMessage, // Still useful if we want to save to local history later, but strictly using chat.messages for now
    selectConversation,
    deleteConversation,
    clearAllConversations,
    renameConversation,
    deleteMessage,
  } = useConversationHistory();

  const speechSynthesisOptions = useMemo(() => ({
    rate: 1,
    pitch: 1,
    volume: 1,
    voiceURI: selectedVoiceURI || undefined,
  }), [selectedVoiceURI]);

  const speechSynthesis = useSpeechSynthesis(speechSynthesisOptions);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
  });

  // Use live chat messages instead of stored conversation
  const messages = chat.messages;

  // Restore history when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      // 1. Restore messages to the chat view
      if (activeConversation.messages) {
        chat.restoreMessages(activeConversation.messages);
      } else {
        chat.setMessages([]);
      }

      // 2. Connect/Reconnect WebSocket with the new Chat ID
      // We check if we are already connected to this chat to avoid unnecessary reconnects
      if (chat.isConnected && chat.currentSessionId === activeConversation.id) {
        // already connected to this session
      } else {
        chat.connect(activeConversation.id);
      }
    } else {
      // If no conversation selected (e.g. initial load or all deleted), maybe clear?
      // But we usually want *some* chat active.
      // If we have 0 conversations, startNewConversation is called by logic elsewhere?
    }
  }, [activeConversationId, activeConversation?.id]); // Depend on ID to trigger switch

  // Connect on mount - Wait, we should probably wait for a conversation to be active?
  // The original code connected on mount.
  // Now we want to connect to a specific chat.
  // We can let the effect above handle connection if we ensure there's an active convo.

  // Initial load logic:
  // If conversations exist, select first?
  // useConversationHistory doesn't auto-select in the new version (it initializes null).
  // We need an effect here to select one if null.

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    } else if (!activeConversationId && conversations.length === 0) {
      // No conversations, maybe create one?
      // Let's rely on user clicking "+" or auto-create?
      // Better UX: Auto-create if empty list loaded.
      // But we need to wait for loading state.
      // For now, let's just let the empty state in Chat View show.
    }
  }, [conversations, activeConversationId, selectConversation]);

  // Remove the simple onMount connect since we want to drive it by activeConversationId
  /* 
  useEffect(() => {
    chat.connect(); 
  }, []);
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, [messages]);

  const handleChatScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      // Find the last message that actually has an emotion set
      // (assistant placeholder messages may not have one yet)
      const lastWithEmotion = [...messages].reverse().find(m => m.emotion);
      if (lastWithEmotion) {
        setEmotion(lastWithEmotion.emotion);
      }
    } else {
      setEmotion('neutral');
    }
  }, [messages]);

  useEffect(() => {
    if (!autoSpeak || !settings.soundEnabled) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id !== lastAssistantMsgRef.current) {
      lastAssistantMsgRef.current = lastMessage.id;
      // Wait for stream to finish or simple debounce? 
      // With streaming, this might speak too early. 
      // For now, let's keep it simple, or maybe only speak if not typing?
      // The socket hook updates 'isTyping' to false when response is done.
      if (!chat.isTyping) {
        setTimeout(() => {
          speechSynthesis.speak(lastMessage.content);
        }, 100);
      }
    }
  }, [messages, autoSpeak, settings.soundEnabled, speechSynthesis, chat.isTyping]);

  // Sync WebSocket messages to Local History for Insights
  const lastSyncedMsgId = useRef(null);
  useEffect(() => {
    if (messages.length === 0) return;

    // Get the last message
    const lastMsg = messages[messages.length - 1];

    // If we haven't synced this message yet
    if (lastMsg.id !== lastSyncedMsgId.current) {
      // Ensure we have an active conversation to add to
      if (!activeConversationId) {
        startNewConversation();
      }

      // Add to history
      addMessage(lastMsg);
      lastSyncedMsgId.current = lastMsg.id;
    }
  }, [messages, activeConversationId, startNewConversation, addMessage]);

  const handleNewConversation = useCallback(() => {
    speechSynthesis.cancel();
    chat.clearHistory(); // Clear backend memory
    startNewConversation(); // Create new local session
    setEmotion('neutral');
  }, [chat, speechSynthesis, startNewConversation]);

  const sendMessage = useCallback(async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || chat.isTyping) return;

    speechSynthesis.cancel();

    // Capture current frame for fusion
    const frame = camera.captureFrame();

    // Send to backend
    chat.sendMessage(textToSend, frame);

    setInput('');
    // isTyping is handled by chat hook
  }, [input, chat, camera, speechSynthesis]);

  const handleQuickReply = useCallback((reply) => {
    sendMessage(reply);
  }, [sendMessage]);

  return (
    <div className="min-h-screen bg-background cursor-none">
      <CustomCursor />
      <BreathingExercise isOpen={breathingOpen} onClose={() => setBreathingOpen(false)} />

      <CameraFeed
        videoRef={camera.videoRef}
        isEnabled={camera.isEnabled}
        onToggle={camera.toggleCamera}
        error={camera.error}
        detectedEmotion={camera.detectedEmotion}
        isDetecting={camera.isDetecting}
      />

      <div className="h-screen flex p-2 sm:p-4 gap-2 sm:gap-4">
        <div className="hidden md:block">
          <ConversationHistory
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
            onClearAll={clearAllConversations}
            onRenameConversation={renameConversation}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="glass-card rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 overflow-visible relative z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MiniAILogo size={40} />
                <div>
                  <h1 className="text-lg font-bold text-primary">Emotion AI</h1>
                  <p className="text-xs text-muted-foreground">Healthcare Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sheet open={historyOpen} onOpenChange={(open) => {
                  if (open && navigator.vibrate) navigator.vibrate(10);
                  setHistoryOpen(open);
                }}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigator.vibrate?.(5)} className="h-9 w-9 rounded-lg text-muted-foreground flex md:hidden active:scale-95 transition-transform" aria-label="Open history">
                      <History className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Conversation History</SheetTitle>
                      <SheetDescription>Access your past conversations</SheetDescription>
                    </SheetHeader>
                    <ConversationHistory
                      conversations={conversations}
                      activeConversationId={activeConversationId}
                      onSelectConversation={(id) => { navigator.vibrate?.(5); selectConversation(id); setHistoryOpen(false); }}
                      onNewConversation={() => { navigator.vibrate?.(5); handleNewConversation(); setHistoryOpen(false); }}
                      onDeleteConversation={deleteConversation}
                      onClearAll={clearAllConversations}
                      onRenameConversation={renameConversation}
                    />
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                  <span className="text-xl">{EMOTION_EMOJIS[emotion]}</span>
                  <span className="text-sm capitalize hidden sm:inline">{emotion}</span>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setShowToolbar(!showToolbar)} className={`h-9 w-9 rounded-lg transition-colors ${showToolbar ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`} aria-label="Toggle tools">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                <SettingsDrawer
                  currentTheme={theme}
                  onThemeChange={setTheme}
                  cameraOn={camera.isEnabled}
                  onCameraToggle={camera.toggleCamera}
                  voices={speechSynthesis.voices}
                  selectedVoiceURI={selectedVoiceURI}
                  onVoiceChange={setSelectedVoiceURI}
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                />
              </div>
            </div>

            <AnimatePresence>
              {showToolbar && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                      <TabsList className="bg-secondary/50">
                        <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary/20"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Chat</span></TabsTrigger>
                        <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary/20"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Insights</span></TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="w-px h-6 bg-border/50" />
                    {speechSynthesis.isSupported && (
                      <Button variant="ghost" size="icon" onClick={() => setAutoSpeak(!autoSpeak)} className={`h-9 w-9 rounded-lg ${autoSpeak ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`} aria-label={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}>
                        {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setBreathingOpen(true)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-primary/20 hover:text-primary" aria-label="Open breathing exercise">
                      <Wind className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>
          {activeTab === 'chat' ? (
            <>
              <div
                ref={(el) => {
                  if (pullToRefresh.containerRef) pullToRefresh.containerRef.current = el;
                  chatContainerRef.current = el;
                }}
                onScroll={handleChatScroll}
                className="relative z-0 flex-1 overflow-y-auto glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 sm:mb-4 scrollbar-thin"
                style={{
                  transform: pullToRefresh.pullDistance > 0 ? `translateY(${pullToRefresh.pullDistance}px)` : undefined,
                  transition: pullToRefresh.pullDistance === 0 ? 'transform 0.2s ease-out' : undefined,
                }}
              >
                <PullToRefreshIndicator pullDistance={pullToRefresh.pullDistance} isRefreshing={pullToRefresh.isRefreshing} progress={pullToRefresh.progress} shouldRefresh={pullToRefresh.shouldRefresh} />
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <RobotMascot size={120} />
                    <h3 className="text-xl font-semibold mb-2 text-primary select-none">Welcome to Emotion AI</h3>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <SwipeableChatMessage key={msg.id} message={msg} speechSynthesis={speechSynthesis} onDelete={(id) => { deleteMessage(id, index); chat.setMessages(prev => prev.map(m => m.id === id ? { ...m, deleted: true } : m)); }} onFavorite={(id) => { apiService.toggleLikeMessage(activeConversationId, index).catch(console.error); chat.setMessages(prev => prev.map(m => m.id === id ? { ...m, liked: !m.liked } : m)); }} isFavorited={!!msg.liked} isNew={msg.id === newestMessageId && msg.role === 'assistant'} />
                    ))}
                    {chat.isTyping && (
                      <div className="flex gap-1.5 p-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
                <ScrollToBottomButton visible={showScrollButton} onClick={scrollToBottom} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(!showSuggestions)} className={`gap-2 ${showSuggestions ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                  <Lightbulb className="h-4 w-4" /><span className="text-xs">Suggestions</span>
                </Button>
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <QuickReplies emotion={emotion} onSelect={handleQuickReply} disabled={chat.isTyping} />
                  </motion.div>
                )}
              </AnimatePresence>

              <VoiceChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage()}
                onStop={chat.stopGeneration}
                isGenerating={chat.isTyping}
                disabled={chat.isTyping && !chat.isTyping /* logic fix: we want input disabled but button enabled? No, wait. VoiceChatInput handles disabling internally for the text area. The onStop button should remain enabled. */}
                placeholder="Type or speak your message..."
              />
            </>
          ) : (
            <div className="relative z-0 flex-1 overflow-hidden glass-card rounded-xl sm:rounded-2xl">
              <EmotionDashboard conversations={conversations} messages={messages} />
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab={mobileTab} onTabChange={(tab) => { setMobileTab(tab); if (tab === 'history') setHistoryOpen(true); else if (tab === 'settings') setSettingsOpen(true); }} />

      {/* Duplicate Sheet removed, simplified bottom nav handler */}

      <div className="h-20 md:hidden" />
    </div>
  );
};

export default Index;
