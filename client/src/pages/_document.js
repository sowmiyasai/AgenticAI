import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        {/* Tailwind CSS CDN for instant styling across all environments */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      background: '#090d16',
                      foreground: '#f8fafc',
                      primary: {
                        DEFAULT: '#6366f1',
                        hover: '#4f46e5',
                      },
                      agent: {
                        planner: '#8b5cf6',
                        execution: '#3b82f6',
                        validation: '#f59e0b',
                        recovery: '#10b981',
                        monitoring: '#06b6d4',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
