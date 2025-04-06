'use client';
import { useState } from 'react';
import { convertDocxToPdf } from '@/utils/convertDocxToPdf';

export default function DocxToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    
    setIsConverting(true);
    setProgress(0);
    setPdfUrl(null);

    try {
      const pdfBlob = await convertDocxToPdf(file, setProgress);
      setPdfUrl(URL.createObjectURL(pdfBlob));
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. Please check console for details.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <input 
        type="file" 
        accept=".docx,.doc" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      
      <button
        onClick={handleConvert}
        disabled={!file || isConverting}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isConverting ? 'Converting...' : 'Convert to PDF'}
      </button>

      {isConverting && (
        <div className="mt-4">
          <progress value={progress} max="100" className="w-full" />
          <p>{progress}%</p>
        </div>
      )}

      {pdfUrl && (
        <a
          href={pdfUrl}
          download={file?.name.replace(/\.[^/.]+$/, '') + '.pdf'}
          className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded"
        >
          Download PDF
        </a>
      )}
    </div>
  );
}