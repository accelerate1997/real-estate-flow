import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Home, Building2, Construction, MapPin,
    CheckCircle2, AlertCircle, IndianRupee, ImagePlus, ChevronRight, ChevronLeft, Trash2, Loader2
} from 'lucide-react';
import { pb } from '../services/pocketbase';
import imageCompression from 'browser-image-compression';

const AMENITIES_LIST = {
    Residential: ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Club House', 'Power Backup', 'Lift', 'Park'],
    Commercial: ['Visitor Parking', 'Loading Dock', 'Central AC', 'Food Court', 'Security', 'Service Lift', 'Fire Safety', 'Cafeteria'],
    NewProjects: ['Club House', 'Swimming Pool', 'Gym', 'Jogging Track', 'Kids Play Area', 'Security', 'Power Backup', 'Indoor Games']
};

const AddPropertyWizard = ({ onClose, onSuccess, targetAgencyId, currentUserId, initialData }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Core Form State
    const [formData, setFormData] = useState({
        propertyCategory: initialData?.propertyCategory || 'Residential',
        transactionType: initialData?.transactionType || 'Rent',
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price || '',
        expectedDeposit: initialData?.expectedDeposit || '',
        pricePerSqFt: initialData?.pricePerSqFt || '',
        builtUpArea: initialData?.builtUpArea || '',
        carpetArea: initialData?.carpetArea || '',
        bhkType: initialData?.bhkType || '2BHK',
        furnishing: initialData?.furnishing || 'Semi',
        floorDetails: initialData?.floorDetails || '',
        businessTypeSuitability: initialData?.businessTypeSuitability || '',
        washroomType: initialData?.washroomType || 'Private',
        powerAmps: initialData?.powerAmps || '',
        constructionStatus: initialData?.constructionStatus || 'Under Construction',
        reraId: initialData?.reraId || '',
        preferredTenant: initialData?.preferredTenant || 'Anyone',
        location: initialData?.location || '',
        city: initialData?.location ? initialData.location.split(', ')[1] || '' : '',
        locality: initialData?.location ? initialData.location.split(', ')[0] || '' : '',
        amenities: initialData?.projectAmenities ? (typeof initialData.projectAmenities === 'string' ? JSON.parse(initialData.projectAmenities) : initialData.projectAmenities) : []
    });

    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const [customAmenityInput, setCustomAmenityInput] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const [isCompressingImage, setIsCompressingImage] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => {
            const current = [...prev.amenities];
            if (current.includes(amenity)) {
                return { ...prev, amenities: current.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...current, amenity] };
            }
        });
    };

    const handleAddCustomAmenity = () => {
        const trimmed = customAmenityInput.trim();
        if (trimmed && !formData.amenities.includes(trimmed)) {
            setFormData(prev => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
        }
        setCustomAmenityInput('');
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 10) {
            setErrors(prev => ({ ...prev, images: "Maximum 10 images allowed." }));
            return;
        }

        setIsCompressingImage(true);
        try {
            const options = {
                maxSizeMB: 1, // Compress to max 1MB
                maxWidthOrHeight: 1920, // Max Full HD res
                useWebWorker: true,
                fileType: 'image/webp', // Convert to WebP
                initialQuality: 0.8
            };

            const compressedPromises = files.map(async (file) => {
                try {
                    const compressedFile = await imageCompression(file, options);
                    return {
                        file: compressedFile,
                        preview: URL.createObjectURL(compressedFile)
                    };
                } catch (error) {
                    console.error("Compression specific file error:", error);
                    // Fallback to original if compression fails
                    return {
                        file,
                        preview: URL.createObjectURL(file)
                    };
                }
            });

            const newImages = await Promise.all(compressedPromises);

            setImages(prev => [...prev, ...newImages]);
            if (errors.images) setErrors(prev => ({ ...prev, images: null }));
        } catch (err) {
            console.error("Image Compression Error:", err);
            setErrors(prev => ({ ...prev, images: "Error compressing image. Try a smaller file." }));
        } finally {
            setIsCompressingImage(false);
            // Reset input so the same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (indexToRemove) => {
        setImages(prev => {
            const newArray = [...prev];
            URL.revokeObjectURL(newArray[indexToRemove].preview);
            newArray.splice(indexToRemove, 1);
            return newArray;
        });
    };

    const handleAddImageUrl = async () => {
        if (!imageUrlInput.trim()) return;
        if (images.length >= 10) {
            setErrors(prev => ({ ...prev, images: "Maximum 10 images allowed." }));
            return;
        }

        setIsDownloadingImage(true);
        try {
            // Fetch the image from the URL and convert it to a Blob
            const response = await fetch(imageUrlInput);
            if (!response.ok) throw new Error("Failed to fetch image from URL");

            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error("URL does not point to a valid image");
            }

            // Create a File object from the Blob
            const filename = `url-image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
            const file = new File([blob], filename, { type: blob.type });

            const newImage = {
                file,
                preview: URL.createObjectURL(file)
            };

            setImages(prev => [...prev, newImage]);
            setImageUrlInput('');
            if (errors.images) setErrors(prev => ({ ...prev, images: null }));
        } catch (error) {
            console.error("Error downloading image:", error);
            alert(`Could not load image from URL: ${error.message}`);
        } finally {
            setIsDownloadingImage(false);
        }
    };

    const handleVideoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (videos.length + files.length > 3) {
            setErrors(prev => ({ ...prev, videos: "Maximum 3 videos allowed." }));
            return;
        }

        const newVideos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setVideos(prev => [...prev, ...newVideos]);
        if (errors.videos) setErrors(prev => ({ ...prev, videos: null }));
    };

    const removeVideo = (indexToRemove) => {
        setVideos(prev => {
            const newArray = [...prev];
            URL.revokeObjectURL(newArray[indexToRemove].preview);
            newArray.splice(indexToRemove, 1);
            return newArray;
        });
    };

    // --- Validations ---
    const validateStep = (currentStep) => {
        const newErrors = {};
        let isValid = true;

        if (currentStep === 1) {
            // Basic Info rules
            if (!formData.propertyCategory) { newErrors.propertyCategory = "Required"; isValid = false; }
            if (formData.propertyCategory === 'Residential') {
                if (!formData.bhkType) { newErrors.bhkType = "Required"; isValid = false; }
            }
            if (formData.propertyCategory === 'Commercial') {
                if (!formData.washroomType) { newErrors.washroomType = "Required"; isValid = false; }
            }
            if (formData.propertyCategory === 'NewProjects') {
                if (!formData.constructionStatus) { newErrors.constructionStatus = "Required"; isValid = false; }
            }
        }
        else if (currentStep === 2) {
            // Location rules
            if (!formData.city) { newErrors.city = "Required"; isValid = false; }
            if (!formData.locality) { newErrors.locality = "Required"; isValid = false; }
        }
        else if (currentStep === 3) {
            // Amenities - Optional
        }
        else if (currentStep === 4) {
            // Strict Pricing and Area validation
            if (!formData.title || formData.title.length < 5) { newErrors.title = "Title must be at least 5 characters."; isValid = false; }

            const p = parseFloat(formData.price || 0);
            if (p <= 0) { newErrors.price = "Price must be greater than zero."; isValid = false; }

            if (formData.transactionType === 'Rent' && !formData.expectedDeposit) {
                newErrors.expectedDeposit = "Deposit required for rentals."; isValid = false;
            }

            const cArea = parseFloat(formData.carpetArea || 0);
            const bArea = parseFloat(formData.builtUpArea || 0);

            if (cArea <= 0) { newErrors.carpetArea = "Required."; isValid = false; }
            if (bArea <= 0) { newErrors.builtUpArea = "Required."; isValid = false; }

            if (cArea >= bArea && bArea > 0) {
                newErrors.carpetArea = "Carpet Area must be strictly less than Built-up Area.";
                isValid = false;
            }

            if (!initialData && images.length < 3) {
                newErrors.images = "At least 3 high-quality images are required.";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
    };

    const submitProperty = async () => {
        if (!validateStep(4)) return;
        setIsSubmitting(true);

        try {
            // Build FormData payload strictly for PocketBase
            const pbData = new FormData();
            pbData.append('title', formData.title);
            pbData.append('description', formData.description);
            pbData.append('propertyCategory', formData.propertyCategory);
            pbData.append('transactionType', formData.transactionType);

            pbData.append('price', parseFloat(formData.price));
            pbData.append('builtUpArea', parseFloat(formData.builtUpArea));
            pbData.append('carpetArea', parseFloat(formData.carpetArea));

            // Appending conditional fields
            if (formData.propertyCategory === 'Residential') {
                pbData.append('bhkType', formData.bhkType);
                pbData.append('furnishing', formData.furnishing);
                pbData.append('floorDetails', formData.floorDetails);
                if (formData.transactionType === 'Rent') pbData.append('preferredTenant', formData.preferredTenant);
            }
            if (formData.propertyCategory === 'Commercial') {
                pbData.append('washroomType', formData.washroomType);
                pbData.append('powerAmps', parseFloat(formData.powerAmps) || 0);
                pbData.append('businessTypeSuitability', formData.businessTypeSuitability);
            }
            if (formData.propertyCategory === 'NewProjects') {
                pbData.append('constructionStatus', formData.constructionStatus);
                pbData.append('reraId', formData.reraId);
            }

            if (formData.transactionType === 'Rent') {
                pbData.append('expectedDeposit', parseFloat(formData.expectedDeposit) || 0);
            } else {
                pbData.append('pricePerSqFt', parseFloat(formData.pricePerSqFt) || 0);
            }

            pbData.append('location', `${formData.locality}, ${formData.city}`);
            pbData.append('projectAmenities', JSON.stringify(formData.amenities));
            pbData.append('agencyId', targetAgencyId);
            pbData.append('createdBy', currentUserId);

            // Append images array
            images.forEach((img) => {
                pbData.append('images', img.file);
            });

            // Append videos array
            videos.forEach((vid) => {
                pbData.append('videos', vid.file);
            });

            if (initialData?.id) {
                await pb.collection('properties').update(initialData.id, pbData);
            } else {
                // Defensive check: Prevent duplicate property entries
                const currentLocation = `${formData.locality}, ${formData.city}`;
                try {
                    const existing = await pb.collection('properties').getFirstListItem(
                        pb.filter('title = {:title} && price = {:price} && location = {:location} && agencyId = {:agencyId}', {
                            title: formData.title,
                            price: parseFloat(formData.price),
                            location: currentLocation,
                            agencyId: targetAgencyId
                        })
                    );
                    
                    if (existing && !window.confirm(`Warning: A property with this title, price, and location already exists (ID: ${existing.id}). Do you still want to list it?`)) {
                        setIsSubmitting(false);
                        return;
                    }
                } catch (e) {
                    // 404 is expected if no duplicate exists, continue normally
                }

                const newRecord = await pb.collection('properties').create(pbData);
                // Trigger Smart Match Backend
                const agentApiUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3000';
                fetch(`${agentApiUrl}/api/properties/match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId: newRecord.id })
                }).catch(console.error);
            }
            onSuccess(); // Close and refresh list
        } catch (error) {
            console.error('Submission failed:', error);

            // Pocketbase specific form errors
            if (error.status === 403) {
                alert("Permission Denied (403): You do not have permission to create properties. Please go to your PocketBase Admin Panel -> properties collection -> API Rules, and unlock the 'Create' and 'List/View' rules.");
            }
            else if (error?.response?.data && Object.keys(error.response.data).length > 0) {
                const apiErrors = {};
                let errorMessages = [];
                for (let key in error.response.data) {
                    apiErrors[key] = error.response.data[key].message;
                    errorMessages.push(`${key}: ${error.response.data[key].message}`);
                }
                setErrors(apiErrors);
                alert(`Validation Error:\n${errorMessages.join('\n')}\n\nPlease ensure your PocketBase 'properties' collection fields EXACTLY match the expected types (e.g. Number, Text, Select).`);
            }
            else {
                alert(`An unexpected error occurred: ${error.message || 'Unknown error'}. Please check the console.`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Render Helpers ---
    const CategoryCard = ({ icon: Icon, title, value }) => (
        <button
            type="button"
            onClick={() => setFormData({ ...formData, propertyCategory: value })}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl transition-all ${formData.propertyCategory === value
                ? 'border-primary bg-red-50 text-primary'
                : 'border-gray-200 hover:border-red-300 hover:bg-gray-50 text-gray-500 hover:text-gray-900'
                }`}
        >
            <Icon className={`w-10 h-10 mb-3 ${formData.propertyCategory === value ? 'text-primary' : 'text-gray-400'}`} />
            <span className="font-bold">{title}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6 lg:p-12 overflow-y-auto">
            <div className="bg-white mx-auto max-w-5xl rounded-2xl shadow-2xl flex flex-col min-h-[85vh]">

                {/* Header Navbar */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                        <Home className="w-6 h-6 text-primary" />
                        {initialData ? 'Edit Property' : 'Post a Property'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-4 sm:px-8 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    {[
                        { num: 1, label: 'Basic Details' },
                        { num: 2, label: 'Location' },
                        { num: 3, label: 'Amenities' },
                        { num: 4, label: 'Gallery & Pricing' }
                    ].map((s) => (
                        <div key={s.num} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step > s.num ? 'bg-primary border-primary text-white' :
                                    step === s.num ? 'border-primary text-primary bg-white' :
                                        'border-gray-300 text-gray-400 bg-white'
                                    }`}>
                                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                                </div>
                                <span className={`text-xs mt-2 font-medium hidden sm:block ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {s.num !== 4 && (
                                <div className={`h-1 flex-1 -mx-8 sm:-mx-12 rounded-full transition-colors ${step > s.num ? 'bg-primary' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Wizard Body Content */}
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-3xl mx-auto space-y-8"
                        >

                            {/* --- STEP 1: Basic Property Info --- */}
                            {step === 1 && (
                                <div className="space-y-8">
                                    {/* Property Category */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">What kind of property are you listing?</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <CategoryCard icon={Home} title="Residential" value="Residential" />
                                            <CategoryCard icon={Building2} title="Commercial" value="Commercial" />
                                            <CategoryCard icon={Construction} title="New Projects" value="NewProjects" />
                                        </div>
                                    </div>

                                    {/* Transaction Type */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Transaction Type</h3>
                                        <div className="flex gap-4">
                                            {['Rent', 'Sale'].map((type) => (
                                                <label key={type} className={`cursor-pointer flex-1 flex items-center justify-center p-4 rounded-xl border-2 font-medium transition-all ${formData.transactionType === type ? 'border-primary bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                                    <input type="radio" name="transactionType" value={type} checked={formData.transactionType === type} onChange={handleInputChange} className="hidden" />
                                                    For {type}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* Conditional Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Residential Specifics */}
                                        {formData.propertyCategory === 'Residential' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">BHK Type *</label>
                                                    <select name="bhkType" value={formData.bhkType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                        {['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '4+BHK'].map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing</label>
                                                    <select name="furnishing" value={formData.furnishing} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                        <option value="Fully">Fully Furnished</option>
                                                        <option value="Semi">Semi Furnished</option>
                                                        <option value="None">Unfurnished</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor Details (e.g., 5th Floor out of 10)</label>
                                                    <input type="text" name="floorDetails" value={formData.floorDetails} onChange={handleInputChange} placeholder="E.g., 5 / 10" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" />
                                                </div>
                                                {formData.transactionType === 'Rent' && (
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Tenant</label>
                                                        <select name="preferredTenant" value={formData.preferredTenant} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                            <option value="Anyone">Anyone</option>
                                                            <option value="Family">Family Only</option>
                                                            <option value="Bachelors">Bachelors Only</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Commercial Specifics */}
                                        {formData.propertyCategory === 'Commercial' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Washroom Type *</label>
                                                    <select name="washroomType" value={formData.washroomType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                        <option value="Private">Private</option>
                                                        <option value="Shared">Shared</option>
                                                        <option value="None">None</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Power Source (Amps)</label>
                                                    <input type="number" name="powerAmps" value={formData.powerAmps} onChange={handleInputChange} placeholder="e.g. 50" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ideal for Businesses (comma separated)</label>
                                                    <input type="text" name="businessTypeSuitability" value={formData.businessTypeSuitability} onChange={handleInputChange} placeholder="Retail, Office, IT Park, Restaurant..." className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" />
                                                </div>
                                            </>
                                        )}

                                        {/* New Projects Specifics */}
                                        {formData.propertyCategory === 'NewProjects' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Construction Status *</label>
                                                    <select name="constructionStatus" value={formData.constructionStatus} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary">
                                                        <option value="New Launch">New Launch (Pre-EMI)</option>
                                                        <option value="Under Construction">Under Construction</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">RERA ID</label>
                                                    <input type="text" name="reraId" value={formData.reraId} onChange={handleInputChange} placeholder="e.g. PR/123/456" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 2: Location --- */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="text-primary" /> Where is the property located?
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Mumbai, Bangalore" className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-primary ${errors.city ? 'border-red-500' : 'border-gray-200'}`} />
                                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Locality / Sector *</label>
                                            <input type="text" name="locality" value={formData.locality} onChange={handleInputChange} placeholder="e.g. Andheri West, Sector 15" className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-primary ${errors.locality ? 'border-red-500' : 'border-gray-200'}`} />
                                            {errors.locality && <p className="text-red-500 text-xs mt-1">{errors.locality}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4">
                                        <MapPin className="text-blue-500 w-6 h-6 flex-shrink-0" />
                                        <p className="text-sm text-blue-900 leading-relaxed">
                                            Providing accurate location details significantly increases your lead conversions. Buyers map-search based on City and Locality.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 3: Amenities --- */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select Available Amenities</h3>
                                    <p className="text-gray-500 text-sm mb-4">Select all the features this property offers to attract the right buyers/tenants.</p>

                                    <div className="flex gap-3 mb-6">
                                        <input
                                            type="text"
                                            value={customAmenityInput}
                                            onChange={(e) => setCustomAmenityInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomAmenity();
                                                }
                                            }}
                                            placeholder="Type custom amenity (e.g. Private Pool) and press Enter"
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomAmenity}
                                            className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-lg font-medium transition-colors"
                                        >
                                            Add Custom
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {Array.from(new Set([...AMENITIES_LIST[formData.propertyCategory], ...formData.amenities])).map((amenity) => {
                                            const isActive = formData.amenities.includes(amenity);
                                            return (
                                                <button
                                                    key={amenity}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity)}
                                                    className={`p-4 rounded-xl border text-sm font-medium transition-all text-center ${isActive
                                                        ? 'bg-primary border-primary text-white shadow-md'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {amenity}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 4: Area, Price, Images & Submit --- */}
                            {step === 4 && (
                                <div className="space-y-8">
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">Public Listing Display</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Property Headline / Title *</label>
                                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Stunning 3BHK Seaview Apartment in Bandra" className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-primary ${errors.title ? 'border-red-500' : 'border-gray-200'}`} />
                                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
                                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Highlight key selling points..." className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary resize-none"></textarea>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Area Sector */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Area Specs</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Super Built-up Area (Sq.Ft) *</label>
                                                    <input type="number" name="builtUpArea" value={formData.builtUpArea} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:border-primary ${errors.builtUpArea ? 'border-red-500 ' : 'border-gray-200'}`} />
                                                    {errors.builtUpArea && <p className="text-red-500 text-xs mt-1">{errors.builtUpArea}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Carpet Area (Sq.Ft) *</label>
                                                    <input type="number" name="carpetArea" value={formData.carpetArea} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:border-primary ${errors.carpetArea ? 'border-red-500 ' : 'border-gray-200'}`} />
                                                    {errors.carpetArea && <p className="text-red-500 text-xs mt-1 flex gap-1"><AlertCircle className="w-3 h-3" />{errors.carpetArea}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Sector */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Financials</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Expected {formData.transactionType === 'Rent' ? 'Monthly Rent' : 'Total Price'} (₹) *</label>
                                                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-lg border bg-white font-bold text-gray-900 focus:outline-none focus:border-primary ${errors.price ? 'border-red-500 ' : 'border-gray-200'}`} />
                                                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                                                </div>
                                                {formData.transactionType === 'Rent' ? (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Security Deposit (₹) *</label>
                                                        <input type="number" name="expectedDeposit" value={formData.expectedDeposit} onChange={handleInputChange} className={`w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:border-primary ${errors.expectedDeposit ? 'border-red-500 ' : 'border-gray-200'}`} />
                                                        {errors.expectedDeposit && <p className="text-red-500 text-xs mt-1">{errors.expectedDeposit}</p>}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Expected Price / Sq.Ft (₹)</label>
                                                        <input type="number" name="pricePerSqFt" value={formData.pricePerSqFt} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border bg-white border-gray-200 focus:outline-none focus:border-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strict Image Zone */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Property Images *</h3>
                                                <p className="text-xs text-gray-500">Upload at least 3 genuine photos of the property. First image acts as Cover.</p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-400">{images.length} / 10 added</span>
                                        </div>

                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${errors.images ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'} ${isCompressingImage ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => !isCompressingImage && fileInputRef.current?.click()}>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/jpeg, image/png, image/webp" className="hidden" />
                                            {isCompressingImage ? (
                                                <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                                            ) : (
                                                <ImagePlus className={`w-12 h-12 mx-auto mb-3 ${errors.images ? 'text-red-400' : 'text-gray-400'}`} />
                                            )}
                                            <p className="font-semibold text-gray-700">
                                                {isCompressingImage ? 'Optimizing Images to WebP...' : 'Click to browse or Drag & Drop herein'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 10 images)</p>
                                        </div>
                                        {errors.images && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4" />{errors.images}</p>}

                                        <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center">
                                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap hidden sm:block">OR</span>
                                            <div className="flex w-full gap-2 mt-2 sm:mt-0">
                                                <input
                                                    type="url"
                                                    value={imageUrlInput}
                                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                                    placeholder="Paste Image URL here (e.g. https://example.com/photo.jpg)"
                                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddImageUrl();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddImageUrl}
                                                    disabled={isDownloadingImage || !imageUrlInput.trim() || images.length >= 10}
                                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors whitespace-nowrap flex items-center"
                                                >
                                                    {isDownloadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Add'}
                                                </button>
                                            </div>
                                        </div>

                                        {images.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                                                {images.map((img, index) => (
                                                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-gray-100 bg-gray-50">
                                                        <img src={img.preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                                                        {index === 0 && (
                                                            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                                                                Cover
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Strict Video Zone - Optional */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Property Videos (Optional)</h3>
                                                <p className="text-xs text-gray-500">Add property walkthroughs to boost engagement. Max 50MB per video.</p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-400">{videos.length} / 3 added</span>
                                        </div>

                                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${errors.videos ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'}`} onClick={() => videoInputRef.current?.click()}>
                                            <input type="file" ref={videoInputRef} onChange={handleVideoUpload} multiple accept="video/mp4, video/webm, video/quicktime" className="hidden" />
                                            <ImagePlus className={`w-12 h-12 mx-auto mb-3 ${errors.videos ? 'text-red-400' : 'text-gray-400'}`} />
                                            <p className="font-semibold text-gray-700">Click to browse or Drag & Drop videos herein</p>
                                            <p className="text-xs text-gray-500 mt-1">Supports MP4, WEBM, MOV (Max 3 videos)</p>
                                        </div>
                                        {errors.videos && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-4 h-4" />{errors.videos}</p>}

                                        {videos.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                                                {videos.map((vid, index) => (
                                                    <div key={index} className="relative group rounded-xl overflow-hidden aspect-video border-2 border-gray-100 bg-gray-900">
                                                        <video src={vid.preview} controls className="w-full h-full object-contain" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeVideo(index); }}
                                                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 z-10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Navigation Bar */}
                <div className="border-t border-gray-100 p-4 sm:p-6 bg-white rounded-b-2xl flex justify-between items-center gap-2">
                    <button
                        type="button"
                        onClick={step === 1 ? onClose : prevStep}
                        className="px-4 sm:px-6 py-2.5 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap"
                    >
                        {step === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" /> Back</>}
                    </button>

                    <button
                        type="button"
                        onClick={step === 4 ? submitProperty : nextStep}
                        disabled={isSubmitting || isCompressingImage}
                        className="px-4 sm:px-8 py-2.5 sm:py-3 font-bold text-white bg-primary hover:bg-red-800 rounded-xl shadow-lg transition-all flex items-center gap-1 sm:gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                        ) : step === 4 ? (
                            <><CheckCircle2 className="w-5 h-5" /> {initialData ? 'Save Changes' : 'Post Property'}</>
                        ) : (
                            <>Next Step <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddPropertyWizard;
