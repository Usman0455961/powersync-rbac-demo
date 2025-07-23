// app/layout.tsx
import { PowerSyncSetup } from '@/app/library/powersync/PowerSyncSetup';
import './globals.css'; // Your CSS file

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PowerSyncSetup>
          {children}
        </PowerSyncSetup>
      </body>
    </html>
  );
}