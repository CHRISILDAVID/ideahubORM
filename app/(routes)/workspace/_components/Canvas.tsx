"use client";
import React, { useEffect, useRef, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { toast } from "sonner";
import { WorkspaceFile } from "../_types";

const Canvas = ({
  onSaveTrigger,
  fileId,
  fileData,
  onFileUpdate,
  onSavingStateChange,
}: {
  onSaveTrigger: any;
  fileId: string;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: "idle" | "saving" | "saved" | "error") => void;
}) => {
  const [whiteBoard, setWhiteBoard] = useState<any>(undefined);
  const localKey = `workspace:${fileId}:whiteboard`;
  const idleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!whiteBoard) return;

    const persist = async () => {
      try {
        onSavingStateChange?.("saving");
        const res = await fetch(`/api/workspace/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whiteboard: whiteBoard }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const updatedFile = (await res.json()) as WorkspaceFile;
        onFileUpdate?.(updatedFile);
        onSavingStateChange?.("saved");
        try {
          window.localStorage.removeItem(localKey);
        } catch {}
        toast.success("Canvas saved");
      } catch (error) {
        onSavingStateChange?.("error");
        // basic retry with backoff up to 3 attempts
        const retries = Math.min(retryCountRef.current + 1, 3);
        retryCountRef.current = retries;
        const backoff = Math.pow(2, retries - 1) * 1000; // 1s,2s,4s
        setTimeout(() => {
          // trigger another attempt
          if (whiteBoard && onSaveTrigger !== undefined) {
            persist();
          }
        }, backoff);
        toast.error("Error saving canvas");
      }
    };

    // Debounce autosave for 3.5s idle
    if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
    idleDebounceRef.current = setTimeout(() => {
      persist();
    }, 3500);
  }, [fileId, onFileUpdate, onSaveTrigger, whiteBoard]);

  return (
    <>
      <div className="h-full w-full">
        {fileData && fileData.whiteboard ? (
          <Excalidraw
            theme="dark"
            initialData={{
              elements:
                // prefer locally cached elements first
                (typeof window !== "undefined"
                  ? (() => {
                      try {
                        const cached = window.localStorage.getItem(localKey);
                        return cached ? (JSON.parse(cached) as any) : null;
                      } catch {
                        return null;
                      }
                    })()
                  : null) || (fileData?.whiteboard as any) || undefined,
            }}
            UIOptions={{
              canvasActions: {
                export: false,
                loadScene: false,
                saveAsImage: false,
              },
            }}
            onChange={(excaliDrawElements, appState, files) => {
              setWhiteBoard(excaliDrawElements);
              try {
                window.localStorage.setItem(
                  localKey,
                  JSON.stringify(excaliDrawElements)
                );
              } catch {}
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
        ) : (
          <Excalidraw
            theme="dark"
            UIOptions={{
              canvasActions: {
                export: false,
                loadScene: false,
                saveAsImage: false,
              },
            }}
            initialData={{
              elements:
                (typeof window !== "undefined"
                  ? (() => {
                      try {
                        const cached = window.localStorage.getItem(localKey);
                        return cached ? (JSON.parse(cached) as any) : undefined;
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined) || undefined,
            }}
            onChange={(excaliDrawElements, appState, files) => {
              setWhiteBoard(excaliDrawElements);
              try {
                window.localStorage.setItem(
                  localKey,
                  JSON.stringify(excaliDrawElements)
                );
              } catch {}
            }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
            <WelcomeScreen>
              <WelcomeScreen.Hints.MenuHint />
              <WelcomeScreen.Hints.ToolbarHint />
              <WelcomeScreen.Hints.HelpHint />
            </WelcomeScreen>
          </Excalidraw>
        )}
      </div>
    </>
  );
};

export default Canvas;
