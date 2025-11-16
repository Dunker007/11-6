import React, { useState, useCallback } from 'react';
import { GeminiProvider } from '@/services/ai/providers/cloudLLM';
import { imageToBase64 } from '@/utils/imageUtils';
import type { GeminiContent } from '@/types/gemini';
import LoadingSpinner from '../shared/LoadingSpinner';
import '../../styles/VisualToCode.css';

const VisualToCode: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Generate the HTML and CSS for this component.');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError('Image file is too large. Maximum size is 20MB.');
      return;
    }

    setError(null);
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to load image preview.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setGeneratedCode('');
    setError(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!imageFile || !prompt) {
      setError('Please provide both an image and a text prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCode('');

    try {
      const base64Image = await imageToBase64(imageFile);
      const gemini = new GeminiProvider();

      const contents: GeminiContent[] = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64Image,
              },
            },
          ],
        },
      ];

      // Use the gemini-pro-vision model for this task
      const response = await gemini.generate('', {
        model: 'gemini-pro-vision',
        contents,
        temperature: 0.3,
        maxTokens: 4096,
      });

      setGeneratedCode(response.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

  return (
    <div className="visual-to-code-panel">
      <h4>Visual to Code (Powered by Gemini Vision)</h4>
      <div className="controls">
        {/* Drag and Drop Area */}
        <div
          className={`drag-drop-area ${isDragging ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-file-input')?.click()}
        >
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                className="clear-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                type="button"
                aria-label="Clear image"
              >
                ×
              </button>
              {imageFile && (
                <div className="image-preview-info">
                  {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          ) : (
            <p>
              {isDragging ? 'Drop image here' : 'Drag & drop an image here or click to browse'}
            </p>
          )}
        </div>

        {/* Hidden file input */}
        <input
          id="image-file-input"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isLoading}
          style={{ display: 'none' }}
        />

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt (e.g., 'Generate the React component for this design')..."
          disabled={isLoading}
        />
        <button onClick={handleGenerateClick} disabled={isLoading || !imageFile}>
          {isLoading && <LoadingSpinner size={16} />}
          {isLoading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {generatedCode && (
        <div className="code-output">
          <h5>Generated Code:</h5>
          <pre>
            <code>{generatedCode}</code>
            <button
              className="copy-code-btn"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
              }}
              type="button"
              aria-label="Copy code"
            >
              Copy
            </button>
          </pre>
        </div>
      )}
    </div>
  );
};

export default VisualToCode;
