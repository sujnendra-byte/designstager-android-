// The AI tools. Until each tool has its own native screen it opens the website page inside the app,
// already logged in (Stage 2 and 3 replace these one by one).
import { Ionicons } from '@expo/vector-icons';

export type Tool = {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  path: string;
};

export const TOOLS: Tool[] = [
  { id: 'ppt', title: 'AI Presentation', sub: 'Full decks from a topic', icon: 'easel-outline', tint: '#e7552f', bg: '#fde7df', path: '/ai-presentation/' },
  { id: 'doc', title: 'AI Document', sub: 'Word reports & docs', icon: 'document-text-outline', tint: '#2f6fe7', bg: '#e1ebfd', path: '/ai-document/' },
  { id: 'charts', title: 'AI Charts', sub: 'Charts from your numbers', icon: 'bar-chart-outline', tint: '#16a34a', bg: '#dcf5e4', path: '/ai-charts/' },
  { id: 'images', title: 'AI Images', sub: 'Generate any picture', icon: 'image-outline', tint: '#8b5cf6', bg: '#ede7fe', path: '/ai-studio/' },
  { id: 'video', title: 'AI Video', sub: 'Short videos from text', icon: 'videocam-outline', tint: '#db2777', bg: '#fce4ef', path: '/ai-video/' },
  { id: 'audio', title: 'AI Audio & Voice', sub: 'Speech, music, voice clone', icon: 'mic-outline', tint: '#d97706', bg: '#fdf0d9', path: '/ai-studio/ai-audio/' },
];
