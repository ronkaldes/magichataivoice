"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const AgentSettings = ({ agentData = {}, onSave }) => {
  // Local state to track form values
  const [localSettings, setLocalSettings] = useState(agentData);

  // Update local state ONLY when agentData._id changes (when a different node is selected)
  useEffect(() => {
    setLocalSettings(agentData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.id]); // Only depend on the ID, not the entire agentData

  // Debounced save function
  const debouncedSave = useCallback(
    (field, value) => {
      const debouncedFn = debounce((f, v) => {
        onSave(f, v);
      }, 1000);
      debouncedFn(field, value);
    },
    [onSave]
  );

  const handleLLMChange = (field, value) => {
    const newSettings = {
      ...localSettings,
      llm: {
        ...localSettings.llm,
        [field]: value,
      },
    };
    setLocalSettings(newSettings);
    debouncedSave("llm", newSettings.llm);
  };

  return (
    <div className="w-full">
      <Card className="border-none shadow-none bg-gray-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select
              value={localSettings?.llm?.provider || ""}
              onValueChange={(value) => handleLLMChange("provider", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LLM Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama">Fast Response (LLaMa)</SelectItem>
                <SelectItem value="premium">
                  Better Response (Gemini, OpenAI)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default AgentSettings;
