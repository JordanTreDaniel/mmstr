'use client';

import { useEffect, useState } from 'react';
import { runStorageTests } from '@/lib/__test-storage__';

/**
 * Component to test storage utilities
 * This runs tests on mount and displays results
 */
export default function StorageTest() {
  const [testResults, setTestResults] = useState<{
    success: boolean;
    results: string[];
    errors: string[];
  } | null>(null);

  useEffect(() => {
    // Run tests on mount
    const results = runStorageTests();
    setTestResults(results);
    
    // Also log to console
    console.log('🧪 Storage Test Results:');
    console.log(results.results.join('\n'));
    if (results.errors.length > 0) {
      console.error('Errors:', results.errors);
    }
  }, []);

  if (!testResults) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">Running storage tests...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded ${testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <h3 className={`text-lg font-semibold mb-2 ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
        {testResults.success ? '✅ Storage Tests Passed' : '❌ Storage Tests Failed'}
      </h3>
      
      <div className="space-y-2">
        <div>
          <h4 className="font-medium text-sm mb-1">Results:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap">
            {testResults.results.join('\n')}
          </pre>
        </div>
        
        {testResults.errors.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-1 text-red-700">Errors:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto text-red-600 whitespace-pre-wrap">
              {testResults.errors.join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
