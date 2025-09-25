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
}: {
  onSaveTrigger: any;
  fileId: any;
  fileData: any;
}) => {
  const ref = useRef<EditorJs>();
  const [document, setDocument] = useState(rawDocument);

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
      data: fileData && fileData.document ? fileData.document : document,
    });
    editor.isReady.then(() => {
      ref.current = editor;
    });
  }, [document, fileData]);

  const onDocumentSave = useCallback(async () => {
    if (!ref.current) return;
    const savedData = await ref.current.save();
    await saveDocument(fileId, savedData);
    toast.success("Document Saved");
  }, [fileId]);

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
