import { useRef, useState } from 'react';
import { motion, useDragControls, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Camera, CameraOff, Move, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOTION_EMOJIS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fear: '😨',
  surprise: '😲',
  neutral: '😐',
  disgust: '🤢',
};

const EMOTION_COLORS = {
  happy: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  sad: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  angry: 'bg-red-500/20 text-red-500 border-red-500/30',
  fear: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  surprise: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  neutral: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  disgust: 'bg-green-500/20 text-green-500 border-green-500/30',
};

const CameraFeed = ({
  videoRef,
  isEnabled,
  onToggle,
  error,
  detectedEmotion,
  isDetecting,
}) => {
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();
  const [isMinimized, setIsMinimized] = useState(true);
  const [size, setSize] = useState({ width: 288, height: 216 }); // Default 4:3ish aspect ratio

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[60]" />

      <LayoutGroup>
        <motion.div
          layout
          drag
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragElastic={0.05}
          dragMomentum={false}
          initial={{ x: 20, y: 20 }}
          animate={{
            width: isMinimized ? 56 : size.width,
            height: isMinimized ? 56 : size.height,
          }}
          transition={{
            layout: { type: 'spring', stiffness: 300, damping: 30 },
            width: { type: 'spring', stiffness: 300, damping: 30 },
            height: { type: 'spring', stiffness: 300, damping: 30 },
          }}
          className="fixed z-[70] pointer-events-auto flex flex-col"
          style={{ touchAction: 'none' }}
        >
          <motion.div
            layout
            className="glass-card overflow-hidden h-full flex flex-col relative"
            animate={{
              borderRadius: isMinimized ? 28 : 16,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <motion.div
              layout="position"
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between p-2 bg-secondary/30 cursor-move flex-shrink-0"
            >
              <AnimatePresence mode="wait">
                {!isMinimized ? (
                  <motion.div
                    key="expanded-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Move className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Camera</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsMinimized(true)}
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={onToggle}
                      >
                        {isEnabled ? <Camera className="h-3 w-3" /> : <CameraOff className="h-3 w-3" />}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="minimized-header"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="w-full flex justify-center"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setIsMinimized(false)}
                    >
                      {detectedEmotion ? (
                        <motion.span
                          className="text-lg"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          {EMOTION_EMOJIS[detectedEmotion.emotion]}
                        </motion.span>
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Video Feed */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex-1 bg-background/50 overflow-hidden"
                >
                  {isEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />

                      {/* Detected emotion overlay */}
                      <AnimatePresence>
                        {detectedEmotion && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-2 left-2 right-2"
                          >
                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border backdrop-blur-sm ${EMOTION_COLORS[detectedEmotion.emotion]}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{EMOTION_EMOJIS[detectedEmotion.emotion]}</span>
                                <span className="text-xs font-medium capitalize">
                                  {detectedEmotion.emotion}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {isDetecting && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                <span className="text-xs opacity-75">
                                  {Math.round(detectedEmotion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <CameraOff className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {error || 'Camera off'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggle}
                        className="mt-2"
                      >
                        Enable Camera
                      </Button>
                    </div>
                  )}

                  {isEnabled && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-destructive"
                      />
                      <span className="text-xs font-medium text-foreground">LIVE</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* Resize Handle */}
            {!isMinimized && (
              <motion.div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center opacity-50 hover:opacity-100"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = size.width;
                  const startHeight = size.height;

                  const handlePointerMove = (moveEvent) => {
                    const newWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)));
                    const newHeight = Math.max(150, Math.min(450, startHeight + (moveEvent.clientY - startY)));
                    setSize({ width: newWidth, height: newHeight });
                  };

                  const handlePointerUp = () => {
                    document.removeEventListener('pointermove', handlePointerMove);
                    document.removeEventListener('pointerup', handlePointerUp);
                  };

                  document.addEventListener('pointermove', handlePointerMove);
                  document.addEventListener('pointerup', handlePointerUp);
                }}
              >
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-muted-foreground/50 border-r-[6px] border-r-transparent rotate-45 transform translate-x-[-2px] translate-y-[-2px]" />
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="absolute bottom-1 right-1 pointer-events-none">
                  <path d="M10 10L0 10L10 0L10 10Z" fill="currentColor" className="text-muted-foreground" />
                </svg>
              </motion.div>
            )}
          </motion.div>


        </motion.div>
      </LayoutGroup >
    </>
  );
};

export default CameraFeed;
