import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import * as LucideIcons from "lucide-react";

import {
  normalizeComponentFromRaw,
  isContainerElement,
  elementNeedsFullWidth,
  getBoxSpacingStyle,
  getFlexJustifyClass,
  getFlexAlignItemsClass,
  getEffectiveFlexJustifyClass,
  getFlexOverflowStyle,
  toCssDimension,
  isTransparentHex,
  resolveThemeColor,
  type ComponentElement,
  type AppComponent,
} from "./App";
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

type SummaryTab = "pages" | "components";

type SummaryPageItem = {
  id: string;
  title: string;
  source: "config" | "prebuilt";
};

type SummaryThemeMode = "light" | "dark";
type SummaryThemeKey =
  | "primary"
  | "secondary"
  | "tertiary"
  | "highlight"
  | "background"
  | "border"
  | "text"
  | "button"
  | "textHint";

type SummaryColorThemePair = {
  light: string;
  dark: string;
};

type SummaryColorTheme = Record<SummaryThemeKey, SummaryColorThemePair>;

const SUMMARY_THEME_KEYS: SummaryThemeKey[] = [
  "primary",
  "secondary",
  "tertiary",
  "highlight",
  "background",
  "border",
  "text",
  "button",
  "textHint",
];

const DEFAULT_SUMMARY_COLOR_THEME: SummaryColorTheme = {
  primary: { light: "#6366f1", dark: "#818cf8" },
  secondary: { light: "#64748b", dark: "#94a3b8" },
  tertiary: { light: "#a855f7", dark: "#c084fc" },
  highlight: { light: "#f59e0b", dark: "#fbbf24" },
  background: { light: "#ffffff", dark: "#0f172a" },
  border: { light: "#e2e8f0", dark: "#334155" },
  text: { light: "#111827", dark: "#e2e8f0" },
  button: { light: "#2563eb", dark: "#3b82f6" },
  textHint: { light: "#71717a", dark: "#94a3b8" },
};

const normalizeSummaryColorTheme = (raw: unknown): SummaryColorTheme => {
  const candidate =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<
          Record<SummaryThemeKey, Partial<SummaryColorThemePair>>
        >)
      : {};

  return SUMMARY_THEME_KEYS.reduce((acc, key) => {
    const fallback = DEFAULT_SUMMARY_COLOR_THEME[key];
    const value = candidate[key];
    acc[key] = {
      light:
        value && typeof value.light === "string" ? value.light : fallback.light,
      dark:
        value && typeof value.dark === "string" ? value.dark : fallback.dark,
    };
    return acc;
  }, {} as SummaryColorTheme);
};

const getSpacingCodeParts = (styles: {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}): string[] => [
  `paddingTop: "${styles.paddingTop}px"`,
  `paddingBottom: "${styles.paddingBottom}px"`,
  `paddingLeft: "${styles.paddingLeft}px"`,
  `paddingRight: "${styles.paddingRight}px"`,
  `marginTop: "${styles.marginTop}px"`,
  `marginBottom: "${styles.marginBottom}px"`,
  `marginLeft: "${styles.marginLeft}px"`,
  `marginRight: "${styles.marginRight}px"`,
];

type ParsedKind =
  | {
      kind: "project";
      pages: SummaryPageItem[];
      components: AppComponent[];
      colorTheme: SummaryColorTheme;
    }
  | { kind: "error"; message: string }
  | { kind: "empty" };

function parseProjectInput(raw: string): ParsedKind {
  if (!raw.trim()) return { kind: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "error", message: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { kind: "error", message: "Expected a JSON object" };
  }

  const root = parsed as Record<string, unknown>;
  const configRoot =
    root.config &&
    typeof root.config === "object" &&
    !Array.isArray(root.config)
      ? (root.config as Record<string, unknown>)
      : root;
  const prebuiltRoot =
    root.prebuilt &&
    typeof root.prebuilt === "object" &&
    !Array.isArray(root.prebuilt)
      ? (root.prebuilt as Record<string, unknown>)
      : null;

  const pages: SummaryPageItem[] = [];

  if (Array.isArray(configRoot.pages)) {
    for (const entry of configRoot.pages) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const page = entry as Record<string, unknown>;
      const id = typeof page.id === "string" ? page.id : "";
      const title =
        typeof page.title === "string" && page.title.trim().length > 0
          ? page.title
          : id;
      if (!id) continue;
      pages.push({ id, title, source: "config" });
    }
  }

  if (prebuiltRoot && Array.isArray(prebuiltRoot.pages)) {
    for (const entry of prebuiltRoot.pages) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const page = entry as Record<string, unknown>;
      const id = typeof page.id === "string" ? page.id : "";
      const title =
        typeof page.title === "string" && page.title.trim().length > 0
          ? page.title
          : id;
      if (!id) continue;
      pages.push({ id, title, source: "prebuilt" });
    }
  }

  const rawComponents: unknown[] = [];

  if (Array.isArray(configRoot.components)) {
    rawComponents.push(...configRoot.components);
  }

  if (Array.isArray(configRoot.customComponents)) {
    rawComponents.push(...configRoot.customComponents);
  }

  const components = rawComponents
    .map((entry) => normalizeComponentFromRaw(entry))
    .filter((entry): entry is AppComponent => Boolean(entry));
  const colorTheme = normalizeSummaryColorTheme(configRoot.colorTheme);

  if (pages.length === 0 && components.length === 0) {
    return {
      kind: "error",
      message:
        "No pages or components found. Expected full project JSON with config/pages/components.",
    };
  }

  return { kind: "project", pages, components, colorTheme };
}

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
    if (getNormalizedIconKey(baseKey) === normalized) {
      return comp as React.ComponentType<{ size?: number; className?: string }>;
    }
  }
  return null;
}

function renderComponentElement(
  element: ComponentElement,
  resolveColor: (color: string) => string,
): ReactNode {
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
        className={`${alignClass} w-full`}
        style={{
          ...getBoxSpacingStyle(element.styles),
          fontSize,
          fontWeight: element.styles.isBold
            ? 700
            : (element.styles.fontWeight ?? 400),
          fontStyle: element.styles.isItalic ? "italic" : "normal",
          color: resolveColor(
            element.styles.isLabel
              ? (((element.styles as Record<string, unknown>)
                  .labelColor as string) ?? "$textHint")
              : (((element.styles as Record<string, unknown>)
                  .textColor as string) ?? "$text"),
          ),
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
      <div
        className={`flex w-full ${positionClass}`}
        style={getBoxSpacingStyle(element.styles)}
      >
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
        style={{
          ...getBoxSpacingStyle(element.styles),
          ...widthStyle,
          color: resolveColor(
            ((element.styles as Record<string, unknown>).textColor as string) ??
              "$text",
          ),
          backgroundColor: element.isGhost
            ? "transparent"
            : resolveColor(
                ((element.styles as Record<string, unknown>)
                  .backgroundColor as string) ?? "$button",
              ),
        }}
      >
        {element.label}
      </Button>
    );
  }

  if (element.elementTypeId === "element-select") {
    const options = element.values.filter((v) => v.trim().length > 0);
    return (
      <Select defaultValue={options.length > 0 ? "0" : undefined}>
        <SelectTrigger
          className="w-44"
          style={{
            ...getBoxSpacingStyle(element.styles),
            color: resolveColor(
              ((element.styles as Record<string, unknown>)
                .textColor as string) ?? "$text",
            ),
            backgroundColor: resolveColor(
              ((element.styles as Record<string, unknown>)
                .backgroundColor as string) ?? "$secondary",
            ),
            borderColor: resolveColor(
              ((element.styles as Record<string, unknown>)
                .borderColor as string) ?? "$border",
            ),
          }}
        >
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
        style={{
          ...getBoxSpacingStyle(element.styles),
          ...widthStyle,
          color: resolveColor(
            ((element.styles as Record<string, unknown>).textColor as string) ??
              "$text",
          ),
          backgroundColor: resolveColor(
            ((element.styles as Record<string, unknown>)
              .backgroundColor as string) ?? "$secondary",
          ),
          borderColor: resolveColor(
            ((element.styles as Record<string, unknown>)
              .borderColor as string) ?? "$border",
          ),
        }}
        defaultValue={element.value}
        placeholder={element.textHint}
      />
    );
  }

  if (element.elementTypeId === "element-icon") {
    const IconComponent = getLucideIconComponent(element.value) ?? Home;
    const size = 10 + element.styles.size * 2;
    return (
      <IconComponent
        size={size}
        style={{
          ...getBoxSpacingStyle(element.styles),
          color: resolveColor(
            ((element.styles as Record<string, unknown>).color as string) ??
              "$text",
          ),
        }}
      />
    );
  }

  if (element.elementTypeId === "element-image") {
    return (
      <img
        src={element.src}
        alt="preview"
        className="rounded border border-border bg-muted"
        style={{
          ...getBoxSpacingStyle(element.styles),
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
      : { backgroundColor: resolveColor(element.styles.backgroundColor) };
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
              ? resolveColor(element.styles.borderColor)
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
              style={
                child.flex === null || child.flex === undefined
                  ? undefined
                  : child.flex === 0
                    ? { flex: "0 0 auto" }
                    : { flex: `${child.flex} ${child.flex} 0%` }
              }
            >
              {renderComponentElement(child, resolveColor)}
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
    return `${indent}<p className="${align} w-full ${label}" style={{ fontSize: "${0.5 + element.styles.size * 0.125}rem", fontWeight: ${fw}, ${getSpacingCodeParts(element.styles).join(", ")} }}>${element.value || "Text"}</p>`;
  }

  if (element.elementTypeId === "element-toggle") {
    const pos =
      element.styles.position === "left"
        ? "justify-start"
        : element.styles.position === "right"
          ? "justify-end"
          : "justify-center";
    return `${indent}<div className="flex w-full ${pos}" style={{ ${getSpacingCodeParts(element.styles).join(", ")} }}>\n${indent}  <Switch defaultChecked={${element.defaultValue}} />\n${indent}</div>`;
  }

  if (element.elementTypeId === "element-button") {
    const widthProp =
      element.styles.width === "full"
        ? 'className="w-full"'
        : 'className="w-auto"';
    const styleProp =
      element.styles.width === "auto"
        ? `style={{ ${getSpacingCodeParts(element.styles).join(", ")} }}`
        : `style={{ width: "${element.styles.width}px", ${getSpacingCodeParts(element.styles).join(", ")} }}`;
    const ghost = element.isGhost ? ' variant="ghost"' : "";
    return `${indent}<Button${ghost} ${widthProp} ${styleProp}>${element.label}</Button>`;
  }

  if (element.elementTypeId === "element-select") {
    const opts = element.values
      .filter((v) => v.trim())
      .map((v, i) => `${indent}    <SelectItem value="${i}">${v}</SelectItem>`)
      .join("\n");
    return `${indent}<Select defaultValue="0">\n${indent}  <SelectTrigger className="w-44" style={{ ${getSpacingCodeParts(element.styles).join(", ")} }}><SelectValue /></SelectTrigger>\n${indent}  <SelectContent>\n${opts}\n${indent}  </SelectContent>\n${indent}</Select>`;
  }

  if (element.elementTypeId === "element-text-input") {
    const w = element.styles.width === "full" ? 'className="w-full"' : "";
    const style =
      element.styles.width === "full"
        ? `style={{ width: "100%", ${getSpacingCodeParts(element.styles).join(", ")} }}`
        : `style={{ width: "${element.styles.width}px", ${getSpacingCodeParts(element.styles).join(", ")} }}`;
    return `${indent}<Input ${w} ${style} defaultValue=${JSON.stringify(element.value)} placeholder=${JSON.stringify(element.textHint)} />`;
  }

  if (element.elementTypeId === "element-icon") {
    return `${indent}<${element.value || "Home"} size={${10 + element.styles.size * 2}} className="text-foreground" style={{ ${getSpacingCodeParts(element.styles).join(", ")} }} />`;
  }

  if (element.elementTypeId === "element-image") {
    return `${indent}<img src=${JSON.stringify(element.src)} alt="preview" style={{ width: "${toCssDimension(element.styles.width)}", height: "${toCssDimension(element.styles.height)}", objectFit: "${element.styles.sizing}", ${getSpacingCodeParts(element.styles).join(", ")} }} />`;
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
    styleEntries.push('borderStyle: "solid"');
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

export default function Summary() {
  const [jsonText, setJsonText] = useState("");
  const [activeTab, setActiveTab] = useState<SummaryTab>("components");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");

  const parsed = useMemo(() => parseProjectInput(jsonText), [jsonText]);
  const [themeMode, setThemeMode] = useState<SummaryThemeMode>("light");

  const pages = parsed.kind === "project" ? parsed.pages : [];
  const components = parsed.kind === "project" ? parsed.components : [];
  const colorTheme =
    parsed.kind === "project" ? parsed.colorTheme : DEFAULT_SUMMARY_COLOR_THEME;
  const resolveColor = (color: string): string =>
    resolveThemeColor(color, colorTheme, themeMode);

  const selectedPage =
    pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;
  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ??
    components[0] ??
    null;

  const reactCode = useMemo(() => {
    if (activeTab !== "components") return null;
    if (!selectedComponent) return null;
    return codeForComponent(selectedComponent);
  }, [activeTab, selectedComponent, themeMode, colorTheme]);

  const preview = useMemo((): ReactNode => {
    if (activeTab === "pages") return null;
    if (!selectedComponent) return null;

    const comp = selectedComponent;
    const dir = comp.styles.direction === "vertical" ? "flex-col" : "flex-row";
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
            comp.styles.minWidth > 0 ? `${comp.styles.minWidth}px` : undefined,
          maxWidth:
            comp.styles.maxWidth > 0 ? `${comp.styles.maxWidth}px` : undefined,
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
            : resolveColor(comp.styles.backgroundColor),
          borderColor:
            comp.styles.borderWidth > 0
              ? resolveColor(comp.styles.borderColor)
              : undefined,
          borderRadius: `${comp.styles.borderRadius}px`,
          borderWidth: `${comp.styles.borderWidth}px`,
          borderStyle: comp.styles.borderWidth > 0 ? "solid" : undefined,
        }}
      >
        {comp.elements.map((el) => (
          <div
            key={el.instanceId}
            className={`min-w-0 ${isContainerElement(el) ? "flex self-stretch" : elementNeedsFullWidth(el) ? "w-full" : ""}`}
            style={
              el.flex === null || el.flex === undefined
                ? undefined
                : el.flex === 0
                  ? { flex: "0 0 auto" }
                  : { flex: `${el.flex} ${el.flex} 0%` }
            }
          >
            {renderComponentElement(el, resolveColor)}
          </div>
        ))}
      </div>
    );
  }, [activeTab, selectedComponent, themeMode, colorTheme]);

  return (
    <div style={{ padding: "16px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Summary</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
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
            placeholder="Paste full project JSON here..."
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
          {parsed.kind === "error" && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: "#dc2626" }}>
              {parsed.message}
            </p>
          )}
          {parsed.kind === "project" && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: "#71717a" }}>
              Detected: <strong>{pages.length}</strong> page
              {pages.length !== 1 ? "s" : ""} and{" "}
              <strong>{components.length}</strong>
              component{components.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <Button
          type="button"
          variant={activeTab === "pages" ? "default" : "outline"}
          onClick={() => setActiveTab("pages")}
        >
          Pages
        </Button>
        <Button
          type="button"
          variant={activeTab === "components" ? "default" : "outline"}
          onClick={() => setActiveTab("components")}
        >
          Components
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "16px",
        }}
      >
        <div
          style={{
            border: "1px solid #d4d4d8",
            borderRadius: "8px",
            padding: "8px",
            minHeight: "300px",
            background: "#ffffff",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 600, margin: "4px 0 8px" }}>
            {activeTab === "pages" ? "Pages" : "Components"}
          </p>

          {(
            activeTab === "pages" ? pages.length === 0 : components.length === 0
          ) ? (
            <p style={{ color: "#71717a", fontSize: "13px", margin: 0 }}>
              No {activeTab} found.
            </p>
          ) : activeTab === "pages" ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {pages.map((page) => {
                const isSelected = (selectedPage?.id ?? "") === page.id;
                return (
                  <button
                    key={`${page.source}-${page.id}`}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    style={{
                      textAlign: "left",
                      border: `1px solid ${isSelected ? "#2563eb" : "#d4d4d8"}`,
                      borderRadius: "6px",
                      padding: "8px",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                      {page.title || page.id}
                    </div>
                    <div style={{ fontSize: "11px", color: "#71717a" }}>
                      {page.id} | {page.source}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {components.map((component) => {
                const isSelected =
                  (selectedComponent?.id ?? "") === component.id;
                return (
                  <button
                    key={component.id}
                    type="button"
                    onClick={() => setSelectedComponentId(component.id)}
                    style={{
                      textAlign: "left",
                      border: `1px solid ${isSelected ? "#2563eb" : "#d4d4d8"}`,
                      borderRadius: "6px",
                      padding: "8px",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                      {component.label || "Untitled Component"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#71717a" }}>
                      {component.elements.length} element
                      {component.elements.length !== 1 ? "s" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              border: "1px solid #d4d4d8",
              borderRadius: "8px",
              padding: "12px",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label style={{ fontWeight: 600, fontSize: "14px" }}>
                React Code
              </label>
              {activeTab === "components" && reactCode && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      View React Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                    <DialogHeader className="shrink-0">
                      <DialogTitle className="font-mono">
                        React Code
                      </DialogTitle>
                    </DialogHeader>
                    <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                      {reactCode}
                    </pre>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#71717a",
              }}
            >
              {activeTab === "pages"
                ? "React code is only shown for components."
                : reactCode
                  ? "Click 'View React Code' to open the full popup."
                  : "Select a component to view code..."}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <label
            style={{
              fontWeight: 600,
              fontSize: "14px",
              display: "block",
              marginBottom: 0,
            }}
          >
            Live Preview
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                color: themeMode === "light" ? "#111827" : "#71717a",
              }}
            >
              Light
            </span>
            <Switch
              checked={themeMode === "dark"}
              onCheckedChange={(checked) =>
                setThemeMode(checked ? "dark" : "light")
              }
              aria-label="Toggle dark mode for summary preview"
            />
            <span
              style={{
                fontSize: "12px",
                color: themeMode === "dark" ? "#111827" : "#71717a",
              }}
            >
              Dark
            </span>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            minHeight: "140px",
            border: `1px solid ${resolveColor("$border")}`,
            borderRadius: "8px",
            padding: preview ? "16px" : "0",
            display: "flex",
            alignItems: preview ? undefined : "center",
            justifyContent: preview ? undefined : "center",
            backgroundColor: resolveColor("$background"),
            color: resolveColor("$text"),
          }}
        >
          {activeTab === "pages" ? (
            <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
              Page preview not implemented yet.
            </span>
          ) : (
            (preview ?? (
              <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
                Select a component to preview...
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
