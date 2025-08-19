


import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext/AuthContext';
import ApiService from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import { toast } from 'react-toastify';
import './DonorDashboard.css';

const DonorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [approvedCases, setApprovedCases] = useState([]); // Changed from verifiedCases
  const [fullyFundedCases, setFullyFundedCases] = useState([]); // New state for fully funded cases
  const [donationHistory, setDonationHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [donorData, setDonorData] = useState({
    donorName: '',
    email: '',
    userType: 'Donor'
  });
  
  const [userStats, setUserStats] = useState({
    totalDonated: 0,
    familiesHelped: 0,
    thisMonth: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // If no user from context, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    setDonorData({
      donorName: user?.name || user?.firstName + ' ' + user?.lastName || 'Anonymous Donor',
      email: user?.email || '',
      userType: user?.userType || user?.role || 'Donor'
    });
    
    loadApprovedCases();
    loadFullyFundedCases();
    loadUserDonationHistory();
    loadUserPreferences();
  }, [navigate, user]);

  const loadUserPreferences = () => {
    if (!user?.email) return;
    
    try {
      const preferences = localStorage.getItem(`userPreferences_${user.email}`);
      if (preferences) {
        const parsedPrefs = JSON.parse(preferences);
        setActiveTab(parsedPrefs.lastActiveTab || 'browse');
        setSelectedRegion(parsedPrefs.selectedRegion || 'all');
        setSelectedDistrict(parsedPrefs.selectedDistrict || null);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const saveUserPreferences = (preferences) => {
    if (!user?.email) return;
    
    try {
      localStorage.setItem(`userPreferences_${user.email}`, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  // Updated function to load approved cases from the backend
  const loadApprovedCases = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Loading approved cases from backend...');
      
      // Use the new API service method
      const response = await ApiService.getApprovedCases();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load approved cases');
      }

      const data = response.data;
      console.log('✅ Approved cases loaded:', data);

      // Transform backend data to match frontend expectations
      const transformedCases = (data.cases || []).map(caseItem => ({
        id: caseItem.caseId,
        caseId: caseItem.caseId,
        family: caseItem.familyName || 'Unknown Family',
        location: caseItem.village || 'Unknown Location',
        familySize: `${caseItem.numberOfMembers || 0} members`,
        verified: caseItem.finalDamagePercentage ? 
          `${caseItem.finalDamagePercentage}% damage` : 
          'Verified',
        damagePercentage: caseItem.finalDamagePercentage || 
          caseItem.destructionPercentage || 0,
        needed: `$${(caseItem.estimatedCost || caseItem.totalNeeded || 50000).toLocaleString()}`,
        raised: `$${(caseItem.totalRaised || 0).toLocaleString()}`,
        progress: caseItem.donationProgress || 0,
        approvedDate: caseItem.approvedAt,
        headOfHousehold: caseItem.familyData?.headOfHousehold,
        phoneNumber: caseItem.familyData?.phoneNumber,
        destructionCause: caseItem.familyData?.destructionCause,
        damageDescription: caseItem.damageDescription,
        estimatedCost: caseItem.estimatedCost || caseItem.totalNeeded || 50000,
        totalDonations: caseItem.totalRaised || 0,
        // Additional fields from the new API
        currentAddress: caseItem.currentAddress,
        childrenCount: caseItem.childrenCount,
        elderlyCount: caseItem.elderlyCount,
        specialNeedsCount: caseItem.specialNeedsCount,
        destructionDate: caseItem.destructionDate,
        checkerComments: caseItem.checkerComments,
        hasDocuments: caseItem.hasDocuments,
        documentCount: caseItem.documentCount
      }));

      setApprovedCases(transformedCases);
      console.log(`📊 Loaded ${transformedCases.length} approved cases`);

    } catch (error) {
      console.error('❌ Error loading approved cases:', error);
      
      // Handle email verification requirement gracefully
      if (error.message && error.message.includes('Email verification required')) {
        // Don't show error for email verification - this is expected for new users
        setError('Please verify your email to view cases');
        setApprovedCases([]);
        return;
      }
      
      // Handle 403 Forbidden errors (likely email verification required)
      if (error.message && error.message.includes('Access forbidden')) {
        setError('Please verify your email to view cases');
        setApprovedCases([]);
        return;
      }
      
      setError(error.message || 'Failed to load cases');
      setApprovedCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullyFundedCases = async () => {
    try {
      const response = await ApiService.getFullyFundedCases();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load fully funded cases');
      }

      const data = response.data;
      console.log('✅ Fully funded cases loaded:', data);

      // Transform backend data to match frontend expectations
      const transformedCases = (data.cases || []).map(caseItem => ({
        id: caseItem.caseId,
        caseId: caseItem.caseId,
        family: caseItem.familyName || 'Unknown Family',
        location: caseItem.village || 'Unknown Location',
        familySize: `${caseItem.numberOfMembers || 0} members`,
        verified: caseItem.finalDamagePercentage ? 
          `${caseItem.finalDamagePercentage}% damage` : 
          'Verified',
        damagePercentage: caseItem.finalDamagePercentage || 
          caseItem.destructionPercentage || 0,
        needed: `$${(caseItem.estimatedCost || caseItem.totalNeeded || 50000).toLocaleString()}`,
        raised: `$${(caseItem.totalRaised || 0).toLocaleString()}`,
        progress: caseItem.donationProgress || 100,
        approvedDate: caseItem.approvedAt,
        fullyFundedDate: caseItem.fullyFundedAt,
        headOfHousehold: caseItem.familyData?.headOfHousehold,
        phoneNumber: caseItem.familyData?.phoneNumber,
        destructionCause: caseItem.familyData?.destructionCause,
        damageDescription: caseItem.damageDescription,
        estimatedCost: caseItem.estimatedCost || caseItem.totalNeeded || 50000,
        totalDonations: caseItem.totalRaised || 0,
        // Additional fields from the new API
        currentAddress: caseItem.currentAddress,
        childrenCount: caseItem.childrenCount,
        elderlyCount: caseItem.elderlyCount,
        specialNeedsCount: caseItem.specialNeedsCount,
        destructionDate: caseItem.destructionDate,
        checkerComments: caseItem.checkerComments,
        hasDocuments: caseItem.hasDocuments,
        documentCount: caseItem.documentCount
      }));

      setFullyFundedCases(transformedCases);
      console.log(`📊 Loaded ${transformedCases.length} fully funded cases`);

    } catch (error) {
      console.error('❌ Error loading fully funded cases:', error);
      
      // Handle email verification requirement gracefully
      if (error.message && error.message.includes('Email verification required')) {
        setFullyFundedCases([]);
        return;
      }
      
      // Handle 403 Forbidden errors (likely email verification required)
      if (error.message && error.message.includes('Access forbidden')) {
        setFullyFundedCases([]);
        return;
      }
      
      setFullyFundedCases([]);
    }
  };

  const loadUserDonationHistory = async () => {
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        ApiService.getDonationHistory({ limit: 50 }),
        ApiService.getDonorStats()
      ]);
      
      setDonationHistory(historyResponse.donations || []);
      setUserStats(statsResponse.stats || {
        totalDonated: 0,
        familiesHelped: 0,
        thisMonth: 0
      });
    } catch (error) {
      console.error('Error loading donation history:', error);
      
      // Handle email verification requirement gracefully
      if (error.message && error.message.includes('Email verification required')) {
        setDonationHistory([]);
        setUserStats({ totalDonated: 0, familiesHelped: 0, thisMonth: 0 });
        return;
      }
      
      // Handle 403 Forbidden errors (likely email verification required)
      if (error.message && error.message.includes('Access forbidden')) {
        setDonationHistory([]);
        setUserStats({ totalDonated: 0, familiesHelped: 0, thisMonth: 0 });
        return;
      }
      
      setDonationHistory([]);
      setUserStats({ totalDonated: 0, familiesHelped: 0, thisMonth: 0 });
    }
  };

  const handleDonation = async (caseItem, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount.');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to make a donation.');
      return;
    }

    try {
      const donationData = {
        caseId: caseItem.caseId, // Use the correct case ID
        amount: parseFloat(amount),
        paymentMethod: 'credit_card',
        anonymous: false,
        message: `Donation from ${donorData.donorName}`
      };

      console.log('💰 Processing donation:', donationData);

      const response = await ApiService.makeDonation(donationData);
      
      // Refresh the approved cases to show updated progress
      await loadApprovedCases();
      
      // Refresh fully funded cases in case any new ones were created
      await loadFullyFundedCases();
      
      // Refresh donation history and stats
      await loadUserDonationHistory();

      toast.success(`Thank you for your donation of $${amount} to ${caseItem.family}! Your donation has been processed.`);
    } catch (error) {
      console.error('Error processing donation:', error);
      
      // Handle email verification requirement gracefully
      if (error.message && error.message.includes('Email verification required')) {
        toast.error('Please verify your email before making donations.');
        return;
      }
      
      // Handle 403 Forbidden errors (likely email verification required)
      if (error.message && error.message.includes('Access forbidden')) {
        toast.error('Please verify your email before making donations.');
        return;
      }
      
      toast.error(error.message || 'Error processing donation. Please try again.');
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    saveUserPreferences({
      lastActiveTab: newTab,
      selectedRegion: selectedRegion,
      selectedDistrict: selectedDistrict
    });
  };

  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    setSelectedDistrict(null);
    saveUserPreferences({
      lastActiveTab: activeTab,
      selectedRegion: newRegion,
      selectedDistrict: null
    });
  };

  const handleDistrictSelection = (districtName, districtVillages) => {
    setSelectedDistrict({ name: districtName, villages: districtVillages });
    setSelectedRegion('district');
    saveUserPreferences({
      lastActiveTab: 'browse',
      selectedRegion: 'district',
      selectedDistrict: { name: districtName, villages: districtVillages }
    });
    setActiveTab('browse');
  };

  const clearDistrictSelection = () => {
    setSelectedDistrict(null);
    setSelectedRegion('all');
    saveUserPreferences({
      lastActiveTab: activeTab,
      selectedRegion: 'all',
      selectedDistrict: null
    });
  };

  const handleLogout = () => {
    try {
      saveUserPreferences({
        lastActiveTab: activeTab,
        selectedRegion: selectedRegion,
        selectedDistrict: selectedDistrict
      });
      
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };   
  
  // Updated regional stats to use approved cases
  const regionalStats2 = [
    {
      region: 'Tyre District',
      funded: '78%',
      villages: [
        'Ain Baal', 'Adloun', 'Al-Bazouriye', 'Al-Mansouri', 'Bafliyeh',
        'Barish', 'Bayt Yahoun', 'Bazouriye', 'Borj ash-Shamali', 'Chamaa',
        'Chehabiyeh', 'Chihine', 'Dhayra', 'El-Adousiye', 'El-Bassatine',
        'Hanaway', 'Jibbain', 'Majdal Zoun', 'Qana', 'Qlayle', 'Ras al-Biyyadah',
        'Rmadiyeh', 'Sarba', 'Shaqra', 'Sreifa', 'Tayr Harfa', 'Tayr Dibba',
        'Tyre', 'Yater', 'Zibqin'
      ],
      cases: approvedCases.filter(c =>
        [
          'Ain Baal', 'Adloun', 'Al-Bazouriye', 'Al-Mansouri', 'Bafliyeh',
          'Barish', 'Bayt Yahoun', 'Bazouriye', 'Borj ash-Shamali', 'Chamaa',
          'Chehabiyeh', 'Chihine', 'Dhayra', 'El-Adousiye', 'El-Bassatine',
          'Hanaway', 'Jibbain', 'Majdal Zoun', 'Qana', 'Qlayle', 'Ras al-Biyyadah',
          'Rmadiyeh', 'Sarba', 'Shaqra', 'Sreifa', 'Tayr Harfa', 'Tayr Dibba',
          'Tyre', 'Yater', 'Zibqin'
        ].some(v => c.location.includes(v))
      ).length,
    },
    {
      region: 'Sidon District',
      funded: '60%',
      villages: [
        'Abra', 'Ain El Delb', 'Ein el-Delb', 'Saida', 'Sarepta',
        'Rmeyleh', 'Sajad'
      ],
      cases: approvedCases.filter(c =>
        [
          'Abra', 'Ain El Delb', 'Ein el-Delb', 'Saida', 'Sarepta',
          'Rmeyleh', 'Sajad'
        ].some(v => c.location.includes(v))
      ).length,
    },
    {
      region: 'Jezzine District',
      funded: '35%',
      villages: [
        'Jezzine', 'Bater', 'Kfarfalous', 'Ain Majdalain', 'Mashmusheh',
        'Kfar Melki', 'Roum', 'Sfaray'
      ],
      cases: approvedCases.filter(c =>
        [
          'Jezzine', 'Bater', 'Kfarfalous', 'Ain Majdalain', 'Mashmusheh',
          'Kfar Melki', 'Roum', 'Sfaray'
        ].some(v => c.location.includes(v))
      ).length,
    },
    {
      region: 'Marjayoun District',
      funded: '45%',
      villages: [
        'Borj el-Muluk', 'Burghuz', 'Deir Mimas', 'El-Qantara',
        'Kfar Kila', 'Marjayoun', 'Odaisseh', 'Qantara', 'Rachaya al-Fukhar'
      ],
      cases: approvedCases.filter(c =>
        [
          'Borj el-Muluk', 'Burghuz', 'Deir Mimas', 'El-Qantara',
          'Kfar Kila', 'Marjayoun', 'Odaisseh', 'Qantara', 'Rachaya al-Fukhar'
        ].some(v => c.location.includes(v))
      ).length,
    },
    {
      region: 'Nabatieh District',
      funded: '52%',
      villages: [
        'Adchit', 'Ansar', 'Arabsalim', 'Arnoun', 'Ebba',
        'El-Khiam', 'Ghandouriye', 'Haddatha', 'Harouf', 'Houla',
        'Jbal as-Saghir', 'Kfar Dounin', 'Kfar Roummane', 'Kfar Tibnit',
        'Khallet Wardeh', 'Ksour', 'Nabatiye', 'Sreifa', 'Zawtar ash-Sharqiyeh'
      ],
      cases: approvedCases.filter(c =>
        [
          'Adchit', 'Ansar', 'Arabsalim', 'Arnoun', 'Ebba',
          'El-Khiam', 'Ghandouriye', 'Haddatha', 'Harouf', 'Houla',
          'Jbal as-Saghir', 'Kfar Dounin', 'Kfar Roummane', 'Kfar Tibnit',
          'Khallet Wardeh', 'Ksour', 'Nabatiye', 'Sreifa', 'Zawtar ash-Sharqiyeh'
        ].some(v => c.location.includes(v))
      ).length,
    },
    {
      region: 'Bint Jbeil District',
      funded: '40%',
      villages: [
        'Aita al-Shaab', 'Aita az-Zut', 'Blida', 'Bint Jbeil',
        'Deir Seriane', 'Kafra', 'Khirbet Selm', 'Kounine',
        'Maroun ar-Ras', 'Mays al-Jabal', 'Meiss ej-Jabal',
        'Qouzah', 'Ramyeh', 'Rmeish', 'Rshaf', 'Tebnine', 'Yaroun'
      ],
      cases: approvedCases.filter(c =>
        [
          'Aita al-Shaab', 'Aita az-Zut', 'Blida', 'Bint Jbeil',
          'Deir Seriane', 'Kafra', 'Khirbet Selm', 'Kounine',
          'Maroun ar-Ras', 'Mays al-Jabal', 'Meiss ej-Jabal',
          'Qouzah', 'Ramyeh', 'Rmeish', 'Rshaf', 'Tebnine', 'Yaroun'
        ].some(v => c.location.includes(v))
      ).length,
    }
  ];

  // Enhanced filtering logic
  const getFilteredCases = () => {
    if (selectedRegion === 'district' && selectedDistrict) {
      return approvedCases.filter(c =>
        selectedDistrict.villages.some(village => c.location.includes(village))
      );
    } else if (selectedRegion === 'all') {
      return approvedCases;
    } else {
      return approvedCases.filter(c => 
        c.location.toLowerCase().includes(selectedRegion.replace('-', ' ').toLowerCase())
      );
    }
  };

  const filteredCases = getFilteredCases();

  const renderTabContent = () => {
    switch(activeTab) {
      case 'browse':
        return (
          <div className="tab-content">
            {/* Email verification notice */}
            {displayUser && !displayUser.emailVerified && (
              <div className="email-verification-banner">
                <div className="verification-content">
                  <i className="fas fa-envelope-open-text"></i>
                  <div className="verification-text">
                    <h3>Email Verification Required</h3>
                    <p>Please verify your email address to view cases and make donations. Check your inbox for a verification link.</p>
                  </div>
                  <button 
                    className="verify-email-btn-primary"
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify Email Now
                  </button>
                </div>
              </div>
            )}
            
            <div className="browse-header">
              <h2>Browse Approved Cases</h2>
              {selectedDistrict && (
                <div className="district-filter-indicator">
                  <span className="filter-badge">
                    <i className="fas fa-filter"></i>
                    Showing: {selectedDistrict.name}
                    <button 
                      className="clear-filter-btn"
                      onClick={clearDistrictSelection}
                      title="Clear district filter"
                    >
                      <i className="fas fa-times"></i> 
                    </button>
                  </span>
                </div>
              )}
              <div className="browse-stats">
                <span className="stat-item">
                  <strong>{filteredCases.length}</strong> {selectedDistrict ? `cases in ${selectedDistrict.name}` : 'approved cases'}
                </span>
                <span className="stat-item">
                  <strong>{filteredCases.filter(c => c.progress < 100).length}</strong> need funding
                </span>
                <span className="stat-item">
                  <strong>${filteredCases.reduce((sum, c) => sum + (c.totalDonations || 0), 0).toLocaleString()}</strong> raised
                </span>
              </div>
              <div className="filters">
                <select 
                  value={selectedRegion === 'district' ? 'all' : selectedRegion} 
                  onChange={(e) => handleRegionChange(e.target.value)}
                  disabled={selectedRegion === 'district'}
                >
                  <option value="all">All Villages</option>
                  <option value="Ain Baal">Ain Baal</option>
                  <option value="Abra">Abra</option>
                  <option value="Adchit">Adchit</option>
                  <option value="Adloun">Adloun</option>
                  <option value="Aita al-Shaab">Aita al-Shaab</option>
                  <option value="Aita az-Zut">Aita az-Zut</option>
                  <option value="Al-Bazouriye">Al-Bazouriye</option>
                  <option value="Al-Khiyam">Al-Khiyam</option>
                  <option value="Al-Mansouri">Al-Mansouri</option>
                  <option value="Al-Taybe">Al-Taybe</option>
                  <option value="Alma ash-Shaab">Alma ash-Shaab</option>
                  <option value="Ansar">Ansar</option>
                  <option value="Arabsalim">Arabsalim</option>
                  <option value="Arnoun">Arnoun</option>
                  <option value="Bafliyeh">Bafliyeh</option>
                  <option value="Bani Hayyan">Bani Hayyan</option>
                  <option value="Barish">Barish</option>
                  <option value="Bayt Yahoun">Bayt Yahoun</option>
                  <option value="Bazouriye">Bazouriye</option>
                  <option value="Bint Jbeil">Bint Jbeil</option>
                  <option value="Blida">Blida</option>
                  <option value="Borj ash-Shamali">Borj ash-Shamali</option>
                  <option value="Borj el-Muluk">Borj el-Muluk</option>
                  <option value="Burghuz">Burghuz</option>
                  <option value="Chamaa">Chamaa</option>
                  <option value="Chaqra">Chaqra</option>
                  <option value="Chehabiyeh">Chehabiyeh</option>
                  <option value="Chihine">Chihine</option>
                  <option value="Deir Mimas">Deir Mimas</option>
                  <option value="Deir Qanoun an-Nahr">Deir Qanoun an-Nahr</option>
                  <option value="Deir Seriane">Deir Seriane</option>
                  <option value="Dhayra">Dhayra</option>
                  <option value="Ebba">Ebba</option>
                  <option value="Ein el-Delb">Ein el-Delb</option>
                  <option value="El-Adousiye">El-Adousiye</option>
                  <option value="El-Bassatine">El-Bassatine</option>
                  <option value="El-Khiam">El-Khiam</option>
                  <option value="El-Mansouri">El-Mansouri</option>
                  <option value="El-Qantara">El-Qantara</option>
                  <option value="Ghandouriye">Ghandouriye</option>
                  <option value="Haddatha">Haddatha</option>
                  <option value="Hanaway">Hanaway</option>
                  <option value="Haris">Haris</option>
                  <option value="Harouf">Harouf</option>
                  <option value="Houla">Houla</option>
                  <option value="Jbal as-Saghir">Jbal as-Saghir</option>
                  <option value="Jezzine">Jezzine</option>
                  <option value="Jibbain">Jibbain</option>
                  <option value="Kafra">Kafra</option>
                  <option value="Kfar Dounin">Kfar Dounin</option>
                  <option value="Kfar Kila">Kfar Kila</option>
                  <option value="Kfar Melki">Kfar Melki</option>
                  <option value="Kfar Roummane">Kfar Roummane</option>
                  <option value="Kfar Shuba">Kfar Shuba</option>
                  <option value="Kfar Tibnit">Kfar Tibnit</option>
                  <option value="Khallet Wardeh">Khallet Wardeh</option>
                  <option value="Khiam">Khiam</option>
                  <option value="Khirbet Selm">Khirbet Selm</option>
                  <option value="Kounine">Kounine</option>
                  <option value="Ksour">Ksour</option>
                  <option value="Majdal Zoun">Majdal Zoun</option>
                  <option value="Marjayoun">Marjayoun</option>
                  <option value="Maroun ar-Ras">Maroun ar-Ras</option>
                  <option value="Mays al-Jabal">Mays al-Jabal</option>
                  <option value="Meiss ej-Jabal">Meiss ej-Jabal</option>
                  <option value="Metulla">Metulla</option>
                  <option value="Nabatiye">Nabatiye</option>
                  <option value="Odaisseh">Odaisseh</option>
                  <option value="Qana">Qana</option>
                  <option value="Qantara">Qantara</option>
                  <option value="Qlayle">Qlayle</option>
                  <option value="Qlayaa">Qlayaa</option>
                  <option value="Qouzah">Qouzah</option>
                  <option value="Rachaya al-Fukhar">Rachaya al-Fukhar</option>
                  <option value="Ramyeh">Ramyeh</option>
                  <option value="Ras al-Biyyadah">Ras al-Biyyadah</option>
                  <option value="Rmadiyeh">Rmadiyeh</option>
                  <option value="Rmeish">Rmeish</option>
                  <option value="Rshaf">Rshaf</option>
                  <option value="Saida">Saida</option>
                  <option value="Sajad">Sajad</option>
                  <option value="Sarba">Sarba</option>
                  <option value="Shaqra">Shaqra</option>
                  <option value="Sreifa">Sreifa</option>
                  <option value="Tayr Harfa">Tayr Harfa</option>
                  <option value="Tayr Dibba">Tayr Dibba</option>
                  <option value="Tebnine">Tebnine</option>
                  <option value="Tyre">Tyre</option>
                  <option value="Yaroun">Yaroun</option>
                  <option value="Yater">Yater</option>
                  <option value="Zawtar ash-Sharqiyeh">Zawtar ash-Sharqiyeh</option>
                </select>
                <button className="refresh-btn" onClick={loadApprovedCases}>
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading approved cases...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Cases</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={loadApprovedCases}>
                  <i className="fas fa-redo"></i> Try Again
                </button>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="no-cases">
                <i className="fas fa-heart-broken"></i>
                <h3>No approved cases available</h3>
                <p>
                  {selectedDistrict 
                    ? `No cases found in ${selectedDistrict.name}` 
                    : selectedRegion !== 'all' 
                      ? `No cases found in ${selectedRegion}` 
                      : 'Cases approved by our checkers will appear here for funding.'
                  }
                </p>
                {(selectedRegion !== 'all' || selectedDistrict) && (
                  <button 
                    className="view-all-btn"
                    onClick={clearDistrictSelection}
                  >
                    View All Cases
                  </button>
                )}
              </div>
            ) : (
              <div className="cases-container">
                <div className="cases-summary">
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <i className="fas fa-home"></i>
                      <div>
                        <span className="stat-number">{filteredCases.length}</span>
                        <span className="stat-label">Families</span>
                      </div>
                    </div>
                    <div className="summary-stat">
                      <i className="fas fa-users"></i>
                      <div>
                        <span className="stat-number">
                          {filteredCases.reduce((sum, c) => sum + (parseInt(c.familySize) || 0), 0)}
                        </span>
                        <span className="stat-label">People Affected</span>
                      </div>
                    </div>
                    <div className="summary-stat">
                      <i className="fas fa-dollar-sign"></i>
                      <div>
                        <span className="stat-number">
                          ${filteredCases.reduce((sum, c) => sum + (c.estimatedCost || 0), 0).toLocaleString()}
                        </span>
                        <span className="stat-label">Total Needed</span>
                      </div>
                    </div>
                    <div className="summary-stat">
                      <i className="fas fa-chart-line"></i>
                      <div>
                        <span className="stat-number">
                          {filteredCases.length > 0 ? 
                            Math.round(filteredCases.reduce((sum, c) => sum + (c.progress || 0), 0) / filteredCases.length) 
                            : 0}%
                        </span>
                        <span className="stat-label">Avg. Progress</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="cases-grid">
                {filteredCases.map(caseItem => (
                  <div key={caseItem.id} className={`case-card ${caseItem.progress >= 100 ? 'fully-funded' : ''}`}>
                    <div className="case-header">
                      <h4>{caseItem.family}</h4>
                      <span className="case-id">{caseItem.caseId}</span>
                      {caseItem.progress >= 100 && (
                        <span className="funded-badge">
                          <i className="fas fa-check-circle"></i> Fully Funded
                        </span>
                      )}
                    </div>
                    
                    <div className="case-info">
                      <p><i className="fas fa-map-marker-alt"></i> {caseItem.location}</p>
                      <p><i className="fas fa-users"></i> {caseItem.familySize}</p>
                      <p><i className="fas fa-check-circle"></i> {caseItem.verified}</p>
                      {caseItem.damagePercentage && (
                        <p><i className="fas fa-exclamation-triangle"></i> Damage: {caseItem.damagePercentage}%</p>
                      )}
                      {caseItem.childrenCount > 0 && (
                        <p><i className="fas fa-baby"></i> {caseItem.childrenCount} children</p>
                      )}
                      {caseItem.elderlyCount > 0 && (
                        <p><i className="fas fa-user-tie"></i> {caseItem.elderlyCount} elderly</p>
                      )}
                      {caseItem.specialNeedsCount > 0 && (
                        <p><i className="fas fa-wheelchair"></i> {caseItem.specialNeedsCount} special needs</p>
                      )}
                      {caseItem.destructionDate && (
                        <p><i className="fas fa-calendar"></i> {new Date(caseItem.destructionDate).toLocaleDateString()}</p>
                      )}
                      {caseItem.checkerComments && (
                        <p><i className="fas fa-comment"></i> {caseItem.checkerComments}</p>
                      )}
                      {caseItem.hasDocuments && (
                        <p><i className="fas fa-file-alt"></i> {caseItem.documentCount} documents verified</p>
                      )}
                    </div>
                    
                    <div className="funding-info">
                      <div className="funding-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{width: `${caseItem.progress}%`}}
                          ></div>
                        </div>
                        <span>{caseItem.progress}%</span>
                      </div>
                      <div className="funding-amounts">
                        <span className="raised">{caseItem.raised} raised</span>
                        <span className="needed">of {caseItem.needed}</span>
                      </div>
                    </div>
                    
                    <div className="case-actions">
                      {caseItem.progress < 100 ? (
                        <div className="donation-input">
                          <input
                            type="number"
                            placeholder="Amount ($)"
                            min="1"
                            max="10000"
                            id={`donation-${caseItem.id}`}
                          />
                          <button 
                            className="donate-btn"
                            onClick={() => {
                              const amount = document.getElementById(`donation-${caseItem.id}`).value;
                              handleDonation(caseItem, amount);
                              document.getElementById(`donation-${caseItem.id}`).value = '';
                            }}
                          >
                            <i className="fas fa-heart"></i>
                            Donate
                          </button>
                        </div>
                      ) : (
                        <div className="fully-funded-message">
                          <i className="fas fa-heart"></i>
                          Goal Achieved!
                        </div>
                      )}
                      <button className="view-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        );
        
      case 'map':
        return (
          <div className="tab-content">
            {/* Email verification notice */}
            {displayUser && !displayUser.emailVerified && (
              <div className="email-verification-banner">
                <div className="verification-content">
                  <i className="fas fa-envelope-open-text"></i>
                  <div className="verification-text">
                    <h3>Email Verification Required</h3>
                    <p>Please verify your email address to view the regional map and case statistics.</p>
                  </div>
                  <button 
                    className="verify-email-btn-primary"
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify Email Now
                  </button>
                </div>
              </div>
            )}
            
            <h2>Regional Impact Map</h2>
            <div className="regional-stats">
              <div className="stats-header">
                <h3>South Lebanon Overview</h3>
                <p>Cases by district with destruction levels</p>
                {selectedDistrict && (
                  <div className="selected-district-info">
                    <span className="selected-badge">
                      <i className="fas fa-map-pin"></i>
                      Currently viewing: {selectedDistrict.name}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="regions-grid">
                {regionalStats2.map(region => (
                  <div key={region.region} className={`region-card ${selectedDistrict?.name === region.region ? 'selected' : ''}`}>
                    <div className="region-header"> 
                      <h4>{region.region}</h4>
                      <span className="funded-percentage">{region.funded} Destroyed</span>
                    </div>
                    <div className="region-stats">
                      <p><strong>{region.cases}</strong> approved cases</p>
                      <div className="region-progress">
                        <div 
                          className="progress-fill"
                          style={{width: region.funded}}
                        ></div>
                      </div>
                      <button 
                        className={`view-region-btn ${selectedDistrict?.name === region.region ? 'active' : ''}`}
                        onClick={() => handleDistrictSelection(region.region, region.villages)}
                      >
                        <i className="fas fa-search"></i>
                        {selectedDistrict?.name === region.region ? 'Viewing Cases' : 'View Cases'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-container">
                <div className="map-header">
                  <h4>
                    {selectedDistrict 
                      ? `${selectedDistrict.name} - Interactive Map` 
                      : 'South Lebanon Districts - Interactive Map'
                    }
                  </h4>
                  {selectedDistrict && (
                    <button className="clear-map-selection" onClick={clearDistrictSelection}>
                      <i className="fas fa-times"></i> Show All Districts
                    </button>
                  )}
                </div>
                <div className="map-placeholder">
                  <iframe
                    src={selectedDistrict 
                      ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(selectedDistrict.name + ', Lebanon')}&zoom=12`
                      : "https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=South+Governorate,+Lebanon&zoom=9"
                    }
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      minHeight: '400px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={selectedDistrict ? `${selectedDistrict.name} District Map` : "South Lebanon Districts Map"}
                  />
                  <div className="map-overlay">
                    <i className="fas fa-map-marked-alt"></i>
                    <p>
                      {selectedDistrict 
                        ? `Showing ${selectedDistrict.name} with ${filteredCases.length} cases`
                        : 'Interactive map of South Lebanon districts'
                      }
                    </p>
                    <small>
                      {selectedDistrict 
                        ? `Villages: ${selectedDistrict.villages.slice(0, 3).join(', ')}${selectedDistrict.villages.length > 3 ? '...' : ''}`
                        : 'Click on district cards to focus on specific areas'
                      }
                    </small>
                  </div>
                </div>
                
                {selectedDistrict && (
                  <div className="district-details">
                    <h5>District Information</h5>
                    <div className="district-info-grid">
                      <div className="info-item">
                        <span className="label">Villages:</span>
                        <span className="value">{selectedDistrict.villages.length}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Active Cases:</span>
                        <span className="value">{filteredCases.length}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Needs Funding:</span>
                        <span className="value">{filteredCases.filter(c => c.progress < 100).length}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Total Raised:</span>
                        <span className="value">
                          ${filteredCases.reduce((sum, c) => sum + (c.totalDonations || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="villages-list">
                      <h6>Villages in {selectedDistrict.name}:</h6>
                      <div className="villages-tags">
                        {selectedDistrict.villages.map(village => (
                          <span key={village} className="village-tag">
                            {village}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'fully-funded':
        return (
          <div className="tab-content">
            {/* Email verification notice */}
            {displayUser && !displayUser.emailVerified && (
              <div className="email-verification-banner">
                <div className="verification-content">
                  <i className="fas fa-envelope-open-text"></i>
                  <div className="verification-text">
                    <h3>Email Verification Required</h3>
                    <p>Please verify your email address to view fully funded cases and donation history.</p>
                  </div>
                  <button 
                    className="verify-email-btn-primary"
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify Email Now
                  </button>
                </div>
              </div>
            )}
            
            <h2>Fully Funded Cases</h2>
            <div className="fully-funded-cases">
              <div className="cases-summary">
                <div className="summary-stats">
                  <div className="summary-stat">
                    <i className="fas fa-check-circle"></i>
                    <div>
                      <span className="stat-number">{fullyFundedCases.length}</span>
                      <span className="stat-label">Families Helped</span>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <i className="fas fa-users"></i>
                    <div>
                      <span className="stat-number">
                        {fullyFundedCases.reduce((sum, c) => sum + (parseInt(c.familySize) || 0), 0)}
                      </span>
                      <span className="stat-label">People Helped</span>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <i className="fas fa-dollar-sign"></i>
                    <div>
                      <span className="stat-number">
                        ${fullyFundedCases.reduce((sum, c) => sum + (c.estimatedCost || 0), 0).toLocaleString()}
                      </span>
                      <span className="stat-label">Total Raised</span>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <i className="fas fa-calendar-check"></i>
                    <div>
                      <span className="stat-number">
                        {fullyFundedCases.length > 0 ? 
                          Math.round(fullyFundedCases.reduce((sum, c) => {
                            if (c.approvedDate && c.fullyFundedDate) {
                              const approved = new Date(c.approvedDate);
                              const funded = new Date(c.fullyFundedDate);
                              return sum + (funded - approved) / (1000 * 60 * 60 * 24); // Days
                            }
                            return sum;
                          }, 0) / fullyFundedCases.length) 
                          : 0} days
                      </span>
                      <span className="stat-label">Avg. Funding Time</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {fullyFundedCases.length === 0 ? (
                <div className="no-cases">
                  <i className="fas fa-heart"></i>
                  <h3>No fully funded cases yet</h3>
                  <p>Cases that reach 100% funding will appear here. Start donating to help families reach their goals!</p>
                  <button 
                    className="start-donating-btn"
                    onClick={() => handleTabChange('browse')}
                  >
                    Browse Active Cases
                  </button>
                </div>
              ) : (
                <div className="cases-grid">
                  {fullyFundedCases.map(caseItem => (
                    <div key={caseItem.id} className="case-card fully-funded">
                      <div className="case-header">
                        <h4>{caseItem.family}</h4>
                        <span className="case-id">{caseItem.caseId}</span>
                        <span className="funded-badge">
                          <i className="fas fa-check-circle"></i> Fully Funded
                        </span>
                      </div>
                      
                      <div className="case-info">
                        <p><i className="fas fa-map-marker-alt"></i> {caseItem.location}</p>
                        <p><i className="fas fa-users"></i> {caseItem.familySize}</p>
                        <p><i className="fas fa-check-circle"></i> {caseItem.verified}</p>
                        {caseItem.damagePercentage && (
                          <p><i className="fas fa-exclamation-triangle"></i> Damage: {caseItem.damagePercentage}%</p>
                        )}
                        {caseItem.childrenCount > 0 && (
                          <p><i className="fas fa-baby"></i> {caseItem.childrenCount} children</p>
                        )}
                        {caseItem.elderlyCount > 0 && (
                          <p><i className="fas fa-user-tie"></i> {caseItem.elderlyCount} elderly</p>
                        )}
                        {caseItem.specialNeedsCount > 0 && (
                          <p><i className="fas fa-wheelchair"></i> {caseItem.specialNeedsCount} special needs</p>
                        )}
                        {caseItem.destructionDate && (
                          <p><i className="fas fa-calendar"></i> {new Date(caseItem.destructionDate).toLocaleDateString()}</p>
                        )}
                        {caseItem.checkerComments && (
                          <p><i className="fas fa-comment"></i> {caseItem.checkerComments}</p>
                        )}
                        {caseItem.hasDocuments && (
                          <p><i className="fas fa-file-alt"></i> {caseItem.documentCount} documents verified</p>
                        )}
                      </div>
                      
                      <div className="funding-info">
                        <div className="funding-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{width: '100%'}}
                            ></div>
                          </div>
                          <span>100%</span>
                        </div>
                        <div className="funding-amounts">
                          <span className="raised">{caseItem.raised} raised</span>
                          <span className="needed">of {caseItem.needed}</span>
                        </div>
                        {caseItem.fullyFundedDate && (
                          <div className="funding-date">
                            <i className="fas fa-calendar-check"></i>
                            <span>Funded on {new Date(caseItem.fullyFundedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="case-actions">
                        <div className="fully-funded-message">
                          <i className="fas fa-heart"></i>
                          Goal Achieved!
                        </div>
                        <button className="view-btn">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'history':
        return (
          <div className="tab-content">
            {/* Email verification notice */}
            {displayUser && !displayUser.emailVerified && (
              <div className="email-verification-banner">
                <div className="verification-content">
                  <i className="fas fa-envelope-open-text"></i>
                  <div className="verification-text">
                    <h3>Email Verification Required</h3>
                    <p>Please verify your email address to view your donation history and statistics.</p>
                  </div>
                  <button 
                    className="verify-email-btn-primary"
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify Email Now
                  </button>
                </div>
              </div>
            )}
            
            <h2>My Donation History</h2>
            <div className="donation-history">
              <div className="donation-summary">
                <div className="summary-card">
                  <h3>Total Donated</h3>
                  <p className="amount">${userStats.totalDonated.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Families Helped</h3>
                  <p className="amount">{userStats.familiesHelped}</p>
                </div>
                <div className="summary-card">
                  <h3>This Month</h3>
                  <p className="amount">${userStats.thisMonth.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="donation-list">
                {donationHistory.length === 0 ? (
                  <div className="no-donations">
                    <i className="fas fa-heart"></i>
                    <h3>No donations yet</h3>
                    <p>Your donation history will appear here after you make your first donation.</p>
                    <button 
                      className="start-donating-btn"
                      onClick={() => handleTabChange('browse')}
                    >
                      Start Donating
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="donation-list-header">
                      <h3>Recent Donations</h3>
                      <p>{donationHistory.length} donations made</p>
                    </div>
                    {donationHistory
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(donation => (
                        <div key={donation.id} className="donation-item">
                          <div className="donation-info">
                            <h4>{donation.familyName}</h4>
                            <p><i className="fas fa-map-marker-alt"></i> {donation.location}</p>
                            <span className="date">
                              <i className="fas fa-calendar"></i> 
                              {new Date(donation.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="donation-amount">
                            <span className="amount">${donation.amount.toLocaleString()}</span>
                            <span className="case-id">{donation.caseId}</span>
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Show loading if no current user yet
  if (!currentUser && !user) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayUser = currentUser || user;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-heart"></i>
            </div>
            <h3>{donorData.donorName || displayUser?.name || 'Donor'}</h3>
            <p className="user-type">{donorData.userType}</p>
            <p className="user-email">{displayUser?.email || 'No email provided'}</p>
            <div className="user-stats-mini">
              <div className="mini-stat">
                <span className="mini-stat-value">${userStats.totalDonated.toLocaleString()}</span>
                <span className="mini-stat-label">donated</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{userStats.familiesHelped}</span>
                <span className="mini-stat-label">families helped</span>
              </div>
            </div>
            
            {/* Email verification notice for new users */}
            {displayUser && !displayUser.emailVerified && (
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
              className={`nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => handleTabChange('browse')}
            >
              <i className="fas fa-search"></i>
              Browse Cases
              <span className="nav-badge">{filteredCases.filter(c => c.progress < 100).length}</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => handleTabChange('map')}
            >
              <i className="fas fa-map-marked-alt"></i>
              Regional Map
              {selectedDistrict && (
                <span className="nav-indicator">
                  <i className="fas fa-dot-circle"></i>
                </span>
              )}
            </button>
            <button 
              className={`nav-btn ${activeTab === 'fully-funded' ? 'active' : ''}`}
              onClick={() => handleTabChange('fully-funded')}
            >
              <i className="fas fa-check-circle"></i>
              Fully Funded
              {fullyFundedCases.length > 0 && (
                <span className="nav-badge">{fullyFundedCases.length}</span>
              )}
            </button>
            <button 
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
              <i className="fas fa-history"></i>
              My Donations
              {donationHistory.length > 0 && (
                <span className="nav-badge">{donationHistory.length}</span>
              )}
            </button>
          </nav>
        </div>
        
        <div className="dashboard-main">
          <div className="dashboard-header">
            <h1>Welcome back, {donorData.donorName?.split(' ')[0] || displayUser?.name?.split(' ')[0] || 'Donor'}!</h1>
            <p>
              {selectedDistrict 
                ? `Currently viewing cases in ${selectedDistrict.name}` 
                : 'Thank you for making a difference in South Lebanon'
              }
            </p>
          </div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;