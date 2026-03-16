import { motion } from 'framer-motion';

const EMOTION_COLORS = {
  happy: 'var(--emotion-happy)',
  sad: 'var(--emotion-sad)',
  angry: 'var(--emotion-angry)',
  fear: 'var(--emotion-fear)',
  surprise: 'var(--emotion-surprise)',
  neutral: 'var(--emotion-neutral)',
  disgust: 'var(--emotion-disgust)',
};

const Background3D = ({ emotion }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: 'var(--gradient-background)' }}
      />
      
      {/* Animated orbs */}
      <motion.div
        key={`orb1-${emotion}`}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{ background: `hsl(${EMOTION_COLORS[emotion]})` }}
      />
      
      <motion.div
        key={`orb2-${emotion}`}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: 'hsl(var(--primary))' }}
      />
      
      <motion.div
        key={`orb3-${emotion}`}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: 'hsl(var(--accent))' }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
        />
      ))}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

export default Background3D;
