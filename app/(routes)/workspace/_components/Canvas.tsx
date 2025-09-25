"use client";
import React, { useEffect, useRef, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { toast } from "sonner";

const Canvas = ({
  onSaveTrigger,
  fileId,
  fileData,
}: {
  onSaveTrigger: any;
  fileId: string;
  fileData: any;
}) => {
  const [whiteBoard, setWhiteBoard] = useState<any>(undefined);

  useEffect(() => {
    if (!whiteBoard) return;

    const persist = async () => {
      try {
        const res = await fetch(`/api/workspace/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whiteboard: whiteBoard }),
        });
        if (!res.ok) throw new Error("Failed to save");
        await res.json();
        toast.success("Canvas saved");
      } catch (error) {
        toast.error("Error saving canvas");
      }
    };

    persist();
  }, [fileId, onSaveTrigger, whiteBoard]);

  return (
    <>
      <div className="h-full w-full">
        {fileData && fileData.whiteboard ? (
          <Excalidraw
            theme="dark"
            initialData={{
              elements: (fileData?.whiteboard as any) || undefined,
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
            onChange={(excaliDrawElements, appState, files) => {
              setWhiteBoard(excaliDrawElements);
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
