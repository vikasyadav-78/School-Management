"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaBars, FaBell, FaSearch, FaUserCircle, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { logoutUser } from "@/features/auth/redux/moduleSlice";
import { APP_CONFIG } from "@/constants/appConfig";
import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function Navbar() {
  const dispatch = useDispatch();
  const { toggleSidebar } = useSidebar();
  const { user } = useSelector((state) => state.auth);
  const { profile: studentProfile } = useSelector((state) => state.students || {});
  
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Notices API State
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [activeNotice, setActiveNotice] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("unread"); // "unread" | "read"

  const markAsRead = async (noticeId) => {
    try {
      const url = user?.role === "teacher" 
        ? `/teacher/notices/${noticeId}/read` 
        : `/student/notices/${noticeId}/read`;
      await api.post(url);
      toast.success("Notification marked as read!");
      fetchNotices(); // Reload from server
    } catch (err) {
      console.error("Notice mark read error:", err);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoadingNotices(true);
      const url = user?.role === "teacher" ? "/teacher/notices" : "/student/notices";
      const response = await api.get(url);
      const list = response.data.notices || response.data.leaves || response.data.data || (Array.isArray(response.data) ? response.data : []);
      setNotices(list);
    } catch (err) {
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    if (user?.role === "student" || user?.role === "teacher") {
      fetchNotices();
    }
  }, [user]);

  const handleNoticeClick = async (noticeId) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const url = user?.role === "teacher" ? `/teacher/notices/${noticeId}` : `/student/notices/${noticeId}`;
      const response = await api.get(url);
      const detailedNotice = response.data.notice || response.data.data || response.data;
      setActiveNotice(detailedNotice);

      // Call read API if notice is currently unread
      const noticeObj = notices.find(n => n.id === noticeId);
      if (noticeObj && !noticeObj.is_read && !noticeObj.read_at) {
        const readUrl = user?.role === "teacher" 
          ? `/teacher/notices/${noticeId}/read` 
          : `/student/notices/${noticeId}/read`;
        await api.post(readUrl);
        fetchNotices(); // Reload from server
      }
    } catch (err) {
      console.error("Notice details error:", err);
      toast.error("Failed to load notice details.");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const dummyNotifications = [
    { id: 1, title: "New Student Enrolled", time: "5 mins ago", desc: "Alice Johnson registered in Class 10." },
    { id: 2, title: "Fee Collection Success", time: "2 hrs ago", desc: "Bob Smith paid tuition fees." },
    { id: 3, title: "Class Schedule Updated", time: "1 day ago", desc: "Class 10-A moved to Room 4." }
  ];

  const unreadNotices = notices.filter((n) => !n.is_read && !n.read_at);
  const readNotices = notices.filter((n) => n.is_read || n.read_at);
  const unreadCount = unreadNotices.length;
  const readCount = readNotices.length;

  const profileHref = user?.role === "teacher" 
    ? "/teacher/profile" 
    : user?.role === "student" 
      ? "/student/profile" 
      : "/admin/profile";

  // Resolve dynamic metadata across roles
  const activeProfile = user?.role === "student" ? (studentProfile || user) : user;
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

  const studentData = activeProfile?.student || activeProfile?.user?.student || (isStudent ? activeProfile : {});
  const teacherData = activeProfile?.teacher || activeProfile?.user?.teacher || (isTeacher ? activeProfile : {});
  const schoolData = activeProfile?.school || activeProfile?.user?.school || user?.school || {};

  const userDisplayName = isStudent
    ? (studentData.full_name || (studentData.first_name && studentData.last_name ? `${studentData.first_name} ${studentData.last_name}` : null) || activeProfile.name || "Student")
    : isTeacher
      ? (teacherData.full_name || activeProfile.name || "Teacher")
      : (activeProfile?.name || "Admin");

  const userDisplayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User";
  
  const userPhoto = isStudent ? studentData.photo : (isTeacher ? teacherData.photo : null);
  const userIdentifier = isStudent ? (studentData.student_id || studentData.id) : (isTeacher ? (teacherData.employee_id || teacherData.id) : null);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 shadow-sm shadow-zinc-100 text-xs">
      {/* Sidebar Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <FaBars className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative w-72">
          <FaSearch className="absolute left-3 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-full text-xs text-black font-semibold outline-none bg-zinc-50 focus:bg-white focus:border-violet-500 transition-all"
          />
        </div>

        {/* School Branding in Header */}
        {schoolData.name && (
          <div 
            className="hidden lg:flex items-center gap-2 border-l border-zinc-200 pl-4 py-1"
            title={schoolData.name}
          >
            {schoolData.logo && !logoError ? (
              <img 
                src={schoolData.logo} 
                alt="School Logo" 
                className="w-6 h-6 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-6 h-6 rounded bg-violet-100 flex items-center justify-center text-violet-600 font-extrabold text-[10px]">
                {schoolData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider truncate max-w-[180px]">
              {schoolData.name.length > 20 ? schoolData.name.slice(0, 20) + "..." : schoolData.name}
            </span>
          </div>
        )}
      </div>

      {/* Notifications & Profile dropdown */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
              if (user?.role === "student" || user?.role === "teacher") {
                fetchNotices();
              }
            }}
            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 relative transition-all"
          >
            <FaBell className="w-5 h-5" />
            {(user?.role === "student" || user?.role === "teacher") && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-blue-600 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 shadow-xl rounded-xl z-50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="font-bold text-sm text-zinc-800">Notifications</span>
                {(user?.role === "student" || user?.role === "teacher") && (
                  <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>

              {(user?.role === "student" || user?.role === "teacher") && (
                <div className="flex border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <button 
                    onClick={() => setActiveTab("unread")}
                    className={`flex-1 py-2 text-center border-b-2 transition-all ${
                      activeTab === "unread" 
                        ? "border-blue-500 text-blue-600 font-extrabold" 
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button 
                    onClick={() => setActiveTab("read")}
                    className={`flex-1 py-2 text-center border-b-2 transition-all ${
                      activeTab === "read" 
                        ? "border-emerald-500 text-emerald-600 font-extrabold" 
                        : "border-transparent text-zinc-400 hover:text-zinc-650"
                    }`}
                  >
                    Read ({readCount})
                  </button>
                </div>
              )}

              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto overflow-x-hidden space-y-2 pt-1">
                {!(user?.role === "student" || user?.role === "teacher") ? (
                  // Fallback for Admin/Teacher view
                  <div className="divide-y divide-zinc-50">
                    {dummyNotifications.map((n) => (
                      <div key={n.id} className="py-2.5 hover:bg-zinc-50 px-1 rounded-md transition-colors">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-semibold text-zinc-800">{n.title}</h4>
                          <span className="text-[9px] text-zinc-400">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                ) : loadingNotices ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex flex-col gap-1.5 p-2 bg-zinc-50 rounded-lg">
                        <div className="h-3.5 bg-zinc-200 rounded-md w-3/4" />
                        <div className="h-3 bg-zinc-100 rounded-md w-1/2" />
                        <div className="h-8 bg-zinc-100 rounded-md w-full" />
                      </div>
                    ))}
                  </div>
                ) : (activeTab === "unread" ? unreadNotices : readNotices).length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    No Notifications Available
                  </div>
                ) : (
                  [...(activeTab === "unread" ? unreadNotices : readNotices)]
                    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
                    .map((n) => {
                      const isUnread = !n.is_read && !n.read_at;
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            handleNoticeClick(n.id);
                            setShowNotifications(false);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm text-left relative flex flex-col ${
                            isUnread 
                              ? "bg-blue-50/30 border-l-4 border-l-blue-500 border-zinc-200" 
                              : "bg-white border-zinc-100 text-zinc-400"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-[11px] font-bold truncate ${isUnread ? "text-blue-900" : "text-zinc-700"}`}>
                              {n.title}
                            </h4>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>{n.published_at_label}</span>
                            {n.target_type && (
                              <>
                                <span>•</span>
                                <span className="text-violet-600 bg-violet-50 px-1 py-0.5 rounded text-[8px]">{n.target_type}</span>
                              </>
                            )}
                          </div>

                          <p className={`text-[10px] mt-2 line-clamp-3 leading-normal ${isUnread ? "text-zinc-600" : "text-zinc-400"}`}>
                            {n.body}
                          </p>

                          {isUnread ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="mt-2.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[9px] transition-all self-start shadow-sm"
                            >
                              Mark as Read
                            </button>
                          ) : (
                            <span className="mt-2.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider self-start">
                              Read
                            </span>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-zinc-100 transition-colors align-middle"
          >
            {userPhoto && !imgError ? (
              <img 
                src={userPhoto} 
                alt={userDisplayName} 
                className="w-8 h-8 rounded-full object-cover shadow-inner"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm shadow-inner">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <h3 className="text-xs font-semibold text-zinc-800 leading-3">{userDisplayName}</h3>
              <span className="text-[10px] text-zinc-400 font-medium capitalize">{userDisplayRole}</span>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-zinc-100 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-zinc-50">
              <div className="p-3 text-xs">
                <p className="text-zinc-400">Signed in as</p>
                <p className="font-extrabold text-zinc-800 truncate mt-0.5">{user?.email || "N/A"}</p>
                {userIdentifier && (
                  <p className="text-[9px] text-zinc-400 font-semibold mt-1">ID: {userIdentifier}</p>
                )}
              </div>
              <div className="py-1">
                <Link
                  href={profileHref}
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <FaUserCircle className="text-zinc-400" />
                  <span>My Profile</span>
                </Link>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <FaSignOutAlt className="text-red-400" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notice Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaBell className="text-violet-500" />
                Notice Announcement
              </h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {loadingDetail || !activeNotice ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-base font-extrabold text-zinc-800 leading-tight">
                    {activeNotice.title}
                  </h2>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-wider pb-3 border-b border-zinc-100">
                    <span>Published: {activeNotice.published_at_label}</span>
                    {activeNotice.target_type && (
                      <>
                        <span>•</span>
                        <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded font-extrabold text-[9px]">
                          Target: {activeNotice.target_type}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-zinc-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {activeNotice.body}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
