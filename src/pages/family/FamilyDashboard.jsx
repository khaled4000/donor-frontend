import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext/AuthContext';
import ApiService from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import { toast } from 'react-toastify';
import './FamilyDashboard.css';
import { regularAuthStorage } from '../../utils/authStorage';

// Memoized file size formatter
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Memoized village data
const SOUTH_LEBANON_VILLAGES = {
  en: [
    'Ain Baal', 'Abra', 'Adchit', 'Adloun', 'Aita al-Shaab', 'Aita az-Zut',
    'Al-Bazouriye', 'Al-Khiyam', 'Al-Mansouri', 'Al-Taybe', 'Alma ash-Shaab',
    'Ansar', 'Arabsalim', 'Arnoun', 'Bafliyeh', 'Bani Hayyan', 'Barish',
    'Bayt Yahoun', 'Bazouriye', 'Bint Jbeil', 'Blida', 'Borj ash-Shamali',
    'Borj el-Muluk', 'Burghuz', 'Chamaa', 'Chaqra', 'Chehabiyeh', 'Chihine',
    'Deir Mimas', 'Deir Qanoun an-Nahr', 'Deir Seriane', 'Dhayra', 'Ebba',
    'Ein el-Delb', 'El-Adousiye', 'El-Bassatine', 'El-Khiam', 'El-Mansouri',
    'El-Qantara', 'Ghandouriye', 'Haddatha', 'Hanaway', 'Haris', 'Harouf',
    'Houla', 'Jbal as-Saghir', 'Jezzine', 'Jibbain', 'Kafra', 'Kfar Dounin',
    'Kfar Kila', 'Kfar Melki', 'Kfar Roummane', 'Kfar Shuba', 'Kfar Tibnit',
    'Khallet Wardeh', 'Khiam', 'Khirbet Selm', 'Kounine', 'Ksour', 'Majdal Zoun',
    'Marjayoun', 'Maroun ar-Ras', 'Mays al-Jabal', 'Meiss ej-Jabal', 'Metulla',
    'Nabatiye', 'Odaisseh', 'Qana', 'Qantara', 'Qlayle', 'Qlayaa', 'Qouzah',
    'Rachaya al-Fukhar', 'Ramyeh', 'Ras al-Biyyadah', 'Rmadiyeh', 'Rmeish',
    'Rshaf', 'Saida', 'Sajad', 'Sarba', 'Shaqra', 'Sreifa', 'Tayr Harfa',
    'Tayr Dibba', 'Tebnine', 'Tyre', 'Yaroun', 'Yateri', 'Zawtar ash-Sharqiye'
  ],
  ar: [
    'عين بعل', 'عبرا', 'عدشيت', 'عدلون', 'عيتا الشعب', 'عيتا الزط',
    'البازورية', 'الخيام', 'المنصوري', 'الطيبة', 'علما الشعب',
    'أنصار', 'عربصاليم', 'أرنون', 'بفلية', 'بني حيان', 'باريش',
    'بيت ياحون', 'البازورية', 'بنت جبيل', 'بليدا', 'برج الشمالي',
    'برج الملوك', 'برغوز', 'شمعا', 'شقرا', 'شهابية', 'شحين',
    'دير ميماس', 'دير قانون النهر', 'دير سريان', 'ضهيرة', 'عبا',
    'عين الدلب', 'العدوسية', 'البساتين', 'الخيام', 'المنصوري',
    'القنطرة', 'غندورية', 'حداثا', 'حناوي', 'حاريص', 'حاروف',
    'حولا', 'جبل الصغير', 'جزين', 'جبين', 'كفرا', 'كفر دونين',
    'كفركلا', 'كفر ملكي', 'كفر رمان', 'كفرشوبا', 'كفر تبنيت',
    'خلة وردة', 'الخيام', 'خربة سلم', 'كونين', 'كسور', 'مجدل زون',
    'مرجعيون', 'مارون الراس', 'ميس الجبل', 'ميس الجبل', 'متولة',
    'النبطية', 'عديسة', 'قانا', 'قنطرة', 'قليلة', 'قلعة', 'قوزح',
    'راشيا الفخار', 'راميا', 'رأس البياضة', 'رمادية', 'رميش',
    'رشاف', 'صيدا', 'سجد', 'صربا', 'شقرا', 'صريفا', 'طير حرفا',
    'طير دبا', 'تبنين', 'صور', 'يارون', 'ياطر', 'زوطر الشرقية'
  ]
};

// Translation object moved outside component for better performance
const TRANSLATIONS = {
  en: {
    // Navigation
    overview: 'Overview',
    submitCase: 'Submit Case',
    myDocuments: 'My Documents',
    
    // Overview page
    welcome: 'Welcome',
    trackStatus: 'Track your case status and manage your information',
    lastSaved: 'Last saved',
    caseStatus: 'Case Status',
    submitted: 'Submitted',
    caseId: 'Case ID',
    filesUploaded: 'Files Uploaded',
    applicationProgress: 'Application Progress',
    complete: 'Complete',
    selectedVillage: 'Selected Village',
    notAssigned: 'Not assigned',
    
    // Status values
    draft: 'Draft',
    underReview: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    
    // Submit form
    submitNewCase: 'Submit New Case Application',
    formInstructions: 'Please provide accurate information about your family and property damage. All fields marked with (*) are required.',
    dataSavedInfo: 'Your data will be saved when you submit the form. Please complete all sections before submitting.',
    
    // Family Information
    familyInformation: 'Family Information',
    familyName: 'Family Name',
    headOfHousehold: 'Head of Household',
    primaryPhone: 'Primary Phone Number',
    emailAddress: 'Email Address',
    totalFamilyMembers: 'Total Family Members',
    
    // Property Information
    propertyInformation: 'Property Information',
    village: 'Village',
    currentAddress: 'Current Address',
    originalPropertyAddress: 'Original Property Address',
    
    // Destruction Assessment
    destructionAssessment: 'Destruction Assessment',
    dateOfDestruction: 'Date of Destruction',
    causeOfDestruction: 'Cause of Destruction',
    estimatedDestructionPercentage: 'Estimated Destruction Percentage',
    detailedDamageDescription: 'Detailed Damage Description',
    
    // Evidence Upload
    evidenceUpload: 'Evidence Upload',
    uploadInstructions: 'Click to upload files or drag and drop',
    fileTypeInfo: 'JPG, PNG, PDF up to 10MB each',
    uploadedFiles: 'Uploaded Files',
    category: 'Category',
    
    // File categories
    selectCategory: 'Select category',
    propertyDamagePhotos: 'Property Damage Photos',
    beforeDestructionPhotos: 'Before Destruction Photos',
    ownershipDocuments: 'Ownership Documents',
    idDocuments: 'ID Documents',
    officialReports: 'Official Reports',
    other: 'Other',
    
    // Destruction causes
    selectCause: 'Select cause',
    airstrike: 'Airstrike',
    artillery: 'Artillery',
    groundCombat: 'Ground Combat',
    explosion: 'Explosion',
    fire: 'Fire',
    
    // Buttons
    submitCaseBtn: 'Submit Case',
    submittingCase: 'Submitting Case...',
    saveDraft: 'Save Draft',
    saving: 'Saving...',
    
    // Placeholders
    enterFamilySurname: 'Enter family surname',
    fullNameHead: 'Full name of head of household',
    phoneFormat: '+961 XX XXX XXX',
    emailFormat: 'your.email@example.com',
    selectMembers: 'Select number of members',
    selectVillage: 'Select your village',
    currentStaying: 'Where are you currently staying?',
    destroyedPropertyAddress: 'Full address of the destroyed property',
    describeDamage: 'Please describe the damage in detail...',
    
    // Validation messages
    fieldRequired: 'This field is required',
    validEmail: 'Please enter a valid email address',
    validPhone: 'Please enter a valid phone number',
    validPercentage: 'Please enter a percentage between 0 and 100',
    uploadRequired: 'Please upload at least one photo or document as evidence',
    
    // Success/Error messages
    fixErrors: 'Please fix the errors in the form before submitting.',
    caseSubmitted: 'Case submitted successfully! Your Case ID is',
    sentToReview: 'The case has been sent to our checker for review.',
    dataSaved: 'Data saved successfully!',
    saveError: 'Error saving data. Please try again.',
    submissionError: 'There was an error submitting your case. Please try again.',
    
    // Documents page
    viewDocuments: 'View and manage all uploaded documents for your case.',
    noDocuments: 'No documents uploaded yet',
    goToSubmit: 'Go to the "Submit Case" tab to upload your evidence documents.',
    view: 'View',
    
    // Member count
    member: 'member',
    members: 'members'
  },
  ar: {
    // Navigation
    overview: 'نظرة عامة',
    submitCase: 'تقديم قضية',
    myDocuments: 'مستنداتي',
    
    // Overview page
    welcome: 'مرحباً',
    trackStatus: 'تتبع حالة قضيتك وإدارة معلوماتك',
    lastSaved: 'آخر حفظ',
    caseStatus: 'حالة القضية',
    submitted: 'مُقدم',
    caseId: 'رقم القضية',
    filesUploaded: 'الملفات المرفوعة',
    applicationProgress: 'تقدم الطلب',
    complete: 'مكتمل',
    selectedVillage: 'القرية المختارة',
    notAssigned: 'غير محدد',
    
    // Status values
    draft: 'مسودة',
    underReview: 'قيد المراجعة',
    approved: 'مُوافق عليه',
    rejected: 'مرفوض',
    
    // Submit form
    submitNewCase: 'تقديم طلب قضية جديدة',
    formInstructions: 'يرجى تقديم معلومات دقيقة عن عائلتك والأضرار التي لحقت بالممتلكات. جميع الحقول المحددة بـ (*) مطلوبة.',
    dataSavedInfo: 'سيتم حفظ بياناتك عند تقديم النموذج. يرجى إكمال جميع الأقسام قبل التقديم.',
    
    // Family Information
    familyInformation: 'معلومات العائلة',
    familyName: 'اسم العائلة',
    headOfHousehold: 'رب الأسرة',
    primaryPhone: 'رقم الهاتف الأساسي',
    emailAddress: 'عنوان البريد الإلكتروني',
    totalFamilyMembers: 'إجمالي أفراد العائلة',
    
    // Property Information
    propertyInformation: 'معلومات الممتلكات',
    village: 'القرية',
    currentAddress: 'العنوان الحالي',
    originalPropertyAddress: 'عنوان الممتلكات الأصلية',
    
    // Destruction Assessment
    destructionAssessment: 'تقييم الدمار',
    dateOfDestruction: 'تاريخ الدمار',
    causeOfDestruction: 'سبب الدمار',
    estimatedDestructionPercentage: 'النسبة المئوية المقدرة للدمار',
    detailedDamageDescription: 'وصف مفصل للأضرار',
    
    // Evidence Upload
    evidenceUpload: 'رفع الأدلة',
    uploadInstructions: 'انقر لرفع الملفات أو اسحب وأفلت',
    fileTypeInfo: 'JPG, PNG, PDF حتى 10 ميجابايت لكل ملف',
    uploadedFiles: 'الملفات المرفوعة',
    category: 'الفئة',
    
    // File categories
    selectCategory: 'اختر الفئة',
    propertyDamagePhotos: 'صور أضرار الممتلكات',
    beforeDestructionPhotos: 'صور ما قبل الدمار',
    ownershipDocuments: 'وثائق الملكية',
    idDocuments: 'وثائق الهوية',
    officialReports: 'التقارير الرسمية',
    other: 'أخرى',
    
    // Destruction causes
    selectCause: 'اختر السبب',
    airstrike: 'غارة جوية',
    artillery: 'مدفعية',
    groundCombat: 'قتال بري',
    explosion: 'انفجار',
    fire: 'حريق',
    
    // Buttons
    submitCaseBtn: 'تقديم القضية',
    submittingCase: 'جاري تقديم القضية...',
    saveDraft: 'حفظ المسودة',
    saving: 'جاري الحفظ...',
    
    // Placeholders
    enterFamilySurname: 'أدخل لقب العائلة',
    fullNameHead: 'الاسم الكامل لرب الأسرة',
    phoneFormat: '+961 XX XXX XXX',
    emailFormat: 'your.email@example.com',
    selectMembers: 'اختر عدد الأفراد',
    selectVillage: 'اختر قريتك',
    currentStaying: 'أين تقيم حالياً؟',
    destroyedPropertyAddress: 'العنوان الكامل للممتلكات المدمرة',
    describeDamage: 'يرجى وصف الأضرار بالتفصيل...',
    
    // Validation messages
    fieldRequired: 'هذا الحقل مطلوب',
    validEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    validPhone: 'يرجى إدخال رقم هاتف صحيح',
    validPercentage: 'يرجى إدخال نسبة مئوية بين 0 و 100',
    uploadRequired: 'يرجى رفع صورة أو وثيقة واحدة على الأقل كدليل',
    
    // Success/Error messages
    fixErrors: 'يرجى إصلاح الأخطاء في النموذج قبل التقديم.',
    caseSubmitted: 'تم تقديم القضية بنجاح! رقم القضية الخاص بك هو',
    sentToReview: 'تم إرسال القضية إلى المدقق للمراجعة.',
    dataSaved: 'تم حفظ البيانات بنجاح!',
    saveError: 'خطأ في حفظ البيانات. يرجى المحاولة مرة أخرى.',
    submissionError: 'حدث خطأ في تقديم قضيتك. يرجى المحاولة مرة أخرى.',
    
    // Documents page
    viewDocuments: 'عرض وإدارة جميع المستندات المرفوعة لقضيتك.',
    noDocuments: 'لم يتم رفع أي مستندات بعد',
    goToSubmit: 'انتقل إلى تبويب "تقديم قضية" لرفع مستندات الأدلة.',
    view: 'عرض',
    
    // Member count
    member: 'فرد',
    members: 'أفراد'
  }
};

// Memoized file component
const FileItem = memo(({ file, onRemove, onUpdateInfo, t }) => (
  <div className="file-item">
    <div className="file-header">
      <div className="file-icon">
        <i className={file.type.includes('image') ? 'fas fa-image' : 'fas fa-file-pdf'}></i>
      </div>
      <div className="file-info">
        <h5>{file.name}</h5>
        <p>{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        className="remove-file"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
    
    <div className="file-details">
      <div className="form-group">
        <label>{t('category')}</label>
        <select
          value={file.category}
          onChange={(e) => onUpdateInfo(file.id, 'category', e.target.value)}
          aria-label={`Category for ${file.name}`}
        >
          <option value="uncategorized">{t('selectCategory')}</option>
          <option value="property_damage">{t('propertyDamagePhotos')}</option>
          <option value="before_photos">{t('beforeDestructionPhotos')}</option>
          <option value="ownership_documents">{t('ownershipDocuments')}</option>
          <option value="identification">{t('idDocuments')}</option>
          <option value="official_reports">{t('officialReports')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>
    </div>
  </div>
));

// Memoized document card component
const DocumentCard = memo(({ file, t }) => (
  <div className="document-card">
    <div className="doc-icon">
      <i className={file.type.includes('image') ? 'fas fa-image' : 'fas fa-file-pdf'}></i>
    </div>
    <div className="doc-info">
      <h4>{file.name}</h4>
      <p>{t('category')}: {file.category}</p>
      <p>Size: {formatFileSize(file.size)}</p>
    </div>
    <div className="doc-actions">
      <button 
        className="view-btn"
        onClick={() => {
          if (file.base64) {
            const newWindow = window.open();
            if (newWindow) {
              if (file.type.includes('image')) {
                newWindow.document.write(`<img src="${file.base64}" style="max-width:100%;height:auto;" alt="${file.name}" />`);
              } else {
                newWindow.location.href = file.base64;
              }
            }
          }
        }}
        aria-label={`View ${file.name}`}
      >
        {t('view')}
      </button>
    </div>
  </div>
));

const FamilyDashboard = () => {
  const { user, isAuthenticated, userType, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // State declarations
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Fixed: Added missing state
  const [lastSaved, setLastSaved] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [caseStatus, setCaseStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  const [familyData, setFamilyData] = useState({
    familyName: '',
    headOfHousehold: '',
    phoneNumber: '',
    alternatePhone: '',
    email: '',
    nationalId: '',
    numberOfMembers: '',
    childrenCount: '',
    elderlyCount: '',
    specialNeedsCount: '',
    village: '',
    currentAddress: '',
    originalAddress: '',
    propertyType: 'house',
    ownershipStatus: 'owned',
    propertyValue: '',
    destructionDate: '',
    destructionCause: '',
    destructionPercentage: '',
    damageDescription: '',
    previouslyReceivedAid: 'no',
    aidDetails: '',
    witnessName: '',
    witnessPhone: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  // Debug: Log auth context state on render
  useEffect(() => {
    console.log('🔍 DEBUG: FamilyDashboard auth context:', {
      isAuthenticated,
      userType,
      loading,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [isAuthenticated, userType, loading, user]);

  // Memoized translation function
  const t = useCallback((key) => TRANSLATIONS[language]?.[key] || key, [language]);

  // Memoized village options for performance
  const villageOptions = useMemo(() => 
    SOUTH_LEBANON_VILLAGES[language].map((village, index) => (
      <option key={village} value={SOUTH_LEBANON_VILLAGES.en[index]}>
        {village}
      </option>
    )), [language]
  );

  // Memoized member options
  const memberOptions = useMemo(() => 
    [...Array(15)].map((_, i) => (
      <option key={i + 1} value={i + 1}>
        {i + 1} {i === 0 ? t('member') : t('members')}
      </option>
    )), [t]
  );

  // Toggle language with useCallback for performance
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  // Calculate form completion percentage - memoized
  const calculateFormCompletion = useCallback((data) => {
    const requiredFields = [
      'familyName', 'headOfHousehold', 'phoneNumber', 'numberOfMembers',
      'village', 'currentAddress', 'originalAddress', 'destructionDate', 'destructionPercentage',
      'damageDescription'
    ];
    
    const completedFields = requiredFields.filter(field => data[field] && data[field].toString().trim() !== '');
    const basicCompletion = (completedFields.length / requiredFields.length) * 80;
    const fileCompletion = uploadedFiles.length > 0 ? 20 : 0;
    
    return Math.round(basicCompletion + fileCompletion);
  }, [uploadedFiles.length]);

  // Save data to backend API - optimized with useCallback
  const saveToStorage = useCallback(async (data, type = 'draft') => {
    setIsSaving(true);
    try {
      // Debug: Check authentication status before making request
      console.log('🔍 DEBUG: Checking authentication before case submission...');
      
      // Check token from storage (not using useAuth hook inside callback)
      const authData = regularAuthStorage.getAuth();
      console.log('🔍 DEBUG: Auth storage data:', {
        hasToken: !!authData.token,
        hasUser: !!authData.user,
        userType: authData.userType,
        isAuthenticated: authData.isAuthenticated,
        tokenLength: authData.token ? authData.token.length : 0
      });
      
      if (!authData.isAuthenticated || !authData.token) {
        throw new Error('User is not authenticated. Please log in again.');
      }
      
      // Only include non-empty fields to avoid validation errors
      const processedFamilyData = {};
      
      // Required fields - ensure they have values
      const requiredFields = {
        familyName: data.familyName?.trim(),
        headOfHousehold: data.headOfHousehold?.trim(),
        phoneNumber: data.phoneNumber?.trim(),
        numberOfMembers: data.numberOfMembers ? parseInt(data.numberOfMembers, 10) : undefined,
        village: data.village?.trim(),
        currentAddress: data.currentAddress?.trim(),
        originalAddress: data.originalAddress?.trim(),
        propertyType: data.propertyType || 'house',
        ownershipStatus: data.ownershipStatus || 'owned',
        destructionDate: data.destructionDate ? new Date(data.destructionDate).toISOString() : undefined,
        destructionCause: data.destructionCause?.trim(),
        destructionPercentage: data.destructionPercentage ? parseFloat(data.destructionPercentage) : undefined,
        damageDescription: data.damageDescription?.trim(),
        previouslyReceivedAid: data.previouslyReceivedAid || 'no'
      };
      
      // Add required fields only if they have values
      Object.entries(requiredFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          processedFamilyData[key] = value;
        }
      });
      
      // Optional fields - only add if they have values
      const optionalFields = {
        childrenCount: data.childrenCount ? parseInt(data.childrenCount, 10) : 0,
        elderlyCount: data.elderlyCount ? parseInt(data.elderlyCount, 10) : 0,
        specialNeedsCount: data.specialNeedsCount ? parseInt(data.specialNeedsCount, 10) : 0,
        propertyValue: data.propertyValue ? parseFloat(data.propertyValue) : undefined,
        alternatePhone: data.alternatePhone?.trim(),
        email: data.email?.trim(),
        nationalId: data.nationalId?.trim(),
        aidDetails: data.aidDetails?.trim(),
        witnessName: data.witnessName?.trim(),
        witnessPhone: data.witnessPhone?.trim(),
        emergencyContact: data.emergencyContact?.trim(),
        emergencyPhone: data.emergencyPhone?.trim()
      };
      
      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          processedFamilyData[key] = value;
        }
      });

      const mapFileCategory = (category) => {
        const categoryMap = {
          'property_damage': 'property_damage',
          'before_photos': 'property_damage',
          'after_photos': 'property_damage', 
          'ownership_documents': 'ownership',
          'identification': 'identification',
          'official_reports': 'other',
          'uncategorized': 'property_damage',
          'other': 'other'
        };
        return categoryMap[category] || 'property_damage';
      };

      const processedFiles = uploadedFiles.map(file => ({
        name: file.name,
        originalName: file.originalName || file.name,
        size: file.size,
        type: file.type,
        category: mapFileCategory(file.category || 'property_damage'),
        description: file.description || '',
        base64: file.base64
      }));

      const casePayload = {
        familyData: processedFamilyData,
        uploadedFiles: processedFiles
      };

      let response;
      if (caseData?.caseId) {
        response = await ApiService.updateCase(caseData.caseId, casePayload);
      } else {
        response = await ApiService.createCase(casePayload);
      }
      
      if (type === 'submitted' && response.case?.caseId) {
        await ApiService.submitCase(response.case.caseId);
        response.case.status = 'submitted';
      }
      
      setCaseData(response.case);
      setLastSaved(new Date());
      
      return response.case;
    } catch (error) {
      console.error('Case submission error:', error);
      
      // Parse error response for specific validation errors
      if (error.message.includes('Missing required fields')) {
        const missingFields = error.message.replace('Missing required fields: ', '');
        throw new Error(`Please fill in the following required fields: ${missingFields}`);
      } else if (error.message.includes('Validation failed')) {
        throw new Error('Please check your form data and ensure all required fields are properly filled.');
      } else if (error.message.includes('required') || error.message.includes('validation')) {
        throw new Error(t('fixErrors'));
      } else if (error.message.includes('500')) {
        throw new Error('Server error occurred. Please try again or contact support if the problem persists.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error(t('submissionError'));
      } else {
        throw new Error(`${t('submissionError')}: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [uploadedFiles, caseData, t]);

  // Load data from backend API - optimized
  const loadFromStorage = useCallback(async () => {
    try {
      const response = await ApiService.getMyCases();
      const cases = response.cases || [];
      
      if (cases.length > 0) {
        const latestCase = cases[0];
        const caseDetails = await ApiService.getCase(latestCase.caseId);
        const caseData = caseDetails.case;
        
        setFamilyData(caseData.familyData || {});
        setUploadedFiles(caseData.uploadedFiles || []);
        setCaseData(caseData);
        setLastSaved(new Date(caseData.timestamps?.lastModified));
        updateCaseStatus(caseData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Handle email verification requirement gracefully
      if (error.message && error.message.includes('Email verification required')) {
        // Don't show error for email verification - this is expected for new users
        return;
      }
      
      // Handle 403 Forbidden errors (likely email verification required)
      if (error.message && error.message.includes('Access forbidden')) {
        console.log('🔒 Email verification required - user should be redirected by ProtectedRoute');
        return;
      }
      
      // Show other errors to user
      toast.error('Failed to load your case data. Please try again later.');
    }
  }, []);

  // Update case status - memoized
  const updateCaseStatus = useCallback((data) => {
    const status = {
      status: t('draft'),
      submittedDate: '-',
      caseId: data?.caseId || t('notAssigned'),
      progress: calculateFormCompletion(data?.familyData || familyData)
    };

    if (data?.status === 'submitted') {
      status.status = t('underReview');
      status.submittedDate = data.timestamps?.submitted ? new Date(data.timestamps.submitted).toLocaleDateString() : '-';
    } else if (data?.status === 'approved') {
      status.status = t('approved');
      status.submittedDate = data.timestamps?.submitted ? new Date(data.timestamps.submitted).toLocaleDateString() : '-';
      status.approvalDetails = {
        finalDamagePercentage: data.finalDamagePercentage,
        estimatedCost: data.estimatedCost,
        checkerComments: data.checkerDecision?.comments
      };
    } else if (data?.status === 'rejected') {
      status.status = t('rejected');
      status.submittedDate = data.timestamps?.submitted ? new Date(data.timestamps.submitted).toLocaleDateString() : '-';
      status.rejectionReason = data.checkerDecision?.comments;
    }

    setCaseStatus(status);
  }, [t, calculateFormCompletion, familyData]);

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadFromStorage();
    }
  }, [loadFromStorage, user]);

  // Initialize with user data if available
  useEffect(() => {
    if (user && !familyData.email) {
      setFamilyData(prev => ({
        ...prev,
        email: user.email || '',
        headOfHousehold: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
        phoneNumber: user.phone || ''
      }));
    }
  }, [user, familyData.email]);

  // Handle form input changes - optimized
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFamilyData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  // Handle file upload - optimized with compression
  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/heic'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.warning(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.warning(`File ${file.name} is not a supported format. Please upload JPG, PNG, PDF, or HEIC files.`);
        return false;
      }
      return true;
    });

    // Function to compress image
    const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
      return new Promise((resolve) => {
        if (file.type === 'application/pdf') {
          // Don't compress PDFs, just convert to base64
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64
          const compressedBase64 = canvas.toDataURL(file.type, quality);
          resolve(compressedBase64);
        };
        
        img.src = URL.createObjectURL(file);
      });
    };

    // Process files with compression
    const processedFiles = await Promise.all(validFiles.map(async (file) => {
      try {
        // Compress the image
        const base64 = await compressImage(file);
        
        // Check if compressed size is still reasonable (base64 is ~33% larger than binary)
        const estimatedSize = (base64.length * 0.75); // Rough estimate of binary size
        
        if (estimatedSize > 5 * 1024 * 1024) { // If still > 5MB after compression
          // Try with lower quality
          const recompressed = await compressImage(file, 1280, 0.6);
          const recompressedSize = (recompressed.length * 0.75);
          
          if (recompressedSize > 5 * 1024 * 1024) {
            toast.warning(`File ${file.name} is still too large after compression. Please use a smaller image.`);
            return null;
          }
          
          return {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            originalName: file.name,
            size: Math.round(recompressedSize), // Use compressed size
            type: file.type,
            uploadDate: new Date().toISOString(),
            category: 'uncategorized',
            description: '',
            base64: recompressed,
            checksum: btoa(file.name + file.size + file.lastModified),
            compressed: true
          };
        }

        return {
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          originalName: file.name,
          size: Math.round(estimatedSize), // Use compressed size
          type: file.type,
          uploadDate: new Date().toISOString(),
          category: 'uncategorized',
          description: '',
          base64: base64,
          checksum: btoa(file.name + file.size + file.lastModified),
          compressed: file.type !== 'application/pdf'
        };
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        toast.error(`Failed to process file: ${file.name}`);
        return null;
      }
    }));

    // Filter out failed uploads
    const successfulFiles = processedFiles.filter(file => file !== null);
    
    if (successfulFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...successfulFiles]);
      toast.success(`Successfully uploaded ${successfulFiles.length} file(s)`);
    }
    
    // Clear the input so the same file can be uploaded again if needed
    e.target.value = '';
  }, []);

  // Remove uploaded file - optimized
  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // Update file category and description - optimized
  const updateFileInfo = useCallback((fileId, field, value) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, [field]: value } : file
      )
    );
  }, []);

  // Form validation - optimized
  const validateForm = useCallback(() => {
    const errors = {};
    
    const requiredFields = [
      'familyName', 'headOfHousehold', 'phoneNumber', 'numberOfMembers',
      'village', 'currentAddress', 'originalAddress', 'destructionDate', 
      'destructionCause', 'destructionPercentage', 'damageDescription'
    ];
    
    requiredFields.forEach(field => {
      if (!familyData[field] || familyData[field].toString().trim() === '') {
        errors[field] = t('fieldRequired');
      }
    });

    if (familyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(familyData.email)) {
      errors.email = t('validEmail');
    }

    if (familyData.phoneNumber && !/^\+?[\d\s-()]{8,}$/.test(familyData.phoneNumber)) {
      errors.phoneNumber = t('validPhone');
    }

    if (familyData.destructionPercentage && (
      isNaN(familyData.destructionPercentage) || 
      familyData.destructionPercentage < 0 || 
      familyData.destructionPercentage > 100
    )) {
      errors.destructionPercentage = t('validPercentage');
    }

    if (uploadedFiles.length === 0) {
      errors.files = t('uploadRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [familyData, uploadedFiles.length, t]);

  // Handle form submission - optimized
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.warning(t('fixErrors'));
      return;
    }

    setIsSubmitting(true);

    try {
      const submittedData = await saveToStorage(familyData, 'submitted');
      toast.success(`${t('caseSubmitted')}: ${submittedData.caseId}. ${t('sentToReview')}`);
      setActiveTab('overview');
    } catch (error) {
      toast.error(error.message || t('submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, saveToStorage, familyData, t]);

  // Save draft functionality
  const saveDraft = useCallback(async () => {
    if (isSaving) return;
    
    try {
      await saveToStorage(familyData, 'draft');
      toast.success(t('dataSaved'));
    } catch (error) {
      toast.error(error.message || t('saveError'));
    }
  }, [saveToStorage, familyData, t, isSaving]);

  // Auto-save draft every 2 minutes
  useEffect(() => {
    if (activeTab === 'submit' && familyData.familyName) {
      const autoSaveInterval = setInterval(() => {
        saveDraft();
      }, 120000); // 2 minutes

      return () => clearInterval(autoSaveInterval);
    }
  }, [activeTab, familyData.familyName, saveDraft]);

  // Component render functions
  const renderEmailVerificationBanner = () => {
    if (!user || user.emailVerified) return null;
    
    return (
      <div className="email-verification-banner">
        <div className="verification-content">
          <i className="fas fa-envelope-open-text"></i>
          <div className="verification-text">
            <h3>Email Verification Required</h3>
            <p>Please verify your email address to access all dashboard features and submit your case.</p>
          </div>
          <button 
            className="verify-email-btn-primary"
            onClick={() => navigate('/verify-email')}
          >
            Verify Email Now
          </button>
        </div>
      </div>
    );
  };

  // Memoized render functions for better performance
  const renderOverviewTab = useMemo(() => (
    <div className="tab-content">
      {renderEmailVerificationBanner()}
      
      <div className="welcome-section">
        <h2>{t('welcome')}, {familyData.familyName || user?.firstName || 'Family'}</h2>
        <p>{t('trackStatus')}</p>
        
        {lastSaved && (
          <div className="save-status">
            <span className="saved">
              <i className="fas fa-check-circle"></i>
              {t('lastSaved')}: {lastSaved.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{t('caseStatus')}</h3>
            <p className={`stat-value status-${caseStatus?.status.toLowerCase().replace(' ', '-')}`}>
              {caseStatus?.status || t('draft')}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar"></i>
          </div>
          <div className="stat-info">
            <h3>{t('submitted')}</h3>
            <p className="stat-value">{caseStatus?.submittedDate || '-'}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-hashtag"></i>
          </div>
          <div className="stat-info">
            <h3>{t('caseId')}</h3>
            <p className="stat-value">{caseStatus?.caseId || t('notAssigned')}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-images"></i>
          </div>
          <div className="stat-info">
            <h3>{t('filesUploaded')}</h3>
            <p className="stat-value">{uploadedFiles.length}</p>
          </div>
        </div>
      </div>
      
      <div className="progress-section">
        <h3>{t('applicationProgress')}</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{width: `${caseStatus?.progress || 0}%`}}
          ></div>
        </div>
        <p>{caseStatus?.progress || 0}% {t('complete')}</p>
        
        {familyData.village && (
          <div className="village-info-section">
            <h4>{t('selectedVillage')}</h4>
            <div className="village-display">
              <i className="fas fa-map-marker-alt"></i>
              <span className="village-name">{familyData.village}</span>
            </div>
          </div>
        )}
      </div>

      {/* Case Status Notifications */}
      {caseStatus?.status === t('approved') && caseStatus.approvalDetails && (
        <div className="status-notification approved">
          <div className="notification-header">
            <i className="fas fa-check-circle"></i>
            <h3>Case Approved!</h3>
          </div>
          <div className="notification-content">
            <p>Congratulations! Your case has been approved and is now available for funding.</p>
            <div className="approval-details">
              <div className="detail-item">
                <strong>Final Damage Assessment:</strong> {caseStatus.approvalDetails.finalDamagePercentage}%
              </div>
              <div className="detail-item">
                <strong>Estimated Rebuild Cost:</strong> ${parseInt(caseStatus.approvalDetails.estimatedCost || 0).toLocaleString()}
              </div>
              {caseStatus.approvalDetails.checkerComments && (
                <div className="detail-item">
                  <strong>Checker Comments:</strong> {caseStatus.approvalDetails.checkerComments}
                </div>
              )}
            </div>
            <div className="notification-actions">
              <Link to="/donor-dashboard" className="action-btn">
                <i className="fas fa-heart"></i>
                View in Donor Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {caseStatus?.status === t('rejected') && caseStatus.rejectionReason && (
        <div className="status-notification rejected">
          <div className="notification-header">
            <i className="fas fa-times-circle"></i>
            <h3>Case Rejected</h3>
          </div>
          <div className="notification-content">
            <p>Unfortunately, your case has been rejected by our checker.</p>
            <div className="rejection-details">
              <div className="detail-item">
                <strong>Reason:</strong> {caseStatus.rejectionReason}
              </div>
            </div>
            <div className="notification-actions">
              <button 
                className="action-btn secondary"
                onClick={() => setActiveTab('submit')}
              >
                <i className="fas fa-edit"></i>
                Update & Resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ), [t, familyData.familyName, familyData.village, user?.firstName, lastSaved, caseStatus, uploadedFiles.length, renderEmailVerificationBanner]);

  const renderSubmitTab = useMemo(() => (
    <div className="tab-content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {renderEmailVerificationBanner()}
      
      <div className="form-header-section">
        <h2>{t('submitNewCase')}</h2>
        <p>{t('formInstructions')}</p>
        
        <div className="save-info">
          <i className="fas fa-info-circle"></i>
          {t('dataSavedInfo')}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="family-form">
        {/* Family Information Section */}
        <div className="form-section">
          <div className="section-title">
            <i className="fas fa-users"></i>
            {t('familyInformation')}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="familyName">{t('familyName')} *</label>
              <input
                id="familyName"
                type="text"
                name="familyName"
                value={familyData.familyName}
                onChange={handleInputChange}
                placeholder={t('enterFamilySurname')}
                className={formErrors.familyName ? 'error' : ''}
                required
              />
              {formErrors.familyName && <span className="error-text">{formErrors.familyName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="headOfHousehold">{t('headOfHousehold')} *</label>
              <input
                id="headOfHousehold"
                type="text"
                name="headOfHousehold"
                value={familyData.headOfHousehold}
                onChange={handleInputChange}
                placeholder={t('fullNameHead')}
                className={formErrors.headOfHousehold ? 'error' : ''}
                required
              />
              {formErrors.headOfHousehold && <span className="error-text">{formErrors.headOfHousehold}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">{t('primaryPhone')} *</label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={familyData.phoneNumber}
                onChange={handleInputChange}
                placeholder={t('phoneFormat')}
                className={formErrors.phoneNumber ? 'error' : ''}
                required
              />
              {formErrors.phoneNumber && <span className="error-text">{formErrors.phoneNumber}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">{t('emailAddress')}</label>
              <input
                id="email"
                type="email"
                name="email"
                value={familyData.email}
                onChange={handleInputChange}
                placeholder={t('emailFormat')}
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numberOfMembers">{t('totalFamilyMembers')} *</label>
              <select
                id="numberOfMembers"
                name="numberOfMembers"
                value={familyData.numberOfMembers}
                onChange={handleInputChange}
                className={formErrors.numberOfMembers ? 'error' : ''}
                required
              >
                <option value="">{t('selectMembers')}</option>
                {memberOptions}
              </select>
              {formErrors.numberOfMembers && <span className="error-text">{formErrors.numberOfMembers}</span>}
            </div>
          </div>
        </div>

        {/* Property Information Section */}
        <div className="form-section">
          <div className="section-title">
            <i className="fas fa-home"></i>
            {t('propertyInformation')}
          </div>

          <div className="form-group">
            <label htmlFor="village">{t('village')} *</label>
            <select
              id="village"
              name="village"
              value={familyData.village}
              onChange={handleInputChange}
              className={formErrors.village ? 'error' : ''}
              required
            >
              <option value="">{t('selectVillage')}</option>
              {villageOptions}
            </select>
            {formErrors.village && <span className="error-text">{formErrors.village}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currentAddress">{t('currentAddress')} *</label>
            <textarea
              id="currentAddress"
              name="currentAddress"
              value={familyData.currentAddress}
              onChange={handleInputChange}
              placeholder={t('currentStaying')}
              rows="2"
              className={formErrors.currentAddress ? 'error' : ''}
              required
            />
            {formErrors.currentAddress && <span className="error-text">{formErrors.currentAddress}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="originalAddress">{t('originalPropertyAddress')} *</label>
            <textarea
              id="originalAddress"
              name="originalAddress"
              value={familyData.originalAddress}
              onChange={handleInputChange}
              placeholder={t('destroyedPropertyAddress')}
              rows="3"
              className={formErrors.originalAddress ? 'error' : ''}
              required
            />
            {formErrors.originalAddress && <span className="error-text">{formErrors.originalAddress}</span>}
          </div>
        </div>

        {/* Destruction Assessment Section */}
        <div className="form-section">
          <div className="section-title">
            <i className="fas fa-exclamation-triangle"></i>
            {t('destructionAssessment')}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="destructionDate">{t('dateOfDestruction')} *</label>
              <input
                id="destructionDate"
                type="date"
                name="destructionDate"
                value={familyData.destructionDate}
                onChange={handleInputChange}
                className={formErrors.destructionDate ? 'error' : ''}
                required
              />
              {formErrors.destructionDate && <span className="error-text">{formErrors.destructionDate}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="destructionCause">{t('causeOfDestruction')} *</label>
              <select
                id="destructionCause"
                name="destructionCause"
                value={familyData.destructionCause}
                onChange={handleInputChange}
                className={formErrors.destructionCause ? 'error' : ''}
                required
              >
                <option value="">{t('selectCause')}</option>
                <option value="airstrike">{t('airstrike')}</option>
                <option value="artillery">{t('artillery')}</option>
                <option value="ground_combat">{t('groundCombat')}</option>
                <option value="explosion">{t('explosion')}</option>
                <option value="fire">{t('fire')}</option>
                <option value="other">{t('other')}</option>
              </select>
              {formErrors.destructionCause && <span className="error-text">{formErrors.destructionCause}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="destructionPercentage">{t('estimatedDestructionPercentage')} *</label>
            <div className="percentage-input">
              <input
                id="destructionPercentage"
                type="number"
                name="destructionPercentage"
                value={familyData.destructionPercentage}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max="100"
                className={formErrors.destructionPercentage ? 'error' : ''}
                required
              />
              <span className="percentage-symbol">%</span>
            </div>
            {formErrors.destructionPercentage && <span className="error-text">{formErrors.destructionPercentage}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="damageDescription">{t('detailedDamageDescription')} *</label>
            <textarea
              id="damageDescription"
              name="damageDescription"
              value={familyData.damageDescription}
              onChange={handleInputChange}
              placeholder={t('describeDamage')}
              rows="5"
              className={formErrors.damageDescription ? 'error' : ''}
              required
            />
            {formErrors.damageDescription && <span className="error-text">{formErrors.damageDescription}</span>}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="form-section">
          <div className="section-title">
            <i className="fas fa-cloud-upload-alt"></i>
            {t('evidenceUpload')}
          </div>
          
          <div className="file-upload-area">
            <div className="file-upload-box">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                id="file-upload"
                aria-describedby="file-upload-description"
              />
              <label htmlFor="file-upload">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>{t('uploadInstructions')}</p>
                <small id="file-upload-description">{t('fileTypeInfo')}</small>
              </label>
            </div>
          </div>

          {formErrors.files && <span className="error-text">{formErrors.files}</span>}

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h4>{t('uploadedFiles')} ({uploadedFiles.length})</h4>
              <div className="files-grid">
                {uploadedFiles.map(file => (
                  <FileItem 
                    key={file.id}
                    file={file}
                    onRemove={removeFile}
                    onUpdateInfo={updateFileInfo}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button"
            className={`save-draft-btn ${isSaving ? 'loading' : ''}`}
            onClick={saveDraft}
            disabled={isSaving}
          >
            <i className="fas fa-save"></i>
            {isSaving ? t('saving') : t('saveDraft')}
          </button>
          
          <button 
            type="submit" 
            className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting || !user?.emailVerified}
          >
            <i className="fas fa-paper-plane"></i>
            {isSubmitting ? t('submittingCase') : t('submitCaseBtn')}
          </button>
        </div>
        
        {!user?.emailVerified && (
          <div className="verification-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Please verify your email address before submitting your case.</span>
          </div>
        )}
      </form>
    </div>
  ), [language, t, familyData, formErrors, handleInputChange, handleSubmit, isSubmitting, isSaving, handleFileUpload, uploadedFiles, removeFile, updateFileInfo, villageOptions, memberOptions, saveDraft, user?.emailVerified, renderEmailVerificationBanner]);

  const renderDocumentsTab = useMemo(() => (
    <div className="tab-content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {renderEmailVerificationBanner()}
      
      <h2>{t('myDocuments')}</h2>
      <div className="documents-overview">
        <p>{t('viewDocuments')}</p>
        
        {uploadedFiles.length === 0 ? (
          <div className="no-documents">
            <i className="fas fa-folder-open"></i>
            <h3>{t('noDocuments')}</h3>
            <p>{t('goToSubmit')}</p>
          </div>
        ) : (
          <div className="documents-grid">
            {uploadedFiles.map(file => (
              <DocumentCard key={file.id} file={file} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  ), [language, t, uploadedFiles, renderEmailVerificationBanner]);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return renderOverviewTab;
      case 'submit':
        return renderSubmitTab;
      case 'documents':
        return renderDocumentsTab;
      default:
        return renderOverviewTab;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar language={language} onLanguageToggle={toggleLanguage} />
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar language={language} onLanguageToggle={toggleLanguage} />
      
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-users"></i>
            </div>
            <h3>{familyData.familyName || user?.firstName || 'Family Name'}</h3>
            <p className="user-type">Victim</p>
            {caseData?.caseId && (
              <p className="case-id">ID: {caseData.caseId}</p>
            )}
            
            {/* Email verification notice for new users */}
            {user && !user.emailVerified && (
              <div className="email-verification-notice">
                <i className="fas fa-envelope"></i>
                <p>Please verify your email to access all features</p>
                <button 
                  className="verify-email-btn"
                  onClick={() => navigate('/verify-email')}
                >
                  Verify Email
                </button>
              </div>
            )}
          </div>
          
          <nav className="dashboard-nav">
            <button 
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-tachometer-alt"></i>
              {t('overview')}
            </button>
            <button 
              className={`nav-btn ${activeTab === 'submit' ? 'active' : ''}`}
              onClick={() => setActiveTab('submit')}
            >
              <i className="fas fa-plus"></i>
              {t('submitCase')}
            </button>
            <button 
              className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <i className="fas fa-folder"></i>
              {t('myDocuments')}
            </button>
          </nav>
        </div>
        
        <div className="dashboard-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboard;