import { useState, useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import * as LucideIcons from "lucide-react";

import {
  normalizeElementFromRaw,
  normalizeComponentFromRaw,
  isContainerElement,
  elementNeedsFullWidth,
  getFlexJustifyClass,
  getFlexAlignItemsClass,
  getEffectiveFlexJustifyClass,
  getFlexOverflowStyle,
  toCssDimension,
  isTransparentHex,
  type ComponentElement,
  type AppComponent,
} from "./App";
import {
  renderPrebuiltElement,
  renderElementCode,
  type PrebuiltElement,
} from "./elementPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Home } from "lucide-react";

// ── Detect JSON shape ─────────────────────────────────────────────────────────

type ParsedInput =
  | { status: "element"; data: PrebuiltElement }
  | { status: "component"; data: AppComponent }
  | { status: "error"; message: string }
  | { status: "empty" };

function parseInput(raw: string): ParsedInput {
  if (!raw.trim()) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { status: "error", message: "Expected a JSON object" };
  }

  const obj = parsed as Record<string, unknown>;

  // Component: has 'elements' array at top level and no 'elementTypeId'
  if (Array.isArray(obj.elements) && !obj.elementTypeId) {
    const comp = normalizeComponentFromRaw(obj);
    if (comp) return { status: "component", data: comp };
    return { status: "error", message: "Could not parse as component" };
  }

  // Prebuilt element: has 'id' starting with 'element-'
  if (typeof obj.id === "string" && obj.id.startsWith("element-")) {
    return { status: "element", data: obj as unknown as PrebuiltElement };
  }

  // ComponentElement: has 'elementTypeId'
  if (typeof obj.elementTypeId === "string") {
    const comp = normalizeComponentFromRaw({
      id: crypto.randomUUID(),
      label: "Preview",
      elements: [obj],
      styles: {},
    });
    if (comp) return { status: "component", data: comp };
    return { status: "error", message: "Could not wrap element for preview" };
  }

  return {
    status: "error",
    message:
      "Unrecognized JSON shape — expected a prebuilt element (id: 'element-*'), a component element (elementTypeId: '...'), or a component (elements: [...])",
  };
}

// ── Inline component element renderer (mirrors App.tsx logic) ─────────────────

const getNormalizedIconKey = (name: string) =>
  name
    .trim()
    .replace(/[-_\s]+/g, "")
    .toLowerCase();

function getLucideIconComponent(name: string) {
  const normalized = getNormalizedIconKey(name);
  for (const [key, comp] of Object.entries(LucideIcons) as [
    string,
    unknown,
  ][]) {
    const baseKey = key.endsWith("Icon") ? key.slice(0, -4) : key;
    if (getNormalizedIconKey(baseKey) === normalized)
      return comp as React.ComponentType<{ size?: number; className?: string }>;
  }
  return null;
}

function renderComponentElement(element: ComponentElement): ReactNode {
  if (element.elementTypeId === "element-text") {
    const fontSize = `${0.5 + element.styles.size * 0.125}rem`;
    const alignClass =
      element.styles.alignment === "left"
        ? "text-left"
        : element.styles.alignment === "right"
          ? "text-right"
          : "text-center";
    return (
      <p
        className={`${alignClass} w-full ${element.styles.isLabel ? "text-muted-foreground" : "text-foreground"}`}
        style={{
          fontSize,
          fontWeight: element.styles.isBold
            ? 700
            : (element.styles.fontWeight ?? 400),
          fontStyle: element.styles.isItalic ? "italic" : "normal",
        }}
      >
        {element.value || "Text"}
      </p>
    );
  }

  if (element.elementTypeId === "element-toggle") {
    const positionClass =
      element.styles.position === "left"
        ? "justify-start"
        : element.styles.position === "right"
          ? "justify-end"
          : "justify-center";
    return (
      <div className={`flex w-full ${positionClass}`}>
        <Switch defaultChecked={element.defaultValue} />
      </div>
    );
  }

  if (element.elementTypeId === "element-button") {
    const widthStyle: CSSProperties =
      element.styles.width === "auto"
        ? {}
        : {
            width:
              element.styles.width === "full"
                ? "100%"
                : `${element.styles.width}px`,
          };
    return (
      <Button
        variant={element.isGhost ? "ghost" : "default"}
        className={element.styles.width === "full" ? "w-full" : undefined}
        style={widthStyle}
      >
        {element.label}
      </Button>
    );
  }

  if (element.elementTypeId === "element-select") {
    const options = element.values.filter((v) => v.trim().length > 0);
    return (
      <Select defaultValue={options.length > 0 ? "0" : undefined}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={String(index)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (element.elementTypeId === "element-text-input") {
    const widthStyle: CSSProperties =
      element.styles.width === "full"
        ? { width: "100%" }
        : { width: `${element.styles.width}px` };
    return (
      <Input
        className={element.styles.width === "full" ? "w-full" : undefined}
        style={widthStyle}
        defaultValue={element.value}
        placeholder={element.textHint}
      />
    );
  }

  if (element.elementTypeId === "element-icon") {
    const IconComponent = getLucideIconComponent(element.value) ?? Home;
    const size = 10 + element.styles.size * 2;
    return <IconComponent size={size} className="text-foreground" />;
  }

  if (element.elementTypeId === "element-image") {
    return (
      <img
        src={element.src}
        alt="preview"
        className="rounded border border-border bg-muted"
        style={{
          width: toCssDimension(element.styles.width),
          height: toCssDimension(element.styles.height),
          objectFit: element.styles.sizing,
        }}
      />
    );
  }

  if (isContainerElement(element)) {
    const isHoriz = element.elementTypeId === "element-horizontal-container";
    const overflowStyle = getFlexOverflowStyle(
      isHoriz ? "horizontal" : "vertical",
      element.styles.overflowScroll,
    );
    const bgStyle: CSSProperties = isTransparentHex(
      element.styles.backgroundColor,
    )
      ? {}
      : { backgroundColor: element.styles.backgroundColor };
    return (
      <div
        className={`flex w-full ${isHoriz ? "flex-row" : "flex-col"} ${element.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexJustifyClass(element.styles.justifyContent)} ${getFlexAlignItemsClass(element.styles.alignItems)}`}
        style={{
          gap: `${element.styles.gap}px`,
          minWidth:
            element.styles.minWidth > 0
              ? `${element.styles.minWidth}px`
              : undefined,
          maxWidth:
            element.styles.maxWidth > 0
              ? `${element.styles.maxWidth}px`
              : undefined,
          minHeight:
            element.styles.minHeight > 0
              ? `${element.styles.minHeight}px`
              : undefined,
          maxHeight:
            element.styles.maxHeight > 0
              ? `${element.styles.maxHeight}px`
              : undefined,
          paddingTop: `${element.styles.paddingTop}px`,
          paddingBottom: `${element.styles.paddingBottom}px`,
          paddingLeft: `${element.styles.paddingLeft}px`,
          paddingRight: `${element.styles.paddingRight}px`,
          marginTop: `${element.styles.marginTop}px`,
          marginBottom: `${element.styles.marginBottom}px`,
          marginLeft: `${element.styles.marginLeft}px`,
          marginRight: `${element.styles.marginRight}px`,
          overflowX: overflowStyle.overflowX,
          overflowY: overflowStyle.overflowY,
          ...bgStyle,
          borderColor:
            element.styles.borderWidth > 0
              ? element.styles.borderColor
              : undefined,
          borderRadius: `${element.styles.borderRadius}px`,
          borderWidth: `${element.styles.borderWidth}px`,
          borderStyle: element.styles.borderWidth > 0 ? "solid" : undefined,
        }}
      >
        {element.elements.length > 0 ? (
          element.elements.map((child) => (
            <div
              key={child.instanceId}
              className={`min-w-0 ${isContainerElement(child) ? "flex self-stretch" : elementNeedsFullWidth(child) ? "w-full" : ""}`}
            >
              {renderComponentElement(child)}
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Empty container</span>
        )}
      </div>
    );
  }

  return null;
}

// ── Code generation for component element ─────────────────────────────────────

function codeForComponentElement(
  element: ComponentElement,
  indent = "  ",
): string {
  if (element.elementTypeId === "element-text") {
    const align =
      element.styles.alignment === "left"
        ? "text-left"
        : element.styles.alignment === "right"
          ? "text-right"
          : "text-center";
    const label = element.styles.isLabel
      ? "text-muted-foreground"
      : "text-foreground";
    const fw = element.styles.isBold ? 700 : (element.styles.fontWeight ?? 400);
    return `${indent}<p className="${align} w-full ${label}" style={{ fontSize: "${0.5 + element.styles.size * 0.125}rem", fontWeight: ${fw} }}>${element.value || "Text"}</p>`;
  }

  if (element.elementTypeId === "element-toggle") {
    const pos =
      element.styles.position === "left"
        ? "justify-start"
        : element.styles.position === "right"
          ? "justify-end"
          : "justify-center";
    return `${indent}<div className="flex w-full ${pos}">\n${indent}  <Switch defaultChecked={${element.defaultValue}} />\n${indent}</div>`;
  }

  if (element.elementTypeId === "element-button") {
    const widthProp =
      element.styles.width === "full"
        ? 'className="w-full"'
        : element.styles.width === "auto"
          ? 'className="w-auto"'
          : `style={{ width: "${element.styles.width}px" }}`;
    const ghost = element.isGhost ? ' variant="ghost"' : "";
    return `${indent}<Button${ghost} ${widthProp}>${element.label}</Button>`;
  }

  if (element.elementTypeId === "element-select") {
    const opts = element.values
      .filter((v) => v.trim())
      .map((v, i) => `${indent}    <SelectItem value="${i}">${v}</SelectItem>`)
      .join("\n");
    return `${indent}<Select defaultValue="0">\n${indent}  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>\n${indent}  <SelectContent>\n${opts}\n${indent}  </SelectContent>\n${indent}</Select>`;
  }

  if (element.elementTypeId === "element-text-input") {
    const w =
      element.styles.width === "full"
        ? 'className="w-full"'
        : `style={{ width: "${element.styles.width}px" }}`;
    return `${indent}<Input ${w} defaultValue=${JSON.stringify(element.value)} placeholder=${JSON.stringify(element.textHint)} />`;
  }

  if (element.elementTypeId === "element-icon") {
    return `${indent}<${element.value || "Home"} size={${10 + element.styles.size * 2}} className="text-foreground" />`;
  }

  if (element.elementTypeId === "element-image") {
    return `${indent}<img src=${JSON.stringify(element.src)} alt="preview" style={{ width: "${toCssDimension(element.styles.width)}", height: "${toCssDimension(element.styles.height)}", objectFit: "${element.styles.sizing}" }} />`;
  }

  if (isContainerElement(element)) {
    const dir =
      element.elementTypeId === "element-horizontal-container"
        ? "flex-row"
        : "flex-col";
    const overflowStyle = getFlexOverflowStyle(
      element.elementTypeId === "element-horizontal-container"
        ? "horizontal"
        : "vertical",
      element.styles.overflowScroll,
    );
    const styleParts = [
      `gap: "${element.styles.gap}px"`,
      element.styles.minWidth > 0
        ? `minWidth: "${element.styles.minWidth}px"`
        : null,
      element.styles.maxWidth > 0
        ? `maxWidth: "${element.styles.maxWidth}px"`
        : null,
      element.styles.minHeight > 0
        ? `minHeight: "${element.styles.minHeight}px"`
        : null,
      element.styles.maxHeight > 0
        ? `maxHeight: "${element.styles.maxHeight}px"`
        : null,
      `paddingTop: "${element.styles.paddingTop}px"`,
      `paddingBottom: "${element.styles.paddingBottom}px"`,
      `paddingLeft: "${element.styles.paddingLeft}px"`,
      `paddingRight: "${element.styles.paddingRight}px"`,
      `marginTop: "${element.styles.marginTop}px"`,
      `marginBottom: "${element.styles.marginBottom}px"`,
      `marginLeft: "${element.styles.marginLeft}px"`,
      `marginRight: "${element.styles.marginRight}px"`,
      overflowStyle.overflowX
        ? `overflowX: "${overflowStyle.overflowX}"`
        : null,
      overflowStyle.overflowY
        ? `overflowY: "${overflowStyle.overflowY}"`
        : null,
      !isTransparentHex(element.styles.backgroundColor)
        ? `backgroundColor: "${element.styles.backgroundColor}"`
        : null,
      element.styles.borderWidth > 0
        ? `borderColor: "${element.styles.borderColor}"`
        : null,
      `borderRadius: "${element.styles.borderRadius}px"`,
      `borderWidth: "${element.styles.borderWidth}px"`,
      element.styles.borderWidth > 0 ? 'borderStyle: "solid"' : null,
    ]
      .filter((part): part is string => Boolean(part))
      .join(", ");
    const children =
      element.elements.length > 0
        ? element.elements
            .map((c) => codeForComponentElement(c, `${indent}  `))
            .join("\n")
        : `${indent}  {/* empty */}`;
    return `${indent}<div className="flex w-full ${dir} ${element.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexJustifyClass(element.styles.justifyContent)} ${getFlexAlignItemsClass(element.styles.alignItems)}" style={{ ${styleParts} }}>\n${children}\n${indent}</div>`;
  }

  return "";
}

function codeForComponent(comp: AppComponent): string {
  const dir = comp.styles.direction === "vertical" ? "flex-col" : "flex-row";
  const justifyClass = getEffectiveFlexJustifyClass(
    comp.styles.justifyContent,
    comp.elements.length,
  );

  const styleEntries: string[] = [];
  if (comp.styles.gap > 0) styleEntries.push(`gap: "${comp.styles.gap}px"`);
  if (comp.styles.minWidth > 0)
    styleEntries.push(`minWidth: "${comp.styles.minWidth}px"`);
  if (comp.styles.maxWidth > 0)
    styleEntries.push(`maxWidth: "${comp.styles.maxWidth}px"`);
  if (comp.styles.minHeight > 0)
    styleEntries.push(`minHeight: "${comp.styles.minHeight}px"`);
  if (comp.styles.maxHeight > 0)
    styleEntries.push(`maxHeight: "${comp.styles.maxHeight}px"`);
  styleEntries.push(`paddingLeft: "${comp.styles.paddingLeft}px"`);
  styleEntries.push(`paddingRight: "${comp.styles.paddingRight}px"`);
  styleEntries.push(`paddingTop: "${comp.styles.paddingTop}px"`);
  styleEntries.push(`paddingBottom: "${comp.styles.paddingBottom}px"`);
  styleEntries.push(`marginLeft: "${comp.styles.marginLeft}px"`);
  styleEntries.push(`marginRight: "${comp.styles.marginRight}px"`);
  styleEntries.push(`marginTop: "${comp.styles.marginTop}px"`);
  styleEntries.push(`marginBottom: "${comp.styles.marginBottom}px"`);
  const componentOverflowStyle = getFlexOverflowStyle(
    comp.styles.direction,
    comp.styles.overflowScroll,
  );
  if (componentOverflowStyle.overflowX) {
    styleEntries.push(`overflowX: "${componentOverflowStyle.overflowX}"`);
  }
  if (componentOverflowStyle.overflowY) {
    styleEntries.push(`overflowY: "${componentOverflowStyle.overflowY}"`);
  }
  if (!isTransparentHex(comp.styles.backgroundColor)) {
    styleEntries.push(`backgroundColor: "${comp.styles.backgroundColor}"`);
  }
  if (comp.styles.borderWidth > 0) {
    styleEntries.push(`borderColor: "${comp.styles.borderColor}"`);
    styleEntries.push(`borderWidth: "${comp.styles.borderWidth}px"`);
    styleEntries.push(`borderStyle: "solid"`);
  }
  if (comp.styles.borderRadius > 0) {
    styleEntries.push(`borderRadius: "${comp.styles.borderRadius}px"`);
  }

  const styleAttr =
    styleEntries.length > 0 ? `\n  style={{ ${styleEntries.join(", ")} }}` : "";

  const children =
    comp.elements.length > 0
      ? comp.elements.map((el) => codeForComponentElement(el, "  ")).join("\n")
      : "  {/* Add elements here */}";

  return `<div\n  className="flex w-full ${dir} ${comp.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexAlignItemsClass(comp.styles.alignItems)} ${justifyClass}"${styleAttr}\n>\n${children}\n</div>`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Playground() {
  const [jsonText, setJsonText] = useState("");

  const parsed = useMemo(() => parseInput(jsonText), [jsonText]);

  const reactCode = useMemo(() => {
    if (parsed.status === "element") return renderElementCode(parsed.data);
    if (parsed.status === "component") return codeForComponent(parsed.data);
    return null;
  }, [parsed]);

  const preview = useMemo((): ReactNode => {
    if (parsed.status === "element") return renderPrebuiltElement(parsed.data);
    if (parsed.status === "component") {
      const comp = parsed.data;
      const dir =
        comp.styles.direction === "vertical" ? "flex-col" : "flex-row";
      const justifyClass = getEffectiveFlexJustifyClass(
        comp.styles.justifyContent,
        comp.elements.length,
      );
      const overflowStyle = getFlexOverflowStyle(
        comp.styles.direction,
        comp.styles.overflowScroll,
      );
      return (
        <div
          className={`flex w-full ${dir} ${comp.styles.overflowScroll ? "" : "flex-wrap"} ${getFlexAlignItemsClass(comp.styles.alignItems)} ${justifyClass}`}
          style={{
            gap: `${comp.styles.gap}px`,
            minWidth:
              comp.styles.minWidth > 0
                ? `${comp.styles.minWidth}px`
                : undefined,
            maxWidth:
              comp.styles.maxWidth > 0
                ? `${comp.styles.maxWidth}px`
                : undefined,
            minHeight:
              comp.styles.minHeight > 0
                ? `${comp.styles.minHeight}px`
                : undefined,
            maxHeight:
              comp.styles.maxHeight > 0
                ? `${comp.styles.maxHeight}px`
                : undefined,
            paddingLeft: `${comp.styles.paddingLeft}px`,
            paddingRight: `${comp.styles.paddingRight}px`,
            paddingTop: `${comp.styles.paddingTop}px`,
            paddingBottom: `${comp.styles.paddingBottom}px`,
            marginLeft: `${comp.styles.marginLeft}px`,
            marginRight: `${comp.styles.marginRight}px`,
            marginTop: `${comp.styles.marginTop}px`,
            marginBottom: `${comp.styles.marginBottom}px`,
            overflowX: overflowStyle.overflowX,
            overflowY: overflowStyle.overflowY,
            backgroundColor: isTransparentHex(comp.styles.backgroundColor)
              ? undefined
              : comp.styles.backgroundColor,
            borderColor:
              comp.styles.borderWidth > 0 ? comp.styles.borderColor : undefined,
            borderRadius: `${comp.styles.borderRadius}px`,
            borderWidth: `${comp.styles.borderWidth}px`,
            borderStyle: comp.styles.borderWidth > 0 ? "solid" : undefined,
          }}
        >
          {comp.elements.map((el) => (
            <div
              key={el.instanceId}
              className={`min-w-0 ${isContainerElement(el) ? "flex self-stretch" : elementNeedsFullWidth(el) ? "w-full" : ""}`}
            >
              {renderComponentElement(el)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  }, [parsed]);

  return (
    <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Playground</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* JSON input */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label style={{ fontWeight: 600, fontSize: "14px" }}>JSON</label>
            {jsonText.trim() && (
              <button
                type="button"
                onClick={() => setJsonText("")}
                style={{
                  fontSize: "12px",
                  color: "#71717a",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste element, component element, or component JSON here…"
            style={{
              width: "100%",
              minHeight: "320px",
              padding: "12px",
              border: "1px solid #d4d4d8",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
              resize: "vertical",
              outline: "none",
            }}
          />
          {parsed.status === "error" && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: "#dc2626" }}>
              {parsed.message}
            </p>
          )}
          {parsed.status !== "empty" && parsed.status !== "error" && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: "#71717a" }}>
              Detected:{" "}
              <strong>
                {parsed.status === "element"
                  ? `prebuilt element (${parsed.data.id})`
                  : `component (${parsed.data.elements.length} element${parsed.data.elements.length !== 1 ? "s" : ""})`}
              </strong>
            </p>
          )}
        </div>

        {/* React code */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label style={{ fontWeight: 600, fontSize: "14px" }}>
              React Code
            </label>
            {reactCode && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Full screen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                  <DialogHeader className="shrink-0">
                    <DialogTitle className="font-mono">React Code</DialogTitle>
                  </DialogHeader>
                  <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                    {reactCode}
                  </pre>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <pre
            style={{
              width: "100%",
              minHeight: "320px",
              padding: "12px",
              border: "1px solid #d4d4d8",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
              overflowX: "auto",
              overflowY: "auto",
              background: "#f4f4f5",
              margin: 0,
              whiteSpace: "pre",
              color: reactCode ? "#18181b" : "#a1a1aa",
            }}
          >
            {reactCode ?? "React code will appear here…"}
          </pre>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <label
          style={{
            fontWeight: 600,
            fontSize: "14px",
            display: "block",
            marginBottom: "6px",
          }}
        >
          Live Preview
        </label>
        <div
          style={{
            width: "100%",
            minHeight: "80px",
            border: "1px solid #d4d4d8",
            borderRadius: "8px",
            padding: preview ? "16px" : "0",
            display: "flex",
            alignItems: preview ? undefined : "center",
            justifyContent: preview ? undefined : "center",
          }}
        >
          {preview ?? (
            <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
              Preview will appear here…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
