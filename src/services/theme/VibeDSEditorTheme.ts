/**
 * VibeDS Monaco Editor Theme
 * Custom dark theme matching VibeUI 2.0 aesthetic
 */

import type { editor } from 'monaco-editor';

export const VibeDSTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'A371F7', fontStyle: 'bold' },
    { token: 'number', foreground: '79C0FF' },
    { token: 'string', foreground: 'A5D6FF' },
    { token: 'operator', foreground: '58A6FF' },
    { token: 'identifier', foreground: 'E6EDF3' },
    { token: 'type', foreground: '79C0FF' },
    { token: 'delimiter', foreground: '8B949E' },
    { token: 'regexp', foreground: 'A5D6FF' },
    { token: 'predefined', foreground: '58A6FF' },
  ],
  colors: {
    'editor.background': '#0D1117',
    'editor.foreground': '#E6EDF3',
    'editor.lineHighlightBackground': '#161B22',
    'editor.selectionBackground': '#264F78',
    'editor.selectionHighlightBackground': '#264F78',
    'editorCursor.foreground': '#58A6FF',
    'editorWhitespace.foreground': '#161B22',
    'editorIndentGuide.activeBackground': '#21262D',
    'editorIndentGuide.background': '#161B22',
    'editorLineNumber.foreground': '#6E7681',
    'editorLineNumber.activeForeground': '#8B949E',
    'editorGutter.background': '#0D1117',
    'editorGutter.modifiedBackground': '#FBBF24',
    'editorGutter.addedBackground': '#34D399',
    'editorGutter.deletedBackground': '#F87171',
    'editorWidget.background': '#161B22',
    'editorWidget.border': '#21262D',
    'editorSuggestWidget.background': '#161B22',
    'editorSuggestWidget.border': '#21262D',
    'editorSuggestWidget.selectedBackground': '#1C2128',
    'editorHoverWidget.background': '#161B22',
    'editorHoverWidget.border': '#21262D',
    'minimap.background': '#0D1117',
    'minimap.selectionHighlight': '#264F78',
    'minimap.findMatchHighlight': '#FBBF24',
    'scrollbarSlider.background': '#21262D',
    'scrollbarSlider.hoverBackground': '#30363D',
    'scrollbarSlider.activeBackground': '#484F58',
  },
};

