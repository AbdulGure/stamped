import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'STAMPED — Go out. Get into it.',description:'Find real-world experiences and make room for them in your plan.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
