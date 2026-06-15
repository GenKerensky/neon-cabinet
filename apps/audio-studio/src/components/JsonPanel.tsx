import { Button } from "@neon-cabinet/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@neon-cabinet/ui/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@neon-cabinet/ui/components/ui/collapsible";
import { Textarea } from "@neon-cabinet/ui/components/ui/textarea";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  UploadIcon,
} from "lucide-react";

export function JsonPanel({
  content,
  isOpen,
  onDownload,
  onImport,
  onImportValueChange,
  onToggle,
  title,
  type,
  value,
}: {
  content: string;
  isOpen: boolean;
  onDownload(): void;
  onImport(): void;
  onImportValueChange(value: string): void;
  onToggle(): void;
  title: string;
  type: "export" | "import";
  value: string;
}) {
  const ToggleIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;

  return (
    <Collapsible onOpenChange={onToggle} open={isOpen}>
      <Card
        className={
          type === "export" ? "panel json-panel" : "panel import-panel"
        }
      >
        <CardHeader className="panel-title">
          <CollapsibleTrigger asChild>
            <Button
              aria-expanded={isOpen}
              className="panel-toggle"
              type="button"
              variant="outline"
            >
              <ToggleIcon data-icon="inline-start" />
              {isOpen ? "Collapse" : "Expand"} {title}
            </Button>
          </CollapsibleTrigger>
          {type === "export" ? (
            <Button onClick={onDownload} type="button" variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Download JSON
            </Button>
          ) : (
            <Button onClick={onImport} type="button" variant="outline">
              <UploadIcon data-icon="inline-start" />
              Import
            </Button>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {type === "export" ? (
              <output aria-label="Patch JSON">{content}</output>
            ) : (
              <Textarea
                aria-label="Import JSON"
                onChange={(event) => onImportValueChange(event.target.value)}
                value={value}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
