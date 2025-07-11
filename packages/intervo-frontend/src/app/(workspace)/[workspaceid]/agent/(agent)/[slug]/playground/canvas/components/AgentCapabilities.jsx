"use client";

import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import KnowledgeBaseSelect from "./KnowledgeBaseSelect";
import IntentDialog from "./IntentDialog";
import IntentItem from "./IntentItem";
import FunctionDialog from "./FunctionDialog";
import FunctionItem from "./FunctionItem";
import ToolConfigDialog from "./ToolConfigDialog";
import ToolSelectionDialog from "./ToolSelectionDialog";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayground } from "@/context/AgentContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { mockCalendarTools } from "@/data/mockCalendarTools";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AgentCapabilities = ({ agentData, onSave }) => {
  const [intents, setIntents] = useState(agentData?.intents || []);
  const [functions, setFunctions] = useState(agentData?.functions || []);
  const [configuredTools, setConfiguredTools] = useState(
    agentData?.tools || []
  );

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    intent: null,
  });

  const [functionDialogState, setFunctionDialogState] = useState({
    isOpen: false,
    func: null,
  });

  const [toolConfigDialogState, setToolConfigDialogState] = useState({
    isOpen: false,
    tool: null,
  });

  const [toolSelectionDialogOpen, setToolSelectionDialogOpen] = useState(false);

  const { tools, fetchTools, aiConfig } = usePlayground();
  const { checkAndShowPricingPopup } = useWorkspace();
  const [selectedTool, setSelectedTool] = useState(null);

  useEffect(() => {
    if (agentData?.intents) {
      setIntents(agentData.intents);
    }
    if (agentData?.functions) {
      setFunctions(agentData.functions);
    }
    if (agentData?.tools) {
      setConfiguredTools(agentData.tools);
    }
    if (agentData?.tools && agentData.tools.length > 0) {
      const initialTool = tools?.find(
        (tool) => tool._id === agentData.tools[0]
      );
      setSelectedTool(initialTool || null);
    }
  }, [agentData, tools]);

  useEffect(() => {
    console.log("fetching tools");
    fetchTools();
    return () => {
      console.log("unmounting tools");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddIntent = () => {
    // Check if user has access, if not show pricing popup
    const needsPricing = checkAndShowPricingPopup();
    if (!needsPricing) {
      // User has access, proceed to open the dialog
      setDialogState({ isOpen: true, intent: null });
    }
  };

  const handleEditIntent = (intent) => {
    setDialogState({ isOpen: true, intent });
  };

  const handleDeleteIntent = async (intentToDelete) => {
    try {
      const updatedIntents = intents.filter(
        (intent) => intent.name !== intentToDelete.name
      );

      setIntents(updatedIntents);
      onSave({ intents: updatedIntents });
    } catch (error) {
      console.error("Error deleting intent:", error);
    }
  };

  const handleSaveIntent = async (intentData) => {
    try {
      let updatedIntents;
      if (dialogState.intent) {
        updatedIntents = intents.map((intent) =>
          intent.name === dialogState.intent.name ? intentData : intent
        );
      } else {
        updatedIntents = [...intents, intentData];
      }

      setIntents(updatedIntents);
      onSave({ intents: updatedIntents });
    } catch (error) {
      console.error("Error saving intent:", error);
    }
  };

  const handleKnowledgeBaseChange = (enabled) => {
    if (enabled && aiConfig?.knowledgeBase?.sources?.length > 0) {
      // If enabling and agent has knowledge base sources, use them
      onSave({
        knowledgeBase: {
          sources: aiConfig.knowledgeBase.sources,
        },
      });
    } else {
      // If disabling or no sources available, set to empty array
      onSave({
        knowledgeBase: {
          sources: [],
        },
      });
    }
  };

  const handleToolChange = (value) => {
    console.log("Raw value received:", value);

    if (value === "remove") {
      setSelectedTool(null);
      onSave({
        tools: [],
      });
      return;
    }

    const selected = tools?.find((tool) => tool._id === value);
    console.log("Selected tool:", selected);

    if (selected) {
      setSelectedTool(selected);
      onSave({
        tools: [selected._id],
      });
    }
  };

  const handleAddTool = () => {
    // Check if user has access, if not show pricing popup
    const needsPricing = checkAndShowPricingPopup();
    if (!needsPricing) {
      // User has access, proceed to show tool selection
      setToolSelectionDialogOpen(true);
    }
  };

  const handleSelectTool = (tool) => {
    // After selecting a tool, open the configuration dialog
    setToolConfigDialogState({ isOpen: true, tool });
  };

  const handleSaveTool = (toolConfig) => {
    const updatedTools = [...configuredTools, toolConfig];
    setConfiguredTools(updatedTools);

    // Save in the orchestration flow format - only pass the tools update
    onSave({
      tools: updatedTools,
    });
  };

  const handleRemoveTool = (toolToRemove) => {
    const updatedTools = configuredTools.filter(
      (tool) =>
        tool.name !== toolToRemove.name || tool.type !== toolToRemove.type
    );
    setConfiguredTools(updatedTools);

    onSave({
      tools: updatedTools,
    });
  };
  return (
    <div className="max-h-[calc(100vh-432px)] overflow-y-auto">
      <div className="flex flex-col gap-3 w-full pr-2">
        {/* Knowledge Base Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-900">
              Enable Knowledge Base
            </h3>
            <p className="text-xs text-gray-600">
              Connect knowledge base to help answer questions
            </p>
          </div>
          <Switch
            checked={agentData?.knowledgeBase?.sources?.length > 0}
            onCheckedChange={handleKnowledgeBaseChange}
          />
        </div>

        {/* Goals Section */}
        <div className="border rounded-lg">
          <div className="flex items-start justify-between p-3">
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-medium text-gray-900">
                Goals of the agent
              </h3>
              <p className="text-xs text-gray-600">
                Goals are what info that needs to be collected by the subagent
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddIntent}
              size="sm"
              variant="outline"
              className="text-xs ml-3 flex-shrink-0"
            >
              Add Goal
            </Button>
          </div>
          {intents.length === 0 && (
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-500 italic">
                No goals defined yet
              </p>
            </div>
          )}
          {intents.length > 0 && (
            <div className="px-3 pb-3">
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {intents.map((intent) => (
                    <IntentItem
                      key={intent.name}
                      intent={intent}
                      onEdit={handleEditIntent}
                      onDelete={handleDeleteIntent}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Tools Section */}
        <div className="border rounded-lg">
          <div className="flex items-start justify-between p-3">
            <div className="space-y-1 flex-1">
              <h3 className="text-xs font-medium text-gray-900">Tools</h3>
              <p className="text-xs text-gray-600">
                Add tools to extend the agent&apos;s capabilities
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddTool}
              size="sm"
              variant="outline"
              className="text-xs ml-3 flex-shrink-0"
            >
              Add Tool
            </Button>
          </div>
          {configuredTools.length === 0 && (
            <div className="px-3 pb-3">
              <p className="text-xs text-gray-500 italic">No tools added yet</p>
            </div>
          )}
          {configuredTools.length > 0 && (
            <div className="px-3 pb-3">
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {configuredTools.map((tool, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="text-xs text-gray-700">
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-gray-500">{tool.type}</div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleRemoveTool(tool)}
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <IntentDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState({ isOpen: false, intent: null })}
          onSave={handleSaveIntent}
          intent={dialogState.intent}
        />

        <ToolSelectionDialog
          isOpen={toolSelectionDialogOpen}
          onClose={() => setToolSelectionDialogOpen(false)}
          onSelectTool={handleSelectTool}
        />

        <ToolConfigDialog
          isOpen={toolConfigDialogState.isOpen}
          onClose={() =>
            setToolConfigDialogState({ isOpen: false, tool: null })
          }
          onSave={handleSaveTool}
          tool={toolConfigDialogState.tool}
        />
      </div>
    </div>
  );
};

export default AgentCapabilities;
