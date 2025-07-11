import React from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayground } from "@/context/AgentContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { mockCalendarTools } from "@/data/mockCalendarTools";

const AgentsTab = ({ onSelect, onClose }) => {
  const { checkAndShowPricingPopup } = useWorkspace();

  const handleAgentSelect = (agentType) => {
    // Check if user has access, if not show pricing popup
    const needsPricing = checkAndShowPricingPopup();
    if (needsPricing) {
      // User needs pricing, close the context menu
      onClose?.();
    } else {
      // User has access, proceed with selection
      onSelect(agentType);
    }
  };

  return (
    <CommandGroup>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Greeting Agent")}
      >
        Greeting Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Receptionist")}
      >
        Receptionist
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Sales Agent")}
      >
        Sales Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Technical Support Agent")}
      >
        Technical Support Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Lead Qualification Agent")}
      >
        Lead Qualification Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Customer Support Agent")}
      >
        Customer Support Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Farewell Agent")}
      >
        Farewell Agent
      </CommandItem>
      <CommandItem
        className="py-2 px-2 rounded-sm text-base"
        onSelect={() => handleAgentSelect("Create with AI")}
      >
        Create from Scratch
      </CommandItem>
    </CommandGroup>
  );
};

const ToolsTab = ({ onSelect, onClose }) => {
  const { checkAndShowPricingPopup } = useWorkspace();

  const handleToolSelect = (toolName) => {
    // Check if user has access, if not show pricing popup
    const needsPricing = checkAndShowPricingPopup();
    if (needsPricing) {
      // User needs pricing, close the context menu
      onClose?.();
    } else {
      // User has access, proceed with selection
      onSelect(toolName);
    }
  };

  return (
    <CommandGroup>
      {mockCalendarTools.map((tool, index) => (
        <CommandItem
          key={tool.id || index}
          className="py-2 px-2 rounded-sm text-base cursor-not-allowed opacity-60"
          disabled
        >
          <div className="flex items-center justify-between w-full">
            <span>{tool.name}</span>
            <span className="text-xs text-gray-500 ml-2">Coming Soon</span>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
};

const ContextMenu = ({ onSelect, onClose }) => {
  return (
    <div className="w-64 bg-white shadow-lg rounded-lg max-h-[85vh] overflow-hidden">
      <Command className="border-none">
        <div className="border-b">
          <CommandInput
            placeholder="Search blocks..."
            className="h-12 border-0 focus:ring-0 rounded-none bg-transparent"
          />
        </div>

        <CommandList className="p-4 max-h-[calc(85vh-4rem)] overflow-y-auto">
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            <TabsContent value="agents">
              <AgentsTab onSelect={onSelect} onClose={onClose} />
            </TabsContent>
            <TabsContent value="tools">
              <ToolsTab onSelect={onSelect} onClose={onClose} />
            </TabsContent>
          </Tabs>
        </CommandList>
      </Command>
    </div>
  );
};

export default ContextMenu;
