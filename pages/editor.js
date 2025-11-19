import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TemplateUploader from '../components/TemplateUploader';
import ExcelUploader from '../components/ExcelUploader';
import DynamicAreaSelector from '../components/DynamicAreaSelector';
import FieldControls from '../components/FieldControls';
import PreviewRenderer from '../components/PreviewRenderer';
import { authAPI } from '../utils/api';

export default function Editor() {
  const router = useRouter();
  const [templatePreview, setTemplatePreview] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(null);
  const [previewRowIndex, setPreviewRowIndex] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [imageCount, setImageCount] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 20, y: 20 });
  const [popupSize, setPopupSize] = useState({ width: 320, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    // Load data from sessionStorage
    const storedPreview = sessionStorage.getItem('templatePreview');
    const storedExcelData = sessionStorage.getItem('excelData');
    const storedHeaders = sessionStorage.getItem('excelHeaders');

    if (storedPreview) setTemplatePreview(storedPreview);
    if (storedExcelData) {
      const data = JSON.parse(storedExcelData);
      setExcelData(data);
    }
    if (storedHeaders) {
      const headers = JSON.parse(storedHeaders);
      // Initialize fields from headers
      const initialFields = headers.map((header) => ({
        column: header,
        rect: null,
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#000000',
        alignment: 'center',
        verticalAlignment: 'bottom',
        lineHeight: 1.2,
        bold: false,
      }));
      setFields(initialFields);
    }

    // Load files from sessionStorage
    const templateFileData = sessionStorage.getItem('templateFileData');
    const templateFileName = sessionStorage.getItem('templateFileName');
    const templateFileType = sessionStorage.getItem('templateFileType');
    
    if (templateFileData && templateFileName) {
      // Convert base64 to File
      fetch(templateFileData)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], templateFileName, { type: templateFileType || 'image/jpeg' });
          setTemplateFile(file);
        });
    }

    const excelFileData = sessionStorage.getItem('excelFileData');
    const excelFileName = sessionStorage.getItem('excelFileName');
    const excelFileType = sessionStorage.getItem('excelFileType');

    if (excelFileData && excelFileName) {
      // Convert base64 to File
      fetch(excelFileData)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], excelFileName, { type: excelFileType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          setExcelFile(file);
        });
    }

    // Set random preview row
    if (storedExcelData) {
      const data = JSON.parse(storedExcelData);
      if (data.rows && data.rows.length > 0) {
        setPreviewRowIndex(Math.floor(Math.random() * data.rows.length));
      }
    }

    // Load user info to display limit
    loadUserInfo();
  }, []);

  useEffect(() => {
    // Set default image count when excelData or user changes
    if (excelData && excelData.rows && user) {
      const maxAllowed = user.role === 'user' && user.imageLimit > 0
        ? Math.min(excelData.rows.length, user.imageLimit - user.imagesGenerated)
        : excelData.rows.length;
      
      if (maxAllowed > 0 && (!imageCount || imageCount > maxAllowed)) {
        setImageCount(maxAllowed);
      }
    } else if (excelData && excelData.rows && !imageCount) {
      setImageCount(excelData.rows.length);
    }
  }, [excelData, user]);

  const loadUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.verify();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleTemplateUpload = (file, preview) => {
    setTemplateFile(file);
    setTemplatePreview(preview);
    sessionStorage.setItem('templatePreview', preview);
    
    // Store file data in sessionStorage
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem('templateFileData', e.target.result);
        sessionStorage.setItem('templateFileName', file.name);
        sessionStorage.setItem('templateFileType', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcelUpload = (data) => {
    setExcelData(data);
    setExcelFile(data.file);
    sessionStorage.setItem('excelData', JSON.stringify(data));
    sessionStorage.setItem('excelHeaders', JSON.stringify(data.headers));

    // Store file data in sessionStorage
    if (data.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem('excelFileData', e.target.result);
        sessionStorage.setItem('excelFileName', data.file.name);
        sessionStorage.setItem('excelFileType', data.file.type);
      };
      reader.readAsDataURL(data.file);
    }

    // Reinitialize fields
    const initialFields = data.headers.map((header) => ({
      column: header,
      rect: null,
      fontFamily: 'Arial',
      fontSize: 16,
      color: '#000000',
      alignment: 'center',
      verticalAlignment: 'bottom',
      lineHeight: 1.2,
      bold: false,
    }));
    setFields(initialFields);

    if (data.rows && data.rows.length > 0) {
      setPreviewRowIndex(Math.floor(Math.random() * data.rows.length));
    }
  };

  const handleFieldUpdate = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('input, select, button, label')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - popupPosition.x,
      y: e.clientY - popupPosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 320; // popup width
    const maxY = window.innerHeight - 100;
    
    setPopupPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: popupSize.width,
      height: popupSize.height,
    });
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const minWidth = 250;
    const minHeight = 300;
    const maxWidth = window.innerWidth - popupPosition.x;
    const maxHeight = window.innerHeight - popupPosition.y;
    
    setPopupSize({
      width: Math.max(minWidth, Math.min(resizeStart.width + deltaX, maxWidth)),
      height: Math.max(minHeight, Math.min(resizeStart.height + deltaY, maxHeight)),
    });
  };

  const handleResizeUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeUp);
      };
    }
  }, [isResizing, resizeStart]);

  const handleGenerate = async () => {
    if (!templatePreview || !excelData) {
      alert('Please upload both template and Excel file');
      return;
    }

    // Validate all fields have rectangles
    const incompleteFields = fields.filter((f) => {
      if (!f.rect) return true;
      if (typeof f.rect.x !== 'number') return true;
      if (typeof f.rect.y !== 'number') return true;
      if (typeof f.rect.width !== 'number' || f.rect.width <= 0) return true;
      if (typeof f.rect.height !== 'number' || f.rect.height <= 0) return true;
      return false;
    });
    if (incompleteFields.length > 0) {
      alert(`Please draw rectangles for all ${incompleteFields.length} field(s). Missing: ${incompleteFields.map((f, i) => f.column || `Field ${i + 1}`).join(', ')}`);
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Get or convert files
      let templateFileToSend = templateFile;
      let excelFileToSend = excelFile;

      // If files not loaded, convert from sessionStorage
      if (!templateFileToSend && templatePreview) {
        const response = await fetch(templatePreview);
        const blob = await response.blob();
        templateFileToSend = new File([blob], 'template.jpg', { type: blob.type || 'image/jpeg' });
      }

      if (!excelFileToSend) {
        // Get from sessionStorage or create from data
        const excelFileData = sessionStorage.getItem('excelFileData');
        const excelFileName = sessionStorage.getItem('excelFileName');
        if (excelFileData) {
          const response = await fetch(excelFileData);
          const blob = await response.blob();
          excelFileToSend = new File([blob], excelFileName || 'data.xlsx', { type: blob.type });
        } else {
          // Re-parse excel data and create file (fallback)
          alert('Excel file not found. Please re-upload on the editor page.');
          setGenerating(false);
          return;
        }
      }

      // Validate image count
      const maxAllowed = user && user.role === 'user' && user.imageLimit > 0
        ? Math.min(excelData.rows.length, user.imageLimit - user.imagesGenerated)
        : excelData.rows.length;
      
      const countToGenerate = imageCount || excelData.rows.length;
      
      if (countToGenerate <= 0 || countToGenerate > maxAllowed) {
        alert(`Please select a valid number of images (1 to ${maxAllowed})`);
        setGenerating(false);
        return;
      }

      const formData = new FormData();
      formData.append('template', templateFileToSend);
      formData.append('excel', excelFileToSend);
      formData.append('fields', JSON.stringify(fields));
      formData.append('excelData', JSON.stringify(excelData));
      formData.append('imageCount', countToGenerate.toString());

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Generation failed' }));
        
        // If limit reached, show contact info
        if (errorData.contactInfo) {
          const contactMsg = `Image limit reached. You have used all ${errorData.used} images.\n\nPlease contact admin to increase your limit:\n\n🌐 Website: ${errorData.contactInfo.website}\n📞 Phone: ${errorData.contactInfo.phone}`;
          alert(contactMsg);
          throw new Error(errorData.error || 'Generation failed');
        }
        
        throw new Error(errorData.error || 'Generation failed');
      }

      // Check for limit warning in response headers (before reading blob)
      const limitWarning = response.headers.get('X-Limit-Warning');
      let actualGenerated = excelData.rows.length;
      if (limitWarning) {
        const decodedWarning = decodeURIComponent(limitWarning);
        const match = decodedWarning.match(/Only (\d+) images/);
        if (match) {
          actualGenerated = parseInt(match[1]);
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cards_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show appropriate message
      if (limitWarning) {
        const decodedWarning = decodeURIComponent(limitWarning);
        alert(`⚠️ ${decodedWarning}\n\n✅ Successfully generated ${actualGenerated} cards!`);
      } else {
        alert(`✅ Successfully generated ${actualGenerated} cards!`);
      }
      setProgress(100);
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Card Editor</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Upload
          </button>
        </div>

        {/* Usage Card - Top of Page */}
        {user && user.role === 'user' && user.imageLimit > 0 && (
          <div className="mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Usage:</span>
                <span className="text-base font-semibold text-gray-900">
                  {user.imagesGenerated}/{user.imageLimit}
                </span>
                <span className={`text-base font-semibold ${
                  (user.imageLimit - user.imagesGenerated) <= 0
                    ? 'text-red-600'
                    : (user.imageLimit - user.imagesGenerated) <= 5
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  ({Math.max(0, user.imageLimit - user.imagesGenerated)} left)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Field Settings Popup - Draggable & Resizable */}
          {selectedFieldIndex !== null && fields[selectedFieldIndex] && (
            <div
              className="fixed z-50 cursor-move"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
                width: `${popupSize.width}px`,
                height: `${popupSize.height}px`,
                minWidth: '250px',
                minHeight: '300px',
              }}
            >
              <div className="bg-white rounded-lg shadow-2xl border-2 border-indigo-500 h-full flex flex-col">
                <div
                  className="flex items-center justify-between p-3 pb-2 border-b border-indigo-200 cursor-move select-none flex-shrink-0"
                  onMouseDown={handleMouseDown}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-500">⋮⋮</span>
                    <h3 className="text-base font-bold text-indigo-600">
                      {fields[selectedFieldIndex]?.column || `Field ${selectedFieldIndex + 1}`}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedFieldIndex(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
                    title="Close"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    ×
                  </button>
                </div>
                <div 
                  className="flex-1 overflow-y-auto p-4" 
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ maxHeight: `${popupSize.height - 60}px` }}
                >
                  <FieldControls
                    fields={fields}
                    selectedFieldIndex={selectedFieldIndex}
                    onFieldUpdate={handleFieldUpdate}
                  />
                </div>
                {/* Resize Handle */}
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-indigo-500 opacity-50 hover:opacity-100 rounded-tl-lg"
                  onMouseDown={handleResizeStart}
                  style={{
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }}
                >
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white"></div>
                </div>
              </div>
            </div>
          )}

          {/* Left Column - Uploads */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Template</h2>
              <TemplateUploader
                onTemplateUpload={handleTemplateUpload}
                templatePreview={templatePreview}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Excel Data</h2>
              <ExcelUploader onExcelUpload={handleExcelUpload} excelData={excelData} />
              {excelData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>{excelData.rows.length}</strong> rows ready to generate
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Select row number from preview section below
                  </p>
                </div>
              )}
            </div>


          </div>

          {/* Right Column - Canvas & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {templatePreview && fields.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Draw Areas ({fields.length} fields)
                </h2>
                <DynamicAreaSelector
                  templateImage={templatePreview}
                  fields={fields}
                  onFieldUpdate={handleFieldUpdate}
                  selectedFieldIndex={selectedFieldIndex}
                  onSelectField={setSelectedFieldIndex}
                />
              </div>
            )}

            {templatePreview && excelData && excelData.rows && excelData.rows.length > 0 && previewRowIndex !== null && (
              <div className="bg-white rounded-lg shadow p-6">
                <PreviewRenderer
                  templateImage={templatePreview}
                  fields={fields}
                  excelData={excelData}
                  previewRowIndex={previewRowIndex}
                  onRowChange={setPreviewRowIndex}
                />
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              {/* Generate Info - Near Button */}
              {excelData && excelData.rows && excelData.rows.length > 0 && (
                <div className="mb-3 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-gray-600">Generate:</span>
                  <input
                    type="number"
                    min="1"
                    max={user && user.role === 'user' && user.imageLimit > 0
                      ? Math.min(excelData.rows.length, user.imageLimit - user.imagesGenerated)
                      : excelData.rows.length}
                    value={imageCount || excelData.rows.length}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const maxAllowed = user && user.role === 'user' && user.imageLimit > 0
                        ? Math.min(excelData.rows.length, user.imageLimit - user.imagesGenerated)
                        : excelData.rows.length;
                      setImageCount(Math.min(Math.max(1, value), maxAllowed));
                    }}
                    className="w-12 px-1.5 py-0.5 border border-gray-300 rounded text-xs text-center font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">of {excelData.rows.length}</span>
                  {user && user.role === 'user' && user.imageLimit > 0 && (user.imageLimit - user.imagesGenerated) > 0 && excelData && excelData.rows.length > (user.imageLimit - user.imagesGenerated) && (
                    <span className="text-yellow-600 font-medium">⚠️ Max: {user.imageLimit - user.imagesGenerated}</span>
                  )}
                </div>
              )}

              {(() => {
                // Check if button should be disabled
                const hasIncompleteFields = fields.some((f) => {
                  if (!f.rect) return true;
                  if (typeof f.rect.x !== 'number') return true;
                  if (typeof f.rect.y !== 'number') return true;
                  if (typeof f.rect.width !== 'number' || f.rect.width <= 0) return true;
                  if (typeof f.rect.height !== 'number' || f.rect.height <= 0) return true;
                  return false;
                });

                // Check if user limit is reached
                const userLimitReached = user && user.role === 'user' && user.imageLimit > 0 && (user.imageLimit - user.imagesGenerated) <= 0;

                const isDisabled =
                  generating ||
                  !templatePreview ||
                  !excelData ||
                  !excelData.rows ||
                  excelData.rows.length === 0 ||
                  fields.length === 0 ||
                  hasIncompleteFields ||
                  userLimitReached;

                return (
                  <button
                    onClick={handleGenerate}
                    disabled={isDisabled}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                      isDisabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                    }`}
                  >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  `Generate ${imageCount || excelData?.rows.length || 0} Card${(imageCount || excelData?.rows.length || 0) !== 1 ? 's' : ''} & Download ZIP`
                )}
                  </button>
                );
              })()}
              {(() => {
                // Show status message if button is disabled
                if (generating) return null;
                
                if (!templatePreview) {
                  return (
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      ⚠️ Please upload a template image
                    </p>
                  );
                }
                
                if (!excelData || !excelData.rows || excelData.rows.length === 0) {
                  return (
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      ⚠️ Please upload an Excel file with data
                    </p>
                  );
                }
                
                if (fields.length === 0) {
                  return (
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      ⚠️ No fields detected. Please check your Excel file.
                    </p>
                  );
                }
                
                const incompleteFields = fields.filter((f) => {
                  if (!f.rect) return true;
                  if (typeof f.rect.x !== 'number') return true;
                  if (typeof f.rect.y !== 'number') return true;
                  if (typeof f.rect.width !== 'number' || f.rect.width <= 0) return true;
                  if (typeof f.rect.height !== 'number' || f.rect.height <= 0) return true;
                  return false;
                });
                
                if (incompleteFields.length > 0) {
                  return (
                    <p className="mt-3 text-sm text-gray-600 text-center">
                      ⚠️ Please draw rectangles for {incompleteFields.length} field(s): {incompleteFields.map((f, i) => f.column || `Field ${i + 1}`).join(', ')}
                    </p>
                  );
                }

                if (user && user.role === 'user' && user.imageLimit > 0 && (user.imageLimit - user.imagesGenerated) <= 0) {
                  return (
                    <p className="mt-3 text-sm text-red-600 text-center">
                      ❌ Image limit reached! Contact admin: <a href="http://lavishstar.in/" target="_blank" rel="noopener noreferrer" className="underline">lavishstar.in</a> or <a href="tel:8801188884" className="underline">8801188884</a>
                    </p>
                  );
                }
                
                return (
                  <p className="mt-3 text-sm text-green-600 text-center">
                    ✅ Ready to generate {excelData.rows.length} cards!
                  </p>
                );
              })()}
              {generating && progress > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">{progress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

