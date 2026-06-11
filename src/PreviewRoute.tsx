import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

function PreviewRoute() {
  const [jsonInput, setJsonInput] = useState("");

  const handlePreview = () => {
    // Intentionally left blank for now.
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Preview</h1>

        <Card className="p-4 space-y-3">
          <Label htmlFor="preview-json-input">JSON</Label>
          <textarea
            id="preview-json-input"
            className="min-h-[220px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
            placeholder='{"example":"value"}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <div>
            <Button type="button" onClick={handlePreview}>
              Preview
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PreviewRoute;
