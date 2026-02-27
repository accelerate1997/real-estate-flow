import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle, X, Loader2, Home, Building2, Construction, MapPin, IndianRupee } from 'lucide-react';
import Papa from 'papaparse';
import { pb } from '../services/pocketbase';

const getTargetFields = (category) => {
    // Base fields applicable to all
    const baseFields = [
        { key: 'title', label: 'Property Title', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'transactionType', label: 'Transaction Type (Sale/Rent)', required: true },
        { key: 'price', label: 'Price/Rent Amount (Number)', required: true },
        { key: 'locality', label: 'Locality / Area', required: true },
        { key: 'city', label: 'City', required: true },
        { key: 'builtUpArea', label: 'Built-up Area (sqft)', required: true },
        { key: 'carpetArea', label: 'Carpet Area (sqft)', required: true },
        { key: 'imageUrls', label: 'Image URLs (Comma separated)', required: false },
    ];

    if (category === 'Residential') {
        return [
            ...baseFields,
            { key: 'bhkType', label: 'BHK Type (e.g. 2BHK)', required: true },
            { key: 'furnishing', label: 'Furnishing (Fully/Semi/None)', required: false },
            { key: 'floorDetails', label: 'Floor Details (e.g., 5 / 10)', required: false },
            { key: 'preferredTenant', label: 'Preferred Tenant (Anyone/Family/Bachelors)', required: false },
            { key: 'expectedDeposit', label: 'Security Deposit (For Rent)', required: false },
        ];
    } else if (category === 'Commercial') {
        return [
            ...baseFields,
            { key: 'washroomType', label: 'Washroom Type (Private/Shared/None)', required: true },
            { key: 'powerAmps', label: 'Power Source (Amps)', required: false },
            { key: 'businessTypeSuitability', label: 'Ideal for Businesses', required: false },
            { key: 'expectedDeposit', label: 'Security Deposit (For Rent)', required: false },
        ];
    } else if (category === 'NewProjects') {
        return [
            ...baseFields,
            { key: 'constructionStatus', label: 'Construction Status', required: true },
            { key: 'reraId', label: 'RERA ID', required: false },
        ];
    }

    return baseFields;
};

const BulkUploadWizard = ({ isOpen, onClose, onSuccess, targetAgencyId, currentUserId }) => {
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [fieldMapping, setFieldMapping] = useState({});

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadErrors, setUploadErrors] = useState([]);

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const currentFields = getTargetFields(selectedCategory);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setStep(2);
    };

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
                    currentFields.forEach(field => {
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
                    setStep(3); // Move to mapping step
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
        const missing = currentFields.filter(f => f.required && !fieldMapping[f.key]);
        if (missing.length > 0) {
            alert(`Please map the following required fields: \n- ${missing.map(m => m.label).join('\n- ')}`);
            return false;
        }
        return true;
    };

    const processUpload = async () => {
        if (!validateMapping()) return;

        setStep(4);
        setUploading(true);
        setUploadProgress(0);
        setUploadErrors([]);

        let successCount = 0;
        let errors = [];

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];

            // Build pocketbase payload based on mapping
            const payload = {
                agencyId: targetAgencyId,
                createdBy: currentUserId,
                propertyCategory: selectedCategory, // Hardcode category based on step 1 selection
            };

            currentFields.forEach(field => {
                const mappedCsvHeader = fieldMapping[field.key];
                if (mappedCsvHeader && row[mappedCsvHeader]) {
                    payload[field.key] = row[mappedCsvHeader].trim();
                }
            });

            // Clean numbers
            if (payload.price) {
                payload.price = parseFloat(String(payload.price).replace(/[^0-9.]/g, '')) || 0;
            }
            if (payload.builtUpArea) {
                payload.builtUpArea = parseFloat(String(payload.builtUpArea).replace(/[^0-9.]/g, '')) || 0;
            }
            if (payload.carpetArea) {
                payload.carpetArea = parseFloat(String(payload.carpetArea).replace(/[^0-9.]/g, '')) || 0;
            }
            if (payload.expectedDeposit) {
                payload.expectedDeposit = parseFloat(String(payload.expectedDeposit).replace(/[^0-9.]/g, '')) || 0;
            }
            if (payload.powerAmps) {
                payload.powerAmps = parseFloat(String(payload.powerAmps).replace(/[^0-9.]/g, '')) || 0;
            }

            // Combine locality and city to location field
            if (payload.locality && payload.city) {
                payload.location = `${payload.locality}, ${payload.city}`;
            } else if (payload.locality) {
                payload.location = payload.locality;
            } else if (payload.city) {
                payload.location = payload.city;
            }

            // Provide minimum required defaults if CSV lacked them but PocketBase requires them
            payload.transactionType = payload.transactionType || 'Sale';
            payload.builtUpArea = payload.builtUpArea || 1; // Required by Backend
            payload.carpetArea = payload.carpetArea || 1;   // Required by Backend

            try {
                // Ensure data falls within pocketbase limitations using FormData, mimicking single property upload
                const pbData = new FormData();
                for (const key in payload) {
                    if (payload[key] !== undefined && payload[key] !== null && key !== 'locality' && key !== 'city' && key !== 'imageUrls') {
                        pbData.append(key, payload[key]);
                    }
                }

                // Fetch and append images if imageUrls are provided
                if (payload.imageUrls) {
                    const urls = payload.imageUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
                    for (let j = 0; j < urls.length; j++) {
                        try {
                            const response = await fetch(urls[j]);
                            if (response.ok) {
                                const blob = await response.blob();
                                if (blob.type.startsWith('image/')) {
                                    const extension = blob.type.split('/')[1] || 'jpg';
                                    const filename = `bulk-image-${Date.now()}-${j}.${extension}`;
                                    pbData.append('images', new File([blob], filename, { type: blob.type }));
                                }
                            } else {
                                console.warn(`Failed to fetch image from URL: ${urls[j]}`);
                            }
                        } catch (imgErr) {
                            console.warn(`Error fetching image ${urls[j]}:`, imgErr);
                        }
                    }
                }

                await pb.collection('properties').create(pbData);
                successCount++;
            } catch (err) {
                console.error(`Row ${i + 1} failed:`, err);
                // Try and grab detailed pocketbase validation errors if available
                let errMsg = err.message;
                if (err.data && err.data.data) {
                    const validationErrors = Object.entries(err.data.data)
                        .map(([key, val]) => `${key}: ${val.message}`)
                        .join('; ');
                    if (validationErrors) errMsg += ` (${validationErrors})`;
                }
                errors.push(`Row ${i + 2} (Title: ${payload.title || 'Unknown'}): ${errMsg}`);
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
        setSelectedCategory(null);
        setFile(null);
        setParsedData([]);
        setCsvHeaders([]);
        setFieldMapping({});
        setUploadProgress(0);
        setUploadErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const CategoryCard = ({ icon: Icon, title, value }) => (
        <button
            type="button"
            onClick={() => handleCategorySelect(value)}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl transition-all border-gray-200 hover:border-red-300 hover:bg-gray-50 text-gray-500 hover:text-gray-900`}
        >
            <Icon className={`w-10 h-10 mb-3 text-gray-400`} />
            <span className="font-bold">{title}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 sm:p-6 flex justify-between items-start sm:items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Bulk Property Upload</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 1 && "Select the property category"}
                            {step === 2 && `Import ${selectedCategory} properties from a CSV file`}
                            {step === 3 && "Map your CSV headers to system fields"}
                            {step === 4 && "Processing bulk upload..."}
                        </p>
                    </div>
                    {step !== 4 && (
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">

                    {/* STEP 1: CATEGORY SELECTION */}
                    {step === 1 && (
                        <div className="py-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">What kind of properties are you uploading?</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                                <CategoryCard icon={Home} title="Residential" value="Residential" />
                                <CategoryCard icon={Building2} title="Commercial" value="Commercial" />
                                <CategoryCard icon={Construction} title="New Projects" value="NewProjects" />
                            </div>
                            <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800 border border-blue-100 max-w-3xl mx-auto">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>You must upload properties of the same category together. If your CSV contains mixed property types, please split them into separate files before uploading.</p>
                            </div>
                        </div>
                    )}


                    {/* STEP 2: UPLOAD */}
                    {step === 2 && (
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
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Click to Upload {selectedCategory} CSV</h3>
                            <p className="text-gray-500 text-sm max-w-sm text-center">
                                Upload a standard CSV exported from Excel or Google Sheets. The first row must contain column headers.
                            </p>
                        </div>
                    )}

                    {/*  STEP 3: MAPPING */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>We found <strong>{parsedData.length}</strong> properties in <strong>{file?.name}</strong>. Please confirm the mapping for <strong>{selectedCategory}</strong> properties below.</p>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-auto max-h-[50vh]">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 font-semibold w-5/12">Target Field</th>
                                            <th className="p-4 font-semibold w-7/12">Your CSV Header</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentFields.map(field => (
                                            <tr key={field.key} className="hover:bg-gray-50/50">
                                                <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        className={`w-full max-w-md p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${field.required && !fieldMapping[field.key] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
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

                    {/* STEP 4: PROCESSING */}
                    {step === 4 && (
                        <div className="py-12 flex flex-col items-center justify-center">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Uploading Properties...</h3>
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
                                            <p className="text-gray-500">Successfully imported {parsedData.length} properties.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="flex items-center justify-center gap-3 text-red-600 mb-6">
                                                <AlertCircle className="w-8 h-8" />
                                                <h3 className="text-2xl font-bold text-gray-900">Completed with Errors</h3>
                                            </div>
                                            <p className="text-center text-gray-600 mb-6">
                                                Imported {parsedData.length - uploadErrors.length} out of {parsedData.length} properties successfully.
                                            </p>

                                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 max-h-64 overflow-y-auto w-full">
                                                <p className="text-sm font-bold text-red-800 mb-2">Error Log:</p>
                                                <ul className="list-disc pl-5 text-sm text-red-700 space-y-2">
                                                    {uploadErrors.map((err, i) => (
                                                        <li key={i} className="break-words">{err}</li>
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
                        {(step === 2 || step === 3) && (
                            <button onClick={resetWizard} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2">
                                Cancel & Start Over
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {step !== 4 && (
                            <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">
                                {step === 1 ? 'Cancel' : 'Close'}
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={processUpload}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                Start Import <ChevronRight className="w-4 h-4" />
                            </button>
                        )}

                        {step === 4 && !uploading && uploadErrors.length > 0 && (
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

export default BulkUploadWizard;
