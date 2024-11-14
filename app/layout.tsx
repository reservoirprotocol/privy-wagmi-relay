import '../styles/globals.css';
import '@reservoir0x/relay-kit-ui/styles.css';

import Providers from 'components/providers';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
