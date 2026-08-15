"use client";

import { useEffect, useState, useRef } from "react";
import PageHeader from "@/components/common/PageHeader";
import PageLoader from "@/components/common/PageLoader";
import EmptyState from "@/components/common/EmptyState";
import { FaBus, FaMapMarkerAlt, FaUser, FaPhoneAlt, FaRoad, FaCircleNotch, FaExclamationTriangle } from "react-icons/fa";
import { getStudentTransport, getStudentTransportLive } from "@/services/transport.service";
import { toast } from "sonner";

export default function StudentTransportPage() {
  const [loading, setLoading] = useState(true);
  const [transportData, setTransportData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const data = await getStudentTransport();
        setTransportData(data);
        
        if (data.assigned) {
          fetchLiveData();
          startPolling();
        }
      } catch (err) {
        setError(err.message || "Failed to load transport details");
        toast.error("Failed to load transport details: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      stopPolling();
    };
  }, []);

  const fetchLiveData = async () => {
    try {
      const data = await getStudentTransportLive();
      setLiveData(data);
    } catch (err) {
      console.error("Failed to fetch live location:", err);
    }
  };

  const startPolling = () => {
    stopPolling(); // Ensure no duplicate intervals
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLiveData();
      }
    }, 10000); // 10 seconds
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center text-red-500 text-sm font-semibold max-w-lg mx-auto mt-10">
        Failed to load transport details: {error}
      </div>
    );
  }

  if (!transportData || !transportData.assigned) {
    return (
      <div className="space-y-6 animate-fade-in text-xs text-left w-full">
        <PageHeader 
          title="My Bus Location"
          subtitle="View your assigned transport details and track live bus location."
        />
        <EmptyState 
          title="No Transport Assigned" 
          desc="You have not been assigned to any transport route. Please contact the administration if you need school transport." 
        />
      </div>
    );
  }

  // Use live data if available, otherwise fallback to summary bus data
  const bus = liveData?.bus || transportData?.bus;
  
  if (!bus) {
    return null;
  }

  const hasLocation = liveData ? liveData.has_location : bus.has_location;
  const lat = liveData ? liveData.bus?.latitude : bus.latitude;
  const lng = liveData ? liveData.bus?.longitude : bus.longitude;

  return (
    <div className="space-y-6 animate-fade-in text-xs text-left w-full">
      <PageHeader 
        title="My Bus Location"
        subtitle="View your assigned transport details and track live bus location."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Bus Summary Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100/60 flex items-center justify-center shrink-0">
                <FaBus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-zinc-800 text-sm truncate">{bus.name || "Assigned Route"}</h3>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Vehicle: {bus.vehicle_number || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-3 text-zinc-600">
                <FaUser className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Driver Name</span>
                  <span className="font-bold text-zinc-800 text-xs truncate block">{bus.driver_name || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <FaPhoneAlt className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Driver Phone</span>
                  <span className="font-bold text-zinc-800 text-xs truncate block">{bus.driver_phone || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <FaRoad className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pickup Point</span>
                  <span className="font-bold text-zinc-800 text-xs truncate block">{bus.pickup_point || "N/A"}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold text-zinc-500">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live Sync Active
              </div>
              <span className="text-zinc-500">
                {liveData?.updated_at ? `Last Updated: ${new Date(liveData.updated_at).toLocaleTimeString()}` : "Polling..."}
              </span>
            </div>
          </div>
        </div>

        {/* Live Location Map */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-[420px]">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <FaMapMarkerAlt className="text-violet-500" /> Live Location
              </h3>
              {!hasLocation ? (
                 <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                   <FaExclamationTriangle /> Location Unavailable
                 </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-500">
                  {bus.location_updated_at ? `GPS Timestamp: ${new Date(bus.location_updated_at).toLocaleTimeString()}` : "Fetching location..."}
                </span>
              )}
            </div>
            
            <div className="flex-1 relative bg-zinc-100 flex items-center justify-center">
              {!hasLocation || !lat || !lng ? (
                <div className="text-center p-6 space-y-3">
                  <FaMapMarkerAlt className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-zinc-500 font-bold">Live location is currently unavailable.</p>
                  <p className="text-zinc-400 text-xs">The bus GPS might be turned off or experiencing connection issues.</p>
                </div>
              ) : (
                <iframe
                  title="Bus Live Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                />
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}