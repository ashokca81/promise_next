import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function TemplateUploader({ onTemplateUpload, templatePreview }) {
  const [preview, setPreview] = useState(templatePreview || null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setError('Please upload a JPG or PNG image');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setPreview(imageUrl);
        onTemplateUpload(file, imageUrl);
      };
      reader.readAsDataURL(file);
    },
    [onTemplateUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
  });

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Template Image (JPG/PNG)
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        } ${error ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Template preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop the image here' : 'Click or drag image to upload'}
            </p>
            <p className="text-xs text-gray-500">JPG or PNG files only</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

