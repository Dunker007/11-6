/**
 * @/utils/imageUtils.ts
 *
 * PURPOSE:
 * Provides utility functions for handling images, primarily for preparing
 * them for use with multi-modal LLMs like the Gemini Vision API.
 */

/**
 * Converts an image file to a Base64 encoded string.
 *
 * @param file - The image file to convert.
 * @returns A promise that resolves to the Base64 string.
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Ensure the file is an image.
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image.'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // The result from FileReader includes the data URL prefix (e.g., "data:image/jpeg;base64,").
      // The Gemini API requires only the Base64 part, so we strip the prefix.
      const base64 = result.split(',')[1];
      if (!base64) {
        return reject(new Error('Failed to extract Base64 content from file.'));
      }
      resolve(base64);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
