import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/provider';
export const metadata: Metadata = { title:'STAMPED — Go out. Get into it.',description:'Find real-world experiences and make room for them in your plan.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html> }
