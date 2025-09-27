"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import EditorJs from "@editorjs/editorjs";
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import checkList from "@editorjs/checklist";
import { Edu_QLD_Beginner } from "next/font/google";
import { toast } from "sonner";
import { WorkspaceFile } from "../_types";

const rawDocument = {
  time: 1550476186479,
  blocks: [
    {
      id: "oUq2g_tl8y",
      type: "header",
      data: {
        text: "Untitled Document",
        level: 2,
      },
    },
  ],
  version: "2.8.1",
};

const Editor = ({
  onSaveTrigger,
  fileId,
  fileData,
  onFileUpdate,
  onSavingStateChange,
}: {
  onSaveTrigger: any;
  fileId: any;
  fileData: any;
  onFileUpdate?: (data: WorkspaceFile) => void;
  onSavingStateChange?: (state: "idle" | "saving" | "saved" | "error") => void;
}) => {
  const ref = useRef<EditorJs>();
  const [document, setDocument] = useState(rawDocument);
  const localKey = `workspace:${fileId}:document`;

  // autosave debounce timer and retry control
  const idleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const saveDocument = async (id: string, data: any) => {
    const res = await fetch(`/api/workspace/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: data }),
    });
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  };

  const initEditor = useCallback(() => {
    const editor = new EditorJs({
      holder: "editorjs",
      placeholder: "Let`s write an awesome story!",
      tools: {
        header: {
          // @ts-ignore
          class: Header,
          inlineToolbar: true,
          shortcut: "CMD+SHIFT+H",
          placeholder: "Enter a heading",
        },
        list: List,
        checklist: checkList,
      },
      data:
        // Prefer locally cached unsaved data first
        (typeof window !== "undefined"
          ? (() => {
              try {
                const cached = window.localStorage.getItem(localKey);
                return cached ? JSON.parse(cached) : null;
              } catch {
                return null;
              }
            })()
          : null) || (fileData && fileData.document ? fileData.document : document),
      onChange: async () => {
        if (!ref.current) return;
        const data = await ref.current.save();
        try {
          // Cache locally for resilience across navigation
          window.localStorage.setItem(localKey, JSON.stringify(data));
        } catch {}

        // debounce autosave (3-5s of inactivity)
        if (idleDebounceRef.current) clearTimeout(idleDebounceRef.current);
        idleDebounceRef.current = setTimeout(async () => {
          if (!ref.current) return;
          onSavingStateChange?.("saving");
          try {
            const latest = await ref.current.save();
            const updatedFile = await saveDocument(fileId, latest);
            onFileUpdate?.(updatedFile as WorkspaceFile);
            onSavingStateChange?.("saved");
            retryCountRef.current = 0;
            // clear cache after successful save to keep it lean
            try {
              window.localStorage.removeItem(localKey);
            } catch {}
          } catch (e) {
            onSavingStateChange?.("error");
            // retry with exponential backoff up to 3 attempts
            const retries = Math.min(retryCountRef.current + 1, 3);
            retryCountRef.current = retries;
            const backoff = Math.pow(2, retries - 1) * 1000; // 1s,2s,4s
            setTimeout(() => {
              // trigger another debounce run to retry
              if (ref.current) {
                // simulate another change to kick autosave
                // by calling the same timeout block directly
                if (idleDebounceRef.current)
                  clearTimeout(idleDebounceRef.current);
                idleDebounceRef.current = setTimeout(async () => {
                  if (!ref.current) return;
                  onSavingStateChange?.("saving");
                  try {
                    const latest2 = await ref.current.save();
                    const updatedFile2 = await saveDocument(fileId, latest2);
                    onFileUpdate?.(updatedFile2 as WorkspaceFile);
                    onSavingStateChange?.("saved");
                    retryCountRef.current = 0;
                    try {
                      window.localStorage.removeItem(localKey);
                    } catch {}
                  } catch {
                    onSavingStateChange?.("error");
                  }
                }, 0);
              }
            }, backoff);
          }
        }, 3500); // ~3.5s idle
      },
    });
    editor.isReady.then(() => {
      ref.current = editor;
    });
  }, [document, fileData]);

  const onDocumentSave = useCallback(async () => {
    if (!ref.current) return;
    onSavingStateChange?.("saving");
    const savedData = await ref.current.save();
    const updatedFile = await saveDocument(fileId, savedData);
    onFileUpdate?.(updatedFile as WorkspaceFile);
    onSavingStateChange?.("saved");
    try {
      window.localStorage.removeItem(localKey);
    } catch {}
    toast.success("Document Saved");
  }, [fileId, onFileUpdate]);

  useEffect(() => {
    if (fileData) {
      initEditor();
    }
  }, [fileData, initEditor]);

  useEffect(() => {
    if (!ref.current) return;
    onDocumentSave();
  }, [onDocumentSave, onSaveTrigger]);

  return (
    <div className="p-2">
      <div
        className="text-white selection:text-black selection:bg-neutral-400 overflow-x-hidden overflow-y-auto w-full pr-4 pl-2 h-[85vh] mb-4"
        id="editorjs"
        key={"editorjs"}
      ></div>
    </div>
  );
};

export default Editor;
