// import "../styles/main.scss";
import { Toaster } from "@/components/ui/toaster";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PlaygroundProvider } from "@/context/AgentContext";
import { SiteHeader } from "@/components/navbar/AgentNavbar";
import { ActivitiesProvider } from "@/context/ActivitiesContext";
import { SourceProvider } from "@/context/SourceContext";
import { PhoneNumberProvider } from "@/context/PhoneNumberContext";
import LayoutWrapper from "./components/LayoutWrapper";

export const metadata = {
  title: "Agent Playground",
};

export default async function RootLayout({ children, params }) {
  const { slug } = await params;

  return (
    <AuthProvider>
      <SourceProvider>
        <PlaygroundProvider>
          <ActivitiesProvider>
            <PhoneNumberProvider>
              <LayoutWrapper>
                <SiteHeader slug={slug} />
                {children}
              </LayoutWrapper>
              <Toaster />
            </PhoneNumberProvider>
          </ActivitiesProvider>
        </PlaygroundProvider>
      </SourceProvider>
    </AuthProvider>
  );
}
