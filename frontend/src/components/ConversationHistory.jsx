'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  MoreVertical,
  Pencil,
  X,
  Check,
  Camera as CameraIcon,
  CameraOff,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const EMOTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  neutral: '😐',
  disgust: '🤢',
};

const ConversationHistory = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAll,
  onRenameConversation,
  camera,
  className = ''
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatChatDate = (dateVal) => {
    if (!dateVal) return 'Just now';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recently';
      return format(d, 'MMM d, h:mm a');
    } catch {
      return 'Recently';
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col w-72 lg:w-80 h-full rounded-[28px] p-4 transition-all duration-300 select-none',
        'bg-[#ebf0f7] dark:bg-[#151922]',
        'shadow-[10px_10px_24px_rgba(166,180,200,0.42),-10px_-10px_24px_rgba(255,255,255,0.95)]',
        'dark:shadow-[10px_10px_26px_rgba(8,10,16,0.8),-8px_-8px_20px_rgba(35,42,58,0.35)]',
        className
      )}
    >
      {/* ─── Top Brand Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Healthcare Heart & Cross Emblem Badge */}
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#ffffff] dark:bg-[#1a202c] shadow-[3px_3px_8px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_8px_rgba(8,10,16,0.7),-2px_-2px_6px_rgba(38,48,68,0.3)]">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-teal-500"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7v6M9 10h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              EmoFusion
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Emotion Healthcare Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            onClick={onNewConversation}
            title="Start New Chat"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f4f9] dark:bg-[#1a202c] text-teal-600 dark:text-teal-400 shadow-[2px_2px_6px_rgba(166,180,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_6px_rgba(8,10,16,0.7),-1px_-1px_4px_rgba(38,48,68,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* ─── Chat History List ────────────────────────────────────────── */}
      <ScrollArea className="flex-1 pr-1 -mr-1 scrollbar-soft">
        <div className="space-y-2 py-1">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40 text-teal-500" />
              <p className="text-xs font-medium">No conversations yet</p>
              <button
                onClick={onNewConversation}
                className="mt-3 px-3 py-1.5 text-xs rounded-full bg-teal-500 text-white font-medium shadow-sm hover:bg-teal-600 transition-colors"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              const emotionEmoji = EMOTION_EMOJIS[conv.dominantEmotion] || '💬';

              return (
                <div
                  key={conv.id}
                  onClick={() => editingId !== conv.id && onSelectConversation(conv.id)}
                  className={cn(
                    'group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-[#d0f4ec] to-[#e4faf6] dark:from-[#134e4a]/70 dark:to-[#0f3d3a]/70 border border-teal-400/40 shadow-[4px_4px_10px_rgba(166,180,200,0.35),-3px_-3px_8px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_12px_rgba(8,10,16,0.7)]'
                      : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  )}
                >
                  {/* Chat Icon Badge */}
                  {isActive ? (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white shadow-sm">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 text-base">
                      {emotionEmoji}
                    </div>
                  )}

                  {/* Title & Timestamp */}
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="h-7 text-xs bg-white dark:bg-slate-800"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-teal-600"
                          onClick={saveEdit}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p
                          className={cn(
                            'text-sm font-semibold truncate',
                            isActive
                              ? 'text-teal-950 dark:text-teal-100'
                              : 'text-slate-700 dark:text-slate-200'
                          )}
                        >
                          {conv.title || 'New Chat'}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatChatDate(conv.updatedAt)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rename / Delete Menu */}
                  {editingId !== conv.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg"
                      >
                        <DropdownMenuItem
                          onClick={() => startEditing(conv)}
                          className="text-xs cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs text-rose-500 focus:text-rose-500 cursor-pointer"
                          onClick={() => onDeleteConversation(conv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* ─── Bottom Integrated Camera Section ────────────────────────── */}
      {camera && (
        <div className="pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CameraIcon className="h-3.5 w-3.5 text-teal-500" />
              <span>Camera</span>
            </div>
            <button
              onClick={() => camera.toggleCamera()}
              title="Expand Camera"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Inset Camera Box */}
          <div
            className={cn(
              'relative w-full h-32 rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all',
              'bg-[#e2e8f0]/60 dark:bg-[#11141c]',
              'shadow-[inset_3px_3px_6px_rgba(166,180,200,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.85)]',
              'dark:shadow-[inset_3px_3px_7px_rgba(8,10,16,0.8),inset_-3px_-3px_6px_rgba(35,42,58,0.25)]'
            )}
          >
            {camera.isEnabled ? (
              <>
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />
                {camera.detectedEmotion && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-sm text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <span>{EMOTION_EMOJIS[camera.detectedEmotion.emotion] || '●'}</span>
                    <span className="capitalize">{camera.detectedEmotion.emotion}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
                <CameraOff className="h-6 w-6 stroke-[1.5]" />
                <span className="text-[11px] font-medium">Camera Off</span>
              </div>
            )}
          </div>

          {/* Enable / Disable Camera Pill Button */}
          <button
            onClick={() => camera.toggleCamera()}
            className={cn(
              'w-full mt-2.5 py-2 px-4 rounded-full font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200',
              'hover:scale-[1.02] active:scale-[0.98]',
              camera.isEnabled
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                : 'bg-gradient-to-r from-[#6ee7b7] via-[#2dd4bf] to-[#38bdf8] text-slate-900 shadow-[0_4px_14px_rgba(45,212,191,0.45)]'
            )}
          >
            <span>{camera.isEnabled ? '⏹ Disable Camera' : '▶ Enable Camera'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default ConversationHistory;
