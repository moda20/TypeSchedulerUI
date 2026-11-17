import type { OnChange, OnMount } from "@monaco-editor/react"
import Editor from "@monaco-editor/react"
import React, { useCallback, useMemo } from "react"

export interface MonacoFileViewerProps {
  fileName: string
  fileContent: string
  fileType: string
  onChange?: OnChange
  readOnly?: boolean
}

export const ENTER_KEYBINDING_CONTEXT =
  "editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !codeActionMenuVisible"

export default function MonacoFileViewer({
  fileName,
  fileContent,
  fileType,
  onChange,
  readOnly,
}: MonacoFileViewerProps) {
  const convertedFileContent = React.useMemo(() => {
    switch (fileType) {
      case "json":
        return JSON.stringify(fileContent, null, 4)
      default:
        return fileContent
    }
  }, [fileContent, fileType])

  const editorOptions = useMemo(
    () => ({
      readOnly: readOnly ?? false,
    }),
    [readOnly],
  )

  const handleEditorMount = useCallback<OnMount>(
    (editor, monaco) => {
      if (readOnly) {
        return
      }
      // Fixing the enter key being ignored by the editor when opened after a modal/popover
      const enterAction = editor.addAction({
        id: "monacoFileViewer.insertNewline",
        label: "Insert new line",
        keybindings: [monaco.KeyCode.Enter],
        keybindingContext: ENTER_KEYBINDING_CONTEXT,
        run: editor => editor.trigger("keyboard", "type", { text: "\n" }),
      })
      editor.onDidDispose(() => enterAction.dispose())
      const container = editor.getContainerDomNode()
      const interceptModifiedEnter = (event: KeyboardEvent) => {
        if (
          event.key !== "Enter" ||
          (!event.metaKey && !event.ctrlKey) ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        event.stopImmediatePropagation()
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            repeat: event.repeat,
            bubbles: true,
            cancelable: true,
          }),
        )
      }
      container.addEventListener("keydown", interceptModifiedEnter, true)
      editor.onDidDispose(() =>
        container.removeEventListener("keydown", interceptModifiedEnter, true),
      )
    },
    [readOnly],
  )

  return (
    <Editor
      theme={"vs-dark"}
      height="100%"
      defaultLanguage={fileType}
      value={convertedFileContent}
      onChange={onChange}
      options={editorOptions}
      onMount={handleEditorMount}
    />
  )
}
