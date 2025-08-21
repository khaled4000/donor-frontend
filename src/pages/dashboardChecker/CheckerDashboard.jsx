import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "../../services/api";
import { adminAuthStorage } from "../../utils/authStorage";
import CaseReviewModal from "./components/CaseReviewModal";
import LebanonMap from "./components/LebanonMap";
import CaseCard from "./components/CaseCard";
import FilterControls from "./components/FilterControls";
import StatsOverview from "./components/StatsOverview";
import "./CheckerDashboard.css";

const CheckerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedCase, setSelectedCase] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeView, setActiveView] = useState("cards");
  const [filters, setFilters] = useState({
    status: "all",
    village: "all",
    priority: "all",
    search: "",
  });

  // Authentication check and initialization
  useEffect(() => {
    const authData = adminAuthStorage.getAuth();
    
    if (!authData.isAuthenticated || !authData.user) {
      navigate("/admin/login");
      return;
    }

    if (authData.user.role !== "checker") {
      if (authData.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/admin/login");
      }
      return;
    }

    setUser(authData.user);
    loadDashboardData();
  }, [navigate]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [casesResponse, statsResponse] = await Promise.all([
        ApiService.getCheckerCases(),
        ApiService.getCheckerStats(),
      ]);

      setCases(casesResponse.cases || casesResponse.data || []);
      setFilteredCases(casesResponse.cases || casesResponse.data || []);
      setStats(statsResponse.stats || statsResponse.data || {});
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      
      if (error.message.includes("401") || error.message.includes("403")) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else {
        toast.error("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter cases based on current filters
  useEffect(() => {
    let filtered = [...cases];

    // Apply filters
    if (filters.status !== "all") {
      if (filters.status === "pending") {
        filtered = filtered.filter((c) =>
          ["submitted", "under_review"].includes(c.status)
        );
      } else {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
    }

    if (filters.village !== "all") {
      filtered = filtered.filter(
        (c) => c.familyData?.village === filters.village
      );
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.caseId.toLowerCase().includes(searchTerm) ||
          c.familyData?.familyName?.toLowerCase().includes(searchTerm) ||
          c.familyData?.village?.toLowerCase().includes(searchTerm) ||
          c.familyData?.headOfHousehold?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);

      if (priorityDiff !== 0) return priorityDiff;

      const dateA = new Date(a.timestamps?.submitted || a.timestamps?.created);
      const dateB = new Date(b.timestamps?.submitted || b.timestamps?.created);
      return dateA - dateB;
    });

    setFilteredCases(filtered);
  }, [cases, filters]);

  // Handle logout
  const handleLogout = () => {
    adminAuthStorage.clearAuth();
    
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      window.history.pushState(null, "", window.location.href);
    }

    navigate("/login", { replace: true });
  };

  // Handle case click to open review modal
  const handleCaseClick = async (caseItem) => {
    try {
      // Try to load detailed case data
      let detailedCase = caseItem;
      
      try {
        const response = await ApiService.getCheckerCase(caseItem.caseId);
        detailedCase = response.case || response.data || response;
      } catch (detailError) {
        console.warn("Failed to load detailed case data, using available data:", detailError.message);
        // Use existing case data if detailed fetch fails
      }

      setSelectedCase(detailedCase);
      setShowReviewModal(true);

    } catch (error) {
      console.error("Error loading case details:", error);
      
      if (error.message.includes("401") || error.message.includes("403")) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else {
        toast.error("Failed to load case details. Please try again.");
      }
    }
  };

  // Handle case assignment
  const handleCaseAssignment = async (caseId) => {
    try {
      const checkerData = {
        checkerId: user?.id,
        checkerName: user?.name || user?.firstName,
        assignedAt: new Date().toISOString(),
        notes: `Case assigned to ${user?.name || user?.firstName}`,
      };

      await ApiService.assignCaseToChecker(caseId, checkerData);
      toast.success("Case assigned successfully!");
      await loadDashboardData();

    } catch (error) {
      console.error("Error assigning case:", error);
      
      if (error.message.includes("403")) {
        toast.error("You don't have permission to assign this case.");
      } else if (error.message.includes("401")) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else {
        toast.error("Failed to assign case. Please try again.");
      }
    }
  };

  // Handle case decision (approve/reject)
  const handleCaseDecision = async (decision, assessmentData) => {
    try {
      // Validate user session
      if (!user || !user.id) {
        toast.error('User session is invalid. Please refresh and try again.');
        return;
      }

      // Validate required fields for approval
      if (decision === "approved") {
        if (!assessmentData.finalDamagePercentage && !assessmentData.finalDestructionPercentage) {
          throw new Error("Please provide a valid destruction percentage (0-100%)");
        }

        if (!assessmentData.estimatedCost && !assessmentData.finalRebuildingCost) {
          throw new Error("Please provide a valid rebuilding cost");
        }
      }

      // Ensure we have valid assessment data
      if (!assessmentData || !assessmentData.comments || !assessmentData.comments.trim()) {
        throw new Error("Comments are required for all decisions");
      }

      // Build the request payload with proper field mapping
      const decisionPayload = {
        decision: decision,
        comments: assessmentData.comments.trim(),
        checkerId: user.id,
        checkerName: user.name || user.firstName || 'Unknown Checker',
      };

      // Map the fields correctly for approval
      if (decision === "approved") {
        // Use the correct field names based on what the API expects
        decisionPayload.finalDamagePercentage = parseFloat(
          assessmentData.finalDamagePercentage || assessmentData.finalDestructionPercentage
        );
        decisionPayload.estimatedCost = parseFloat(
          assessmentData.estimatedCost || assessmentData.finalRebuildingCost
        );

        // Add field notes if available
        if (assessmentData.fieldNotes) {
          decisionPayload.fieldNotes = assessmentData.fieldNotes;
        }
      }

      console.log('Dashboard sending payload:', decisionPayload); // Debug log

      await ApiService.submitCheckerDecision(selectedCase.caseId, decisionPayload);

      const decisionText = decision === "approved" ? "approved" : "rejected";
      toast.success(`Case ${decisionText} successfully!`);

      // Close modal and refresh data
      setShowReviewModal(false);
      setSelectedCase(null);
      await loadDashboardData();

    } catch (error) {
      console.error("Error submitting decision:", error);
      
      // More specific error handling
      if (error.message.includes("401") || error.message.includes("403")) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else if (error.message.includes("400")) {
        toast.error(error.message || "Invalid data submitted. Please check all fields and try again.");
      } else {
        toast.error(error.message || "Failed to submit decision. Please try again.");
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Get village options for filter
  const getVillageOptions = () => {
    const villages = [
      ...new Set(cases.map((c) => c.familyData?.village).filter(Boolean)),
    ];
    return villages.sort();
  };

  if (loading) {
    return (
      <div className="checker-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading checker dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checker-dashboard">
      {/* Header */}
      <header className="checker-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Field Checker Dashboard</h1>
            <p>Welcome back, {user?.name || user?.firstName}</p>
            <div className="checker-info">
              <span className="checker-badge">
                <i className="fas fa-shield-alt"></i>
                Field Checker
              </span>
              <span className="active-cases-count">
                {filteredCases.filter(c => c.assignedTo === user?.id && c.status === "under_review").length} Active Cases
              </span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {filteredCases.filter(c => c.status === "approved" && c.finalChecker?.id === user?.id).length}
                  </span>
                  <span className="stat-label">Approved</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {filteredCases.filter(c => c.status === "under_review" && c.assignedTo === user?.id).length}
                  </span>
                  <span className="stat-label">In Review</span>
                </div>
              </div>
              
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${activeView === "cards" ? "active" : ""}`}
                  onClick={() => setActiveView("cards")}
                >
                  <i className="fas fa-th-large"></i>
                  Cases
                </button>
                <button
                  className={`toggle-btn ${activeView === "map" ? "active" : ""}`}
                  onClick={() => setActiveView("map")}
                >
                  <i className="fas fa-map-marker-alt"></i>
                  Map
                </button>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <StatsOverview 
        stats={{
          ...stats,
          approvedByMe: filteredCases.filter(c => c.status === "approved" && c.finalChecker?.id === user?.id).length,
          myActiveCases: filteredCases.filter(c => c.assignedTo === user?.id && c.status === "under_review").length,
          totalAssessed: filteredCases.filter(c => c.finalChecker?.id === user?.id).length,
        }} 
      />

      {/* Filters */}
      <FilterControls
        filters={filters}
        onFilterChange={handleFilterChange}
        villageOptions={getVillageOptions()}
        casesCount={filteredCases.length}
      />

      {/* Main Content */}
      <main className="checker-main">
        {activeView === "cards" ? (
          <div className="cases-grid">
            {filteredCases.length > 0 ? (
              filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.caseId}
                  caseData={caseItem}
                  onCaseClick={handleCaseClick}
                  onAssignCase={handleCaseAssignment}
                  currentCheckerId={user?.id}
                  showCheckerInfo={true}
                  showAssessmentStatus={true}
                />
              ))
            ) : (
              <div className="no-cases">
                <i className="fas fa-clipboard-list"></i>
                <h3>No Cases Found</h3>
                <p>
                  {filters.status === "all" 
                    ? "No cases match your current filters."
                    : `No ${filters.status.replace('_', ' ')} cases found.`
                  }
                </p>
                {filters.status !== "all" && (
                  <button 
                    className="clear-filters-btn"
                    onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <LebanonMap
            cases={filteredCases}
            onCaseClick={handleCaseClick}
            onAssignCase={handleCaseAssignment}
            currentCheckerId={user?.id}
          />
        )}
      </main>

      {/* Case Review Modal */}
      {showReviewModal && selectedCase && (
        <CaseReviewModal
          caseData={selectedCase}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedCase(null);
          }}
          onSubmitDecision={handleCaseDecision}
          currentUser={user}
          currentCheckerId={user?.id}
          isOpen={showReviewModal}
        />
      )}
    </div>
  );
};

export default CheckerDashboard;