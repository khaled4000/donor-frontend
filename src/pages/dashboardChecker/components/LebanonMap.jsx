import React, { useEffect, useRef, useState } from 'react';
import './LebanonMap.css';

const LebanonMap = ({ cases, onCaseClick, onAssignCase, currentCheckerId }) => {
  const mapRef = useRef(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lebanon villages coordinates (extended list)
  const LEBANON_VILLAGES_COORDINATES = {
    'Tyre': { lat: 33.2703, lng: 35.2039 },
    'Bint Jbeil': { lat: 33.1215, lng: 35.4267 },
    'Nabatiye': { lat: 33.3708, lng: 35.4836 },
    'Marjayoun': { lat: 33.3608, lng: 35.5919 },
    'Saida': { lat: 33.5614, lng: 35.3714 },
    'Jezzine': { lat: 33.5475, lng: 35.5897 },
    'Ain Baal': { lat: 33.2889, lng: 35.2047 },
    'Abra': { lat: 33.5281, lng: 35.3558 },
    'Adchit': { lat: 33.6147, lng: 35.3978 },
    'Adloun': { lat: 33.4003, lng: 35.2839 },
    'Aita al-Shaab': { lat: 33.1044, lng: 35.4039 },
    'Al-Khiyam': { lat: 33.2972, lng: 35.6444 },
    'Alma ash-Shaab': { lat: 33.0644, lng: 35.3928 },
    'Ansar': { lat: 33.4983, lng: 35.4397 },
    'Arnoun': { lat: 33.3467, lng: 35.4761 },
    'Bafliyeh': { lat: 33.2342, lng: 35.1942 },
    'Blida': { lat: 33.1889, lng: 35.2081 },
    'Borj ash-Shamali': { lat: 33.2728, lng: 35.1628 },
    'Chamaa': { lat: 33.2728, lng: 35.1306 },
    'Deir Mimas': { lat: 33.4589, lng: 35.5406 },
    'Hanaway': { lat: 33.2042, lng: 35.1753 },
    'Houla': { lat: 33.1011, lng: 35.4631 },
    'Kafra': { lat: 33.1328, lng: 35.6481 },
    'Kfar Kila': { lat: 33.1056, lng: 35.5614 },
    'Khiam': { lat: 33.2972, lng: 35.6444 },
    'Majdal Zoun': { lat: 33.2339, lng: 35.6119 },
    'Mays al-Jabal': { lat: 33.0633, lng: 35.4628 },
    'Qana': { lat: 33.2069, lng: 35.3056 },
    'Rmeish': { lat: 33.0881, lng: 35.3339 },
    'Yaroun': { lat: 33.0528, lng: 35.4472 },
    'Tebnine': { lat: 33.2489, lng: 35.2628 },
  };

  // Group cases by village
  const casesByVillage = cases.reduce((acc, caseItem) => {
    const village = caseItem.location?.village || caseItem.familyData?.village;
    if (!village) return acc;
    
    if (!acc[village]) {
      acc[village] = [];
    }
    acc[village].push(caseItem);
    return acc;
  }, {});

  useEffect(() => {
    // For demo purposes, we'll use a simplified map implementation
    // In a real implementation, you would use Leaflet, Google Maps, or Mapbox
    setIsLoading(false);
  }, []);

  const getMarkerColor = (villageCases) => {
    const highPriority = villageCases.filter(c => c.priority === 'high').length;
    const pending = villageCases.filter(c => ['submitted', 'under_review'].includes(c.status)).length;
    
    if (highPriority > 0) return '#dc3545'; // Red for high priority
    if (pending > 0) return '#ffc107'; // Yellow for pending
    return '#28a745'; // Green for resolved
  };

  const getMarkerSize = (villageCases) => {
    const count = villageCases.length;
    if (count >= 5) return 'large';
    if (count >= 3) return 'medium';
    return 'small';
  };

  const handleVillageClick = (village, villageCases) => {
    setSelectedVillage({ village, cases: villageCases });
  };

  const handleCloseVillagePopup = () => {
    setSelectedVillage(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading Lebanon map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* Map Legend */}
      <div className="map-legend">
        <h4>Map Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker high-priority"></div>
            <span>High Priority Cases</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker pending"></div>
            <span>Pending Review</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker resolved"></div>
            <span>Resolved Cases</span>
          </div>
        </div>
        <div className="legend-sizes">
          <p><strong>Marker Size:</strong> Small (1-2), Medium (3-4), Large (5+)</p>
        </div>
      </div>

      {/* Simplified Map */}
      <div className="lebanon-map" ref={mapRef}>
        <div className="map-title">
          <h3>South Lebanon - Case Distribution</h3>
          <p>{Object.keys(casesByVillage).length} villages with cases</p>
        </div>

        {/* SVG Map of Lebanon (simplified for demo) */}
        <div className="map-svg-container">
          <svg viewBox="0 0 400 600" className="lebanon-outline">
            {/* Simplified Lebanon border */}
            <path
              d="M50 100 L350 100 L370 150 L360 200 L350 250 L340 300 L330 350 L320 400 L310 450 L290 500 L270 520 L250 530 L200 540 L150 530 L100 520 L80 500 L60 450 L50 400 L45 350 L40 300 L45 250 L50 200 L50 150 Z"
              fill="#f8f9fa"
              stroke="#dee2e6"
              strokeWidth="2"
            />
            
            {/* South Lebanon region highlight */}
            <path
              d="M50 300 L340 300 L330 350 L320 400 L310 450 L290 500 L270 520 L250 530 L200 540 L150 530 L100 520 L80 500 L60 450 L50 400 Z"
              fill="#e3f2fd"
              stroke="#1976d2"
              strokeWidth="1"
              opacity="0.3"
            />
          </svg>

          {/* Village Markers */}
          <div className="village-markers">
            {Object.entries(casesByVillage).map(([village, villageCases]) => {
              const coordinates = LEBANON_VILLAGES_COORDINATES[village];
              if (!coordinates) return null;

              // Convert lat/lng to SVG coordinates (simplified mapping)
              const x = ((coordinates.lng - 35.0) / 0.8) * 300 + 50;
              const y = ((33.9 - coordinates.lat) / 0.9) * 400 + 100;

              return (
                <div
                  key={village}
                  className={`village-marker ${getMarkerSize(villageCases)}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    backgroundColor: getMarkerColor(villageCases),
                  }}
                  onClick={() => handleVillageClick(village, villageCases)}
                  title={`${village}: ${villageCases.length} case${villageCases.length !== 1 ? 's' : ''}`}
                >
                  <span className="marker-count">{villageCases.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-value">{cases.length}</span>
            <span className="stat-label">Total Cases</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {cases.filter(c => ['submitted', 'under_review'].includes(c.status)).length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {cases.filter(c => c.priority === 'high').length}
            </span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      </div>

      {/* Village Cases Popup */}
      {selectedVillage && (
        <div className="village-popup-overlay" onClick={handleCloseVillagePopup}>
          <div className="village-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>{selectedVillage.village}</h3>
              <button 
                className="close-popup"
                onClick={handleCloseVillagePopup}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="popup-content">
              <p className="village-summary">
                {selectedVillage.cases.length} case{selectedVillage.cases.length !== 1 ? 's' : ''} in this village
              </p>
              
              <div className="village-cases">
                {selectedVillage.cases.map((caseItem) => (
                  <div key={caseItem.caseId} className="village-case-item">
                    <div className="case-summary">
                      <div className="case-header">
                        <span className="case-id">{caseItem.caseId}</span>
                        <span className={`case-status ${caseItem.status}`}>
                          {caseItem.status.replace('_', ' ')}
                        </span>
                        <span className={`case-priority ${caseItem.priority}`}>
                          {caseItem.priority}
                        </span>
                      </div>
                      
                      <div className="case-family">
                        <strong>{caseItem.familyData.familyName}</strong>
                        <span>{caseItem.familyData.numberOfMembers} members</span>
                      </div>
                      
                      <div className="case-damage">
                        <span>Damage: {caseItem.familyData.destructionPercentage}%</span>
                        <span>Submitted: {formatDate(caseItem.timestamps.submitted)}</span>
                      </div>
                    </div>
                    
                    <div className="case-actions">
                      {!caseItem.assignment && caseItem.status === 'submitted' && (
                        <button
                          className="assign-case-btn"
                          onClick={() => {
                            onAssignCase(caseItem.caseId);
                            handleCloseVillagePopup();
                          }}
                        >
                          Assign
                        </button>
                      )}
                      
                      <button
                        className="view-case-btn"
                        onClick={() => {
                          onCaseClick(caseItem);
                          handleCloseVillagePopup();
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LebanonMap;
