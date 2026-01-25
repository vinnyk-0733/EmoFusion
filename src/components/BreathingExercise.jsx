import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BREATHING_PATTERNS = [
  {
    name: '4-7-8 Relaxing',
    description: 'Calming technique for anxiety and sleep',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 7 },
      { phase: 'exhale', duration: 8 },
    ],
    cycles: 4,
  },
  {
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus and calm',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'rest', duration: 4 },
    ],
    cycles: 4,
  },
  {
    name: 'Calming Breath',
    description: 'Simple technique for quick relief',
    phases: [
      { phase: 'inhale', duration: 4 },
      { phase: 'exhale', duration: 6 },
    ],
    cycles: 6,
  },
];

const PHASE_INSTRUCTIONS = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  rest: 'Rest',
};

const PHASE_COLORS = {
  inhale: 'from-blue-400 to-cyan-400',
  hold: 'from-purple-400 to-indigo-400',
  exhale: 'from-teal-400 to-green-400',
  rest: 'from-amber-400 to-orange-400',
};

const BreathingExercise = ({ isOpen, onClose }) => {
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentPhase = selectedPattern.phases[currentPhaseIndex];

  const resetExercise = useCallback(() => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setCurrentCycle(1);
    setTimeLeft(selectedPattern.phases[0].duration);
    setIsComplete(false);
  }, [selectedPattern]);

  const startExercise = useCallback(() => {
    resetExercise();
    setIsActive(true);
    setTimeLeft(selectedPattern.phases[0].duration);
  }, [resetExercise, selectedPattern]);

  const togglePause = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhaseIndex = currentPhaseIndex + 1;
          
          if (nextPhaseIndex >= selectedPattern.phases.length) {
            // Completed one cycle
            if (currentCycle >= selectedPattern.cycles) {
              // All cycles complete
              setIsActive(false);
              setIsComplete(true);
              return 0;
            }
            // Start next cycle
            setCurrentCycle((c) => c + 1);
            setCurrentPhaseIndex(0);
            return selectedPattern.phases[0].duration;
          }
          
          setCurrentPhaseIndex(nextPhaseIndex);
          return selectedPattern.phases[nextPhaseIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isComplete, currentPhaseIndex, currentCycle, selectedPattern]);

  useEffect(() => {
    if (isOpen) {
      resetExercise();
    }
  }, [isOpen, resetExercise]);

  useEffect(() => {
    setTimeLeft(selectedPattern.phases[0].duration);
  }, [selectedPattern]);

  const getCircleScale = () => {
    if (!isActive && !isComplete) return 1;
    if (currentPhase.phase === 'inhale') return 1.4;
    if (currentPhase.phase === 'exhale') return 0.8;
    return 1;
  };

  const progress = isActive 
    ? (currentPhase.duration - timeLeft) / currentPhase.duration 
    : 0;

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4 p-6 rounded-2xl bg-card border border-border shadow-2xl"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-4 right-4 z-10"
            >
              <X className="w-5 h-5" />
            </Button>

            <h2 className="text-2xl font-bold text-foreground mb-2">Breathing Exercise</h2>
            <p className="text-muted-foreground mb-6">Take a moment to relax and center yourself</p>

            {/* Pattern Selection */}
            {!isActive && !isComplete && (
              <div className="flex flex-wrap gap-2 mb-8">
                {BREATHING_PATTERNS.map((pattern) => (
                  <button
                    key={pattern.name}
                    onClick={() => setSelectedPattern(pattern)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedPattern.name === pattern.name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {pattern.name}
                  </button>
                ))}
              </div>
            )}

            {/* Breathing Circle Animation */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer ring progress */}
                <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/30"
                  />
                  {isActive && (
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="text-primary"
                      strokeDasharray={565}
                      strokeDashoffset={565 * (1 - progress)}
                      transition={{ duration: 0.1 }}
                    />
                  )}
                </svg>

                {/* Breathing circle */}
                <motion.div
                  animate={{
                    scale: getCircleScale(),
                  }}
                  transition={{
                    duration: currentPhase?.duration || 1,
                    ease: 'easeInOut',
                  }}
                  className={`w-32 h-32 rounded-full bg-gradient-to-br ${
                    isActive ? PHASE_COLORS[currentPhase.phase] : 'from-primary/50 to-primary'
                  } shadow-lg flex items-center justify-center`}
                >
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm"
                  />
                </motion.div>
              </div>

              {/* Phase instruction */}
              <motion.div
                key={`${currentPhaseIndex}-${currentCycle}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                {isComplete ? (
                  <>
                    <p className="text-2xl font-semibold text-primary">Well Done! 🎉</p>
                    <p className="text-muted-foreground mt-2">You completed the exercise</p>
                  </>
                ) : isActive ? (
                  <>
                    <p className="text-3xl font-bold text-foreground">{PHASE_INSTRUCTIONS[currentPhase.phase]}</p>
                    <p className="text-4xl font-mono text-primary mt-2">{timeLeft}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cycle {currentCycle} of {selectedPattern.cycles}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-foreground">{selectedPattern.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPattern.description}</p>
                  </>
                )}
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-4">
              {isComplete ? (
                <Button onClick={resetExercise} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              ) : isActive ? (
                <>
                  <Button variant="outline" onClick={togglePause} className="gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                  <Button variant="destructive" onClick={resetExercise} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </>
              ) : (
                <Button onClick={startExercise} size="lg" className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Exercise
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreathingExercise;
