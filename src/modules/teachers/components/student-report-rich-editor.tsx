"use client";

import { useEffect, useState } from "react";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import { EditorContent, EditorRoot, Placeholder, StarterKit, type EditorInstance, type JSONContent } from "novel";

import { Button } from "@/components/ui/button";

const initialContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const extensions = [
  StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, horizontalRule: false }),
  Placeholder.configure({ placeholder: "Escribí el reporte..." }),
];

type EditorValue = { json: string; text: string };

function EditorToolbar({ editor, disabled }: { editor: EditorInstance | null; disabled: boolean }) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => setVersion((version) => version + 1);
    editor.on("selectionUpdate", update);
    editor.on("update", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("update", update);
    };
  }, [editor]);

  const actions = [
    { label: "Negrita", icon: Bold, active: editor?.isActive("bold"), run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Cursiva", icon: Italic, active: editor?.isActive("italic"), run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Tachado", icon: Strikethrough, active: editor?.isActive("strike"), run: () => editor?.chain().focus().toggleStrike().run() },
    { label: "Título", icon: Heading2, active: editor?.isActive("heading", { level: 2 }), run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Viñetas", icon: List, active: editor?.isActive("bulletList"), run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Lista numerada", icon: ListOrdered, active: editor?.isActive("orderedList"), run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Cita", icon: Quote, active: editor?.isActive("blockquote"), run: () => editor?.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div role="toolbar" aria-label="Formato del reporte" className="flex flex-wrap gap-1 border-b p-2">
      {actions.map(({ label, icon: Icon, active, run }) => (
        <Button key={label} type="button" size="sm" variant={active ? "secondary" : "ghost"}
          aria-label={label} aria-pressed={!!active} title={label} disabled={!editor || disabled} onClick={run}>
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}

export function StudentReportRichEditor({ onChange, disabled }: {
  onChange: (value: EditorValue) => void;
  disabled: boolean;
}) {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      <EditorToolbar editor={editor} disabled={disabled} />
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          editorProps={{ attributes: { id: "report-body", "aria-label": "Reporte escrito", class: "min-h-[320px] max-w-none p-4 text-sm outline-none prose prose-sm prose-neutral" } }}
          onCreate={({ editor: created }) => setEditor(created)}
          onUpdate={({ editor: updated }) => onChange({ json: JSON.stringify(updated.getJSON()), text: updated.getText() })}
        />
      </EditorRoot>
    </div>
  );
}
