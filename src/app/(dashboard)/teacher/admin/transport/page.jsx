"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/ui/Button";
import {
  FaBus,
  FaTimes,
  FaTimesCircle,
  FaInfoCircle,
  FaUserPlus,
} from "react-icons/fa";
import {
  getTeacherTransportMeta,
  getTeacherTransportRoutes,
  createTeacherTransportRoute,
  getTeacherTransportLive,
  updateTeacherTransportRoute,
  toggleTeacherTransportRouteStatus,
  deleteTeacherTransportRoute,
  getTeacherTransportAssignments,
  assignTeacherTransportStudent,
  unassignTeacherTransportStudent,
  getTeacherTransportRoutesReport,
  getTeacherTransportAssignmentsReport,
  deleteTeacherTransportAssignment,
} from "@/features/teachers/services/teacher.service";
import { toast } from "sonner";

export default function TeacherTransportManagementPage() {
  const { user } = useSelector((state) => state.auth);
  const { profile: teacherProfile } = useSelector((state) => state.teachers || {});

  const [activeTab, setActiveTab] = useState("manage"); // "manage" | "routes_report" | "assignments_report" | "live"
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Core Data States
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [liveBuses, setLiveBuses] = useState([]);
  const iframeRef = useRef(null);

  // Create / Edit Route Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [routeFee, setRouteFee] = useState("1000");
  const [feeFrequency, setFeeFrequency] = useState("monthly");
  const [routeStops, setRouteStops] = useState("");
  const [gpsDeviceId, setGpsDeviceId] = useState("");

  // Assign Student Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRouteId, setAssignRouteId] = useState("");
  const [assignStudentId, setAssignStudentId] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [assignFee, setAssignFee] = useState(true);
  const [autoAssignMonthly, setAutoAssignMonthly] = useState(true);

  // Filters State (Report tabs)
  const [routesStatusFilter, setRoutesStatusFilter] = useState("all");
  const [routesSearchQuery, setRoutesSearchQuery] = useState("");
  const [routesFilteredList, setRoutesFilteredList] = useState([]);

  const [assignRouteFilter, setAssignRouteFilter] = useState("all");
  const [assignFeeFilter, setAssignFeeFilter] = useState("all");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [assignFilteredList, setAssignFilteredList] = useState([]);

  const [routesReportStats, setRoutesReportStats] = useState(null);
  const [assignmentsReportStats, setAssignmentsReportStats] = useState(null);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          margin: 0; padding: 0; width: 100%; height: 100%; font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([26.9124, 75.7873], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const markers = {};

        function updateMarkers(buses) {
          Object.keys(markers).forEach(id => {
            markers[id].remove();
            delete markers[id];
          });

          const points = [];
          buses.forEach(bus => {
            if (!bus.latitude || !bus.longitude) return;
            const lat = parseFloat(bus.latitude);
            const lng = parseFloat(bus.longitude);
            points.push([lat, lng]);

            const popupContent = \`
              <div style="font-size: 11.5px; line-height: 1.4;">
                <b style="font-size: 12.5px; color: #1e1b4b; display: block; margin-bottom: 4px;">\${bus.name || 'Active Route'}</b>
                <span style="color: #6b7280; font-weight: 700;">Vehicle:</span> \${bus.vehicle_number}<br/>
                <span style="color: #6b7280; font-weight: 700;">Driver:</span> \${bus.driver_name}<br/>
                <span style="color: #6b7280; font-weight: 700;">Phone:</span> \${bus.driver_phone || 'N/A'}<br/>
                <span style="color: #6b7280; font-weight: 700;">Status:</span> Live Location
              </div>
            \`;

            const marker = L.circleMarker([lat, lng], {
              radius: 9,
              color: '#ffffff',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              weight: 2.5
            }).addTo(map)
              .bindPopup(popupContent);
            markers[bus.id] = marker;
          });

          if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }
        }

        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'update_buses') {
            updateMarkers(event.data.buses);
          } else if (event.data && event.data.type === 'focus_bus') {
            const { lat, lng } = event.data;
            map.setView([parseFloat(lat), parseFloat(lng)], 16);
          }
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (activeTab === "live" && iframeRef.current?.contentWindow) {
      const t = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "update_buses", buses: liveBuses },
          "*"
        );
      }, 350);
      return () => clearTimeout(t);
    }
  }, [liveBuses, activeTab]);

  const handleFocusBusOnMap = (bus) => {
    if (iframeRef.current?.contentWindow && bus.latitude && bus.longitude) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "focus_bus",
          lat: bus.latitude,
          lng: bus.longitude,
        },
        "*"
      );
    }
  };

  const hasPermission = () => {
    const checkValue = (obj) => {
      if (!obj) return false;
      if (
        obj.can_manage_transport === true ||
        obj.can_manage_transport === "true" ||
        obj.can_manage_transport === 1 ||
        obj.can_manage_transport === "1" ||
        obj.can_manage_transport === "yes"
      )
        return true;
      if (
        Array.isArray(obj.enabled_features) &&
        obj.enabled_features.includes("transport")
      )
        return true;
      if (obj.teacher && checkValue(obj.teacher)) return true;
      if (obj.teacher_profile && checkValue(obj.teacher_profile)) return true;
      if (obj.profile && checkValue(obj.profile)) return true;
      return false;
    };
    return checkValue(user) || checkValue(teacherProfile);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const metaRes = await getTeacherTransportMeta();
      setStudents(metaRes?.students || metaRes?.data?.students || []);

      const routesRes = await getTeacherTransportRoutes();
      const loadedRoutes =
        routesRes?.routes ||
        routesRes?.data ||
        (Array.isArray(routesRes) ? routesRes : []);
      setRoutes(loadedRoutes);
      setRoutesFilteredList(loadedRoutes);

      const assignRes = await getTeacherTransportAssignments();
      const loadedAssignments = assignRes?.assignments || assignRes?.data || [];
      setAssignments(loadedAssignments);
      setAssignFilteredList(loadedAssignments);

      const liveRes = await getTeacherTransportLive();
      setLiveBuses(liveRes?.buses || liveRes?.data || []);

      try {
        const routesReportRes = await getTeacherTransportRoutesReport();
        if (routesReportRes?.success) {
          setRoutesReportStats(routesReportRes.stats);
        }
        const assignmentsReportRes = await getTeacherTransportAssignmentsReport();
        if (assignmentsReportRes?.success) {
          setAssignmentsReportStats(assignmentsReportRes.stats);
        }
      } catch (repErr) {
        console.error("Failed to load transport reports stats:", repErr);
      }
    } catch (err) {
      if (
        err?.status === 403 ||
        err?.statusCode === 403 ||
        (err?.message && err.message.includes("403"))
      ) {
        setForbidden(true);
      } else {
        toast.error("Failed to load transport records: " + (err?.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasPermission()) {
      setForbidden(true);
      setLoading(false);
    } else {
      loadData();
    }
  }, [user, teacherProfile]);

  useEffect(() => {
    if (activeTab !== "live" || forbidden || loading) return;
    refreshLiveBuses();
    const interval = setInterval(refreshLiveBuses, 10000);
    return () => clearInterval(interval);
  }, [activeTab, forbidden, loading]);

  const refreshRoutes = async () => {
    try {
      setListLoading(true);
      const res = await getTeacherTransportRoutes();
      const list = res?.routes || res?.data || (Array.isArray(res) ? res : []);
      setRoutes(list);
      applyRoutesFilters(list, routesStatusFilter, routesSearchQuery);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const refreshAssignments = async () => {
    try {
      setListLoading(true);
      const res = await getTeacherTransportAssignments();
      const list = res?.assignments || res?.data || [];
      setAssignments(list);
      applyAssignmentsFilters(
        list,
        assignRouteFilter,
        assignFeeFilter,
        assignSearchQuery
      );
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const refreshLiveBuses = async () => {
    try {
      const liveRes = await getTeacherTransportLive();
      setLiveBuses(liveRes?.buses || liveRes?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const applyRoutesFilters = (list, status, query) => {
    let filtered = [...list];
    if (status !== "all") {
      const targetActive = status === "active";
      filtered = filtered.filter((r) => r.is_active === targetActive);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.vehicle_number?.toLowerCase().includes(q) ||
          r.driver_name?.toLowerCase().includes(q)
      );
    }
    setRoutesFilteredList(filtered);
  };

  const handleRoutesFilterSubmit = (e) => {
    e.preventDefault();
    applyRoutesFilters(routes, routesStatusFilter, routesSearchQuery);
  };

  const applyAssignmentsFilters = (list, routeId, feeStatus, query) => {
    let filtered = [...list];
    if (routeId !== "all") {
      filtered = filtered.filter((a) => a.transport_route_id === routeId);
    }
    if (feeStatus !== "all") {
      filtered = filtered.filter((a) => {
        if (feeStatus === "pending")
          return a.fee_status?.toLowerCase() === "pending" || !a.is_paid;
        if (feeStatus === "paid")
          return a.fee_status?.toLowerCase() === "paid" || a.is_paid;
        return true;
      });
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.student_name?.toLowerCase().includes(q) ||
          a.admission_no?.toLowerCase().includes(q) ||
          a.pickup_point?.toLowerCase().includes(q)
      );
    }
    setAssignFilteredList(filtered);
  };

  const handleAssignmentsFilterSubmit = (e) => {
    e.preventDefault();
    applyAssignmentsFilters(
      assignments,
      assignRouteFilter,
      assignFeeFilter,
      assignSearchQuery
    );
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    if (!routeName.trim() || !vehicleNumber.trim() || !driverName.trim()) {
      toast.error("Route name, vehicle number, and driver details are required.");
      return;
    }

    try {
      setListLoading(true);
      const payload = {
        name: routeName.trim(),
        vehicle_number: vehicleNumber.trim(),
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
        fee: parseFloat(routeFee) || 0,
        fee_frequency: feeFrequency,
        stops: routeStops.trim(),
        gps_device_id: gpsDeviceId.trim(),
        is_active: true,
      };

      if (editingRouteId) {
        const res = await updateTeacherTransportRoute(editingRouteId, payload);
        if (res.success) {
          toast.success(res.message || "Route updated successfully!");
        }
      } else {
        const res = await createTeacherTransportRoute(payload);
        if (res.success) {
          toast.success(res.message || "Route created successfully!");
        }
      }

      setIsRouteModalOpen(false);
      refreshRoutes();
    } catch (err) {
      toast.error("Failed to save route: " + (err?.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenEditRoute = (route) => {
    setEditingRouteId(route.id);
    setRouteName(route.name || "");
    setVehicleNumber(route.vehicle_number || "");
    setDriverName(route.driver_name || "");
    setDriverPhone(route.driver_phone || "");
    setRouteFee(route.fee?.toString() || "1000");
    setFeeFrequency(route.fee_frequency || "monthly");
    setRouteStops(route.stops || "");
    setGpsDeviceId(route.gps_device_id || "");
    setIsRouteModalOpen(true);
  };

  const handleOpenCreateRoute = () => {
    setEditingRouteId(null);
    setRouteName("");
    setVehicleNumber("");
    setDriverName("");
    setDriverPhone("");
    setRouteFee("1000");
    setFeeFrequency("monthly");
    setRouteStops("");
    setGpsDeviceId("");
    setIsRouteModalOpen(true);
  };

  const handleToggleStatus = async (routeId) => {
    try {
      setListLoading(true);
      const res = await toggleTeacherTransportRouteStatus(routeId);
      if (res.success) {
        toast.success(res.message || "Route status toggled.");
        refreshRoutes();
      }
    } catch (err) {
      toast.error("Failed to toggle status: " + (err?.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (
      !confirm(
        "Are you sure you want to delete this route? This action cannot be undone."
      )
    )
      return;
    try {
      setListLoading(true);
      const res = await deleteTeacherTransportRoute(routeId);
      if (res.success) {
        toast.success(res.message || "Route deleted.");
        refreshRoutes();
      }
    } catch (err) {
      toast.error("Failed to delete route: " + (err?.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleAssignStudentSubmit = async (e) => {
    e.preventDefault();
    if (!assignRouteId || !assignStudentId) {
      toast.error("Please select both a student and a route.");
      return;
    }

    try {
      setListLoading(true);
      const res = await assignTeacherTransportStudent({
        student_id: assignStudentId,
        transport_route_id: assignRouteId,
        pickup_point: pickupPoint.trim(),
        assign_fee: assignFee,
        auto_assign_monthly: autoAssignMonthly,
      });
      if (res.success) {
        toast.success(res.message || "Student assigned successfully!");
        setIsAssignModalOpen(false);
        setAssignStudentId("");
        setAssignRouteId("");
        setPickupPoint("");
        refreshAssignments();
      }
    } catch (err) {
      toast.error("Failed to assign student: " + (err?.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const handleUnassignStudent = async (assignmentId, studentId, routeId) => {
    if (!confirm("Are you sure you want to delete this student assignment?"))
      return;
    try {
      setListLoading(true);
      let res;
      if (assignmentId) {
        res = await deleteTeacherTransportAssignment(assignmentId);
      } else {
        res = await unassignTeacherTransportStudent({
          student_id: studentId,
          transport_route_id: routeId,
        });
      }
      if (res?.success) {
        toast.success(res.message || "Assignment deleted.");
        refreshAssignments();
      }
    } catch (err) {
      toast.error("Failed to delete assignment: " + (err?.message || err));
    } finally {
      setListLoading(false);
    }
  };

  const routesCount = routesReportStats?.total_routes || routes.length;
  const activeStudentsCount =
    assignmentsReportStats?.total_assignments || assignments.length;
  const busesWithFeeCount =
    routesReportStats?.routes_with_fee ||
    routes.filter((r) => r.fee > 0).length;

  const totalMonthlyFeeAmount = useMemo(() => {
    if (
      routesReportStats?.fee_total !== undefined &&
      routesReportStats?.fee_total !== null
    ) {
      return routesReportStats.fee_total;
    }
    const activeRouteIds = routes.filter((r) => r.is_active).map((r) => r.id);
    return assignments
      .filter((a) => activeRouteIds.includes(a.transport_route_id))
      .reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0);
  }, [routes, assignments, routesReportStats]);

  const pendingFeeTotal = useMemo(() => {
    if (
      assignmentsReportStats?.pending_amount !== undefined &&
      assignmentsReportStats?.pending_amount !== null
    ) {
      return assignmentsReportStats.pending_amount;
    }
    return assignments
      .filter((a) => !a.is_paid && a.fee_status?.toLowerCase() !== "paid")
      .reduce((sum, a) => sum + (parseFloat(a.fee) || 0), 0);
  }, [assignments, assignmentsReportStats]);

  const liveBusesOnlineCount = liveBuses.filter(
    (b) => b.has_location || (b.latitude && b.longitude)
  ).length;
  const liveBusesOfflineCount = liveBuses.length - liveBusesOnlineCount;

  if (loading) return <PageLoader />;

  if (forbidden) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto text-xs">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
          <FaTimesCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Access Restricted
          </h2>
          <p className="text-zinc-600 mt-2 text-xs leading-relaxed font-medium">
            You do not have permission to access the Transport Management Workspace. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-xs text-zinc-700">
      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("manage")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "manage"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          Manage
        </button>
        <button
          onClick={() => setActiveTab("routes_report")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "routes_report"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          Routes Report
        </button>
        <button
          onClick={() => setActiveTab("assignments_report")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "assignments_report"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          Assignments Report
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === "live"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/60 rounded-t-lg"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          Live Map
        </button>
      </div>

      {/* 1. MANAGE TAB */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div>
              <h1 className="text-sm font-bold text-zinc-900">Transport Management</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                Control routes and assign students. Fee auto assigns on monthly design.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleOpenCreateRoute}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm"
              >
                Add Route
              </Button>
              <Button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs px-3.5 py-1.5 rounded-lg border border-zinc-300"
              >
                Assign Student
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Routes
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {routesCount}
              </span>
              <span
                className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer block pt-1"
                onClick={() => setActiveTab("routes_report")}
              >
                View routes report →
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Active Passengers
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {activeStudentsCount}
              </span>
              <span
                className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer block pt-1"
                onClick={() => setActiveTab("assignments_report")}
              >
                View passengers report →
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Buses with Fee
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {busesWithFeeCount}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium block pt-1">
                Active tariff enabled
              </span>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FaInfoCircle className="text-indigo-600" /> Quick Tips
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 font-medium">
              <li>
                Use <span className="font-semibold text-zinc-900">Add Route</span> to create a bus route with monthly/yearly fee.
              </li>
              <li>
                Use <span className="font-semibold text-zinc-900">Assign Student</span> to put a student on a route — fee bills automatically to their ledger.
              </li>
              <li>
                Open <span className="font-semibold text-zinc-900">Routes Report / Assignments Report</span> tabs to view rosters, filter records, or download spreadsheets.
              </li>
              <li>
                Driver operator logins on <span className="font-semibold text-zinc-900">/driver</span> initializes automatic trip tracking using GPS signals.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. ROUTES REPORT TAB */}
      {activeTab === "routes_report" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm">
            <div>
              <h1 className="text-sm font-bold text-zinc-900">Routes Report</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                All bus routes with fee and student strength.
              </p>
            </div>

            <form
              onSubmit={handleRoutesFilterSubmit}
              className="flex flex-wrap items-end gap-2 w-full sm:w-auto"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Status
                </span>
                <select
                  value={routesStatusFilter}
                  onChange={(e) => setRoutesStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 bg-white outline-none"
                >
                  <option value="all">All</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="space-y-1 w-44">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Search
                </span>
                <input
                  type="text"
                  placeholder="Route / Vehicle / Driver"
                  value={routesSearchQuery}
                  onChange={(e) => setRoutesSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs outline-none bg-white text-zinc-800 placeholder-zinc-400"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Total Routes
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {routesCount}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Active Passengers
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {activeStudentsCount}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Monthly Fee Total
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                ₹{totalMonthlyFeeAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm relative overflow-hidden">
            {listLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center">
                <PageLoader />
              </div>
            )}

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Stops</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {routesFilteredList.length > 0 ? (
                    routesFilteredList.map((route) => (
                      <tr key={route.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-semibold text-zinc-900">
                          <div>{route.name}</div>
                          <span className="block text-[10px] text-zinc-500 font-mono mt-0.5 font-normal">
                            {route.vehicle_number} • Driver: {route.driver_name} ({route.driver_phone || "—"})
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-zinc-900">
                          ₹{route.fee?.toLocaleString()}
                        </td>
                        <td className="p-3 uppercase text-[10px] text-zinc-500 font-bold">
                          {route.fee_frequency}
                        </td>
                        <td className="p-3 font-bold text-indigo-600">
                          {route.students_count || route.students?.length || 0}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${route.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                          >
                            {route.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500 max-w-[200px] truncate">
                          {route.stops || "—"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditRoute(route)}
                              className="px-2 py-1 text-zinc-700 hover:text-indigo-600 border border-zinc-200 rounded hover:bg-zinc-50 font-bold text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(route.id)}
                              className={`px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50 font-bold text-[11px] ${route.is_active ? "text-rose-600" : "text-emerald-600"
                                }`}
                            >
                              {route.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(route.id)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-zinc-200 rounded font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8">
                        <EmptyState
                          title="No Routes Match Filters"
                          desc="Change status or query parameters."
                          icon={FaBus}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ASSIGNMENTS REPORT TAB */}
      {activeTab === "assignments_report" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm">
            <div>
              <h1 className="text-sm font-bold text-zinc-900">Assignments Report</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Students assigned to transport routes with fee status.
              </p>
            </div>

            <form
              onSubmit={handleAssignmentsFilterSubmit}
              className="flex flex-wrap items-end gap-2 w-full sm:w-auto"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Route
                </span>
                <select
                  value={assignRouteFilter}
                  onChange={(e) => setAssignRouteFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 bg-white outline-none"
                >
                  <option value="all">All routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Fee Status
                </span>
                <select
                  value={assignFeeFilter}
                  onChange={(e) => setAssignFeeFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 bg-white outline-none"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="space-y-1 w-44">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Search
                </span>
                <input
                  type="text"
                  placeholder="Student / ID / Pickup"
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs outline-none bg-white text-zinc-800 placeholder-zinc-400"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Assigned Students
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {activeStudentsCount}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                With Fee Bill
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                {assignments.filter((a) => a.assign_fee || a.fee > 0).length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Pending Fee Amount
              </span>
              <span className="text-xl font-black text-zinc-900 block">
                ₹{pendingFeeTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm relative overflow-hidden">
            {listLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center">
                <PageLoader />
              </div>
            )}

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Pickup</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Auto Month</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned On</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {assignFilteredList.length > 0 ? (
                    assignFilteredList.map((assign) => (
                      <tr key={assign.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-semibold text-zinc-900">
                          <div>{assign.student_name}</div>
                          <span className="block text-[10px] text-zinc-400 font-mono mt-0.5 font-normal">
                            {assign.admission_no || "—"}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-600">
                          {assign.student_class || assign.class || "—"}
                        </td>
                        <td className="p-3 font-medium text-zinc-800">
                          {assign.route_name}
                        </td>
                        <td className="p-3 text-zinc-600">
                          {assign.pickup_point || "—"}
                        </td>
                        <td className="p-3 font-semibold text-zinc-900">
                          ₹{assign.fee?.toLocaleString() || "—"}
                        </td>
                        <td className="p-3 uppercase text-[10px] text-zinc-500 font-bold">
                          {assign.fee_frequency || assign.type || "monthly"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold uppercase ${assign.auto_assign_monthly
                                ? "text-emerald-600"
                                : "text-zinc-400"
                              }`}
                          >
                            {assign.auto_assign_monthly ? "on" : "off"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${assign.is_paid ||
                                assign.fee_status?.toLowerCase() === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                          >
                            {assign.is_paid ||
                              assign.fee_status?.toLowerCase() === "paid"
                              ? "Paid"
                              : "Running"}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-500 font-mono text-[11px]">
                          {assign.assigned_at_label || assign.assigned_on || "—"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              handleUnassignStudent(
                                assign.id,
                                assign.student_id,
                                assign.transport_route_id
                              )
                            }
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-zinc-200 rounded font-bold text-[11px]"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8">
                        <EmptyState
                          title="No Assignments Match Filters"
                          desc="Change parameters or allocate a student."
                          icon={FaUserPlus}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. LIVE MAP TAB */}
      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-zinc-900">Live Bus Map</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                See where each active bus is right now. Map refreshes every 10 seconds. Drivers share GPS from{" "}
                <span className="text-indigo-600 font-bold">/driver</span>
              </p>
            </div>
            <div className="flex gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[10px] font-bold">
                {liveBusesOnlineCount} online
              </span>
              <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2.5 py-1 rounded text-[10px] font-bold">
                {liveBusesOfflineCount} no GPS yet
              </span>
            </div>
          </div>

          {/* Active Routes list cards */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
            <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider border-b border-zinc-100 pb-2">
              Active Routes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {liveBuses.map((bus) => {
                const isOnline =
                  bus.has_location || (bus.latitude && bus.longitude);
                return (
                  <div
                    key={bus.id}
                    onClick={() => isOnline && handleFocusBusOnMap(bus)}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${isOnline
                        ? "bg-zinc-50 border-zinc-200 hover:border-indigo-400 cursor-pointer"
                        : "bg-zinc-50/50 border-zinc-200/60 opacity-80"
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-zinc-900 text-xs block">
                          {bus.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                          {bus.vehicle_number} • {bus.students_count || 0} students
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isOnline
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                      >
                        {isOnline ? "Live" : "Offline"}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-medium flex items-center justify-between border-t border-zinc-200/60 pt-2">
                      <span>
                        {isOnline
                          ? `Updated ${bus.location_updated_label || "just now"}`
                          : "Waiting for driver GPS"}
                      </span>
                      {isOnline && (
                        <span className="text-indigo-600 font-bold">Focus Map</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Preview */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm relative overflow-hidden flex flex-col h-[480px]">
            <div className="flex-1 w-full h-full">
              <iframe
                ref={iframeRef}
                title="Live Telemetry Map"
                width="100%"
                height="100%"
                style={{ border: 0, display: "block" }}
                srcDoc={mapHtml}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">
                {editingRouteId ? "Edit Transport Route" : "Add Transport Route"}
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 text-xs"
                  placeholder="e.g. Route A — Sector 15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 font-mono text-xs"
                  placeholder="e.g. RJ14 AB 1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 text-xs"
                    placeholder="Ramesh"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 text-xs"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                    Fee Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={routeFee}
                    onChange={(e) => setRouteFee(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 font-bold text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                    Fee Frequency
                  </label>
                  <select
                    value={feeFrequency}
                    onChange={(e) => setFeeFrequency(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none bg-white text-zinc-900 font-bold text-xs"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Stops (Comma separated)
                </label>
                <input
                  type="text"
                  value={routeStops}
                  onChange={(e) => setRouteStops(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 text-xs"
                  placeholder="Stop 1, Stop 2, School"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  GPS Device ID (Optional)
                </label>
                <input
                  type="text"
                  value={gpsDeviceId}
                  onChange={(e) => setGpsDeviceId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 font-mono text-xs"
                  placeholder="gps_device_id"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRouteId ? "Save Changes" : "Create Route"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900">
                Assign Student to Route
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAssignStudentSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Select Student *
                </label>
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none bg-white text-zinc-900 font-bold text-xs"
                >
                  <option value="">Choose Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id || s.admission_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Select Route *
                </label>
                <select
                  value={assignRouteId}
                  onChange={(e) => setAssignRouteId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none bg-white text-zinc-900 font-bold text-xs"
                >
                  <option value="">Choose Route</option>
                  {routes
                    .filter((r) => r.is_active)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.vehicle_number})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Pickup Point
                </label>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg outline-none text-zinc-900 text-xs"
                  placeholder="Near metro"
                />
              </div>

              <div className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  id="assign_fee"
                  checked={assignFee}
                  onChange={(e) => setAssignFee(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="assign_fee"
                  className="text-zinc-700 cursor-pointer font-semibold text-xs"
                >
                  Assign fee (bill current period now)
                </label>
              </div>

              <div className="flex items-center gap-2 py-0.5">
                <input
                  type="checkbox"
                  id="auto_assign_monthly"
                  checked={autoAssignMonthly}
                  onChange={(e) => setAutoAssignMonthly(e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="auto_assign_monthly"
                  className="text-zinc-700 cursor-pointer font-semibold text-xs"
                >
                  Auto assign monthly fee ledger updates
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Assign Route</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}