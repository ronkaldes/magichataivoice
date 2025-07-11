"use client";
import React, { useEffect, useState, useContext } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceContext } from "@/context/WorkspaceContext";
import returnAPIUrl from "@/config/config";

const backendAPIUrl = returnAPIUrl();

export default function TimezoneSelect({
  value,
  onValueChange,
  disabled,
  triggerClassName,
}) {
  // Try to get workspace context, but don't throw error if not available
  const workspaceContext = useContext(WorkspaceContext);

  // Local state for when workspace context is not available
  const [localTimezones, setLocalTimezones] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Use workspace context if available, otherwise use local state
  const availableTimezones =
    workspaceContext?.availableTimezones || localTimezones;
  const timezonesLoading = workspaceContext?.timezonesLoading || localLoading;
  const timezonesError = workspaceContext?.timezonesError || localError;

  // Fetch timezones directly when not in workspace context
  const fetchTimezonesDirectly = async () => {
    if (localTimezones.length > 0) return; // Don't refetch if already loaded

    setLocalLoading(true);
    setLocalError(null);
    try {
      const response = await fetch(`${backendAPIUrl}/workspace/timezones`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch timezones");
      }
      setLocalTimezones(data);
    } catch (err) {
      console.error("Error fetching timezones directly:", err);
      setLocalError(err.message);
      setLocalTimezones([]); // Clear timezones on error
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceContext) {
      // Use workspace context method if available
      if (
        !workspaceContext.timezonesLoading &&
        workspaceContext.availableTimezones.length === 0 &&
        !workspaceContext.timezonesError
      ) {
        workspaceContext.fetchTimezones();
      }
    } else {
      // Fetch directly when not in workspace context
      if (!localLoading && localTimezones.length === 0 && !localError) {
        fetchTimezonesDirectly();
      }
    }
  }, [workspaceContext, localTimezones, localLoading, localError]);

  return (
    <Select
      onValueChange={onValueChange}
      value={value}
      disabled={disabled || timezonesLoading}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        {timezonesLoading && (
          <SelectItem value="loading" disabled>
            Loading timezones...
          </SelectItem>
        )}
        {timezonesError && (
          <SelectItem value="error" disabled>
            Error: {timezonesError}
          </SelectItem>
        )}
        {!timezonesLoading &&
          !timezonesError &&
          availableTimezones.length === 0 && (
            <SelectItem value="notfound" disabled>
              No timezones found
            </SelectItem>
          )}
        {availableTimezones.map((tz, index) => (
          <SelectItem key={`${tz.value}-${index}`} value={tz.value}>
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
