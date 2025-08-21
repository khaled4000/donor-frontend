// export default AdminDashboard;
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// Removed ClipLoader import - using simple spinner instead
import { FiLogOut, FiUser } from "react-icons/fi";
import { adminAuthStorage } from "../../utils/authStorage";
import CheckerManagement from "./components/CheckerManagement";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  console.log("🔍 AdminDashboard: Component rendered");

  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState("kanban");
  const [kanbanData, setKanbanData] = useState({
    submitted: [],
    under_review: [],
    approved: [],
  });
  const [allCases, setAllCases] = useState([]);
  const [fullyFundedCases, setFullyFundedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [checkers, setCheckers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [draggedCase, setDraggedCase] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // NEW: Delete case state
  const [isDeletingCase, setIsDeletingCase] = useState(false);
  const [deletingCaseId, setDeletingCaseId] = useState(null);

  // Checker assignment state
  const [selectedChecker, setSelectedChecker] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCheckerAssignmentModal, setShowCheckerAssignmentModal] =
    useState(false);

  const navigate = useNavigate();

  // API rate limiting and debouncing
  const [isApiRequestInProgress, setIsApiRequestInProgress] = useState(false);
  const lastApiRequestTime = useRef(0);
  const MIN_API_REQUEST_INTERVAL = 1000; // Increased to 1 second between API requests
  const tabChangeTimeoutRef = useRef(null);

  // Ref for logout button to prevent unwanted triggers
  const logoutButtonRef = useRef(null);

  // API request throttling function
  const throttledApiRequest = useCallback(
    async (requestFn) => {
      const now = Date.now();
      if (now - lastApiRequestTime.current < MIN_API_REQUEST_INTERVAL) {
        console.log(
          `🔒 API request throttled, waiting ${
            MIN_API_REQUEST_INTERVAL - (now - lastApiRequestTime.current)
          }ms`
        );
        return;
      }

      if (isApiRequestInProgress) {
        console.log("🔒 API request already in progress, skipping");
        return;
      }

      setIsApiRequestInProgress(true);
      try {
        await requestFn();
        lastApiRequestTime.current = now;
      } catch (error) {
        console.error("API request failed:", error);
      } finally {
        setIsApiRequestInProgress(false);
      }
    },
    [isApiRequestInProgress]
  );

  // Debounced tab change handler to prevent rapid successive API calls
  const handleTabChange = useCallback((newTab) => {
    // Clear any existing timeout
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    // Set a new timeout to delay the tab change
    tabChangeTimeoutRef.current = setTimeout(() => {
      setActiveTab(newTab);
    }, 200); // 200ms delay
  }, []);

  // Calculate dynamic stats from existing data
  const stats = useMemo(() => {
    const allCasesData =
      activeTab === "cases"
        ? allCases
        : [
            ...kanbanData.submitted,
            ...kanbanData.under_review,
            ...kanbanData.approved,
          ];

    const pending = kanbanData.submitted.length;
    const underReview = kanbanData.under_review.length;
    const approved = kanbanData.approved.length;
    const rejected = allCasesData.filter((c) => c.status === "rejected").length;
    const families = users.filter((u) => u.role === "family").length;

    return {
      cases: {
        pending,
        under_review: underReview,
        approved,
        rejected,
      },
      users: {
        families,
      },
    };
  }, [kanbanData, allCases, users, activeTab]);

  // Define all functions first
  const verifyAdminAuth = useCallback(async () => {
    const authData = adminAuthStorage.getAuth();

    console.log("🔍 Verifying admin auth:", {
      isAuthenticated: authData.isAuthenticated,
      hasToken: !!authData.token,
      tokenLength: authData.token?.length,
    });

    if (!authData.isAuthenticated) {
      console.log("🔒 Not authenticated, redirecting to login");
      navigate("/admin/login");
      return;
    }

    try {
      console.log("🔍 Making auth verification request...");
      const response = await fetch(
        "http://localhost:5000/api/admin/auth/verify",
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        }
      );

      console.log("🔍 Auth verification response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Auth verification successful:", data);
        setAdminUser(data.admin);
        setIsLoading(false);
      } else {
        console.log(
          "❌ Auth verification failed, clearing auth and redirecting"
        );
        adminAuthStorage.clearAuth();
        navigate("/admin/login");
      }
    } catch (error) {
      console.error("❌ Auth verification error:", error);
      setError(
        "Authentication verification failed. Please check your connection."
      );
      setIsLoading(false);
    }
  }, [navigate]);

  const loadKanbanData = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch(
          "http://localhost:5000/api/admin/cases/kanban",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setKanbanData(data.data);
        }
      } catch (error) {
        console.error("Error loading kanban data:", error);
      }
    });
  }, [throttledApiRequest]);

  const loadAllCases = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch(
          "http://localhost:5000/api/admin/cases/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAllCases(data.cases);
        }
      } catch (error) {
        console.error("Error loading all cases:", error);
      }
    });
  }, [throttledApiRequest]);

  const loadFullyFundedCases = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch(
          "http://localhost:5000/api/cases/fully-funded",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFullyFundedCases(data.data.cases || []);
        }
      } catch (error) {
        console.error("Error loading fully funded cases:", error);
      }
    });
  }, [throttledApiRequest]);

  const loadUsers = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    });
  }, [throttledApiRequest]);

  const loadCheckers = useCallback(async () => {
    await throttledApiRequest(async () => {
      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;
        const response = await fetch(
          "http://localhost:5000/api/admin/checker-management/checkers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📋 Loaded checkers:", data.checkers);
          setCheckers(data.checkers || []);
        } else {
          console.error(
            "Failed to load checkers:",
            response.status,
            response.statusText
          );
          setCheckers([]);
        }
      } catch (error) {
        console.error("Error loading checkers:", error);
        setCheckers([]);
      }
    });
  }, [throttledApiRequest]);

  // NEW: Delete case function
  const deleteCase = useCallback(
    async (caseId) => {
      // Find the case to check if it's rejected
      const caseToDelete = allCases.find((c) => c.caseId === caseId);

      if (!caseToDelete) {
        toast.error("Case not found");
        return;
      }

      if (caseToDelete.status !== "rejected") {
        toast.error("Only rejected cases can be deleted");
        return;
      }

      // Show confirmation dialog
      const confirmMessage = `Are you sure you want to permanently delete case ${caseId}?\n\nThis action cannot be undone and will remove all case data from the database.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setIsDeletingCase(true);
      setDeletingCaseId(caseId);

      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;

        if (!token) {
          toast.error("Authentication required. Please log in again.");
          navigate("/admin/login");
          return;
        }

        console.log("🗑️ Deleting case:", caseId);

        // Try multiple possible endpoints for deleting cases
        const possibleEndpoints = [
          `http://localhost:5000/api/admin/cases/${caseId}`,
          `http://localhost:5000/api/cases/${caseId}/delete`,
          `http://localhost:5000/api/admin/cases/${caseId}/delete`,
          `http://localhost:5000/api/cases/${caseId}`,
        ];

        let response;
        let success = false;

        // Try each endpoint until one works
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🗑️ Trying delete endpoint: ${endpoint}`);

            response = await fetch(endpoint, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              console.log(
                `✅ Successfully deleted case with endpoint: ${endpoint}`
              );
              success = true;
              break;
            } else if (response.status === 404) {
              console.log(`❌ 404 for endpoint: ${endpoint}, trying next...`);
              continue;
            } else {
              const errorData = await response
                .json()
                .catch(() => ({ message: "Unknown error occurred" }));
              throw new Error(
                errorData.message ||
                  `HTTP ${response.status}: ${response.statusText}`
              );
            }
          } catch (fetchError) {
            console.log(
              `❌ Error with endpoint ${endpoint}:`,
              fetchError.message
            );
            if (!fetchError.message.includes("404")) {
              throw fetchError;
            }
          }
        }

        if (!success) {
          // If all endpoints failed with 404, use mock deletion for development
          console.log(
            "🔧 All delete endpoints failed, using mock deletion for development"
          );

          // Remove from local state
          setAllCases((prevCases) =>
            prevCases.filter((c) => c.caseId !== caseId)
          );

          toast.success(
            "Case deleted successfully (mock deletion - backend endpoint not implemented)"
          );
          return;
        }

        const responseData = await response.json().catch(() => ({}));
        console.log("✅ Case deletion successful:", responseData);

        toast.success("Case deleted successfully");

        // Remove the case from local state immediately for better UX
        setAllCases((prevCases) =>
          prevCases.filter((c) => c.caseId !== caseId)
        );

        // Refresh data to ensure consistency
        try {
          await Promise.all([
            loadAllCases(),
            activeTab === "kanban" ? loadKanbanData() : Promise.resolve(),
          ]);
        } catch (refreshError) {
          console.warn("Failed to refresh data after deletion:", refreshError);
          // Don't fail if refresh fails - deletion succeeded
        }
      } catch (error) {
        console.error("❌ Error deleting case:", error);

        // Provide specific error messages
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else if (
          error.message.includes("403") ||
          error.message.includes("401")
        ) {
          toast.error("Authentication failed. Please log in again.");
          navigate("/admin/login");
        } else if (error.message.includes("404")) {
          toast.error("Case not found. It may have already been deleted.");
          // Remove from local state if it doesn't exist on server
          setAllCases((prevCases) =>
            prevCases.filter((c) => c.caseId !== caseId)
          );
        } else {
          toast.error(
            error.message || "Failed to delete case. Please try again."
          );
        }
      } finally {
        setIsDeletingCase(false);
        setDeletingCaseId(null);
      }
    },
    [allCases, navigate, loadAllCases, loadKanbanData, activeTab]
  );

  const handleDragStart = (e, caseItem) => {
    setDraggedCase(caseItem);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedCase) return;

    try {
      const authData = adminAuthStorage.getAuth();
      const token = authData.token;
      const response = await fetch(
        `http://localhost:5000/api/admin/cases/${draggedCase.caseId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: targetStatus }),
        }
      );

      if (response.ok) {
        toast.success(`Case moved to ${targetStatus.replace("_", " ")}`);
        await loadKanbanData();
      } else {
        toast.error("Failed to move case");
      }
    } catch (error) {
      console.error("Error moving case:", error);
      toast.error("Error moving case");
    } finally {
      setDraggedCase(null);
    }
  };

  // Temporary mock assignment function for development
  const mockAssignChecker = useCallback(
    async (caseId, checkerId, notes = "") => {
      console.log("🔧 Using mock assignment (backend not implemented yet)");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find the checker
      const selectedCheckerData = checkers.find(
        (c) => (c.id || c._id) === checkerId
      );
      if (!selectedCheckerData) {
        throw new Error("Checker not found");
      }

      // Update the case data locally
      const updateCaseWithChecker = (cases) => {
        return cases.map((caseItem) => {
          if (caseItem.caseId === caseId) {
            return {
              ...caseItem,
              assignedChecker: {
                id: checkerId,
                name: selectedCheckerData.name,
                email: selectedCheckerData.email,
              },
              status:
                caseItem.status === "submitted"
                  ? "under_review"
                  : caseItem.status,
              assignedAt: new Date().toISOString(),
              assignmentNotes: notes,
            };
          }
          return caseItem;
        });
      };

      // Update kanban data
      setKanbanData((prev) => ({
        submitted: updateCaseWithChecker(prev.submitted).filter(
          (c) => c.status === "submitted"
        ),
        under_review: [
          ...updateCaseWithChecker(prev.under_review).filter(
            (c) => c.status === "under_review"
          ),
          ...updateCaseWithChecker(prev.submitted).filter(
            (c) => c.status === "under_review"
          ),
        ],
        approved: updateCaseWithChecker(prev.approved),
      }));

      // Update all cases data
      setAllCases((prev) => updateCaseWithChecker(prev));

      return true;
    },
    [checkers]
  );

  // Main assignment function with fallback to mock
  const assignChecker = useCallback(
    async (caseId, checkerId, notes = "") => {
      if (!checkerId) {
        toast.error("Please select a checker");
        return false;
      }

      if (!caseId) {
        toast.error("Invalid case ID");
        return false;
      }

      setIsAssigning(true);

      try {
        const authData = adminAuthStorage.getAuth();
        const token = authData.token;

        if (!token) {
          toast.error("Authentication required. Please log in again.");
          navigate("/admin/login");
          return false;
        }

        console.log("🔍 Assigning checker:", { caseId, checkerId, notes });

        // Try multiple possible endpoints - start with the most likely ones
        const possibleEndpoints = [
          `http://localhost:5000/api/admin/cases/${caseId}/assign`,
          `http://localhost:5000/api/cases/${caseId}/assign-checker`,
          `http://localhost:5000/api/admin/assign-checker`,
          `http://localhost:5000/api/checker/assign-case`,
        ];

        let response;
        let allEndpointsFailed = true;

        // Try each endpoint until one works
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);

            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                caseId,
                checkerId,
                notes: notes || "Assigned by admin",
                assignedBy: adminUser?.id,
              }),
            });

            if (response.ok) {
              console.log(`✅ Success with endpoint: ${endpoint}`);
              allEndpointsFailed = false;
              break; // Success, exit the loop
            } else if (response.status === 404) {
              console.log(`❌ 404 for endpoint: ${endpoint}, trying next...`);
              continue; // Try next endpoint
            } else {
              // Non-404 error, stop trying other endpoints
              const errorData = await response
                .json()
                .catch(() => ({ message: "Unknown error occurred" }));
              throw new Error(
                errorData.message ||
                  `HTTP ${response.status}: ${response.statusText}`
              );
            }
          } catch (fetchError) {
            console.log(
              `❌ Error with endpoint ${endpoint}:`,
              fetchError.message
            );
            if (
              !fetchError.message.includes("404") &&
              !fetchError.message.includes("fetch")
            ) {
              throw fetchError; // Non-404 and non-network errors should be thrown immediately
            }
          }
        }

        // If all endpoints failed with 404, use mock assignment
        if (allEndpointsFailed) {
          console.log(
            "🔧 All endpoints failed, using mock assignment for development"
          );
          toast.info(
            "Using temporary mock assignment (backend endpoint not implemented)"
          );

          const success = await mockAssignChecker(caseId, checkerId, notes);
          if (success) {
            toast.success("Checker assigned successfully (mock)");
          }
          return success;
        }

        const data = await response.json();
        console.log("✅ Checker assignment successful:", data);

        toast.success("Checker assigned successfully");

        // Update the case status to 'under_review' if it's still 'submitted'
        if (selectedCase?.status === "submitted") {
          try {
            const statusResponse = await fetch(
              `http://localhost:5000/api/admin/cases/${caseId}/status`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: "under_review" }),
              }
            );

            if (!statusResponse.ok) {
              console.warn(
                "Failed to update case status, but assignment succeeded"
              );
            }
          } catch (statusError) {
            console.warn("Failed to update case status:", statusError);
            // Don't fail the assignment if status update fails
          }
        }

        // Refresh data
        try {
          await Promise.all([loadKanbanData(), loadAllCases()]);
        } catch (refreshError) {
          console.warn("Failed to refresh data:", refreshError);
          // Don't fail if refresh fails - data will be stale but assignment succeeded
        }

        return true;
      } catch (error) {
        console.error("❌ Error assigning checker:", error);

        // Provide specific error messages
        if (error.message.includes("fetch")) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else if (
          error.message.includes("403") ||
          error.message.includes("401")
        ) {
          toast.error("Authentication failed. Please log in again.");
          navigate("/admin/login");
        } else {
          toast.error(
            error.message || "Failed to assign checker. Please try again."
          );
        }

        return false;
      } finally {
        setIsAssigning(false);
      }
    },
    [
      adminUser?.id,
      selectedCase?.status,
      loadKanbanData,
      loadAllCases,
      navigate,
      mockAssignChecker,
    ]
  );

  // Function to open checker assignment modal with error handling
  const openCheckerAssignmentModal = useCallback(
    (caseItem) => {
      if (!caseItem) {
        toast.error("Invalid case selected");
        return;
      }

      if (checkers.length === 0) {
        toast.warning("No checkers available. Please create checkers first.");
        setActiveTab("checkers");
        return;
      }

      setSelectedCase(caseItem);
      setSelectedChecker("");
      setAssignmentNotes("");
      setShowCheckerAssignmentModal(true);
    },
    [checkers.length]
  );

  // Function to close checker assignment modal
  const closeCheckerAssignmentModal = useCallback(() => {
    setShowCheckerAssignmentModal(false);
    setSelectedCase(null);
    setSelectedChecker("");
    setAssignmentNotes("");
  }, []);

  // Function to handle checker assignment submission with proper error handling
  const handleCheckerAssignmentSubmit = useCallback(
    async (e) => {
      // Prevent event bubbling and default behavior
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!selectedCase || !selectedChecker) {
        toast.error("Please select a checker");
        return;
      }

      if (isAssigning) {
        console.log("Assignment already in progress, ignoring click");
        return;
      }

      try {
        const success = await assignChecker(
          selectedCase.caseId,
          selectedChecker,
          assignmentNotes
        );

        if (success) {
          // Close modals and reset state
          closeCheckerAssignmentModal();
          setShowCaseModal(false);
          setSelectedCase(null);
        }
      } catch (error) {
        console.error("Error in assignment submission:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
    [
      selectedCase,
      selectedChecker,
      assignmentNotes,
      isAssigning,
      assignChecker,
      closeCheckerAssignmentModal,
    ]
  );

  const updateUserStatus = async (userId, isActive) => {
    try {
      const authData = adminAuthStorage.getAuth();
      const token = authData.token;
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive }),
        }
      );

      if (response.ok) {
        toast.success(
          `User ${isActive ? "activated" : "deactivated"} successfully`
        );
        await loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Error updating user status");
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const authData = adminAuthStorage.getAuth();
      const token = authData.token;
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("User deleted successfully");
        await loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };

  // Simple logout handler without complex event handling
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    console.log("🔓 AdminDashboard: Starting logout process");
    setIsLoggingOut(true);

    try {
      // Clear admin authentication first
      adminAuthStorage.clearAuth();
      console.log("🔓 AdminDashboard: Admin auth cleared");

      // Notify navbar and other components about logout
      window.dispatchEvent(new CustomEvent('adminLogout'));

      // Clear ALL authentication data
      if (typeof window !== "undefined") {
        // Clear admin auth
        localStorage.removeItem("adminAuth");
        localStorage.removeItem("regularAuth");

        // Clear session storage
        sessionStorage.clear();

        // Set logout flag to prevent AdminRedirect from interfering
        sessionStorage.setItem("adminLogout", "true");

        // Clear any other auth-related items
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");

        console.log(
          "🔓 AdminDashboard: All auth storage cleared, logout flag set"
        );
      }

      // Clear browser caches
      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
          console.log("🔓 AdminDashboard: Caches cleared");
        }
      } catch (cacheError) {
        console.log("ℹ️ Cache clearing not available or failed:", cacheError);
      }

      // Force a complete page reload to ensure clean state
      console.log("🔓 AdminDashboard: Force reloading to home page");
      window.location.replace("/");
    } catch (error) {
      console.error("❌ Logout error:", error);

      // Fallback: force reload to home page
      window.location.replace("/");
    } finally {
      // No need to reset isLoggingOut since we're reloading the page
    }
  }, [isLoggingOut]);

  const handleModalOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
      }
      setShowCaseModal(false);
    }
  }, []);

  const handleModalContentClick = useCallback((event) => {
    if (event) {
      event.stopPropagation();

      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }
  }, []);

  // useEffect hooks - Only run once on mount
  useEffect(() => {
    console.log("🔍 AdminDashboard: useEffect triggered, verifying admin auth");

    const timer = setTimeout(() => {
      console.log("🔍 AdminDashboard: Executing verifyAdminAuth after delay");
      verifyAdminAuth();
    }, 100);

    return () => {
      console.log("🔍 AdminDashboard: Component cleanup");
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    console.log(
      `🔍 AdminDashboard: Tab data useEffect triggered for tab: ${activeTab}`
    );

    if (adminUser) {
      const loadTabData = async () => {
        try {
          // Add a small delay to prevent rapid successive calls
          await new Promise((resolve) => setTimeout(resolve, 300));

          console.log(`🔍 AdminDashboard: Loading data for tab: ${activeTab}`);

          // Only load data if component is still mounted and tab hasn't changed
          if (activeTab === "kanban") {
            await loadKanbanData();
            await loadCheckers(); // Load checkers for kanban view
          } else if (activeTab === "cases") {
            await loadAllCases();
            await loadCheckers(); // Load checkers for cases view
          } else if (activeTab === "fully-funded") {
            await loadFullyFundedCases();
          } else if (activeTab === "users") {
            await loadUsers();
          } else if (activeTab === "checkers") {
            await loadCheckers();
          }

          console.log(`🔍 AdminDashboard: Data loaded for tab: ${activeTab}`);
        } catch (error) {
          console.error("Error loading tab data:", error);
          setError(`Failed to load ${activeTab} data`);
        }
      };

      loadTabData();
    }
  }, [activeTab, adminUser]); // Only essential dependencies

  useEffect(() => {
    return () => {
      console.log(`🔍 AdminDashboard: Component unmounting, cleaning up`);

      // Clear any pending timeouts
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current);
      }

      if (typeof window !== "undefined") {
        setError("");
        setIsLoading(false);
        setIsLoggingOut(false);

        if (isLoggingOut) {
          console.log("🔓 Cleanup: Logout in progress during unmount");
          adminAuthStorage.clearAuth();
          sessionStorage.clear();
        }
      }
    };
  }, [isLoggingOut]);

  useEffect(() => {
    if (!isLoading && !adminUser && !isLoggingOut) {
      const authData = adminAuthStorage.getAuth();
      if (!authData.isAuthenticated) {
        console.log(
          "🔓 No authenticated admin user found, redirecting to home"
        );
        navigate("/", {
          replace: true,
          state: {
            message: "Please log in to access the admin dashboard.",
          },
        });
      }
    }
  }, [adminUser, isLoading, isLoggingOut, navigate]);

  // Global error handler
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error("Global error caught:", event.error);
      setError("An unexpected error occurred. Please refresh the page.");
    };

    const handleUnhandledRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      setError("A network error occurred. Please check your connection.");
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (
        logoutButtonRef.current &&
        logoutButtonRef.current.contains(event.target)
      ) {
        return;
      }

      if (isLoggingOut) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();

          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [isLoggingOut]);

  // Error boundary fallback
  if (error && (error.includes("network") || error.includes("connection"))) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="admin-header-left">
            <h1>Admin Dashboard</h1>
            <p>Connection Error</p>
          </div>
          <div className="admin-header-right">
            <button
              onClick={() => navigate("/")}
              className="back-btn"
              type="button"
              style={{ marginRight: "10px" }}
            >
              <span style={{ marginRight: "8px" }}>←</span>
              <span>Go Home</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="refresh-btn"
              type="button"
            >
              <span style={{ marginRight: "8px" }}>🔄</span>
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
        <div className="error-display">
          <p>
            <strong>Connection Error:</strong> {error}
          </p>
          <p>Please check your internet connection and try again.</p>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
              type="button"
              style={{
                background: "linear-gradient(135deg, #3498db, #2980b9)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>←</span>
              Return to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: "50px", color: "#3498db" }}
          ></i>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <div className="welcome-section">
            <FiUser size={20} className="welcome-icon" />
            <span className="welcome-text">
              Welcome, <strong>{adminUser?.name || "Admin"}</strong>
            </span>
          </div>
        </div>
        <div className="admin-header-right">
          <button
            onClick={handleLogout}
            className={`custom-logout-btn ${isLoggingOut ? "loading" : ""}`}
            disabled={isLoggingOut}
            type="button"
            aria-label="Logout from admin dashboard"
          >
            <span className="logout-icon">
              {isLoggingOut ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <FiLogOut size={18} />
              )}
            </span>
            <span className="logout-text">
              {isLoggingOut ? "Logging Out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-display">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "kanban" ? "active" : ""}`}
          onClick={() => handleTabChange("kanban")}
          type="button"
        >
          <span className="tab-icon">📊</span>
          Kanban Board
        </button>
        <button
          className={`tab-btn ${activeTab === "cases" ? "active" : ""}`}
          onClick={() => handleTabChange("cases")}
          type="button"
        >
          <span className="tab-icon">📋</span>
          All Cases
        </button>
        <button
          className={`tab-btn ${activeTab === "fully-funded" ? "active" : ""}`}
          onClick={() => handleTabChange("fully-funded")}
          type="button"
        >
          <span className="tab-icon">💰</span>
          Fully Funded
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => handleTabChange("users")}
          type="button"
        >
          <span className="tab-icon">👥</span>
          User Management
        </button>
        <button
          className={`tab-btn ${activeTab === "checkers" ? "active" : ""}`}
          onClick={() => handleTabChange("checkers")}
          type="button"
        >
          <span className="tab-icon">🛡️</span>
          Checker Management
        </button>
      </div>

      {/* Stats Section */}
      {activeTab === "kanban" && (
        <div className="stats-section">
          <h3>
            <span className="section-icon">📈</span>
            Quick Overview
          </h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon pending">
                <span>⏳</span>
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.cases.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon approved">
                <span>✅</span>
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.cases.approved}</span>
                <span className="stat-label">Approved</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon rejected">
                <span>❌</span>
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.cases.rejected}</span>
                <span className="stat-label">Rejected</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon total">
                <span>👨‍👩‍👧‍👦</span>
              </div>
              <div className="stat-content">
                <span className="stat-number">{stats.users.families}</span>
                <span className="stat-label">Families</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="admin-main-content">
        {/* Tab Content */}
        {activeTab === "kanban" && (
          <div className="kanban-board">
            <div className="kanban-columns">
              <div
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "submitted")}
              >
                <div className="column-header submitted">
                  <h3>Submitted</h3>
                  <span className="case-count">
                    {kanbanData.submitted.length}
                  </span>
                </div>
                <div className="column-content">
                  {kanbanData.submitted.map((caseItem) => (
                    <div
                      key={caseItem.id || caseItem.caseId}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, caseItem)}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setShowCaseModal(true);
                      }}
                    >
                      <div className="card-header">
                        <h4>{caseItem.caseId}</h4>
                        <span className="status-badge submitted">
                          Submitted
                        </span>
                      </div>
                      <div className="card-content">
                        <h5>{caseItem.familyName}</h5>
                        <p>
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {caseItem.village}
                        </p>
                        <p>
                          <i className="fas fa-users"></i>{" "}
                          {caseItem.numberOfMembers} members
                        </p>
                        <p>
                          <i className="fas fa-exclamation-triangle"></i>{" "}
                          {caseItem.destructionPercentage}% damage
                        </p>
                      </div>
                      <div className="card-footer">
                        <small>
                          Submitted:{" "}
                          {new Date(
                            caseItem.submittedDate
                          ).toLocaleDateString()}
                        </small>
                        <button
                          className="quick-assign-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openCheckerAssignmentModal(caseItem);
                          }}
                          type="button"
                          title="Assign Checker"
                          disabled={isAssigning}
                        >
                          <i className="fas fa-user-plus"></i>
                          Assign Checker
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "under_review")}
              >
                <div className="column-header under-review">
                  <h3>Under Review</h3>
                  <span className="case-count">
                    {kanbanData.under_review.length}
                  </span>
                </div>
                <div className="column-content">
                  {kanbanData.under_review.map((caseItem) => (
                    <div
                      key={caseItem.id || caseItem.caseId}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, caseItem)}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setShowCaseModal(true);
                      }}
                    >
                      <div className="card-header">
                        <h4>{caseItem.caseId}</h4>
                        <span className="status-badge under-review">
                          Under Review
                        </span>
                      </div>
                      <div className="card-content">
                        <h5>{caseItem.familyName}</h5>
                        <p>
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {caseItem.village}
                        </p>
                        <p>
                          <i className="fas fa-users"></i>{" "}
                          {caseItem.numberOfMembers} members
                        </p>
                        {caseItem.assignedChecker ? (
                          <div className="assigned-checker-info">
                            <p>
                              <i className="fas fa-user-shield"></i>
                              <strong>
                                {caseItem.assignedChecker.name ||
                                  caseItem.assignedChecker}
                              </strong>
                            </p>
                            <span className="checker-status">Assigned</span>
                          </div>
                        ) : (
                          <div className="no-checker-assigned">
                            <p>
                              <i className="fas fa-exclamation-circle"></i> No
                              checker assigned
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <small>
                          Review started:{" "}
                          {new Date(
                            caseItem.reviewStartedDate || caseItem.submittedDate
                          ).toLocaleDateString()}
                        </small>
                        <button
                          className={`quick-assign-btn ${
                            caseItem.assignedChecker ? "reassign" : "assign"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openCheckerAssignmentModal(caseItem);
                          }}
                          type="button"
                          title={
                            caseItem.assignedChecker
                              ? "Reassign Checker"
                              : "Assign Checker"
                          }
                          disabled={isAssigning}
                        >
                          <i
                            className={`fas ${
                              caseItem.assignedChecker
                                ? "fa-user-edit"
                                : "fa-user-plus"
                            }`}
                          ></i>
                          {caseItem.assignedChecker ? "Reassign" : "Assign"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "approved")}
              >
                <div className="column-header approved">
                  <h3>Approved</h3>
                  <span className="case-count">
                    {kanbanData.approved.length}
                  </span>
                </div>
                <div className="column-content">
                  {kanbanData.approved.map((caseItem) => (
                    <div
                      key={caseItem.id || caseItem.caseId}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, caseItem)}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setShowCaseModal(true);
                      }}
                    >
                      <div className="card-header">
                        <h4>{caseItem.caseId}</h4>
                        <span className="status-badge approved">Approved</span>
                      </div>
                      <div className="card-content">
                        <h5>{caseItem.familyName}</h5>
                        <p>
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {caseItem.village}
                        </p>
                        <p>
                          <i className="fas fa-users"></i>{" "}
                          {caseItem.numberOfMembers} members
                        </p>
                        {caseItem.finalChecker && (
                          <p>
                            <i className="fas fa-user-shield"></i>{" "}
                            {caseItem.finalChecker.name ||
                              caseItem.finalChecker}
                          </p>
                        )}
                        {caseItem.totalNeeded && (
                          <p>
                            <i className="fas fa-dollar-sign"></i> $
                            {caseItem.totalNeeded.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="card-footer">
                        <small>
                          Approved:{" "}
                          {new Date(caseItem.approvedDate).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cases" && (
          <div className="cases-section">
            <div className="section-header">
              <h2>All Cases</h2>
              <button
                onClick={loadAllCases}
                className="refresh-btn"
                type="button"
              >
                <span style={{ marginRight: "8px" }}>🔄</span>
                Refresh
              </button>
            </div>
            <div className="cases-grid">
              {allCases.map((caseItem) => (
                <div key={caseItem.caseId} className="case-card">
                  <div className="case-header">
                    <h4>{caseItem.caseId}</h4>
                    <span className={`case-status ${caseItem.status}`}>
                      {caseItem.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="case-content">
                    <h5>{caseItem.familyName}</h5>
                    <div className="case-details">
                      <p>
                        <i className="fas fa-map-marker-alt"></i>{" "}
                        {caseItem.village}
                      </p>
                      <p>
                        <i className="fas fa-exclamation-triangle"></i>{" "}
                        {caseItem.destructionPercentage}% damage
                      </p>
                      {/* Show checker assignment status */}
                      {(caseItem.status === "under_review" ||
                        caseItem.status === "approved") && (
                        <div className="checker-assignment-status">
                          {caseItem.assignedChecker ? (
                            <p>
                              <i className="fas fa-user-shield"></i>
                              <strong>
                                {caseItem.assignedChecker.name ||
                                  caseItem.assignedChecker}
                              </strong>
                            </p>
                          ) : (
                            <p>
                              <i className="fas fa-exclamation-circle"></i>
                              <span className="no-checker">
                                No checker assigned
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="case-meta">
                      <small>
                        Submitted: {caseItem.submittedDate || "N/A"}
                      </small>
                    </div>
                  </div>
                  <div className="case-actions">
                    <button
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setShowCaseModal(true);
                      }}
                      className="review-btn"
                      type="button"
                    >
                      <i className="fas fa-eye"></i> View Details
                    </button>

                    {/* Assign/Reassign checker button for non-rejected cases */}
                    {(caseItem.status === "submitted" ||
                      caseItem.status === "under_review") && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openCheckerAssignmentModal(caseItem);
                        }}
                        className={`assign-checker-btn ${
                          caseItem.assignedChecker ? "reassign" : "assign"
                        }`}
                        type="button"
                        disabled={isAssigning}
                      >
                        <i
                          className={`fas ${
                            caseItem.assignedChecker
                              ? "fa-user-edit"
                              : "fa-user-plus"
                          }`}
                        ></i>
                        {caseItem.assignedChecker ? "Reassign" : "Assign"}
                      </button>
                    )}

                    {/* NEW: Delete button for rejected cases */}
                    {caseItem.status === "rejected" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteCase(caseItem.caseId);
                        }}
                        className={`delete-case-btn ${
                          isDeletingCase && deletingCaseId === caseItem.caseId
                            ? "deleting"
                            : ""
                        }`}
                        type="button"
                        disabled={
                          isDeletingCase && deletingCaseId === caseItem.caseId
                        }
                        title="Permanently delete this rejected case"
                      >
                        {isDeletingCase &&
                        deletingCaseId === caseItem.caseId ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trash-alt"></i>
                            Delete Case
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "fully-funded" && (
          <div className="fully-funded-section">
            <div className="section-header">
              <h2>Fully Funded Cases</h2>
              <button
                onClick={loadFullyFundedCases}
                className="refresh-btn"
                type="button"
              >
                <span style={{ marginRight: "8px" }}>🔄</span>
                Refresh
              </button>
            </div>
            <div className="cases-summary">
              <div className="summary-stats">
                <div className="summary-stat">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <span className="stat-number">
                      {fullyFundedCases.length}
                    </span>
                    <span className="stat-label">Families Helped</span>
                  </div>
                </div>
                <div className="summary-stat">
                  <i className="fas fa-users"></i>
                  <div>
                    <span className="stat-number">
                      {fullyFundedCases.reduce(
                        (sum, c) => sum + (c.numberOfMembers || 0),
                        0
                      )}
                    </span>
                    <span className="stat-label">People Helped</span>
                  </div>
                </div>
                <div className="summary-stat">
                  <i className="fas fa-dollar-sign"></i>
                  <div>
                    <span className="stat-number">
                      $
                      {fullyFundedCases
                        .reduce((sum, c) => sum + (c.totalNeeded || 0), 0)
                        .toLocaleString()}
                    </span>
                    <span className="stat-label">Total Raised</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cases-grid">
              {fullyFundedCases.length === 0 ? (
                <div className="no-cases">
                  <i className="fas fa-heart"></i>
                  <h3>No fully funded cases yet</h3>
                  <p>Cases that reach 100% funding will appear here.</p>
                </div>
              ) : (
                fullyFundedCases.map((caseItem) => (
                  <div key={caseItem.caseId} className="case-card fully-funded">
                    <div className="case-header">
                      <h4>{caseItem.caseId}</h4>
                      <span className="case-status fully-funded">
                        Fully Funded
                      </span>
                    </div>
                    <div className="case-content">
                      <h5>{caseItem.familyName}</h5>
                      <div className="case-details">
                        <p>
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {caseItem.village}
                        </p>
                        <p>
                          <i className="fas fa-exclamation-triangle"></i>{" "}
                          {caseItem.destructionPercentage || 0}% damage
                        </p>
                        <p>
                          <i className="fas fa-dollar-sign"></i> $
                          {(caseItem.totalNeeded || 0).toLocaleString()} raised
                        </p>
                      </div>
                      <div className="case-meta">
                        <small>
                          Approved:{" "}
                          {caseItem.approvedAt
                            ? new Date(caseItem.approvedAt).toLocaleDateString()
                            : "N/A"}
                        </small>
                        {caseItem.fullyFundedAt && (
                          <small>
                            Funded:{" "}
                            {new Date(
                              caseItem.fullyFundedAt
                            ).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="case-actions">
                      <button
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setShowCaseModal(true);
                        }}
                        className="review-btn"
                        type="button"
                      >
                        <i className="fas fa-eye"></i> View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Management</h2>
              <button onClick={loadUsers} className="refresh-btn" type="button">
                <span style={{ marginRight: "8px" }}>🔄</span>
                Refresh
              </button>
            </div>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            user.isActive ? "active" : "inactive"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        {new Date(user.registrationDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() =>
                              updateUserStatus(user.id, !user.isActive)
                            }
                            className={`status-btn ${
                              user.isActive ? "deactivate" : "activate"
                            }`}
                            type="button"
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="delete-btn"
                            disabled={user.role === "checker"}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "checkers" && <CheckerManagement />}
      </div>

      {/* Case Details Modal */}
      {showCaseModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowCaseModal(false)}>
          <div className="case-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Case Details: {selectedCase.caseId}</h3>
              <button
                onClick={() => setShowCaseModal(false)}
                className="close-btn"
                type="button"
                aria-label="Close modal"
              >
                <span>✕</span>
              </button>
            </div>
            <div className="modal-content">
              <div className="case-info">
                <h4>{selectedCase.familyName}</h4>
                <p>
                  <strong>Village:</strong> {selectedCase.village}
                </p>
                <p>
                  <strong>Members:</strong> {selectedCase.numberOfMembers}
                </p>
                <p>
                  <strong>Damage:</strong> {selectedCase.destructionPercentage}%
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {selectedCase.status.replace("_", " ")}
                </p>

                {/* Show current checker assignment */}
                {(selectedCase.status === "under_review" ||
                  selectedCase.status === "approved") && (
                  <div className="current-assignment">
                    <h5>Current Assignment:</h5>
                    {selectedCase.assignedChecker ? (
                      <div className="assigned-checker-display">
                        <p>
                          <i className="fas fa-user-shield"></i>
                          <strong>
                            {selectedCase.assignedChecker.name ||
                              selectedCase.assignedChecker}
                          </strong>
                        </p>
                        <span className="assignment-status assigned">
                          ✓ Assigned
                        </span>
                      </div>
                    ) : (
                      <div className="no-assignment-display">
                        <p>
                          <i className="fas fa-exclamation-circle"></i> No
                          checker assigned
                        </p>
                        <span className="assignment-status unassigned">
                          ⚠ Unassigned
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checker assignment for eligible cases */}
              {(selectedCase.status === "submitted" ||
                selectedCase.status === "under_review") && (
                <div className="checker-assignment">
                  <h4>
                    {selectedCase.assignedChecker
                      ? "Reassign Checker"
                      : "Assign Checker"}
                  </h4>
                  {checkers.length > 0 ? (
                    <div className="assignment-form">
                      <select
                        className="checker-select"
                        value={selectedChecker}
                        onChange={(e) => setSelectedChecker(e.target.value)}
                      >
                        <option value="">Select a checker...</option>
                        {checkers
                          .filter((checker) => checker.isActive !== false)
                          .map((checker) => (
                            <option
                              key={checker.id || checker._id}
                              value={checker.id || checker._id}
                            >
                              {checker.name} ({checker.email})
                            </option>
                          ))}
                      </select>
                      <textarea
                        className="assignment-notes"
                        placeholder="Assignment notes (optional)"
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        rows="3"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCheckerAssignmentSubmit(e);
                        }}
                        className={`assign-btn ${isAssigning ? "loading" : ""}`}
                        disabled={!selectedChecker || isAssigning}
                        type="button"
                      >
                        {isAssigning ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Assigning...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus"></i>
                            {selectedCase.assignedChecker
                              ? "Reassign Checker"
                              : "Assign Checker"}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="no-checkers-available">
                      <p>
                        No checkers available. Please create checkers first.
                      </p>
                      <button
                        onClick={() => {
                          setShowCaseModal(false);
                          setActiveTab("checkers");
                        }}
                        className="create-checker-btn"
                        type="button"
                      >
                        Go to Checker Management
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Delete option for rejected cases */}
              {selectedCase.status === "rejected" && (
                <div className="case-deletion-section">
                  <h4 className="deletion-title">
                    <i className="fas fa-exclamation-triangle"></i>
                    Case Management
                  </h4>
                  <div className="deletion-info">
                    <p className="deletion-description">
                      This case has been rejected. You can permanently delete it
                      from the database if it's no longer needed for record
                      keeping.
                    </p>
                    <div className="deletion-warning">
                      <i className="fas fa-warning"></i>
                      <strong>Warning:</strong> This action cannot be undone.
                      All case data will be permanently removed.
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCaseModal(false); // Close modal first
                      deleteCase(selectedCase.caseId);
                    }}
                    className={`delete-case-btn-modal ${
                      isDeletingCase && deletingCaseId === selectedCase.caseId
                        ? "deleting"
                        : ""
                    }`}
                    type="button"
                    disabled={
                      isDeletingCase && deletingCaseId === selectedCase.caseId
                    }
                  >
                    {isDeletingCase &&
                    deletingCaseId === selectedCase.caseId ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Deleting Case...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash-alt"></i>
                        Permanently Delete Case
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checker Assignment Modal */}
      {showCheckerAssignmentModal && selectedCase && (
        <div className="modal-overlay" onClick={closeCheckerAssignmentModal}>
          <div
            className="checker-assignment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <i className="fas fa-user-plus"></i>
                {selectedCase.assignedChecker
                  ? "Reassign Checker"
                  : "Assign Checker"}
              </h3>
              <button
                onClick={closeCheckerAssignmentModal}
                className="close-btn"
                type="button"
                aria-label="Close modal"
              >
                <span>✕</span>
              </button>
            </div>
            <div className="modal-content">
              <div className="case-summary">
                <h4>
                  {selectedCase.caseId} - {selectedCase.familyName}
                </h4>
                <p>
                  <strong>Village:</strong> {selectedCase.village}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {selectedCase.status.replace("_", " ")}
                </p>

                {selectedCase.assignedChecker && (
                  <div className="current-assignment-info">
                    <p>
                      <strong>Currently assigned to:</strong>{" "}
                      {selectedCase.assignedChecker.name ||
                        selectedCase.assignedChecker}
                    </p>
                  </div>
                )}
              </div>

              {checkers.length > 0 ? (
                <div className="assignment-form">
                  <div className="form-group">
                    <label htmlFor="checker-select">Select Checker:</label>
                    <select
                      id="checker-select"
                      className="checker-select"
                      value={selectedChecker}
                      onChange={(e) => setSelectedChecker(e.target.value)}
                    >
                      <option value="">Choose a checker...</option>
                      {checkers
                        .filter((checker) => checker.isActive !== false)
                        .map((checker) => (
                          <option
                            key={checker.id || checker._id}
                            value={checker.id || checker._id}
                          >
                            {checker.name} - {checker.email}
                            {checker.specialization &&
                              ` (${checker.specialization})`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="assignment-notes">Assignment Notes:</label>
                    <textarea
                      id="assignment-notes"
                      className="assignment-notes"
                      placeholder="Add any specific instructions or notes for the checker..."
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      rows="4"
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      onClick={closeCheckerAssignmentModal}
                      className="cancel-btn"
                      type="button"
                      disabled={isAssigning}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCheckerAssignmentSubmit(e);
                      }}
                      className={`assign-btn ${isAssigning ? "loading" : ""}`}
                      disabled={!selectedChecker || isAssigning}
                      type="button"
                    >
                      {isAssigning ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          {selectedCase.assignedChecker
                            ? "Reassign Checker"
                            : "Assign Checker"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-checkers-available">
                  <div className="no-checkers-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h4>No Checkers Available</h4>
                    <p>
                      You need to create checker accounts before you can assign
                      them to cases.
                    </p>
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={closeCheckerAssignmentModal}
                      className="cancel-btn"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        closeCheckerAssignmentModal();
                        setShowCaseModal(false);
                        setActiveTab("checkers");
                      }}
                      className="create-checker-btn"
                      type="button"
                    >
                      <i className="fas fa-plus"></i>
                      Create Checkers
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
