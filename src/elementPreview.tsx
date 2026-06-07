import type { ComponentType, CSSProperties, ReactNode } from "react";
import * as LucideIcons from "lucide-react";

import { PREBUILT_ELEMENTS } from "./App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type PrebuiltElement = (typeof PREBUILT_ELEMENTS)[number];

const toPascalCase = (value: string): string =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toCssDimension = (value: unknown): string | undefined => {
  if (typeof value === "number") return `${value}px`;
  if (typeof value !== "string") return undefined;
  if (/^\d+(\.\d+)?$/.test(value.trim())) return `${value.trim()}px`;
  if (value === "full") return "100%";
  if (value === "auto") return "auto";
  return value;
};

const toJustifyContent = (value: unknown): CSSProperties["justifyContent"] => {
  switch (value) {
    case "start":
      return "flex-start";
    case "end":
      return "flex-end";
    case "space-between":
    case "space-around":
    case "space-evenly":
    case "center":
      return value;
    default:
      return "flex-start";
  }
};

const toAlignItems = (value: unknown): CSSProperties["alignItems"] => {
  switch (value) {
    case "start":
      return "flex-start";
    case "end":
      return "flex-end";
    case "center":
    case "stretch":
      return value;
    default:
      return "stretch";
  }
};

const toHorizontalJustify = (value: unknown): CSSProperties["justifyContent"] => {
  if (value === "left") return "flex-start";
  if (value === "right") return "flex-end";
  return "center";
};

const resolveTextFontWeight = (styles: PrebuiltElement["styles"]): number => {
  if (typeof styles?.fontWeight === "number" && Number.isFinite(styles.fontWeight)) {
    return Math.max(100, Math.min(900, Math.round(styles.fontWeight)));
  }

  return styles?.isBold ? 700 : 400;
};

const formatStyleObject = (style: Record<string, unknown>): string => {
  const entries = Object.entries(style).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return "";

  const body = entries
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `${key}: ${JSON.stringify(value)}`;
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return `${key}: ${String(value)}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join(", ");

  return ` style={{ ${body} }}`;
};

export const renderPrebuiltElement = (element: PrebuiltElement): ReactNode => {
  if (element.id === "element-text") {
    const fontWeight = resolveTextFontWeight(element.styles);
    const style: CSSProperties = {
      textAlign:
        element.styles?.alignment === "left" ||
        element.styles?.alignment === "right" ||
        element.styles?.alignment === "center"
          ? element.styles.alignment
          : "center",
      fontSize: `${0.5 + (typeof element.styles?.size === "number" ? element.styles.size : 3) * 0.125}rem`,
      fontWeight,
      fontStyle: element.styles?.isItalic ? "italic" : "normal",
      color: element.styles?.isLabel ? "#71717a" : undefined,
      width: "100%",
    };

    return <p style={style}>{typeof element.value === "string" && element.value ? element.value : "Text"}</p>;
  }

  if (element.id === "element-toggle") {
    const justifyContent =
      element.styles?.position === "left"
        ? "flex-start"
        : element.styles?.position === "right"
          ? "flex-end"
          : "center";

    return (
      <div style={{ display: "flex", justifyContent, width: "100%" }}>
        <Switch checked={Boolean(element.value)} disabled />
      </div>
    );
  }

  if (element.id === "element-button") {
    const width = toCssDimension(element.styles?.width);
    const justifyContent = toHorizontalJustify(element.styles?.alignment);
    return (
      <div style={{ display: "flex", justifyContent, width: "100%" }}>
        <Button
          variant={element.isGhost ? "ghost" : "default"}
          style={{ width }}
          className={element.styles?.width === "full" ? "w-full" : "w-auto"}
        >
          {element.buttonLabel || "Button"}
        </Button>
      </div>
    );
  }

  if (element.id === "element-select") {
    const options = Array.isArray(element.values) && element.values.length > 0 ? element.values : ["Value One"];
    const showDefaultLabel = element.showDefaultLabel !== false;
    const defaultLabel = typeof element.defaultLabel === "string" && element.defaultLabel.trim().length > 0
      ? element.defaultLabel
      : "Please Select";

    return (
      <Select key={showDefaultLabel ? "placeholder" : "first-option"} defaultValue={showDefaultLabel ? undefined : "0"}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={defaultLabel} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={`${element.id}-${index}`} value={String(index)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (element.id === "element-text-input") {
    const width = toCssDimension(element.styles?.width);
    return (
      <Input
        defaultValue={typeof element.value === "string" ? element.value : ""}
        placeholder={element.textHint || ""}
        style={{ width }}
        className={element.styles?.width === "full" ? "w-full" : undefined}
      />
    );
  }

  if (element.id === "element-icon") {
    const iconName = toPascalCase(typeof element.value === "string" ? element.value : "Home") || "Home";
    const Icon =
      (LucideIcons as Record<string, ComponentType<{ size?: number; color?: string }>>)[iconName] ||
      LucideIcons.Ban;
    const isRecognized = Boolean((LucideIcons as Record<string, unknown>)[iconName]);
    const sizeRaw = typeof element.styles?.size === "number" ? element.styles.size : 24;
    const size = Math.max(8, Math.min(96, Math.round(sizeRaw)));
    const justifyContent = toHorizontalJustify(element.styles?.alignment);

    return (
      <div style={{ display: "flex", justifyContent, width: "100%" }}>
        <Icon size={size} color={isRecognized ? undefined : "#dc2626"} />
      </div>
    );
  }

  if (element.id === "element-image") {
    const containerWidth = toCssDimension(element.styles?.containerWidth) || "auto";
    const containerHeight = toCssDimension(element.styles?.containerHeight) || "auto";
    const justifyContent = toHorizontalJustify(element.styles?.alignment);

    return (
      <div style={{ display: "flex", justifyContent, width: "100%" }}>
        <div style={{ width: containerWidth, height: containerHeight }}>
          <img
            src={element.src || "https://placehold.co/600x400"}
            alt="Preview"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit:
                element.styles?.sizing === "cover"
                  ? element.styles.sizing
                  : "contain",
            }}
          />
        </div>
      </div>
    );
  }

  if (element.id === "element-vertical-container") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: toJustifyContent(element.styles?.justifyContent),
          alignItems: toAlignItems(element.styles?.alignItems),
          gap: typeof element.styles?.gap === "number" ? `${element.styles.gap}px` : "8px",
          minHeight: "96px",
          backgroundColor: typeof element.styles?.backgroundColor === "string" ? element.styles.backgroundColor : undefined,
          borderColor: typeof element.styles?.borderColor === "string" ? element.styles.borderColor : undefined,
          borderRadius: typeof element.styles?.borderRadius === "number" ? `${element.styles.borderRadius}px` : undefined,
          borderWidth: typeof element.styles?.borderWidth === "number" ? `${element.styles.borderWidth}px` : undefined,
          borderStyle: typeof element.styles?.borderWidth === "number" && element.styles.borderWidth > 0 ? "solid" : undefined,
          padding: "12px",
        }}
      >
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    );
  }

  return null;
};

export const renderElementCode = (element: PrebuiltElement): string => {
  if (element.id === "element-text") {
    const fontWeight = resolveTextFontWeight(element.styles);
    const style = formatStyleObject({
      textAlign: element.styles?.alignment || "center",
      fontSize: `${0.5 + (typeof element.styles?.size === "number" ? element.styles.size : 3) * 0.125}rem`,
      fontWeight,
      fontStyle: element.styles?.isItalic ? "italic" : "normal",
      color: element.styles?.isLabel ? "#71717a" : undefined,
    });
    return `<p${style}>${typeof element.value === "string" && element.value ? element.value : "Text"}</p>`;
  }

  if (element.id === "element-toggle") {
    const justifyContent =
      element.styles?.position === "left"
        ? "flex-start"
        : element.styles?.position === "right"
          ? "flex-end"
          : "center";
    return `<div style={{ display: "flex", justifyContent: ${JSON.stringify(justifyContent)}, width: "100%" }}><Switch checked={${Boolean(element.value)}} disabled /></div>`;
  }

  if (element.id === "element-button") {
    const style = formatStyleObject({ width: toCssDimension(element.styles?.width) });
    const variantProp = element.isGhost ? ' variant="ghost"' : "";
    const className = element.styles?.width === "full" ? ' className="w-full"' : ' className="w-auto"';
    const justifyContent = toHorizontalJustify(element.styles?.alignment);
    return `<div style={{ display: "flex", justifyContent: ${JSON.stringify(justifyContent)}, width: "100%" }}><Button${variantProp}${className}${style}>${element.buttonLabel || "Button"}</Button></div>`;
  }

  if (element.id === "element-select") {
    const options = Array.isArray(element.values) && element.values.length > 0 ? element.values : ["Value One"];
    const showDefaultLabel = element.showDefaultLabel !== false;
    const defaultValue = showDefaultLabel ? undefined : "0";
    const defaultLabel = typeof element.defaultLabel === "string" && element.defaultLabel.trim().length > 0
      ? element.defaultLabel
      : "Please Select";
    const items = options
      .map((option, index) => `    <SelectItem value=${JSON.stringify(String(index))}>${option}</SelectItem>`)
      .join("\n");
    return `<Select${defaultValue ? ` defaultValue=${JSON.stringify(defaultValue)}` : ""}>\n  <SelectTrigger className="w-44">\n    <SelectValue placeholder=${JSON.stringify(defaultLabel)} />\n  </SelectTrigger>\n  <SelectContent>\n${items}\n  </SelectContent>\n</Select>`;
  }

  if (element.id === "element-text-input") {
    const style = formatStyleObject({ width: toCssDimension(element.styles?.width) });
    return `<Input defaultValue=${JSON.stringify(typeof element.value === "string" ? element.value : "")} placeholder=${JSON.stringify(element.textHint || "")} className=${JSON.stringify(element.styles?.width === "full" ? "w-full" : "")} ${style} />`;
  }

  if (element.id === "element-icon") {
    const iconName = toPascalCase(typeof element.value === "string" ? element.value : "Home") || "Home";
    const isRecognized = Boolean((LucideIcons as Record<string, unknown>)[iconName]);
    const emittedIcon = isRecognized ? iconName : "Ban";
    const sizeRaw = typeof element.styles?.size === "number" ? element.styles.size : 24;
    const size = Math.max(8, Math.min(96, Math.round(sizeRaw)));
    const justifyContent = toHorizontalJustify(element.styles?.alignment);
    return `<div style={{ display: "flex", justifyContent: ${JSON.stringify(justifyContent)}, width: "100%" }}><${emittedIcon} size={${size}}${isRecognized ? "" : ' color="#dc2626"'} /></div>`;
  }

  if (element.id === "element-image") {
    const justifyContent = toHorizontalJustify(element.styles?.alignment);
    const style = formatStyleObject({
      display: "block",
      width: "100%",
      height: "100%",
      objectFit:
        element.styles?.sizing === "cover"
          ? element.styles.sizing
          : "contain",
    });
    const containerStyle = formatStyleObject({
      width: toCssDimension(element.styles?.containerWidth) || "auto",
      height: toCssDimension(element.styles?.containerHeight) || "auto",
    });
    return `<div style={{ display: "flex", justifyContent: ${JSON.stringify(justifyContent)}, width: "100%" }}><div${containerStyle}><img src=${JSON.stringify(element.src || "https://placehold.co/600x400")} alt="Preview"${style} /></div></div>`;
  }

  if (element.id === "element-vertical-container") {
    const style = formatStyleObject({
      display: "flex",
      flexDirection: "column",
      justifyContent: toJustifyContent(element.styles?.justifyContent),
      alignItems: toAlignItems(element.styles?.alignItems),
      gap: typeof element.styles?.gap === "number" ? `${element.styles.gap}px` : "8px",
      minHeight: "96px",
      backgroundColor: element.styles?.backgroundColor,
      borderColor: element.styles?.borderColor,
      borderRadius: typeof element.styles?.borderRadius === "number" ? `${element.styles.borderRadius}px` : undefined,
      borderWidth: typeof element.styles?.borderWidth === "number" ? `${element.styles.borderWidth}px` : undefined,
      borderStyle: typeof element.styles?.borderWidth === "number" && element.styles.borderWidth > 0 ? "solid" : undefined,
      padding: "12px",
    });
    return `<div${style}>\n  <div>Item 1</div>\n  <div>Item 2</div>\n</div>`;
  }

  return "";
};
