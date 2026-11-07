'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  Heart,
  MessageSquare,
  BarChart3,
  Volume2,
  VolumeX,
  Wind,
  MoreHorizontal,
  Lightbulb,
  History,
  Sun,
  Moon,
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SettingsDrawer from '@/components/SettingsDrawer';
import ConversationHistory from '@/components/ConversationHistory';
import VoiceChatInput from '@/components/VoiceChatInput';
import EmotionDashboard from '@/components/EmotionDashboard';
import SwipeableChatMessage from '@/components/SwipeableChatMessage';
import QuickReplies from '@/components/QuickReplies';
import BreathingExercise from '@/components/BreathingExercise';
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
import MiniAILogo from '@/components/MiniAILogo';
import { cn } from '@/lib/utils';

const EMOTION_STATUS_MAP = {
  happy: { label: 'Happy', color: 'bg-emerald-500 text-emerald-600', dot: 'bg-emerald-500' },
  sad: { label: 'Sad', color: 'bg-sky-500 text-sky-600', dot: 'bg-sky-500' },
  angry: { label: 'Stressed', color: 'bg-rose-500 text-rose-600', dot: 'bg-rose-500' },
  fear: { label: 'Anxious', color: 'bg-purple-500 text-purple-600', dot: 'bg-purple-500' },
  surprise: { label: 'Surprised', color: 'bg-amber-500 text-amber-600', dot: 'bg-amber-500' },
  neutral: { label: 'Neutral', color: 'bg-emerald-500 text-emerald-600', dot: 'bg-emerald-500' },
  disgust: { label: 'Discomfort', color: 'bg-teal-500 text-teal-600', dot: 'bg-teal-500' },
};

const Index = () => {
  const [input, setInput] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [activeTab, setActiveTab] = useState('chat');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef(null);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [newestMessageId, setNewestMessageId] = useState(null);

  const { theme, setTheme, toggleLightDark, isDark } = useTheme();
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

  const {
    conversations,
    activeConversationId,
    activeConversation,
    startNewConversation,
    addMessage,
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
    await new Promise(resolve => setTimeout(resolve, 800));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
  });

  const messages = chat.messages;

  // Restore history when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      if (activeConversation.messages) {
        chat.restoreMessages(activeConversation.messages);
      } else {
        chat.setMessages([]);
      }

      if (chat.isConnected && chat.currentSessionId === activeConversation.id) {
        // already connected to this session
      } else {
        chat.connect(activeConversation.id);
      }
    }
  }, [activeConversationId, activeConversation?.id]);

  // Initial load selection
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, activeConversationId, selectConversation]);

  // Auto scroll
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

  // Update current emotion from last message
  useEffect(() => {
    if (messages.length > 0) {
      const lastWithEmotion = [...messages].reverse().find(m => m.emotion);
      if (lastWithEmotion) {
        setEmotion(lastWithEmotion.emotion);
      }
    } else {
      setEmotion('neutral');
    }
  }, [messages]);

  // Auto speak
  useEffect(() => {
    if (!autoSpeak || !settings.soundEnabled) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id !== lastAssistantMsgRef.current) {
      lastAssistantMsgRef.current = lastMessage.id;
      if (!chat.isTyping) {
        setTimeout(() => {
          speechSynthesis.speak(lastMessage.content);
        }, 100);
      }
    }
  }, [messages, autoSpeak, settings.soundEnabled, speechSynthesis, chat.isTyping]);

  // Sync to history
  const lastSyncedMsgId = useRef(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.id !== lastSyncedMsgId.current) {
      if (!activeConversationId) {
        startNewConversation();
      }
      addMessage(lastMsg);
      lastSyncedMsgId.current = lastMsg.id;
    }
  }, [messages, activeConversationId, startNewConversation, addMessage]);

  const handleNewConversation = useCallback(() => {
    speechSynthesis.cancel();
    chat.clearHistory();
    startNewConversation();
    setEmotion('neutral');
  }, [chat, speechSynthesis, startNewConversation]);

  const sendMessage = useCallback(async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || chat.isTyping) return;

    speechSynthesis.cancel();

    if (!activeConversationId && conversations.length === 0) {
      await startNewConversation();
    }

    const frame = camera.captureFrame();
    chat.sendMessage(textToSend, frame);
    setInput('');
  }, [input, chat, camera, speechSynthesis, activeConversationId, conversations.length, startNewConversation]);

  const handleQuickReply = useCallback((reply) => {
    sendMessage(reply);
  }, [sendMessage]);

  const emotionStatus = EMOTION_STATUS_MAP[emotion] || EMOTION_STATUS_MAP.neutral;

  return (
    <div className="min-h-screen bg-[#ebf0f7] dark:bg-[#121620] text-slate-800 dark:text-slate-100 cursor-none transition-colors duration-300">
      <CustomCursor />
      <BreathingExercise isOpen={breathingOpen} onClose={() => setBreathingOpen(false)} />

      {/* Main Responsive Grid Layout */}
      <div className="h-screen flex p-3 sm:p-5 gap-4 sm:gap-6 max-w-[1600px] mx-auto">
        {/* ─── Left Navigation Sidebar (Desktop) ────────────────────── */}
        <div className="hidden md:flex flex-shrink-0">
          <ConversationHistory
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
            onClearAll={clearAllConversations}
            onRenameConversation={renameConversation}
            camera={camera}
          />
        </div>

        {/* ─── Right Main Chat Column ───────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 h-full">
          {/* ─── Top Floating Neumorphic Header ─────────────────────── */}
          <header className="flex items-center justify-between px-5 py-3 rounded-[26px] mb-4 bg-[#f0f4f9] dark:bg-[#161a24] shadow-[6px_6px_18px_rgba(166,180,200,0.4),-6px_-6px_18px_rgba(255,255,255,0.95)] dark:shadow-[6px_6px_20px_rgba(8,10,16,0.75),-4px_-4px_14px_rgba(35,42,58,0.3)] transition-all select-none">
            {/* Robot Mascot & Title */}
            <div className="flex items-center gap-3">
              <MiniAILogo size={40} />
              <div>
                <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                  EmoFusion
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Emotion Healthcare Assistant
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Sidebar Trigger */}
              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <button
                    className="flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-[2px_2px_6px_rgba(166,180,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.7)] text-slate-600 dark:text-slate-300"
                    aria-label="Open History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 bg-transparent border-0 shadow-none">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Conversation History</SheetTitle>
                    <SheetDescription>Access your past conversations</SheetDescription>
                  </SheetHeader>
                  <ConversationHistory
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={(id) => { selectConversation(id); setHistoryOpen(false); }}
                    onNewConversation={() => { handleNewConversation(); setHistoryOpen(false); }}
                    onDeleteConversation={deleteConversation}
                    onClearAll={clearAllConversations}
                    onRenameConversation={renameConversation}
                    camera={camera}
                  />
                </SheetContent>
              </Sheet>

              {/* Status Emotion Pill: ● Neutral */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all',
                  'bg-[#ebf0f7] dark:bg-[#13161f]',
                  'shadow-[inset_2px_2px_5px_rgba(166,180,200,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]',
                  'dark:shadow-[inset_2px_2px_5px_rgba(8,10,16,0.7),inset_-1px_-1px_4px_rgba(35,42,58,0.25)]'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full animate-pulse', emotionStatus.dot)} />
                <span className="text-slate-700 dark:text-slate-200">{emotionStatus.label}</span>
              </div>

              {/* Quick Light ☀️ / Dark 🌙 Toggle */}
              <button
                onClick={toggleLightDark}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ffffff] dark:bg-[#1a202c] text-slate-700 dark:text-amber-400 shadow-[2px_2px_6px_rgba(166,180,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.7),-1px_-1px_4px_rgba(35,42,58,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* More Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    title="More Options"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ffffff] dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 shadow-[2px_2px_6px_rgba(166,180,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.7),-1px_-1px_4px_rgba(35,42,58,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5"
                >
                  <DropdownMenuItem
                    onClick={() => setActiveTab(activeTab === 'chat' ? 'dashboard' : 'chat')}
                    className="rounded-xl text-xs cursor-pointer py-2"
                  >
                    <BarChart3 className="h-4 w-4 mr-2.5 text-teal-500" />
                    <span>{activeTab === 'chat' ? 'View Emotion Insights' : 'Back to Chat'}</span>
                  </DropdownMenuItem>

                  {speechSynthesis.isSupported && (
                    <DropdownMenuItem
                      onClick={() => setAutoSpeak(!autoSpeak)}
                      className="rounded-xl text-xs cursor-pointer py-2"
                    >
                      {autoSpeak ? (
                        <>
                          <VolumeX className="h-4 w-4 mr-2.5 text-rose-500" />
                          <span>Mute Assistant Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 mr-2.5 text-teal-500" />
                          <span>Enable Assistant Voice</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setBreathingOpen(true)}
                    className="rounded-xl text-xs cursor-pointer py-2"
                  >
                    <Wind className="h-4 w-4 mr-2.5 text-sky-500" />
                    <span>Breathing Exercise</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleNewConversation}
                    className="rounded-xl text-xs cursor-pointer py-2 text-rose-500 focus:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2.5" />
                    <span>Clear Conversation</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings Gear Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                title="Open Settings"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ffffff] dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 shadow-[2px_2px_6px_rgba(166,180,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.7),-1px_-1px_4px_rgba(35,42,58,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
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
              </button>
            </div>
          </header>

          {/* ─── Main Viewport (Chat or Insights) ──────────────────── */}
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Messages Container */}
              <div
                ref={(el) => {
                  if (pullToRefresh.containerRef) pullToRefresh.containerRef.current = el;
                  chatContainerRef.current = el;
                }}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto px-4 py-4 rounded-[28px] mb-3 bg-transparent scrollbar-soft"
                style={{
                  transform: pullToRefresh.pullDistance > 0 ? `translateY(${pullToRefresh.pullDistance}px)` : undefined,
                  transition: pullToRefresh.pullDistance === 0 ? 'transform 0.2s ease-out' : undefined,
                }}
              >
                <PullToRefreshIndicator
                  pullDistance={pullToRefresh.pullDistance}
                  isRefreshing={pullToRefresh.isRefreshing}
                  progress={pullToRefresh.progress}
                  shouldRefresh={pullToRefresh.shouldRefresh}
                />

                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                    <MiniAILogo size={80} className="mb-4 shadow-xl" />
                    <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                      Welcome to EmoFusion
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
                      I&apos;m your multimodal emotional healthcare companion. Speak, type, or enable your camera to share how you feel.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-md">
                      {["Tell me a joke 😊", "I'm feeling a bit stressed", "How are you today?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="px-4 py-2 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-[3px_3px_8px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_8px_rgba(8,10,16,0.7)] hover:border-teal-400 hover:text-teal-600 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <SwipeableChatMessage
                        key={msg.id}
                        message={msg}
                        speechSynthesis={speechSynthesis}
                        onDelete={(id) => {
                          deleteMessage(id, index);
                          chat.setMessages(prev => prev.map(m => m.id === id ? { ...m, deleted: true } : m));
                        }}
                        onFavorite={(id) => {
                          apiService.toggleLikeMessage(activeConversationId, index).catch(console.error);
                          chat.setMessages(prev => prev.map(m => m.id === id ? { ...m, liked: !m.liked } : m));
                        }}
                        isFavorited={!!msg.liked}
                        isNew={msg.id === newestMessageId && msg.role === 'assistant'}
                      />
                    ))}

                    {/* Typing Animation */}
                    {chat.isTyping && (
                      <div className="flex items-center gap-3 mb-4">
                        <MiniAILogo size={32} />
                        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 shadow-[4px_4px_12px_rgba(166,180,200,0.35),-4px_-4px_12px_rgba(255,255,255,0.95)] dark:shadow-[4px_4px_14px_rgba(8,10,16,0.7)] flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
                <ScrollToBottomButton visible={showScrollButton} onClick={scrollToBottom} />
              </div>

              {/* ─── Floating Suggestions Row ──────────────────────── */}
              <QuickReplies
                emotion={emotion}
                onSelect={handleQuickReply}
                disabled={chat.isTyping}
              />

              {/* ─── Neumorphic Capsule Input Bar ──────────────────── */}
              <VoiceChatInput
                value={input}
                onChange={setInput}
                onSend={() => sendMessage()}
                onStop={chat.stopGeneration}
                isGenerating={chat.isTyping}
                disabled={chat.isTyping}
                placeholder="Type or speak your message..."
              />
            </div>
          ) : (
            /* Insights Dashboard View */
            <div className="flex-1 overflow-hidden rounded-[28px] p-4 bg-[#f0f4f9] dark:bg-[#161a24] shadow-[8px_8px_20px_rgba(166,180,200,0.38),-8px_-8px_20px_rgba(255,255,255,0.95)] dark:shadow-[8px_8px_22px_rgba(8,10,16,0.75)]">
              <EmotionDashboard conversations={conversations} messages={messages} />
            </div>
          )}
        </main>
      </div>

      <BottomNav
        activeTab={mobileTab}
        onTabChange={(tab) => {
          setMobileTab(tab);
          if (tab === 'history') setHistoryOpen(true);
          else if (tab === 'settings') setSettingsOpen(true);
        }}
      />
    </div>
  );
};

export default Index;
