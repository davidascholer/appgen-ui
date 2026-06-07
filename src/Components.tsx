import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { PREBUILT_ELEMENTS } from "./App";
import { renderElementCode, renderPrebuiltElement } from "./elementPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Components() {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    PREBUILT_ELEMENTS[0]?.id ?? null,
  );
  const [flexEnabled, setFlexEnabled] = useState(true);
  const [borderEnabled, setBorderEnabled] = useState(false);

  const selectedElement = useMemo(
    () => PREBUILT_ELEMENTS.find((entry) => entry.id === selectedElementId) ?? null,
    [selectedElementId],
  );

  const rawCode = useMemo(() => {
    const wrappers = PREBUILT_ELEMENTS.map((element) => {
      const wrapperStyle = borderEnabled
        ? ' style={{ border: "1px solid #d4d4d8" }}'
        : "";

      return `  <div${wrapperStyle}>${renderElementCode(element)}</div>`;
    }).join("\n");

    const parentStyle = flexEnabled
      ? ' style={{ display: "flex" }}'
      : "";

    return `import { Button } from \"@/components/ui/button\";\nimport { Input } from \"@/components/ui/input\";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";\nimport { Switch } from \"@/components/ui/switch\";\n\nexport default function Components() {\n  return (\n    <div${parentStyle}>\n${wrappers}\n    </div>\n  );\n}`;
  }, [borderEnabled, flexEnabled]);

  const containerStyle: CSSProperties | undefined = flexEnabled
    ? { display: "flex" }
    : undefined;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1>Components</h1>
        <div style={{ marginBottom: "8px" }}>
          <Button type="button" variant={flexEnabled ? "default" : "outline"} onClick={() => setFlexEnabled((current) => !current)}>
            Flex {flexEnabled ? "On" : "Off"}
          </Button>{" "}
          <Button type="button" variant={borderEnabled ? "default" : "outline"} onClick={() => setBorderEnabled((current) => !current)}>
            Border {borderEnabled ? "On" : "Off"}
          </Button>{" "}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const elementId = selectedElement?.id ?? PREBUILT_ELEMENTS[0]?.id;
              if (!elementId) return;
              window.location.href = `/elements/playground?element=${encodeURIComponent(elementId)}`;
            }}
            disabled={!selectedElement}
          >
            Playground
          </Button>{" "}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Code</Button>
            </DialogTrigger>
            <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-mono">Components Raw React Code</DialogTitle>
              </DialogHeader>
              <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                {rawCode}
              </pre>
            </DialogContent>
          </Dialog>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Selected Element:</strong> {selectedElement?.label || "None"}
        </div>
        <pre style={{ background: "#f4f4f5", padding: "12px", borderRadius: "8px", overflow: "auto" }}>
          {selectedElement ? JSON.stringify(selectedElement, null, 2) : "No element selected"}
        </pre>
      </div>

      <div style={containerStyle}>
        {PREBUILT_ELEMENTS.map((element) => (
          <div
            key={element.id}
            onClick={() => setSelectedElementId(element.id)}
            style={{
              border: borderEnabled ? "1px solid #d4d4d8" : undefined,
            }}
          >
            {renderPrebuiltElement(element)}
          </div>
        ))}
      </div>
    </div>
  );
}
