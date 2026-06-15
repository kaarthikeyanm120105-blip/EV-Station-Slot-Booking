import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BatteryCharging, Play, Square, RefreshCcw, ArrowLeft, Zap, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ManagePorts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPortStatus();
    const interval = setInterval(fetchPortStatus, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchPortStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings/owner/station/${id}/ports`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching port status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCharging = async (portNumber: number) => {
    setActionLoading(portNumber);
    try {
      const response = await fetch(`${API_URL}/bookings/owner/start-charging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stationId: id, portNumber })
      });

      if (response.ok) {
        toast.success(`Charging started on Port ${portNumber}`);
        fetchPortStatus();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to start charging");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopCharging = async (bookingId: string, portNumber: number) => {
    setActionLoading(portNumber);
    try {
      const response = await fetch(`${API_URL}/bookings/owner/stop-charging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Charging stopped. Total Amount: ₹${data.totalAmount}`);
        fetchPortStatus();
      } else {
        toast.error("Failed to stop charging");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCcw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/owner")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{status?.stationName || "Manage Ports"}</h1>
              <p className="text-gray-500">Live Port Monitoring & Control</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="bg-white px-4 py-2 text-sm font-medium border-gray-200">
              Total Ports: {status?.totalPorts}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 px-4 py-2 text-sm font-medium border-red-100">
              In Use: {status?.usedPorts}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {status?.ports.map((port: any) => (
            <Card key={port.portNumber} className={`relative overflow-hidden border-0 shadow-lg ring-1 transition-all ${
              port.status === 'busy' ? 'ring-red-100 bg-white' : 'ring-green-100 bg-white'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BatteryCharging className={`h-6 w-6 ${port.status === 'busy' ? 'text-red-500' : 'text-green-500'}`} />
                    Port {port.portNumber}
                  </CardTitle>
                  <Badge className={port.status === 'busy' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {port.status === 'busy' ? 'Occupied' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  {port.status === 'busy' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-red-50 p-3 rounded-lg space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 uppercase tracking-wider">
                          <Zap className="h-3 w-3" /> Active Session
                        </div>
                        <p className="text-sm font-medium text-gray-700">Source: <span className="capitalize">{port.booking?.source}</span></p>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-400" /> Since: {port.booking?.startTime}
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="w-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleStopCharging(port.booking?._id, port.portNumber)}
                        disabled={actionLoading === port.portNumber}
                      >
                        {actionLoading === port.portNumber ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <><Square className="h-5 w-5 mr-2 fill-current" /> Stop Charging</>}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Ready for charging
                        </p>
                      </div>
                      <Button 
                        className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                        onClick={() => handleStartCharging(port.portNumber)}
                        disabled={actionLoading === port.portNumber}
                      >
                         {actionLoading === port.portNumber ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <><Play className="h-5 w-5 mr-2 fill-current" /> Start Charging</>}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              {port.status === 'busy' && (
                <div className="absolute bottom-0 left-0 h-1 bg-red-500 animate-pulse w-full"></div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
