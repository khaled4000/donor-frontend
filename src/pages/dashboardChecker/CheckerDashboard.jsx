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
  const [activeView, setActiveView] = useState("cards"); // 'cards' or 'map'
  const [filters, setFilters] = useState({
    status: "all",
    village: "all",
    priority: "all",
    search: "",
  });

  // Check authentication and load initial data
  useEffect(() => {
    const authData = adminAuthStorage.getAuth();
    console.log("🔍 CHECKER AUTH - Checking authentication:", authData);

    if (!authData.isAuthenticated || !authData.user) {
      console.log(
        "❌ CHECKER AUTH - Not authenticated, redirecting to admin login"
      );
      navigate("/admin/login");
      return;
    }

    if (authData.user.role !== "checker") {
      console.log(
        "❌ CHECKER AUTH - User is not a checker, redirecting to appropriate dashboard"
      );
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

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 CHECKER - Loading dashboard data...");

      // Load cases and stats in parallel
      const [casesResponse, statsResponse] = await Promise.all([
        ApiService.request("/checker/cases", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAuthStorage.getAuth().token}`,
          },
        }),
        ApiService.request("/checker/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAuthStorage.getAuth().token}`,
          },
        }),
      ]);

      console.log(
        "🔍 CHECKER - Cases loaded:",
        casesResponse.cases?.length || 0
      );
      console.log("🔍 CHECKER - Stats loaded:", statsResponse.stats);

      setCases(casesResponse.cases || []);
      setFilteredCases(casesResponse.cases || []);
      setStats(statsResponse.stats || {});
    } catch (error) {
      console.error("❌ CHECKER - Error loading dashboard data:", error);
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

    // Status filter
    if (filters.status !== "all") {
      if (filters.status === "pending") {
        filtered = filtered.filter((c) =>
          ["submitted", "under_review"].includes(c.status)
        );
      } else {
        filtered = filtered.filter((c) => c.status === filters.status);
      }
    }

    // Village filter
    if (filters.village !== "all") {
      filtered = filtered.filter(
        (c) => c.familyData?.village === filters.village
      );
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    // Search filter
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

    // Sort by priority and submission date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);

      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by submission date (older first)
      const dateA = new Date(a.timestamps?.submitted || a.timestamps?.created);
      const dateB = new Date(b.timestamps?.submitted || b.timestamps?.created);
      return dateA - dateB;
    });

    setFilteredCases(filtered);
  }, [cases, filters]);

  const handleLogout = () => {
    console.log("🔓 CHECKER - Logging out user");
    adminAuthStorage.clearAuth();

    // Clear session storage and prevent back navigation
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);

      setTimeout(() => {
        window.removeEventListener("popstate", handlePopState);
      }, 1000);
    }

    navigate("/login", { replace: true });
  };

  const handleCaseClick = async (caseItem) => {
    try {
      console.log("🔍 CHECKER - Loading detailed case:", caseItem.caseId);

      const response = await ApiService.request(
        `/checker/cases/${caseItem.caseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminAuthStorage.getAuth().token}`,
          },
        }
      );

      setSelectedCase(response.case);
      setShowReviewModal(true);
    } catch (error) {
      console.error("❌ CHECKER - Error loading case details:", error);
      toast.error("Failed to load case details. Please try again.");
    }
  };

  const handleCaseAssignment = async (caseId) => {
    try {
      console.log("🔍 CHECKER - Assigning case to self:", caseId);

      await ApiService.request(`/checker/cases/${caseId}/assign-to-me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminAuthStorage.getAuth().token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: "Self-assigned for review",
        }),
      });

      toast.success("Case assigned to you successfully!");
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error("❌ CHECKER - Error assigning case:", error);
      toast.error("Failed to assign case. Please try again.");
    }
  };

  const handleCaseDecision = async (caseId, decision, data) => {
    try {
      console.log("🔍 CHECKER - Submitting case decision:", {
        caseId,
        decision,
        data,
      });

      const response = await ApiService.request(
        `/checker/cases/${caseId}/decision`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminAuthStorage.getAuth().token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            comments: data.comments,
            finalDamagePercentage: data.finalDamagePercentage,
            estimatedCost: data.estimatedCost,
            fieldNotes: data.fieldNotes,
          }),
        }
      );

      toast.success(`Case ${decision} successfully!`);
      setShowReviewModal(false);
      setSelectedCase(null);
      loadDashboardData(); // Reload data

      return response;
    } catch (error) {
      console.error("❌ CHECKER - Error submitting decision:", error);
      const errorMessage = error.message || "Failed to submit decision";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

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
          </div>
          <div className="header-right">
            <div className="view-toggle">
              <button
                className={`toggle-btn ${
                  activeView === "cards" ? "active" : ""
                }`}
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
      </header>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

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
                />
              ))
            ) : (
              <div className="no-cases">
                <i className="fas fa-clipboard-list"></i>
                <h3>No Cases Found</h3>
                <p>No cases match your current filters.</p>
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
          onAssignCase={handleCaseAssignment}
          currentCheckerId={user?.id}
        />
      )}
    </div>
  );
};

export default CheckerDashboard;
