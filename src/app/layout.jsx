import { APP_CONFIG } from "@/constants/appConfig";
import "./globals.css";
import ReduxProvider from "@/components/common/ReduxProvider";
import { DialogProvider } from "@/context/DialogContext";
import { Toaster } from "sonner";

export const metadata = {
  title: APP_CONFIG.metaTitle,
  description: APP_CONFIG.metaDescription,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-zinc-50 antialiased text-zinc-700">
        <ReduxProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
        </ReduxProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
