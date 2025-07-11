"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import ContextMenu from "../components/ContextMenu";
import { useReactFlow, useViewport } from "@xyflow/react";
import { Position } from "@xyflow/react";

const agentPrompts = {
  "Greeting Agent":
    "You are a welcoming greeting agent who initiates conversations with visitors. Your role is to provide a warm, professional welcome, briefly introduce the service, and identify how you can assist the visitor. Keep greetings concise but friendly, and quickly transition to understanding their needs.",
  Receptionist:
    "You are a professional receptionist who greets callers warmly and efficiently routes them to the right department. Handle inquiries with a friendly tone, gather necessary information, and provide basic company information. Always maintain a professional and helpful demeanor.",
  "Sales Agent":
    "You are a persuasive sales agent focused on understanding customer needs and presenting solutions. Ask qualifying questions, highlight product benefits, handle objections professionally, and guide prospects toward making informed purchasing decisions.",
  "Technical Support Agent":
    "You are a knowledgeable technical support specialist who helps customers resolve technical issues. Provide clear step-by-step troubleshooting guidance, ask diagnostic questions, and escalate complex issues when necessary. Always remain patient and helpful.",
  "Lead Qualification Agent":
    "You are a lead qualification specialist who identifies and evaluates potential customers. Ask strategic questions to determine budget, authority, need, and timeline. Score leads appropriately and route qualified prospects to the sales team.",
  "Customer Support Agent":
    "You are a dedicated customer support agent focused on resolving customer concerns and ensuring satisfaction. Listen actively to problems, provide solutions, process returns or refunds when appropriate, and maintain a positive customer relationship.",
  "Farewell Agent":
    "You are a farewell agent responsible for concluding conversations professionally. Summarize key points discussed, confirm next steps if any, express gratitude for the visitor's time, and provide clear instructions for future contact. Ensure the visitor feels satisfied with the interaction before ending.",
  "Create with AI":
    "Create a custom agent with AI assistance. Define your agent's role, personality, and specific capabilities based on your unique business needs. The AI will help you craft the perfect prompt for your use case.",
};

export const withAddButton = (WrappedNode) => {
  const WithAddButtonComponent = ({ data, id, ...props }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeHandleId, setActiveHandleId] = useState(null);
    const [parentNodeId, setParentNodeId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef(null);
    const modalRef = useRef(null);
    const { getNodes, addNodes, addEdges } = useReactFlow();
    const { zoom } = useViewport();

    const getActiveHandle = useCallback(() => {
      const currentNode = getNodes().find((node) => node.id === id);
      if (!currentNode) return null;

      // Get all handles from the node's DOM element
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (!nodeElement) return null;

      const handles = nodeElement.querySelectorAll("[data-class-handle]");
      if (!handles.length) return null;

      // Get the first handle
      const firstHandle = handles[0];
      return {
        handleId: firstHandle.dataset.classHandle,
        parentNodeId: firstHandle.dataset.nodeId,
      };
    }, [getNodes, id]);

    const handleAddNode = useCallback(
      (nodeType) => {
        console.log("handleAddNode", nodeType);
        const activeHandle = getActiveHandle();
        if (!activeHandle) return;

        const { handleId: activeHandleId, parentNodeId } = activeHandle;
        const parentNode = getNodes().find((node) => node.id === parentNodeId);
        console.log("parentNode", parentNode, activeHandleId);
        if (!parentNode || !activeHandleId) return;

        // Safely handle the className extraction
        const className = activeHandleId?.split("-")[0] || "";
        const classes = parentNode.data?.settings?.classes || [
          "Class 1",
          "Class 2",
        ];
        const classIndex = classes.indexOf(className);
        const yOffset = classIndex * 100; // Adjust this value as needed

        // Create new node
        const newNode = {
          id: `${nodeType.replace(/\s+/g, "-")}-${Date.now()}`,
          type: "agentNode",
          position: {
            x: parentNode.position.x + 200,
            y: parentNode.position.y + yOffset,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            label: nodeType,
            settings: {
              name: nodeType,
              description: agentPrompts[nodeType] || "",
            },
          },
        };

        // Add node first
        addNodes(newNode);

        // Wait for next tick and verify nodes exist before adding edge
        setTimeout(() => {
          const nodes = getNodes();
          const targetExists = nodes.some((node) => node.id === newNode.id);

          if (!targetExists) {
            console.log("Target node not ready, retrying...");
            setTimeout(() => {
              const newEdge = {
                id: `${parentNodeId}-${newNode.id}`,
                source: parentNodeId,
                target: newNode.id,
                sourceHandle: activeHandleId,
                type: "default",
                animated: true,
              };
              addEdges(newEdge);
            }, 1000);
            return;
          }

          const newEdge = {
            id: `${parentNodeId}-${newNode.id}`,
            source: parentNodeId,
            target: newNode.id,
            sourceHandle: activeHandleId,
            type: "default",
            animated: true,
          };

          console.log("newEdge", newEdge, nodes);
          addEdges([newEdge]);
        }, 100);

        setIsModalOpen(false);
      },
      [getNodes, addNodes, addEdges, getActiveHandle]
    );

    const handleMouseEnter = (event) => {
      const classDiv = event.target.closest("[data-class-handle]");
      console.log(classDiv, "classDiv");
      if (classDiv) {
        setActiveHandleId(classDiv.dataset.classHandle);
        const parentNodeId = classDiv.dataset.nodeId;
        if (parentNodeId) {
          const parentNode = getNodes().find(
            (node) => node.id === parentNodeId
          );
          if (parentNode) {
            setParentNodeId(parentNodeId);
          }
        }
      }
    };

    const handleMouseLeave = () => {
      setActiveHandleId(null);
    };

    const handleOpenMenu = (e) => {
      e.stopPropagation();
      const buttonRect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        x: buttonRect.right + 10,
        y: buttonRect.top,
      });
      setIsModalOpen(true);
    };

    useLayoutEffect(() => {
      if (isModalOpen && modalRef.current) {
        const menuRect = modalRef.current.getBoundingClientRect();
        setMenuPosition((prev) => {
          let { x, y } = prev;

          const buttonRect = buttonRef.current.getBoundingClientRect();

          if (x + menuRect.width > window.innerWidth) {
            x = buttonRect.left - menuRect.width - 10;
          }
          if (x < 0) {
            x = 10;
          }

          if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height - 10;
          }
          if (y < 0) {
            y = 10;
          }

          if (x === prev.x && y === prev.y) {
            return prev;
          }

          return { x, y };
        });
      }
    }, [isModalOpen]);

    useEffect(() => {
      if (!isModalOpen) return;

      const handleClickOutside = (event) => {
        // Check if click is outside the modal
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          // Check if click is not on the button that opened the menu
          if (buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsModalOpen(false);
          }
        }
      };

      // Add listener to document to catch all clicks
      document.addEventListener("mousedown", handleClickOutside, true);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }, [isModalOpen]);

    return (
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="relative group/node">
          <WrappedNode data={data} id={id} {...props} />
          {true && (
            <div className="absolute top-0 -right-10 h-full w-10 cursor-pointer">
              <Button
                ref={buttonRef}
                onClick={handleOpenMenu}
                variant="secondary"
                size="sm"
                className="absolute top-1/2 -translate-y-1/2 left-2 h-6 w-6 rounded-full flex items-center justify-center p-0 hover:bg-black hover:text-white opacity-0 group-hover/node:opacity-100 transition-opacity duration-300"
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          )}
          {isModalOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={modalRef}
                className="fixed"
                style={{
                  left: `${menuPosition.x}px`,
                  top: `${menuPosition.y}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  zIndex: 9999,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ContextMenu
                  onSelect={handleAddNode}
                  onClose={() => setIsModalOpen(false)}
                />
              </div>,
              document.body
            )}
        </div>
      </div>
    );
  };

  WithAddButtonComponent.displayName = `WithAddButton(${getDisplayName(
    WrappedNode
  )})`;
  return WithAddButtonComponent;
};

// Helper function to get display name
const getDisplayName = (WrappedComponent) => {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
};

withAddButton.displayName = "withAddButton";
