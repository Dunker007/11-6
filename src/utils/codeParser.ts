/**
 * @/utils/codeParser.ts
 *
 * PURPOSE:
 * Provides utility functions for parsing source code. This is initially
 * focused on extracting comments to be used with the "Smart Comments"
 * feature, which leverages the Google Cloud Natural Language API.
 */

/**
 * Represents a comment extracted from a source code file.
 */
export interface ExtractedComment {
  // The text content of the comment.
  text: string;
  // The line number where the comment starts.
  lineNumber: number;
  // The type of comment (e.g., 'singleline', 'multiline').
  type: 'singleline' | 'multiline';
}

/**
 * Extracts all single-line (//) and multi-line (/* ... *´/) comments
 * from a given string of source code.
 *
 * @param code - The source code to parse.
 * @returns An array of ExtractedComment objects.
 */
export function extractComments(code: string): ExtractedComment[] {
  const comments: ExtractedComment[] = [];
  const lines = code.split('\n');

  let inMultiLineComment = false;
  let multiLineBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    let j = 0;
    while (j < line.length) {
      if (inMultiLineComment) {
        const endIndex = line.indexOf('*/', j);
        if (endIndex !== -1) {
          multiLineBuffer += line.substring(j, endIndex);
          comments.push({
            text: multiLineBuffer.trim(),
            lineNumber,
            type: 'multiline',
          });
          inMultiLineComment = false;
          multiLineBuffer = '';
          j = endIndex + 2;
        } else {
          multiLineBuffer += line.substring(j) + '\n';
          break;
        }
      } else {
        const singleLineIndex = line.indexOf('//', j);
        const multiLineStartIndex = line.indexOf('/*', j);

        if (singleLineIndex !== -1 && (multiLineStartIndex === -1 || singleLineIndex < multiLineStartIndex)) {
          comments.push({
            text: line.substring(singleLineIndex + 2).trim(),
            lineNumber,
            type: 'singleline',
          });
          break; // Rest of the line is a comment
        }

        if (multiLineStartIndex !== -1) {
          const endIndex = line.indexOf('*/', multiLineStartIndex + 2);
          if (endIndex !== -1) {
            comments.push({
              text: line.substring(multiLineStartIndex + 2, endIndex).trim(),
              lineNumber,
              type: 'multiline',
            });
            j = endIndex + 2;
          } else {
            inMultiLineComment = true;
            multiLineBuffer = line.substring(multiLineStartIndex + 2) + '\n';
            break;
          }
        } else {
          break; // No comments on this line
        }
      }
    }
  }

  return comments;
}
