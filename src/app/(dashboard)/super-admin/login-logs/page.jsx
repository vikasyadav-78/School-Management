"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import {
  getLoginLogs,
  getLoginLogsMeta,
  getLoginLogDetails
} from "@/features/super-admin/services/super-admin.service";
import {
  FaSearch,
  FaFilter,
  FaSync,
  FaEye,
  FaMapMarkerAlt,
  FaGlobe,
  FaMobileAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaInfoCircle,
  FaTimes,
  FaShieldAlt
} from "react-icons/fa";

export default function SuperAdminLoginLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({
    roles: [],
    events: [],
    channels: [],
    schools: []
  });

  // Filter States
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [event, setEvent] = useState("");
  const [channel, setChannel] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    logins: 0,
    logouts: 0
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(30);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadMeta = async () => {
    try {
      const res = await getLoginLogsMeta();
      if (res.success) {
        setMeta({
          roles: res.roles || [],
          events: res.events || [],
          channels: res.channels || [],
          schools: res.schools || []
        });
      }
    } catch (err) {
      console.error("Failed to load audit metadata:", err);
    }
  };

  const fetchLogsList = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        role: role || undefined,
        event: event || undefined,
        channel: channel || undefined,
        school_id: schoolId || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      };

      const res = await getLoginLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
        setStats(res.stats || { total: 0, logins: 0, logouts: 0 });
        setCurrentPage(res.current_page || 1);
        setLastPage(res.last_page || 1);
        setTotalCount(res.count || 0);
      } else {
        toast.error(res.message || "Failed to load login reports.");
      }
    } catch (err) {
      console.error("Error retrieving login logs:", err);
      toast.error("Error loading session audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    fetchLogsList(1);
  }, []);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    fetchLogsList(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setRole("");
    setEvent("");
    setChannel("");
    setSchoolId("");
    setFromDate("");
    setToDate("");
    setTimeout(() => {
      fetchLogsList(1);
    }, 50);
  };

  const handleOpenDetailModal = async (logId) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await getLoginLogDetails(logId);
      if (res.success && res.log) {
        setSelectedLog(res.log);
      } else {
        const localLog = logs.find((l) => l.id === logId);
        setSelectedLog(localLog);
      }
    } catch (err) {
      const localLog = logs.find((l) => l.id === logId);
      setSelectedLog(localLog);
    } finally {
      setDetailLoading(false);
    }
  };

  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case "super_admin":
        return "bg-red-50 ring-1 ring-inset ring-red-600/20 text-red-700";
      case "school_admin":
        return "bg-violet-50 ring-1 ring-inset ring-violet-600/20 text-violet-700";
      case "teacher":
        return "bg-amber-50 ring-1 ring-inset ring-amber-600/20 text-amber-700";
      case "student":
        return "bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 text-emerald-700";
      case "parent":
        return "bg-indigo-50 ring-1 ring-inset ring-indigo-600/20 text-indigo-700";
      default:
        return "bg-slate-100 ring-1 ring-inset ring-slate-500/20 text-slate-700";
    }
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-left w-full">
        <PageHeader
          title="Login Session Audit Logs"
          description="Track global user login/logout activity, geolocations, IP channels, and device identifiers across the platform."
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Session Logs
              </span>
              <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                <FaShieldAlt />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</h3>
              <p className="text-xs text-slate-500 mt-1">Audit log records matching criteria</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Logins
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm ring-1 ring-emerald-500/10">
                <FaSignInAlt />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-emerald-600 tracking-tight">{stats.logins}</h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">Successful session logins recorded</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recorded Logouts
              </span>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm ring-1 ring-slate-500/10">
                <FaSignOutAlt />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-700 tracking-tight">{stats.logouts}</h3>
              <p className="text-xs text-slate-500 mt-1">Manual/session logout triggers tracked</p>
            </div>
          </div>
        </div>

        {/* Filters Header Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <FaFilter className="text-violet-600" />
            <span>Search Filters</span>
          </div>

          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Name, email, IP, device..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Roles</option>
                {meta.roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Event</label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Events</option>
                {meta.events.map((ev) => (
                  <option key={ev.value} value={ev.value}>
                    {ev.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Channels</option>
                {meta.channels.map((ch) => (
                  <option key={ch.value} value={ch.value}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Institution</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="">All Schools</option>
                {meta.schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2 rounded-xl bg-slate-50/50 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-end gap-2 pt-2 sm:pt-0">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1 py-2 text-xs font-semibold shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                <FaSearch className="w-3 h-3" /> Search Log
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex-1 py-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs inline-flex items-center justify-center gap-1.5"
              >
                <FaSync className="w-3 h-3" /> Reset
              </Button>
            </div>
          </form>
        </div>

        {/* Audit Registry Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center items-center">
              <PageLoader />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 flex flex-col justify-center items-center text-center space-y-3">
              <FaInfoCircle className="w-10 h-10 text-slate-300" />
              <div>
                <p className="font-bold text-slate-700 text-sm">No Audit Logs Found</p>
                <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 pl-6 pr-4 whitespace-nowrap min-w-[180px]">User Name</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Email</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[120px]">Role</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">School / Portal</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap min-w-[100px]">Action</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap min-w-[90px]">Channel</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[160px]">IP / Geo-Location</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Device</th>
                    <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Timestamp</th>
                    <th className="py-4 pl-4 pr-6 text-right whitespace-nowrap min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 pl-6 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.user_name}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.email}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getRoleBadgeStyle(
                            log.role
                          )}`}
                        >
                          {log.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        {log.school_name ? (
                          <span className="font-semibold text-slate-800">{log.school_name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono italic">Platform Admin Portal</span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        {log.event === "login" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/20 px-2.5 py-0.5 rounded-full">
                            <FaSignInAlt className="w-2.5 h-2.5" /> Login
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 ring-1 ring-inset ring-slate-500/20 px-2.5 py-0.5 rounded-full">
                            <FaSignOutAlt className="w-2.5 h-2.5" /> Logout
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold ${
                            log.channel === "web"
                              ? "bg-sky-50 border border-sky-100 text-sky-700"
                              : "bg-indigo-50 border border-indigo-100 text-indigo-700"
                          }`}
                        >
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-mono text-xs text-slate-600">{log.ip_address}</p>
                        {log.maps_url ? (
                          <a
                            href={log.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-0.5"
                          >
                            <FaMapMarkerAlt className="w-3 h-3 text-violet-400" />
                            {log.location || "View Map"}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <FaGlobe className="w-3 h-3 text-slate-300" /> Loc unavailable
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap capitalize">
                        {log.device_name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <FaMobileAlt className="w-3 h-3 text-slate-400" /> {log.device_name.replace("-", " ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">Web browser</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.created_at_label}
                      </td>
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(log.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200/80 transition-colors"
                          title="View metadata specs"
                        >
                          <FaEye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && logs.length > 0 && totalCount > perPage && (
            <div className="px-6 py-4 border-t border-slate-100 bg-white">
              <Pagination
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={perPage}
                onPageChange={fetchLogsList}
              />
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL DRAWER */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm ring-1 ring-violet-500/10">
                  <FaShieldAlt />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Session Audit Details</h3>
                  <p className="text-[11px] text-slate-500">Client request headers & geolocation values</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {detailLoading ? (
                <div className="py-16 flex justify-center items-center">
                  <PageLoader />
                </div>
              ) : selectedLog ? (
                <div className="space-y-4">
                  {/* Basic User Segment */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Log Entry ID</p>
                      <p className="font-mono text-slate-900 font-medium text-xs mt-0.5 break-all select-all">{selectedLog.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User ID</p>
                      <p className="font-mono text-slate-900 font-medium text-xs mt-0.5 break-all select-all">{selectedLog.user_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Full Name</p>
                      <p className="text-slate-900 mt-0.5 font-bold text-xs">{selectedLog.user_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                      <p className="font-mono text-slate-700 mt-0.5 text-xs">{selectedLog.email}</p>
                    </div>
                  </div>

                  {/* Actions & Channels details */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Role</p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize mt-1 ${getRoleBadgeStyle(
                          selectedLog.role
                        )}`}
                      >
                        {selectedLog.role?.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Event Action</p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize mt-1 ${
                          selectedLog.event === "login"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20"
                        }`}
                      >
                        {selectedLog.event}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Channel</p>
                      <span className="inline-block px-2 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 rounded text-[10px] font-bold uppercase mt-1">
                        {selectedLog.channel}
                      </span>
                    </div>
                  </div>

                  {/* IP, Location details */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IP Address</p>
                      <p className="font-mono text-slate-900 font-medium text-xs mt-0.5">{selectedLog.ip_address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Timestamp</p>
                      <p className="font-mono text-slate-700 text-xs mt-0.5">{selectedLog.created_at_label}</p>
                    </div>
                    <div className="col-span-2 pt-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Geo-Location Coords</p>
                      {selectedLog.latitude && selectedLog.longitude ? (
                        <div className="mt-1.5 flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                          <div>
                            <p className="text-xs text-slate-800 font-mono">Latitude: {selectedLog.latitude}</p>
                            <p className="text-xs text-slate-800 font-mono mt-0.5">Longitude: {selectedLog.longitude}</p>
                          </div>
                          {selectedLog.maps_url && (
                            <a
                              href={selectedLog.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <FaMapMarkerAlt className="w-3 h-3" /> Open Maps
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-400 mt-1 italic">No geolocation parameters captured for this API session</p>
                      )}
                    </div>
                  </div>

                  {/* Headers Agent String */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Agent Client Details</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-600 leading-relaxed break-all whitespace-pre-wrap select-all">
                      {selectedLog.user_agent ||
                        selectedLog.device_name ||
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400">Failed to render details.</div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="text-xs font-semibold px-4 py-2"
              >
                Close Audit Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}