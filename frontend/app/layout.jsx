import './globals.css';

export const metadata = {
  title: 'AI-SBOM - Security Platform & Model Supply Chain',
  description: 'Real-time multi-layer AI security firewall, adversarial prompt detection, and cryptographic SBOM supply-chain analysis.',
  icons: {
    icon: '/AIONLYLOGO-removebg-preview.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/AIONLYLOGO-removebg-preview.png" />
      </head>
      <body className="platform-app-body">
        {children}
      </body>
    </html>
  );
}
