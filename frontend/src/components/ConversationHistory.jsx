import { useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Plus, Trash2, Clock, ChevronLeft, ChevronRight, MoreVertical, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const EMOTION_EMOJIS = { happy: '😊', sad: '😢', angry: '😠', fear: '😨', surprise: '😲', neutral: '😐', disgust: '🤢' };

const ConversationHistory = ({ conversations, activeConversationId, onSelectConversation, onNewConversation, onDeleteConversation, onClearAll, onRenameConversation }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (conv) => { setEditingId(conv.id); setEditTitle(conv.title); };
  const saveEdit = () => { if (editingId && editTitle.trim()) onRenameConversation(editingId, editTitle.trim()); setEditingId(null); setEditTitle(''); };
  const cancelEdit = () => { setEditingId(null); setEditTitle(''); };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-2 glass-card rounded-2xl h-full w-14">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="mb-4"><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onNewConversation} className="mb-2"><Plus className="h-4 w-4" /></Button>
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          {conversations.slice(0, 8).map((conv) => (
            <Button key={conv.id} variant="ghost" size="icon" onClick={() => onSelectConversation(conv.id)} className={cn("w-10 h-10", activeConversationId === conv.id && "bg-primary/20")}>
              <span className="text-lg">{EMOTION_EMOJIS[conv.dominantEmotion]}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col glass-card rounded-2xl h-full w-72">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />History</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewConversation} className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="py-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No conversations yet</p><p className="text-xs mt-1">Start a new chat to begin</p></div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className={cn("group relative flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all", activeConversationId === conv.id ? "bg-primary/20 border border-primary/30" : "hover:bg-secondary/50 border border-transparent")} onClick={() => editingId !== conv.id && onSelectConversation(conv.id)}>
                <span className="text-xl flex-shrink-0">{EMOTION_EMOJIS[conv.dominantEmotion]}</span>
                <div className="flex-1 min-w-0">
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} className="h-7 text-sm" autoFocus />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate text-foreground">{conv.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /><span>{format(new Date(conv.updatedAt), 'MMM d, h:mm a')}</span></div>
                    </>
                  )}
                </div>
                {editingId !== conv.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                      <DropdownMenuItem onClick={() => startEditing(conv)}><Pencil className="h-4 w-4 mr-2" />Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteConversation(conv.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
