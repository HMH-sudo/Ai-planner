import './globals.css';

export const metadata = {
  title: 'Maintenance AI Planner',
  description: 'Live maintenance planner dashboard MVP',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
