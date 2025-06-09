"use client";
import React from "react";
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Link,
  NavbarMenuItem,
  NavbarMenu,
} from "@nextui-org/react";
import { useAuth } from "@/context/AuthContext";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { AgentNavItems } from "@/config/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayground } from "@/context/AgentContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import Dropdown from "./Dropdown";
import { MobileNavContent } from "./MobileNavContent";

export function SiteHeader({ slug }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { getAllAgents } = usePlayground();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(slug || "");
  const {
    workspaceId,
    handleWorkspaceChange,
    memberWorkspaces,
    workspaceInfo,
    workspaceLoading,
  } = useWorkspace();

  useEffect(() => {
    const fetchAgents = async () => {
      const agents = await getAllAgents();
      setAgents(agents);
    };

    fetchAgents();
  }, []);

  const handleAgentSelectChange = (value) => {
    setSelectedAgent(value);
    router.push(`/${workspaceId}/agent/${value}/playground`);
  };

  return (
    <header className="top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        <Navbar
          className="!relative border-b items-center h-12"
          onMenuOpenChange={setIsMenuOpen}
          isMenuOpen={isMenuOpen}
          maxWidth={"full"}
        >
          <NavbarContent justify="start" className="gap-0">
            <div className="flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">Intervo.ai</span>
              </Link>
            </div>

            <Select
              value={selectedAgent}
              onValueChange={handleAgentSelectChange}
            >
              <SelectTrigger className="max-w-[136px] mr-2 w-full text-foreground">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {agents.map((item, index) => (
                    <SelectItem key={index} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="hidden md:flex">
              {isAuthenticated &&
                AgentNavItems.map((item) => (
                  <NavbarItem key={item.href}>
                    <Link
                      href={`/${workspaceId}/agent/${slug}${item.href}`}
                      className={navigationMenuTriggerStyle()}
                    >
                      {item.title}
                    </Link>
                  </NavbarItem>
                ))}
            </div>
          </NavbarContent>

          <NavbarMenu className="bg-white py-2 top-12">
            <MobileNavContent
              mainNavItems={AgentNavItems.map((item) => ({
                ...item,
                href: `/agent/${slug}${item.href}`,
              }))}
              workspaceId={workspaceId}
              workspaceInfo={workspaceInfo}
              memberWorkspaces={memberWorkspaces}
              handleWorkspaceChange={handleWorkspaceChange}
              logout={logout}
              user={user}
              isAuthenticated={isAuthenticated}
              workspaceLoading={workspaceLoading}
            />
          </NavbarMenu>

          <NavbarContent justify="end" className="gap-4">
            {isAuthenticated ? (
              <NavbarItem className="hidden md:flex">
                <Dropdown />
              </NavbarItem>
            ) : (
              <NavbarItem className="hidden lg:flex">
                <Link href="/login">Login</Link>
              </NavbarItem>
            )}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-6 h-full text-foreground focus:outline-none"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </NavbarContent>
        </Navbar>
      </div>
    </header>
  );
}
