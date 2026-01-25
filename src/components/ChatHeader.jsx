import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles, Shield, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import EmotionIndicator from './EmotionIndicator';
import ThemeSwitcher from './ThemeSwitcher';
import { Button } from '@/components/ui/button';

const ConnectionStatus = ({ 
  isConnected, 
  isConnecting,
  onReconnect,
}) => {
  if (isConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Connecting</span>
      </motion.div>
    );
  }

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Wifi className="w-3 h-3" />
        </motion.div>
        <span className="hidden sm:inline">Connected</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
    >
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs">
        <WifiOff className="w-3 h-3" />
        <span className="hidden sm:inline">Offline</span>
      </div>
      {onReconnect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className="h-6 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Reconnect</span>
        </Button>
      )}
    </motion.div>
  );
};

const ChatHeader = ({ 
  emotion, 
  mentalState,
  emotionConfidence,
  theme, 
  onThemeChange,
  isConnected = false,
  isConnecting = false,
  onReconnect,
}) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative glass-card rounded-t-3xl border-b border-border/30 overflow-hidden emotion-glow-${emotion}`}
    >
      {/* Animated background glow */}
      <motion.div
        key={emotion}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, hsl(var(--emotion-${emotion}) / 0.3), transparent 70%)`,
        }}
      />

      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and title */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center neon-glow">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Emotion AI</h1>
              <p className="text-xs text-muted-foreground">Healthcare Assistant</p>
            </div>
          </div>

          {/* Center: Emotion indicator with mental state */}
          <div className="flex items-center gap-4">
            <motion.div
              key={`${emotion}-${mentalState}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl emotion-bg emotion-bg-${emotion}`}
            >
              <div className="relative">
                <EmotionIndicator emotion={emotion} size="md" />
                {emotionConfidence !== undefined && emotionConfidence > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[28px] text-center"
                  >
                    {Math.round(emotionConfidence * 100)}%
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Detected</span>
                <span className="text-sm font-medium capitalize">{emotion}</span>
                {mentalState && (
                  <motion.span 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-primary font-medium"
                  >
                    {mentalState}
                  </motion.span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Connection status, Theme switcher and indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} onReconnect={onReconnect} />
            <div className="hidden md:flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Active</span>
              </motion.div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
            </div>
            <ThemeSwitcher currentTheme={theme} onThemeChange={onThemeChange} />
          </div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <Heart className="w-3 h-3 text-destructive" />
          <span>For emotional support only. Not a substitute for professional medical advice.</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
