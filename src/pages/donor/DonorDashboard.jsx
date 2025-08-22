import React, { useState, useEffect, useRef } from 'react';
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
  const [approvedCases, setApprovedCases] = useState([]);
  const [fullyFundedCases, setFullyFundedCases] = useState([]);
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
  
  // Google Maps references
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
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
    
    // Load Google Maps when component mounts
    loadGoogleMaps();
  }, [navigate, user]);

  // Load Google Maps API (with fallback to embedded iframe)
  const loadGoogleMaps = () => {
    // For development/demo purposes, we'll use a fallback approach
    // In production, replace 'DEMO_MODE' with your actual API key
    const apiKey = 'DEMO_MODE'; // Replace with actual Google Maps API key
    
    if (apiKey === 'DEMO_MODE') {
      // Use iframe fallback for demo
      setIsMapLoaded(true);
      return;
    }

    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setIsMapLoaded(true); // Fallback to iframe mode
    };
    document.head.appendChild(script);
  };

  // Initialize Google Map or fallback to iframe
  const initializeMap = () => {
    if (!isMapLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Check if we have Google Maps API available
    if (window.google && window.google.maps) {
      initializeGoogleMap();
    } else {
      initializeIframeMap();
    }
  };

  // Initialize Google Maps (when API is available)
  const initializeGoogleMap = () => {
    const southLebanonCenter = { lat: 33.2774, lng: 35.2044 };
    
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: selectedDistrict ? 12 : 9,
      center: southLebanonCenter,
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }, { lightness: 17 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 18 }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 16 }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
    addMarkersToMap();
  };

  // Initialize iframe-based map (fallback)
  const initializeIframeMap = () => {
    const mapQuery = selectedDistrict 
      ? encodeURIComponent(`${selectedDistrict.name}, Lebanon`)
      : 'South+Governorate,+Lebanon';
    
    const zoom = selectedDistrict ? 12 : 9;
    
    mapRef.current.innerHTML = `
      <div style="position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden;">
        <iframe
          src="https://www.google.com/maps?q=${mapQuery}&output=embed&z=${zoom}"
          width="100%"
          height="100%"
          style="border: 0; border-radius: 12px;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="${selectedDistrict ? `${selectedDistrict.name} District Map` : 'South Lebanon Districts Map'}"
        ></iframe>
        <div class="map-overlay-info" style="
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">
            ${selectedDistrict ? selectedDistrict.name : 'South Lebanon'}
          </h4>
          <div style="color: #6b7280; font-size: 14px; line-height: 1.4;">
            <div style="margin-bottom: 4px;">
              📍 <strong>${filteredCases.length}</strong> cases in this area
            </div>
            <div style="margin-bottom: 4px;">
              ❤️ <strong>${filteredCases.filter(c => c.progress < 100).length}</strong> need funding
            </div>
            <div style="margin-bottom: 4px;">
              ✅ <strong>${filteredCases.filter(c => c.progress >= 100).length}</strong> fully funded
            </div>
            <div>
              💰 <strong>$${filteredCases.reduce((sum, c) => sum + (c.totalDonations || 0), 0).toLocaleString()}</strong> raised
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Add markers to map for all cases (only when Google Maps API is available)
  const addMarkersToMap = () => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    clearMarkers();

    const casesToShow = selectedDistrict ? getFilteredCases() : [...approvedCases, ...fullyFundedCases];
    
    casesToShow.forEach(caseItem => {
      // Generate approximate coordinates based on village name
      // In a real application, you'd store actual lat/lng in your database
      const coordinates = getVillageCoordinates(caseItem.location);
      
      if (coordinates) {
        const marker = new window.google.maps.Marker({
          position: coordinates,
          map: mapInstanceRef.current,
          title: `${caseItem.family} - ${caseItem.location}`,
          icon: {
            url: caseItem.progress >= 100 
              ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#10B981" stroke="#fff" stroke-width="2"/>
                  <path d="M10 16l4 4 8-8" stroke="#fff" stroke-width="2" fill="none"/>
                </svg>`)
              : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#fff" stroke-width="2"/>
                  <path d="M16 8v8M16 20v2" stroke="#fff" stroke-width="2" fill="none"/>
                </svg>`),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        });

        // Add click listener for info window
        marker.addListener('click', () => {
          const contentString = `
            <div style="
              padding: 16px; 
              min-width: 280px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
            ">
              <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                margin-bottom: 12px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 12px;
              ">
                <div>
                  <h3 style="
                    margin: 0 0 4px 0; 
                    font-size: 18px; 
                    font-weight: 600; 
                    color: #1f2937;
                  ">${caseItem.family}</h3>
                  <p style="
                    margin: 0; 
                    color: #6b7280; 
                    font-size: 14px;
                  ">${caseItem.caseId}</p>
                </div>
                ${caseItem.progress >= 100 ? `
                  <span style="
                    background: #dcfce7; 
                    color: #166534; 
                    padding: 4px 8px; 
                    border-radius: 16px; 
                    font-size: 12px; 
                    font-weight: 500;
                  ">✓ Fully Funded</span>
                ` : `
                  <span style="
                    background: #fef3c7; 
                    color: #92400e; 
                    padding: 4px 8px; 
                    border-radius: 16px; 
                    font-size: 12px; 
                    font-weight: 500;
                  ">Needs Funding</span>
                `}
              </div>
              
              <div style="margin-bottom: 12px;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <span style="color: #ef4444; margin-right: 8px;">📍</span>
                  <span style="color: #374151; font-size: 14px;">${caseItem.location}</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <span style="color: #3b82f6; margin-right: 8px;">👨‍👩‍👧‍👦</span>
                  <span style="color: #374151; font-size: 14px;">${caseItem.familySize}</span>
                </div>
                ${caseItem.damagePercentage ? `
                  <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="color: #f59e0b; margin-right: 8px;">⚠️</span>
                    <span style="color: #374151; font-size: 14px;">${caseItem.damagePercentage}% damage</span>
                  </div>
                ` : ''}
              </div>
              
              <div style="
                background: #f9fafb; 
                padding: 12px; 
                border-radius: 8px; 
                margin-bottom: 12px;
              ">
                <div style="
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 8px;
                ">
                  <span style="color: #6b7280; font-size: 14px;">Progress</span>
                  <span style="color: #1f2937; font-weight: 600; font-size: 14px;">${caseItem.progress}%</span>
                </div>
                <div style="
                  width: 100%; 
                  height: 8px; 
                  background: #e5e7eb; 
                  border-radius: 4px; 
                  overflow: hidden;
                  margin-bottom: 8px;
                ">
                  <div style="
                    width: ${caseItem.progress}%; 
                    height: 100%; 
                    background: ${caseItem.progress >= 100 ? '#10b981' : '#3b82f6'}; 
                    transition: width 0.3s ease;
                  "></div>
                </div>
                <div style="
                  display: flex; 
                  justify-content: space-between; 
                  color: #6b7280; 
                  font-size: 13px;
                ">
                  <span>${caseItem.raised} raised</span>
                  <span>of ${caseItem.needed}</span>
                </div>
              </div>
              
              ${caseItem.progress < 100 ? `
                <div style="text-align: center;">
                  <button 
                    onclick="window.parent.postMessage({type: 'donate', caseId: '${caseItem.caseId}'}, '*')"
                    style="
                      background: #3b82f6; 
                      color: white; 
                      border: none; 
                      padding: 8px 16px; 
                      border-radius: 6px; 
                      font-size: 14px; 
                      font-weight: 500; 
                      cursor: pointer;
                      transition: background 0.2s;
                    "
                    onmouseover="this.style.background='#2563eb'"
                    onmouseout="this.style.background='#3b82f6'"
                  >
                    💖 Donate to Help
                  </button>
                </div>
              ` : ''}
            </div>
          `;

          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      }
    });

    // Adjust map bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setCenter(markersRef.current[0].getPosition());
        mapInstanceRef.current.setZoom(13);
      } else {
        mapInstanceRef.current.fitBounds(bounds);
        const currentZoom = mapInstanceRef.current.getZoom();
        if (currentZoom > 12) {
          mapInstanceRef.current.setZoom(12);
        }
      }
    }
  };

  // Clear all markers from map
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  };

  // Get approximate coordinates for villages (in a real app, store these in database)
  const getVillageCoordinates = (village) => {
    const villageCoords = {
      // Tyre District
      'Ain Baal': { lat: 33.2688, lng: 35.2044 },
      'Adloun': { lat: 33.3567, lng: 35.2711 },
      'Al-Bazouriye': { lat: 33.2722, lng: 35.2089 },
      'Al-Mansouri': { lat: 33.2856, lng: 35.1589 },
      'Bafliyeh': { lat: 33.2567, lng: 35.1678 },
      'Tyre': { lat: 33.2704, lng: 35.2038 },
      'Qana': { lat: 33.2044, lng: 35.3089 },
      'Sreifa': { lat: 33.1889, lng: 35.2756 },
      
      // Sidon District
      'Saida': { lat: 33.5633, lng: 35.3689 },
      'Abra': { lat: 33.5278, lng: 35.3444 },
      'Ein el-Delb': { lat: 33.5156, lng: 35.3833 },
      
      // Nabatieh District
      'Nabatiye': { lat: 33.3789, lng: 35.4833 },
      'Ansar': { lat: 33.3456, lng: 35.4278 },
      'Arnoun': { lat: 33.3667, lng: 35.4556 },
      'Harouf': { lat: 33.3233, lng: 35.4144 },
      'Houla': { lat: 33.3089, lng: 35.4456 },
      
      // Bint Jbeil District
      'Bint Jbeil': { lat: 33.1144, lng: 35.4278 },
      'Aita al-Shaab': { lat: 33.1056, lng: 35.4144 },
      'Maroun ar-Ras': { lat: 33.0944, lng: 35.4089 },
      'Yaroun': { lat: 33.0778, lng: 35.4233 },
      'Tebnine': { lat: 33.1333, lng: 35.4500 },
      
      // Marjayoun District
      'Marjayoun': { lat: 33.3611, lng: 35.5889 },
      'Kfar Kila': { lat: 33.1056, lng: 35.5644 },
      'Odaisseh': { lat: 33.0944, lng: 35.6089 },
      
      // Jezzine District
      'Jezzine': { lat: 33.5444, lng: 35.5833 },
      'Kfarfalous': { lat: 33.5233, lng: 35.5456 }
    };

    // Try exact match first
    if (villageCoords[village]) {
      return villageCoords[village];
    }

    // Try partial match
    const partialMatch = Object.keys(villageCoords).find(key => 
      village.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(village.toLowerCase())
    );

    if (partialMatch) {
      return villageCoords[partialMatch];
    }

    // Default to South Lebanon center with slight random offset
    return {
      lat: 33.2774 + (Math.random() - 0.5) * 0.2,
      lng: 35.2044 + (Math.random() - 0.5) * 0.2
    };
  };

  // Listen for donate messages from info window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'donate' && event.data.caseId) {
        const caseItem = [...approvedCases, ...fullyFundedCases].find(c => c.caseId === event.data.caseId);
        if (caseItem) {
          const amount = prompt(`Enter donation amount for ${caseItem.family}:`);
          if (amount && !isNaN(amount) && amount > 0) {
            handleDonation(caseItem, amount);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [approvedCases, fullyFundedCases]);

  // Initialize map when tab changes to map and data is loaded
  useEffect(() => {
    if (activeTab === 'map' && isMapLoaded && approvedCases.length > 0) {
      setTimeout(initializeMap, 100); // Small delay to ensure DOM is ready
    }
  }, [activeTab, isMapLoaded, approvedCases, fullyFundedCases]);

  // Update markers when cases or filters change (only for Google Maps)
  useEffect(() => {
    if (activeTab === 'map' && mapInstanceRef.current && window.google) {
      addMarkersToMap();
    } else if (activeTab === 'map' && isMapLoaded && !window.google) {
      // Re-initialize iframe map with updated data
      initializeIframeMap();
    }
  }, [approvedCases, fullyFundedCases, selectedDistrict, selectedRegion]);

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
        documentCount: caseItem.documentCount,
        // Add coordinates if available from backend, otherwise will be generated
        latitude: caseItem.latitude,
        longitude: caseItem.longitude
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
        documentCount: caseItem.documentCount,
        // Add coordinates if available from backend, otherwise will be generated
        latitude: caseItem.latitude,
        longitude: caseItem.longitude
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

      // Close info window after successful donation
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      toast.success(`Thank you for your donation of ${amount} to ${caseItem.family}! Your donation has been processed.`);
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

  // New donation handlers for Visa and Wish
  const handleVisaDonate = async (caseItem, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount.');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to make a donation.');
      return;
    }

    try {
      console.log('💳 Processing Visa donation:', { caseId: caseItem.caseId, amount });
      
      // Show loading toast
      toast.info('Processing Visa payment...');
      
      const donationData = {
        caseId: caseItem.caseId,
        amount: parseFloat(amount),
        paymentMethod: 'visa',
        anonymous: false,
        message: `Visa donation from ${donorData.donorName}`
      };

      // Here you would integrate with Visa's payment API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const response = await ApiService.makeDonation(donationData);
      
      // Refresh data
      await loadApprovedCases();
      await loadFullyFundedCases();
      await loadUserDonationHistory();

      toast.success(`✅ Visa payment successful! Thank you for your ${amount} donation to ${caseItem.family}!`);
    } catch (error) {
      console.error('Error processing Visa donation:', error);
      toast.error(error.message || 'Visa payment failed. Please try again.');
    }
  };

  const handleWishDonate = (caseItem) => {
    if (!currentUser) {
      toast.error('Please log in to make a donation.');
      return;
    }

    try {
      // Generate a unique donation ID for the Wishmony redirect
      const donationId = `${caseItem.caseId}-${Date.now()}`;
      const wishmoneyUrl = `https://wishmony.com/donate/${donationId}`;
      
      console.log('🌟 Redirecting to Wishmony:', wishmoneyUrl);
      
      // Show info toast
      toast.info('Redirecting to Wishmony for donation...');
      
      // Open Wishmony in a new tab
      window.open(wishmoneyUrl, '_blank', 'noopener,noreferrer');
      
      // Optionally track the redirect in your analytics
      console.log(`Wish donation redirect for case: ${caseItem.caseId}, family: ${caseItem.family}`);
    } catch (error) {
      console.error('Error redirecting to Wishmony:', error);
      toast.error('Failed to redirect to Wishmony. Please try again.');
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
                        <>
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
                          
                          {/* New Donation Buttons */}
                          <div className="new-donation-buttons">
                            <button 
                              className="visa-donate-btn"
                              onClick={() => {
                                const amount = document.getElementById(`donation-${caseItem.id}`).value;
                                if (amount && amount > 0) {
                                  handleVisaDonate(caseItem, amount);
                                  document.getElementById(`donation-${caseItem.id}`).value = '';
                                } else {
                                  toast.warning('Please enter a donation amount first');
                                }
                              }}
                            >
                              <i className="fab fa-cc-visa"></i>
                              Donate by Visa
                            </button>
                            
                            <button 
                              className="wish-donate-btn"
                              onClick={() => handleWishDonate(caseItem)}
                            >
                              <i className="fas fa-star"></i>
                              Donate by Wish
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="fully-funded-message">
                          <i className="fas fa-heart"></i>
                          Goal Achieved!
                        </div>
                      )}
                    
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
                    Interactive Cases Map
                    {selectedDistrict && ` - ${selectedDistrict.name}`}
                  </h4>
                  <div className="map-controls">
                    {selectedDistrict && (
                      <button className="clear-map-selection" onClick={clearDistrictSelection}>
                        <i className="fas fa-times"></i> Show All Districts
                      </button>
                    )}
                    <div className="map-legend">
                 
                    </div>
                  </div>
                </div>
                
                <div className="interactive-map-wrapper">
                  <div 
                    ref={mapRef}
                    className="google-map"
                    style={{
                      width: '100%',
                      height: '500px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  
                  {!isMapLoaded && (
                    <div className="map-loading-overlay">
                      <div className="map-loading-content">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading interactive map...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="map-info-panel">
                  <div className="map-stats">
                    <div className="map-stat">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <span className="stat-number">
                          {selectedDistrict ? filteredCases.length : [...approvedCases, ...fullyFundedCases].length}
                        </span>
                        <span className="stat-label">Cases on Map</span>
                      </div>
                    </div>
                    <div className="map-stat">
                      <i className="fas fa-heart"></i>
                      <div>
                        <span className="stat-number">
                          {selectedDistrict 
                            ? filteredCases.filter(c => c.progress < 100).length
                            : [...approvedCases, ...fullyFundedCases].filter(c => c.progress < 100).length}
                        </span>
                        <span className="stat-label">Need Funding</span>
                      </div>
                    </div>
                    <div className="map-stat">
                      <i className="fas fa-check-circle"></i>
                      <div>
                        <span className="stat-number">
                          {selectedDistrict 
                            ? filteredCases.filter(c => c.progress >= 100).length
                            : fullyFundedCases.length}
                        </span>
                        <span className="stat-label">Fully Funded</span>
                      </div>
                    </div>
                    <div className="map-stat">
                      <i className="fas fa-dollar-sign"></i>
                      <div>
                        <span className="stat-number">
                          ${(selectedDistrict 
                            ? filteredCases.reduce((sum, c) => sum + (c.totalDonations || 0), 0)
                            : [...approvedCases, ...fullyFundedCases].reduce((sum, c) => sum + (c.totalDonations || 0), 0)
                          ).toLocaleString()}
                        </span>
                        <span className="stat-label">Total Raised</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="map-instructions">
                    <h5><i className="fas fa-info-circle"></i> How to Use the Map</h5>
                    <ul>
                      <li><strong>Red markers</strong> - Cases that need funding</li>
                      <li><strong>Green markers</strong> - Fully funded cases</li>
                      <li><strong>Click markers</strong> to view case details and donate</li>
                      <li><strong>Use district cards</strong> above to filter by region</li>
                    </ul>
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
              Interactive Map
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