import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle, X, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { pb } from '../services/pocketbase';

const TARGET_FIELDS = [
    { key: 'name', label: 'Lead Name', required: true },
    { key: 'phone', label: 'WhatsApp / Phone Number', required: true },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'requirement', label: 'Requirement Overview', required: false },
    { key: 'date', label: 'Follow-up Date (YYYY-MM-DD)', required: false },
    { key: 'status', label: 'Status (e.g. New Lead)', required: false },
];

const BulkLeadUploadWizard = ({ isOpen, onClose, onSuccess, targetAgencyId, currentUserId }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({});

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadErrors, setUploadErrors] = useState([]);

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        } else {
            alert('Please select a valid CSV file.');
        }
    };

    const parseCSV = (fileToParse) => {
        Papa.parse(fileToParse, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setParsedData(results.data);

                    const headers = results.meta.fields || Object.keys(results.data[0]);
                    setCsvHeaders(headers);

                    // Auto-suggest mappings mapping
                    const initialMapping = {};
                    TARGET_FIELDS.forEach(field => {
                        // fuzzy match: lowercase, remove spaces
                        const match = headers.find(h =>
                            h.toLowerCase().replace(/\s/g, '') === field.key.toLowerCase() ||
                            h.toLowerCase().includes(field.label.split(' ')[0].toLowerCase())
                        );
                        if (match) {
                            initialMapping[field.key] = match;
                        } else {
                            initialMapping[field.key] = ''; // unmapped
                        }
                    });
                    setFieldMapping(initialMapping);
                    setStep(2); // Move to mapping step
                } else {
                    alert('The CSV file appears to be empty or unreadable.');
                }
            },
            error: (err) => {
                console.error("PapaParse Error:", err);
                alert("Failed to parse CSV file. Ensure it is properly formatted.");
            }
        });
    };

    const handleMappingChange = (targetKey, csvHeader) => {
        setFieldMapping(prev => ({ ...prev, [targetKey]: csvHeader }));
    };

    const validateMapping = () => {
        const missing = TARGET_FIELDS.filter(f => f.required && !fieldMapping[f.key]);
        if (missing.length > 0) {
            alert(`Please map the following required fields: ${missing.map(m => m.label).join(', ')}`);
            return false;
        }
        return true;
    };

    const processUpload = async () => {
        if (!validateMapping()) return;

        setStep(3);
        setUploading(true);
        setUploadProgress(0);
        setUploadErrors([]);

        let successCount = 0;
        let errors = [];

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];

            // Build pocketbase payload based on mapping
            const payload = {
                agencyId: targetAgencyId
            };

            TARGET_FIELDS.forEach(field => {
                const mappedCsvHeader = fieldMapping[field.key];
                if (mappedCsvHeader && row[mappedCsvHeader]) {
                    payload[field.key] = row[mappedCsvHeader].trim();
                }
            });

            // Clean phone to basic characters if needed (PocketBase handles this as text anyway)

            // Provide minimum required defaults if CSV lacked them but PocketBase requires them
            payload.status = payload.status || 'New Lead';

            try {
                await pb.collection('leads').create(payload);
                successCount++;
            } catch (err) {
                console.error(`Row ${i + 1} failed:`, err);
                errors.push(`Row ${i + 2} (Name: ${payload.name || 'Unknown'}): ${err.message}`);
            }

            setUploadProgress(Math.round(((i + 1) / parsedData.length) * 100));
        }

        setUploading(false);
        setUploadErrors(errors);

        if (errors.length === 0) {
            setTimeout(() => {
                onSuccess();
            }, 1500);
        }
    };

    const resetWizard = () => {
        setStep(1);
        setFile(null);
        setParsedData([]);
        setCsvHeaders([]);
        setFieldMapping({});
        setUploadProgress(0);
        setUploadErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 sm:p-6 flex justify-between items-start sm:items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Bulk Lead Upload</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 1 && "Import leads from a CSV file"}
                            {step === 2 && "Map your CSV headers to system fields"}
                            {step === 3 && "Processing bulk upload..."}
                        </p>
                    </div>
                    {step !== 3 && (
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">

                    {/* STEP 1: UPLOAD */}
                    {step === 1 && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Click to Upload CSV</h3>
                            <p className="text-gray-500 text-sm max-w-sm text-center">
                                Upload a standard CSV exported from Excel or Google Sheets. The first row must contain column headers.
                            </p>
                        </div>
                    )}

                    {/*  STEP 2: MAPPING */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>We found <strong>{parsedData.length}</strong> leads in <strong>{file?.name}</strong>. Please confirm the data mapping below.</p>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-x-auto">
                                <table className="w-full text-left text-sm min-w-[500px]">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                        <tr>
                                            <th className="p-3 font-semibold w-1/3">Target Field</th>
                                            <th className="p-3 font-semibold">Your CSV Header</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {TARGET_FIELDS.map(field => (
                                            <tr key={field.key} className="hover:bg-gray-50/50">
                                                <td className="p-3 font-medium text-gray-900 flex items-center gap-2">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        className="w-full max-w-xs p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                                        value={fieldMapping[field.key] || ''}
                                                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                                    >
                                                        <option value="">-- Do Not Import --</option>
                                                        {csvHeaders.map(header => (
                                                            <option key={header} value={header}>{header}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PROCESSING */}
                    {step === 3 && (
                        <div className="py-12 flex flex-col items-center justify-center">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Uploading Leads...</h3>
                                    <p className="text-gray-500 mb-8">Please don't close this window.</p>

                                    <div className="w-full max-w-md bg-gray-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                                        <div className="bg-primary h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{uploadProgress}% Complete</span>
                                </>
                            ) : (
                                <>
                                    {uploadErrors.length === 0 ? (
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
                                            <p className="text-gray-500">Successfully imported {parsedData.length} leads.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex items-center justify-center gap-3 text-red-600 mb-6">
                                                <AlertCircle className="w-8 h-8" />
                                                <h3 className="text-2xl font-bold text-gray-900">Completed with Errors</h3>
                                            </div>
                                            <p className="text-center text-gray-600 mb-6">
                                                Imported {parsedData.length - uploadErrors.length} out of {parsedData.length} leads successfully.
                                            </p>

                                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                <p className="text-sm font-bold text-red-800 mb-2">Error Log:</p>
                                                <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                                                    {uploadErrors.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-4 justify-between shrink-0 items-center">
                    <div className="w-full sm:w-auto text-center">
                        {step === 2 && (
                            <button onClick={resetWizard} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2">
                                Cancel & Start Over
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {step !== 3 && (
                            <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">
                                {step === 1 ? 'Cancel' : 'Close'}
                            </button>
                        )}

                        {step === 2 && (
                            <button
                                onClick={processUpload}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                Start Import <ChevronRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 3 && !uploading && uploadErrors.length > 0 && (
                            <button
                                onClick={onSuccess}
                                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-sm"
                            >
                                Finish & Refresh
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BulkLeadUploadWizard;
