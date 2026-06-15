import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, MapPin, Loader2, BarChart3, TrendingUp, Zap, Clock, Calendar, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';

export function OwnerDashboard() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      activeBookings: 0,
      availablePorts: 0,
      totalPorts: 0,
      totalEarnings: 0
    },
    chartData: [],
    recentActivities: []
  });



  const API_URL = "https://ev-station-slot-booking-backend.onrender.com/api";

  useEffect(() => {
    fetchDashboardStats();
    fetchStations();
  }, []);



  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_URL}/stations/owner/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      setStationsLoading(true);
      const response = await fetch(`${API_URL}/stations/owner/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setStationsLoading(false);
    }
  };

  const toggleStationStatus = async (id: string, currentlyActive: boolean) => {
    try {
      const response = await fetch(`${API_URL}/stations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentlyActive })
      });
      if (response.ok) {
        toast.success(`Station successfully ${!currentlyActive ? 'opened' : 'closed'}!`);
        fetchStations();
      } else {
        toast.error('Failed to update station status');
      }
    } catch (error) {
      toast.error('Network error while updating status');
    }
  };



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-gray-600">Manage your charging stations</p>
        </div>
        <Link to="/owner/add-station">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Add Station
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalBookings}</div>
            <p className="text-xs text-gray-400 mt-1">Lifetime bookings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" /> Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.stats.activeBookings}</div>
            <p className="text-xs text-gray-400 mt-1">Upcoming slots</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" /> Available Ports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.availablePorts} / {dashboardData.stats.totalPorts}</div>
            <p className="text-xs text-gray-400 mt-1">Ready for use</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" /> Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${dashboardData.stats.totalEarnings}</div>
            <p className="text-xs text-gray-400 mt-1">Confirmed payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" /> Performance Over Time
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Bookings"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Earnings ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData.recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No recent activity found.</p>
              ) : (
                dashboardData.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4 border-l-2 border-gray-100 pl-4 relative">
                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                      activity.type === 'cancellation' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Stations Section */}
      <h2 className="text-2xl font-bold mb-6">My Stations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {stationsLoading ? (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : stations.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border shadow-sm">
            No stations found. Add your first station!
          </div>
        ) : (
          stations.map((station: any) => (
            <Card key={station._id} className="bg-white shadow-sm flex flex-col border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{station.stationName}</CardTitle>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" /> {station.city}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    station.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {station.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-gray-600 space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>Opening Time:</span>
                    <span className="font-medium">{station.openingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing Time:</span>
                    <span className="font-medium">{station.closingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Ports:</span>
                    <span className="font-medium">{station.totalPorts}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex flex-col gap-2">
                {station.isApproved ? (
                  <>
                    <Link to={`/owner/manage/${station._id}`} className="w-full">
                      <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                        Manage Station
                      </Button>
                    </Link>
                    <Link to={`/owner/ports/${station._id}`} className="w-full">
                      <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                        Manage Ports
                      </Button>
                    </Link>
                    <Button 
                      variant={station.isActive === false ? "default" : "destructive"} 
                      className="w-full"
                      onClick={() => toggleStationStatus(station._id, station.isActive !== false)}
                    >
                      {station.isActive === false ? "Open Station" : "Close Station"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full cursor-not-allowed opacity-50" disabled>
                    Waiting for Approval
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
