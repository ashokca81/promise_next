import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TemplateUploader from '../components/TemplateUploader';
import ExcelUploader from '../components/ExcelUploader';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is logged in, redirect to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);

  const handleTemplateUpload = (file, preview) => {
    setTemplateFile(file);
    setTemplatePreview(preview);
  };

  const handleExcelUpload = (data) => {
    setExcelData(data);
    setExcelFile(data.file);
  };

  const handleContinue = async () => {
    if (!templateFile || !excelData) {
      alert('Please upload both template image and Excel file');
      return;
    }

    // Store data in sessionStorage for editor page
    sessionStorage.setItem('templatePreview', templatePreview);
    sessionStorage.setItem('excelData', JSON.stringify(excelData));
    sessionStorage.setItem('excelHeaders', JSON.stringify(excelData.headers));

    // Convert template file to base64 and store
    if (templateFile) {
      const templateReader = new FileReader();
      templateReader.onload = (e) => {
        sessionStorage.setItem('templateFileData', e.target.result);
        sessionStorage.setItem('templateFileName', templateFile.name);
        sessionStorage.setItem('templateFileType', templateFile.type);
      };
      templateReader.readAsDataURL(templateFile);
    }

    // Convert excel file to base64 and store
    if (excelFile) {
      const excelReader = new FileReader();
      excelReader.onload = (e) => {
        sessionStorage.setItem('excelFileData', e.target.result);
        sessionStorage.setItem('excelFileName', excelFile.name);
        sessionStorage.setItem('excelFileType', excelFile.type);
        
        // Navigate after files are stored
        router.push({
          pathname: '/editor',
          query: {
            templateUploaded: 'true',
            columnsCount: excelData.headers.length,
          },
        });
      };
      excelReader.readAsDataURL(excelFile);
    } else {
      // Navigate even if excel file conversion fails
      router.push({
        pathname: '/editor',
        query: {
          templateUploaded: 'true',
          columnsCount: excelData.headers.length,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bulk Card Generator
          </h1>
          <p className="text-lg text-gray-600">
            Create professional cards from Excel data with Photoshop-like text rendering
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 1: Upload Template</h2>
            <TemplateUploader
              onTemplateUpload={handleTemplateUpload}
              templatePreview={templatePreview}
            />
          </div>

          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 2: Upload Excel/CSV</h2>
            <ExcelUploader onExcelUpload={handleExcelUpload} excelData={excelData} />
          </div>

          <div className="pt-6">
            <button
              onClick={handleContinue}
              disabled={!templateFile || !excelData}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                templateFile && excelData
                  ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Editor →
            </button>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Upload a JPG or PNG template image</li>
            <li>Upload an Excel (.xlsx) or CSV file with your data</li>
            <li>The app will automatically detect all columns</li>
            <li>Next, you&apos;ll draw rectangles for each field on the template</li>
            <li>Configure font settings for each field</li>
            <li>Generate all cards and download as ZIP</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

