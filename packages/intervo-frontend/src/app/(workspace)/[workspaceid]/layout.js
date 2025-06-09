"use client";
// import "../styles/main.scss";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { PlaygroundProvider } from "@/context/AgentContext";
import { SourceProvider } from "@/context/SourceContext";
import { SiteHeader } from "@/components/navbar/site-header";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAgentRoute = pathname?.includes("/agent/");

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProtectedRoute>
            <WorkspaceProvider>
              <SourceProvider>
                <PlaygroundProvider>
                  <div className="flex flex-col gap-6">
                    {!isAgentRoute && <SiteHeader />}
                    {children}
                  </div>
                  <Toaster />
                </PlaygroundProvider>
              </SourceProvider>
            </WorkspaceProvider>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
