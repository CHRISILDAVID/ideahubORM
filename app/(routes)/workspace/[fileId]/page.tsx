"use client";
import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkSpaceHeader from "../_components/WorkSpaceHeader";
import dynamic from "next/dynamic";
import { WorkspaceFile } from "../_types";

const Editor = dynamic(() => import("../_components/Editor"), {
  ssr: false,
});

const Canvas = dynamic(() => import("../_components/Canvas"), {
  ssr: false,
});

const Workspace = ({ params }: any) => {
  const [fileData, setfileData] = useState<WorkspaceFile | null>(null);

  useEffect(() => {
    if (!params?.fileId) return;

    const fetchFileData = async () => {
      const res = await fetch(`/api/workspace/${params.fileId}`);
      if (!res.ok) return;
      const file = await res.json();
      setfileData(file);
    };

    fetchFileData();
  }, [params?.fileId]);
  const Tabs = [
    {
      name: "Document",
    },
    {
      name: "Both",
    },
    {
      name: "Canvas",
    },
  ];

  const [activeTab, setActiveTab] = useState(Tabs[1].name);
  const [triggerSave, setTriggerSave] = useState(false);

  return (
    <div className="overflow-hidden w-full">
      <WorkSpaceHeader
        Tabs={Tabs}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        onSave={() => setTriggerSave(!triggerSave)}
        file={fileData}
      />
      {activeTab === "Document" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Editor
              onSaveTrigger={triggerSave}
              fileId={params.fileId}
              fileData={fileData as any}
            />
          )}
        </div>
      ) : activeTab === "Both" ? (
        <ResizablePanelGroup
          style={{
            height: "calc(100vh - 3rem)",
          }}
          direction="horizontal"
        >
          <ResizablePanel defaultSize={50} minSize={40} collapsible={false}>
            {fileData && (
              <Editor
                onSaveTrigger={triggerSave}
                fileId={params.fileId}
                fileData={fileData as any}
              />
            )}
          </ResizablePanel>
          <ResizableHandle className=" bg-neutral-600" />
          <ResizablePanel defaultSize={50} minSize={45}>
            {fileData && (
              <Canvas
                onSaveTrigger={triggerSave}
                fileId={params.fileId}
                fileData={fileData as any}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : activeTab === "Canvas" ? (
        <div
          style={{
            height: "calc(100vh - 3rem)",
          }}
        >
          {fileData && (
            <Canvas
              onSaveTrigger={triggerSave}
              fileId={params.fileId}
              fileData={fileData as any}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Workspace;
