import { APP_CONFIG } from "@/constants/appConfig";
import "./globals.css";
import ReduxProvider from "@/components/common/ReduxProvider";

export const metadata = {
  title: APP_CONFIG.metaTitle,
  description: APP_CONFIG.metaDescription,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-zinc-50 antialiased text-zinc-700">
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
