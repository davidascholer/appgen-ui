import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { PREBUILT_ELEMENTS } from "./App";
import {
  type PrebuiltElement,
  renderElementCode,
  renderPrebuiltElement,
} from "./elementPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const cloneElement = (element: PrebuiltElement): PrebuiltElement =>
  JSON.parse(JSON.stringify(element)) as PrebuiltElement;

const cloneElements = (): PrebuiltElement[] =>
  PREBUILT_ELEMENTS.filter(
    (element) => element.id !== "element-vertical-container",
  ).map((element) => cloneElement(element));

const setValueAtPath = (
  source: PrebuiltElement,
  path: Array<string | number>,
  value: unknown,
): PrebuiltElement => {
  const next = cloneElement(source) as Record<string, unknown>;
  let cursor: Record<string | number, unknown> = next;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const nested = cursor[key];
    if (nested && typeof nested === "object") {
      cursor = nested as Record<string | number, unknown>;
    } else {
      cursor[key] = {};
      cursor = cursor[key] as Record<string | number, unknown>;
    }
  }

  cursor[path[path.length - 1]] = value;
  return next as PrebuiltElement;
};

const getFixedOptionsForField = (
  fieldName: string,
  value: unknown,
): string[] | null => {
  if (fieldName === "alignment") return ["left", "center", "right"];
  if (fieldName === "position") return ["left", "center", "right"];
  if (fieldName === "justifyContent") {
    return [
      "start",
      "center",
      "end",
      "space-between",
      "space-around",
      "space-evenly",
    ];
  }
  if (fieldName === "alignItems") return ["start", "center", "end", "stretch"];
  if (fieldName === "sizing") return ["contain", "cover"];
  if (fieldName === "fontWeight") {
    return ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
  }

  if (fieldName === "width" && typeof value === "string") {
    return null;
  }

  if (fieldName === "containerWidth" || fieldName === "containerHeight")
    return null;

  return null;
};

type WidthMode = "full" | "auto" | "pixels" | "vw";

const getWidthMode = (value: unknown): WidthMode => {
  if (value === "full") return "full";
  if (value === "auto") return "auto";
  if (typeof value === "number" && Number.isFinite(value)) return "pixels";
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "full") return "full";
    if (trimmed === "auto") return "auto";
    if (/^\d+(\.\d+)?px$/.test(trimmed)) return "pixels";
    if (/^\d+(\.\d+)?vw$/.test(trimmed)) return "vw";
    if (/^\d+(\.\d+)?$/.test(trimmed)) return "pixels";
  }
  return "auto";
};

const getWidthNumber = (value: unknown, mode: WidthMode): number => {
  const raw =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim().toLowerCase()
        : "";
  const parsed = Number(raw.replace(/(px|vw)$/g, ""));

  if (!Number.isFinite(parsed)) {
    return mode === "vw" ? 50 : 320;
  }

  if (mode === "vw") return Math.max(1, Math.min(100, Math.round(parsed)));
  return Math.max(1, Math.round(parsed));
};

const getImageSizingHelpText = (sizing: string): ReactNode => {
  if (sizing === "cover") {
    return (
      <p
        style={{
          marginTop: "6px",
          fontSize: "12px",
          color: "#71717a",
          lineHeight: 1.4,
        }}
      >
        object-fit: cover. Gaps are filled completely. Cropping: Yes (excess is
        cut off). Distortion: None (retains ratio). Best for hero banners,
        profile cards, and background grids.
      </p>
    );
  }

  return (
    <p
      style={{
        marginTop: "6px",
        fontSize: "12px",
        color: "#71717a",
        lineHeight: 1.4,
      }}
    >
      object-fit: contain. Entire image is visible. Cropping: None. Distortion:
      None (retains ratio). Best for logos, product photos, and e-commerce
      listings.
    </p>
  );
};

const getExplicitElementJson = (
  element: PrebuiltElement,
): Record<string, unknown> => {
  if (element.id === "element-text") {
    return {
      id: element.id,
      label: element.label,
      value: typeof element.value === "string" ? element.value : "",
      styles: {
        alignment:
          element.styles?.alignment === "left" ||
          element.styles?.alignment === "center" ||
          element.styles?.alignment === "right"
            ? element.styles.alignment
            : "center",
        size:
          typeof element.styles?.size === "number" ? element.styles.size : 3,
        fontWeight:
          typeof element.styles?.fontWeight === "number"
            ? element.styles.fontWeight
            : 400,
        isBold: Boolean(element.styles?.isBold),
        isItalic: Boolean(element.styles?.isItalic),
        isLabel: Boolean(element.styles?.isLabel),
        textColor:
          typeof element.styles?.textColor === "string"
            ? element.styles.textColor
            : "$text",
        labelColor:
          typeof element.styles?.labelColor === "string"
            ? element.styles.labelColor
            : "$textHint",
      },
    };
  }

  if (element.id === "element-toggle") {
    return {
      id: element.id,
      label: element.label,
      value: Boolean(element.value),
      styles: {
        position:
          element.styles?.position === "left" ||
          element.styles?.position === "center" ||
          element.styles?.position === "right"
            ? element.styles.position
            : "center",
        activeColor:
          typeof element.styles?.activeColor === "string"
            ? element.styles.activeColor
            : "$primary",
        inactiveColor:
          typeof element.styles?.inactiveColor === "string"
            ? element.styles.inactiveColor
            : "$border",
      },
    };
  }

  if (element.id === "element-button") {
    return {
      id: element.id,
      label: element.label,
      buttonLabel:
        typeof element.buttonLabel === "string"
          ? element.buttonLabel
          : "Button",
      highlightOnHover: element.highlightOnHover !== false,
      isGhost: Boolean(element.isGhost),
      styles: {
        width:
          typeof element.styles?.width === "string" ||
          typeof element.styles?.width === "number"
            ? element.styles.width
            : "full",
        alignment:
          element.styles?.alignment === "left" ||
          element.styles?.alignment === "center" ||
          element.styles?.alignment === "right"
            ? element.styles.alignment
            : "center",
        textColor:
          typeof element.styles?.textColor === "string"
            ? element.styles.textColor
            : "$text",
        backgroundColor:
          typeof element.styles?.backgroundColor === "string"
            ? element.styles.backgroundColor
            : "$button",
        highlightColor:
          typeof element.styles?.highlightColor === "string"
            ? element.styles.highlightColor
            : "$highlight",
      },
    };
  }

  if (element.id === "element-select") {
    return {
      id: element.id,
      label: element.label,
      values:
        Array.isArray(element.values) && element.values.length > 0
          ? element.values
          : ["Value One", "Value Two"],
      showDefaultLabel: element.showDefaultLabel !== false,
      defaultLabel:
        typeof element.defaultLabel === "string" &&
        element.defaultLabel.trim().length > 0
          ? element.defaultLabel
          : "Please Select",
      styles: {
        textColor:
          typeof element.styles?.textColor === "string"
            ? element.styles.textColor
            : "$text",
        backgroundColor:
          typeof element.styles?.backgroundColor === "string"
            ? element.styles.backgroundColor
            : "$secondary",
        highlightColor:
          typeof element.styles?.highlightColor === "string"
            ? element.styles.highlightColor
            : "$highlight",
        borderColor:
          typeof element.styles?.borderColor === "string"
            ? element.styles.borderColor
            : "$border",
      },
    };
  }

  if (element.id === "element-text-input") {
    return {
      id: element.id,
      label: element.label,
      textHint: typeof element.textHint === "string" ? element.textHint : "",
      value: typeof element.value === "string" ? element.value : "",
      styles: {
        width:
          typeof element.styles?.width === "string" ||
          typeof element.styles?.width === "number"
            ? element.styles.width
            : "full",
        textColor:
          typeof element.styles?.textColor === "string"
            ? element.styles.textColor
            : "$text",
        borderColor:
          typeof element.styles?.borderColor === "string"
            ? element.styles.borderColor
            : "$border",
        backgroundColor:
          typeof element.styles?.backgroundColor === "string"
            ? element.styles.backgroundColor
            : "$secondary",
      },
    };
  }

  if (element.id === "element-icon") {
    return {
      id: element.id,
      label: element.label,
      value:
        typeof element.value === "string" && element.value.trim().length > 0
          ? element.value
          : "Home",
      styles: {
        alignment:
          element.styles?.alignment === "left" ||
          element.styles?.alignment === "center" ||
          element.styles?.alignment === "right"
            ? element.styles.alignment
            : "center",
        size:
          typeof element.styles?.size === "number" ? element.styles.size : 24,
        color:
          typeof element.styles?.color === "string"
            ? element.styles.color
            : "$text",
        borderWidth:
          typeof element.styles?.borderWidth === "number"
            ? element.styles.borderWidth
            : 0,
        borderColor:
          typeof element.styles?.borderColor === "string"
            ? element.styles.borderColor
            : "$border",
        borderRadius:
          typeof element.styles?.borderRadius === "number"
            ? element.styles.borderRadius
            : 8,
      },
    };
  }

  if (element.id === "element-image") {
    return {
      id: element.id,
      label: element.label,
      src:
        typeof element.src === "string" && element.src.trim().length > 0
          ? element.src
          : "https://placehold.co/600x400",
      styles: {
        alignment:
          element.styles?.alignment === "left" ||
          element.styles?.alignment === "center" ||
          element.styles?.alignment === "right"
            ? element.styles.alignment
            : "center",
        sizing: element.styles?.sizing === "cover" ? "cover" : "contain",
        containerWidth:
          typeof element.styles?.containerWidth === "string" ||
          typeof element.styles?.containerWidth === "number"
            ? element.styles.containerWidth
            : "auto",
        containerHeight:
          typeof element.styles?.containerHeight === "string" ||
          typeof element.styles?.containerHeight === "number"
            ? element.styles.containerHeight
            : "auto",
        backgroundColor:
          typeof element.styles?.backgroundColor === "string"
            ? element.styles.backgroundColor
            : "$secondary",
        borderWidth:
          typeof element.styles?.borderWidth === "number"
            ? element.styles.borderWidth
            : 0,
        borderColor:
          typeof element.styles?.borderColor === "string"
            ? element.styles.borderColor
            : "$border",
        borderRadius:
          typeof element.styles?.borderRadius === "number"
            ? element.styles.borderRadius
            : 8,
        padding:
          typeof element.styles?.padding === "number"
            ? element.styles.padding
            : 0,
      },
    };
  }

  return element as unknown as Record<string, unknown>;
};

export default function Elements() {
  const [elements, setElements] = useState<PrebuiltElement[]>(() =>
    cloneElements(),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedElement = elements[selectedIndex] ?? null;

  const selectedCode = useMemo(() => {
    if (!selectedElement) return "No element selected";
    return `<div>${renderElementCode(selectedElement)}</div>`;
  }, [selectedElement]);

  const selectedJson = useMemo(() => {
    if (!selectedElement) return "No element selected";
    return JSON.stringify(getExplicitElementJson(selectedElement), null, 2);
  }, [selectedElement]);

  const updateSelectedPath = (path: Array<string | number>, value: unknown) => {
    setElements((current) =>
      current.map((element, index) =>
        index === selectedIndex
          ? setValueAtPath(element, path, value)
          : element,
      ),
    );
  };

  const renderEditorField = (
    fieldValue: unknown,
    path: Array<string | number>,
    label: string,
  ): ReactNode => {
    const fieldKey = path.join(".");
    const fieldName = String(path[path.length - 1] ?? "");
    const isWidthDimensionField =
      fieldName === "width" || fieldName === "containerWidth";
    const isHeightDimensionField =
      fieldName === "height" || fieldName === "containerHeight";
    const isDimensionField = isWidthDimensionField || isHeightDimensionField;

    if (selectedElement?.id === "element-icon" && fieldName === "value") {
      return null;
    }

    if (
      selectedElement?.id === "element-text-input" &&
      fieldName === "alignment"
    ) {
      return null;
    }

    if (Array.isArray(fieldValue)) {
      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <Label>{label}</Label>
          <textarea
            value={JSON.stringify(fieldValue, null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value) as unknown[];
                updateSelectedPath(path, parsed);
              } catch {
                // Keep current value until valid JSON is entered.
              }
            }}
            style={{
              width: "100%",
              minHeight: "90px",
              padding: "8px",
              border: "1px solid #d4d4d8",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          />
        </div>
      );
    }

    if (fieldValue && typeof fieldValue === "object") {
      return (
        <div
          key={fieldKey}
          style={{
            marginBottom: "12px",
            border: "1px solid #e4e4e7",
            borderRadius: "8px",
            padding: "8px",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>{label}</p>
          {Object.entries(fieldValue as Record<string, unknown>).map(
            ([key, value]) => renderEditorField(value, [...path, key], key),
          )}
        </div>
      );
    }

    if (typeof fieldValue === "boolean") {
      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <Label>{label}</Label>
            <Switch
              checked={fieldValue}
              onCheckedChange={(checked) => updateSelectedPath(path, checked)}
            />
          </div>
        </div>
      );
    }

    if (fieldName === "fontWeight" && typeof fieldValue === "number") {
      const options = getFixedOptionsForField(fieldName, fieldValue) ?? ["400"];

      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <Label>{label}</Label>
          <Select
            value={String(fieldValue)}
            onValueChange={(nextValue) =>
              updateSelectedPath(path, Number(nextValue))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={`${fieldKey}-${option}`} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (typeof fieldValue === "number") {
      if (isDimensionField) {
        const mode = getWidthMode(fieldValue);
        const amount = getWidthNumber(fieldValue, mode);

        return (
          <div key={fieldKey} style={{ marginBottom: "12px" }}>
            <Label>{label}</Label>
            <Select
              value={mode}
              onValueChange={(nextMode: WidthMode) => {
                if (nextMode === "full" || nextMode === "auto") {
                  updateSelectedPath(path, nextMode);
                  return;
                }

                if (nextMode === "vw") {
                  updateSelectedPath(
                    path,
                    `${Math.max(1, Math.min(100, amount))}vw`,
                  );
                  return;
                }

                updateSelectedPath(path, `${Math.max(1, amount)}px`);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">full</SelectItem>
                <SelectItem value="auto">auto</SelectItem>
                <SelectItem value="pixels">pixels</SelectItem>
                <SelectItem value="vw">vw</SelectItem>
              </SelectContent>
            </Select>

            {(mode === "pixels" || mode === "vw") && (
              <Input
                type="number"
                min={1}
                max={mode === "vw" ? 100 : undefined}
                value={amount}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  if (!Number.isFinite(parsed)) return;

                  if (mode === "vw") {
                    const clamped = Math.max(
                      1,
                      Math.min(100, Math.round(parsed)),
                    );
                    updateSelectedPath(path, `${clamped}vw`);
                    return;
                  }

                  const clamped = Math.max(1, Math.round(parsed));
                  updateSelectedPath(path, `${clamped}px`);
                }}
              />
            )}
          </div>
        );
      }

      if (fieldName === "size" && selectedElement?.id === "element-icon") {
        return (
          <div key={fieldKey} style={{ marginBottom: "12px" }}>
            <Label>{label}</Label>
            <Input
              type="number"
              min={8}
              max={96}
              value={fieldValue}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const next = Number.isFinite(parsed)
                  ? Math.max(8, Math.min(96, parsed))
                  : 24;
                updateSelectedPath(path, next);
              }}
            />
          </div>
        );
      }

      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <Label>{label}</Label>
          <Input
            type="number"
            value={fieldValue}
            onChange={(event) =>
              updateSelectedPath(path, Number(event.target.value))
            }
          />
        </div>
      );
    }

    if (typeof fieldValue === "string" && isDimensionField) {
      const mode = getWidthMode(fieldValue);
      const amount = getWidthNumber(fieldValue, mode);

      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <Label>{label}</Label>
          <Select
            value={mode}
            onValueChange={(nextMode: WidthMode) => {
              if (nextMode === "full" || nextMode === "auto") {
                updateSelectedPath(path, nextMode);
                return;
              }

              if (nextMode === "vw") {
                updateSelectedPath(
                  path,
                  `${Math.max(1, Math.min(100, amount))}vw`,
                );
                return;
              }

              updateSelectedPath(path, `${Math.max(1, amount)}px`);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">full</SelectItem>
              <SelectItem value="auto">auto</SelectItem>
              <SelectItem value="pixels">pixels</SelectItem>
              <SelectItem value="vw">vw</SelectItem>
            </SelectContent>
          </Select>

          {(mode === "pixels" || mode === "vw") && (
            <Input
              type="number"
              min={1}
              max={mode === "vw" ? 100 : undefined}
              value={amount}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) return;

                if (mode === "vw") {
                  const clamped = Math.max(
                    1,
                    Math.min(100, Math.round(parsed)),
                  );
                  updateSelectedPath(path, `${clamped}vw`);
                  return;
                }

                const clamped = Math.max(1, Math.round(parsed));
                updateSelectedPath(path, `${clamped}px`);
              }}
            />
          )}
        </div>
      );
    }

    const fixedOptions = getFixedOptionsForField(fieldName, fieldValue);
    if (fixedOptions && typeof fieldValue === "string") {
      return (
        <div key={fieldKey} style={{ marginBottom: "12px" }}>
          <Label>{label}</Label>
          <Select
            value={fieldValue}
            onValueChange={(nextValue) => updateSelectedPath(path, nextValue)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fixedOptions.map((option) => (
                <SelectItem key={`${fieldKey}-${option}`} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedElement?.id === "element-image" &&
            fieldName === "sizing" &&
            getImageSizingHelpText(fieldValue)}
        </div>
      );
    }

    return (
      <div key={fieldKey} style={{ marginBottom: "12px" }}>
        <Label>{label}</Label>
        <Input
          value={
            typeof fieldValue === "string"
              ? fieldValue
              : String(fieldValue ?? "")
          }
          onChange={(event) => updateSelectedPath(path, event.target.value)}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1>Elements</h1>

      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {elements.map((element, index) => (
          <Button
            key={`${element.id}-${index}`}
            type="button"
            variant={index === selectedIndex ? "default" : "outline"}
            onClick={() => setSelectedIndex(index)}
          >
            {element.label}
          </Button>
        ))}
      </div>

      {!selectedElement ? (
        <p>No element selected.</p>
      ) : (
        <>
          <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-mono">
                    {selectedElement.label} JSON
                  </DialogTitle>
                </DialogHeader>
                <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                  {selectedJson}
                </pre>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  Code
                </Button>
              </DialogTrigger>
              <DialogContent className="w-screen max-w-[100vw] h-screen max-h-screen rounded-none flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-mono">
                    {selectedElement.label} React Code
                  </DialogTitle>
                </DialogHeader>
                <pre className="flex-1 overflow-auto rounded-lg bg-secondary p-4 text-sm font-mono whitespace-pre">
                  {selectedCode}
                </pre>
              </DialogContent>
            </Dialog>
          </div>

          <div style={{ marginBottom: "16px" }}>
            {renderPrebuiltElement(selectedElement)}
          </div>

          <div
            style={{
              border: "1px solid #e4e4e7",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "8px" }}>
              Edit Element Properties
            </p>
            {Object.entries(selectedElement).map(([key, value]) =>
              renderEditorField(value, [key], key),
            )}
          </div>
        </>
      )}
    </div>
  );
}
