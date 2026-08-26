"use client";

import { useEffect, useState, useRef } from "react";
import { FaBus, FaPhoneAlt, FaLock, FaMapMarkerAlt, FaSignOutAlt, FaPlay, FaStop, FaSatellite } from "react-icons/fa";
import { loginDriver, getDriverMe, updateDriverLocation, logoutDriver } from "@/services/driver.service";
import { toast } from "sonner";

export default function DriverDashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Login form state
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  // Driver details state
  const [driverInfo, setDriverInfo] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Trip tracking state
  const [isTripActive, setIsTripActive] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsErrorText, setGpsErrorText] = useState("");
  const trackingIntervalRef = useRef(null);

  // Manual Coordinates Override (For testing/simulation on desktop)
  const [useOverride, setUseOverride] = useState(false);
  const [overrideLat, setOverrideLat] = useState("26.9124");
  const [overrideLng, setOverrideLng] = useState("75.7873");

  const checkLoggedInStatus = async () => {
    const token = localStorage.getItem("driver_token");
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    try {
      const data = await getDriverMe();
      if (data.success || data.driver) {
        setDriverInfo(data.driver);
        setRouteInfo(data.route || data.assigned_route);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem("driver_token");
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.warn("Auth check failed, logging out:", err);
      localStorage.removeItem("driver_token");
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoggedInStatus();
    return () => stopTracking();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) {
      toast.error("Please enter both phone number and PIN.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await loginDriver(phone.trim(), pin.trim());
      if (res.token || res.data?.token) {
        const token = res.token || res.data?.token;
        localStorage.setItem("driver_token", token);
        
        // Load driver details
        const details = await getDriverMe();
        setDriverInfo(details.driver);
        setRouteInfo(details.route || details.assigned_route);
        setIsLoggedIn(true);
        toast.success("Driver session initialized successfully!");
      } else {
        toast.error("Login failed: Invalid credentials.");
      }
    } catch (err) {
      toast.error("Authentication failed: " + (err.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    stopTracking();
    try {
      await logoutDriver();
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    localStorage.removeItem("driver_token");
    setIsLoggedIn(false);
    setDriverInfo(null);
    setRouteInfo(null);
    toast.success("Session closed.");
  };

  // GPS transmission logic
  const transmitLocation = async (lat, lng) => {
    try {
      await updateDriverLocation(lat, lng);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to transmit GPS:", err);
    }
  };

  const startTracking = () => {
    if (isTripActive) return;

    setGpsErrorText("");
    setIsTripActive(true);
    toast.success("Trip started! Transmitting location telemetry...");

    let toastShown = false;
    const track = () => {
      if (useOverride) {
        setGpsErrorText("");
        const lat = parseFloat(overrideLat);
        const lng = parseFloat(overrideLng);
        setLatitude(lat);
        setLongitude(lng);
        transmitLocation(lat, lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGpsErrorText("");
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            transmitLocation(lat, lng);
          },
          (error) => {
            let errorMsg = error?.message || "Location coordinates lookup timed out or unavailable.";
            if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
              errorMsg += " (Note: Geolocation API requires secure origin HTTPS to run).";
            }
            setGpsErrorText(errorMsg);
            if (!toastShown) {
              toast.error("GPS position unavailable: " + errorMsg);
              toastShown = true;
            }
            console.warn("GPS Error:", error?.code, errorMsg);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        setGpsErrorText("Geolocation API not supported by browser.");
        toast.error("Geolocation is not supported by your browser.");
      }
    };

    track();
    // Poll location updates every 8 seconds
    trackingIntervalRef.current = setInterval(track, 8000);
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTripActive(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-semibold text-xs text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <FaBus className="w-10 h-10 text-indigo-600 animate-bounce" />
          <span>Verifying driver credential tokens...</span>
        </div>
      </div>
    );
  }

  // --- 1. Logged Out View ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 text-xs font-semibold text-zinc-600">
        <div className="w-full max-w-sm bg-white border border-zinc-200 shadow-xl rounded-3xl p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <FaBus className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-black text-zinc-800">Transport Driver Access</h1>
            <p className="text-[11px] text-zinc-450 uppercase tracking-wider">Configure your terminal and start trip tracking</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Phone Number *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <FaPhoneAlt className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-2xl outline-none focus:border-indigo-500 bg-zinc-50/50 text-zinc-800 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Login PIN *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <FaLock className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  placeholder="PIN code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-zinc-250 rounded-2xl outline-none focus:border-indigo-500 bg-zinc-50/50 text-zinc-800 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-center shadow-lg shadow-indigo-150 transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Initializing Terminal..." : "Start Driver Session"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. Logged In / Dashboard View ---
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-4 text-xs font-semibold text-zinc-600">
      <div className="w-full max-w-md space-y-5">
        
        {/* Navbar */}
        <div className="flex items-center justify-between bg-white border border-zinc-200 px-5 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-855 font-bold uppercase tracking-wider text-[10px]">Driver Mode</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-rose-600 font-bold hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
          >
            <FaSignOutAlt /> End Session
          </button>
        </div>

        {/* Driver / Route summary */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/60 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <FaBus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-zinc-800 font-extrabold text-sm">{routeInfo?.name || "Assigned Bus Route"}</h2>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Vehicle: {routeInfo?.vehicle_number || "RJ14KW2001"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 font-semibold text-[11px] text-zinc-650">
            <div>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Driver Name</span>
              <span className="text-zinc-800 font-bold">{driverInfo?.name || "Driver Operator"}</span>
            </div>
            <div>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Driver Phone</span>
              <span className="text-zinc-800 font-bold">{driverInfo?.phone || phone}</span>
            </div>
          </div>
        </div>

        {/* GPS Live Tracking State */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FaSatellite className="text-indigo-600" /> Telemetry Control Board
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${isTripActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}>
              {isTripActive ? "Trip In-Progress" : "Trip Idle"}
            </span>
          </div>

          {/* Action triggers */}
          {!isTripActive ? (
            <button
              onClick={startTracking}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-center text-sm shadow-lg shadow-indigo-150 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FaPlay className="text-xs" /> Start Route Trip
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-center text-sm shadow-lg shadow-rose-150 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FaStop className="text-xs" /> End Route Trip
            </button>
          )}

          {/* Coordinates updates log */}
          {isTripActive && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3 font-mono text-[11px] text-zinc-650">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-extrabold border-b border-zinc-200/50 pb-2">
                <span>GPS TELEMETRY RECEIVED</span>
                <span className={gpsErrorText ? "text-rose-500 font-extrabold" : "text-emerald-600 animate-pulse"}>
                  {gpsErrorText ? "● GPS Failed" : "● Transmitting"}
                </span>
              </div>
              
              {gpsErrorText ? (
                <div className="text-[10px] text-rose-600 leading-normal font-bold p-1">
                  Error: {gpsErrorText}
                </div>
              ) : (
                <div className="space-y-1">
                  <p><span className="font-bold text-zinc-400 uppercase">Latitude:</span> {latitude || "Fetching..."}</p>
                  <p><span className="font-bold text-zinc-400 uppercase">Longitude:</span> {longitude || "Fetching..."}</p>
                  <p><span className="font-bold text-zinc-400 uppercase">Last Signal:</span> {lastUpdated || "Initializing..."}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simulated coordinates override panel */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <input
              type="checkbox"
              id="use_override"
              checked={useOverride}
              onChange={(e) => setUseOverride(e.target.checked)}
              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="use_override" className="text-zinc-800 font-extrabold text-xs cursor-pointer select-none">
              GPS Coordinates Override (Simulator)
            </label>
          </div>

          {useOverride && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Latitude</span>
                <input
                  type="text"
                  value={overrideLat}
                  onChange={(e) => setOverrideLat(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl outline-none focus:border-indigo-500 text-zinc-800 font-bold bg-zinc-50/50"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Longitude</span>
                <input
                  type="text"
                  value={overrideLng}
                  onChange={(e) => setOverrideLng(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-zinc-250 rounded-xl outline-none focus:border-indigo-500 text-zinc-800 font-bold bg-zinc-50/50"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
