import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../utils/api';
import TemplateUploader from '../components/TemplateUploader';
import ExcelUploader from '../components/ExcelUploader';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await authAPI.verify();
      if (response.user.role === 'superadmin') {
        router.push('/admin/dashboard');
        return;
      }
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

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
      router.push({
        pathname: '/editor',
        query: {
          templateUploaded: 'true',
          columnsCount: excelData.headers.length,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const remaining = user.imageLimit > 0 ? user.imageLimit - user.imagesGenerated : 'Unlimited';
  const usagePercent = user.imageLimit > 0 
    ? Math.round((user.imagesGenerated / user.imageLimit) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Card Generator</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Stats - Compact Design */}
        {user.imageLimit > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Usage</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {user.imagesGenerated} / {user.imageLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-lg font-bold text-indigo-600">
                  {typeof remaining === 'number' ? remaining : '∞'}
                </p>
                <p className="text-xs text-gray-500">remaining</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
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
              disabled={!templateFile || !excelData || (user.imageLimit > 0 && remaining <= 0)}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                templateFile && excelData && (user.imageLimit === 0 || remaining > 0)
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Continue to Editor →
            </button>
            {user.imageLimit > 0 && remaining <= 0 && (
              <p className="mt-2 text-sm text-red-600 text-center">
                You have reached your image generation limit. Please contact admin.
              </p>
            )}
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

