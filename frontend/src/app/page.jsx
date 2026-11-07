'use client';

import dynamic from 'next/dynamic';

// Dynamically import Index page with SSR disabled because it accesses browser APIs
// (navigator.mediaDevices camera stream, Web Speech API, Canvas, and WebSocket)
const IndexPage = dynamic(() => import('@/views/Index'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading EmoFusion...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <IndexPage />;
}

