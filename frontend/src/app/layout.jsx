import '@/index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'EmoFusion - Emotion-Aware AI Healthcare Assistant',
  description: 'Multimodal emotion recognition with context-aware AI companion',
  icons: {
    icon: '/vite.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

