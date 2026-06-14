import { ClipNote } from "@neon-cabinet/audio-tools";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@neon-cabinet/ui/components/ui/context-menu";
import type { PointerEvent } from "react";
import { pitchLabel } from "../authoring-utils";
import type { ComposeTransform } from "./use-compose-transform";

export function NoteLayer({
  notes,
  onDeleteNote,
  onNotePointerDown,
  onResizePointerDown,
  transform,
}: {
  notes: ClipNote[];
  onDeleteNote(noteId: string): void;
  onNotePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    note: ClipNote,
  ): void;
  onResizePointerDown(
    event: PointerEvent<HTMLSpanElement>,
    note: ClipNote,
  ): void;
  transform: ComposeTransform;
}) {
  return (
    <>
      {notes.map((note) => {
        const rect = transform.noteToRect(note);
        const label = pitchLabel(note.pitch);

        return (
          <ContextMenu key={note.id}>
            <ContextMenuTrigger asChild>
              <button
                aria-label={`Audition ${label} note`}
                className="piano-note"
                onPointerDown={(event) => onNotePointerDown(event, note)}
                style={{
                  height: `${rect.height}px`,
                  left: `${rect.left}px`,
                  top: `${rect.top}px`,
                  width: `${rect.width}px`,
                }}
                type="button"
              >
                {label}
                <span
                  aria-label={`Resize ${label} note`}
                  className="piano-note-resize"
                  onPointerDown={(event) => onResizePointerDown(event, note)}
                  role="slider"
                  tabIndex={0}
                />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent
              className="audio-context-menu"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ContextMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteNote(note.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onDeleteNote(note.id);
                }}
                variant="destructive"
              >
                Delete note
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </>
  );
}
