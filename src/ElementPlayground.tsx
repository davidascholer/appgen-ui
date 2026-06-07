import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { PREBUILT_ELEMENTS } from "./App";
import {
  PrebuiltElement,
  renderElementCode,
  renderPrebuiltElement,
} from "./elementPreview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ElementOptionSection = {
  title: string;
  items: string[];
};

const ELEMENT_OPTION_SECTIONS: Record<
  PrebuiltElement["id"],
  ElementOptionSection[]
> = {
  "element-text": [
    {
      title: "Properties",
      items: ["label: string", "value: string"],
    },
    {
      title: "Styles",
      items: [
        "alignment: left | center | right",
        "size: number (1-10)",
        "isBold: boolean",
        "isItalic: boolean",
        "isLabel: boolean",
      ],
    },
  ],
  "element-toggle": [
    {
      title: "Properties",
      items: ["label: string", "value: boolean"],
    },
    {
      title: "Styles",
      items: ["position: left | center | right"],
    },
  ],
  "element-button": [
    {
      title: "Properties",
      items: [
        "label: string",
        "buttonLabel: string",
        "highlightOnHover: boolean",
        "isGhost: boolean",
      ],
    },
    {
      title: "Styles",
      items: ["width: auto | full | number"],
    },
  ],
  "element-select": [
    {
      title: "Properties",
      items: ["label: string", "values: string[]"],
    },
  ],
  "element-text-input": [
    {
      title: "Properties",
      items: ["label: string", "value: string", "textHint: string"],
    },
    {
      title: "Styles",
      items: [
        "alignment: left | center | right",
        "width: auto | full | number",
      ],
    },
  ],
  "element-icon": [
    {
      title: "Properties",
      items: ["label: string", "value: Lucide icon name string"],
    },
    {
      title: "Styles",
      items: ["size: number"],
    },
  ],
  "element-image": [
    {
      title: "Properties",
      items: ["label: string", "src: image URL string"],
    },
    {
      title: "Styles",
      items: [
        "sizing: fit | contain",
        "width: auto | full | number | css string",
        "height: auto | number | css string",
      ],
    },
  ],
  "element-vertical-container": [
    {
      title: "Properties",
      items: ["label: string"],
    },
    {
      title: "Styles",
      items: [
        "justifyContent: start | center | end | space-between | space-around | space-evenly",
        "alignItems: start | center | end | stretch",
        "gap: number",
        "backgroundColor: hex or hex8 color",
        "borderColor: hex or hex8 color",
        "borderRadius: number",
        "borderWidth: number",
      ],
    },
  ],
};

const getInitialElement = (): PrebuiltElement | null => {
  const params = new URLSearchParams(window.location.search);
  const elementId = params.get("element");
  const source =
    PREBUILT_ELEMENTS.find((entry) => entry.id === elementId) ??
    PREBUILT_ELEMENTS[0] ??
    null;

  if (!source) return null;

  return JSON.parse(JSON.stringify(source)) as PrebuiltElement;
};

export default function ElementPlayground() {
  const [element, setElement] = useState<PrebuiltElement | null>(() =>
    getInitialElement(),
  );
  const [editorValue, setEditorValue] = useState<string>(() =>
    JSON.stringify(getInitialElement(), null, 2),
  );
  const [editorError, setEditorError] = useState<string>("");
  const [flexEnabled, setFlexEnabled] = useState(true);
  const [borderEnabled, setBorderEnabled] = useState(false);

  const rawCode = useMemo(() => {
    if (!element) return "No element selected";
    const styleParts: string[] = [];
    if (flexEnabled) styleParts.push('display: "flex"');
    if (borderEnabled) styleParts.push('border: "1px solid #d4d4d8"');
    const wrapperStyle =
      styleParts.length > 0 ? ` style={{ ${styleParts.join(", ")} }}` : "";

    return `import { Button } from \"@/components/ui/button\";\nimport { Input } from \"@/components/ui/input\";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\";\nimport { Switch } from \"@/components/ui/switch\";\n\nexport default function ElementPlayground() {\n  return (\n    <div${wrapperStyle}>${renderElementCode(element)}</div>\n  );\n}`;
  }, [borderEnabled, element, flexEnabled]);

  const wrapperStyle: CSSProperties | undefined =
    flexEnabled || borderEnabled
      ? {
          display: flexEnabled ? "flex" : undefined,
          border: borderEnabled ? "1px solid #d4d4d8" : undefined,
        }
      : undefined;

  const handleEditorChange = (nextValue: string) => {
    setEditorValue(nextValue);

    try {
      const parsed = JSON.parse(nextValue) as PrebuiltElement;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.id !== "string"
      ) {
        setEditorError("Element JSON must include a valid id.");
        return;
      }

      setElement(parsed);
      setEditorError("");
    } catch {
      setEditorError("Invalid JSON. Fix the JSON to update the preview.");
    }
  };

  if (!element) {
    return <div style={{ padding: "16px" }}>No element selected.</div>;
  }

  const optionSections = ELEMENT_OPTION_SECTIONS[element.id] ?? [];
  const objectPreviewStyleParts: string[] = [];
  if (flexEnabled) objectPreviewStyleParts.push('display: "flex"');
  if (borderEnabled)
    objectPreviewStyleParts.push('border: "1px solid #d4d4d8"');
  const objectPreviewStyle =
    objectPreviewStyleParts.length > 0
      ? ` style={{ ${objectPreviewStyleParts.join(", ")} }}`
      : "";
  const objectPreview = `// Rendered div React code\n<div${objectPreviewStyle}>\n  ${renderElementCode(element)}\n</div>`;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1>Element Playground</h1>
        <div style={{ marginBottom: "8px" }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = "/components";
            }}
          >
            Back
          </Button>{" "}
          <Button
            type="button"
            variant={flexEnabled ? "default" : "outline"}
            onClick={() => setFlexEnabled((current) => !current)}
          >
            Flex {flexEnabled ? "On" : "Off"}
          </Button>{" "}
          <Button
            type="button"
            variant={borderEnabled ? "default" : "outline"}
            onClick={() => setBorderEnabled((current) => !current)}
          >
            Border {borderEnabled ? "On" : "Off"}
          </Button>{" "}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Code
              </Button>
            </DialogTrigger>
            <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-mono">
                  Element Playground Code
                </DialogTitle>
              </DialogHeader>
              <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                {rawCode}
              </pre>
            </DialogContent>
          </Dialog>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <strong>Selected Element:</strong> {element.label}
        </div>
        <div style={{ marginBottom: "16px" }}>
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-md border px-4"
          >
            {optionSections.map((section) => (
              <AccordionItem key={section.title} value={section.title}>
                <AccordionTrigger>{section.title}</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <div>
            <p style={{ marginBottom: "8px", fontWeight: 600 }}>
              Edit Element JSON
            </p>
            <textarea
              value={editorValue}
              onChange={(event) => handleEditorChange(event.target.value)}
              style={{
                width: "100%",
                minHeight: "320px",
                padding: "12px",
                border: "1px solid #d4d4d8",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "14px",
              }}
            />
            {editorError ? (
              <p style={{ color: "#dc2626", marginTop: "8px" }}>
                {editorError}
              </p>
            ) : null}
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontWeight: 600 }}>
              Object Preview
            </p>
            <pre
              style={{
                background: "#f4f4f5",
                padding: "12px",
                borderRadius: "8px",
                overflow: "auto",
                minHeight: "320px",
              }}
            >
              {objectPreview}
            </pre>
          </div>
        </div>
      </div>

      <div style={wrapperStyle}>{renderPrebuiltElement(element)}</div>
    </div>
  );
}
