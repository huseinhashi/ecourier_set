import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { format } from "date-fns";
import { User, Shield, Truck, MapPin, Building, Users, CreditCard, Plus, TrendingUp, BarChart2, PieChart } from "lucide-react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export const AdminDashboard = () => {
  const { toast } = useToast();
  const { request } = useApiRequest();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cities, setCities] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, couriersRes, customersRes, citiesRes, hubsRes, shipmentsRes, paymentsRes] = await Promise.all([
        request({ method: "GET", url: "/users/admins" }),
        request({ method: "GET", url: "/users/couriers" }),
        request({ method: "GET", url: "/users/customers" }),
        request({ method: "GET", url: "/cities" }),
        request({ method: "GET", url: "/hubs" }),
        request({ method: "GET", url: "/shipments" }),
        request({ method: "GET", url: "/payments" }),
      ]);
      setAdmins(adminsRes.data || []);
      setCouriers(couriersRes.data || []);
      setCustomers(customersRes.data || []);
      setCities(citiesRes.data || []);
      setHubs(hubsRes.data || []);
      setShipments(shipmentsRes.data || []);
      setPayments(paymentsRes.data || []);
      setRecentShipments((shipmentsRes.data || []).slice(0, 5));
      setRecentUsers([...(adminsRes.data || []), ...(couriersRes.data || []), ...(customersRes.data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Stats
  const totalAdmins = admins.length;
  const totalCouriers = couriers.length;
  const totalCustomers = customers.length;
  const totalCities = cities.length;
  const totalHubs = hubs.length;
  const totalShipments = shipments.length;
  const totalPayments = payments.length;

  // Shipments by status
  const shipmentStatuses = [
    "Pending Pickup",
    "Picked Up",
    "At Origin Hub",
    "In Transit",
    "At Destination Hub",
    "Out for Delivery",
    "Delivered",
    "Canceled",
  ];
  const shipmentStatusCounts = shipmentStatuses.map(status => shipments.filter(s => s.status === status).length);

  // Users by role
  const userRoles = [
    { label: "Admins", value: "admin" },
    { label: "Couriers", value: "courier" },
    { label: "Customers", value: "customer" },
  ];
  const userRoleCounts = [totalAdmins, totalCouriers, totalCustomers];

  // Shipments over time (by day)
  const shipmentsByDay = {};
  shipments.forEach(s => {
    const day = format(new Date(s.createdAt), "yyyy-MM-dd");
    shipmentsByDay[day] = (shipmentsByDay[day] || 0) + 1;
  });
  const shipmentDays = Object.keys(shipmentsByDay).sort();
  const shipmentCounts = shipmentDays.map(day => shipmentsByDay[day]);

  // Chart data
  const shipmentStatusPieData = {
    labels: shipmentStatuses,
    datasets: [
      {
        data: shipmentStatusCounts,
        backgroundColor: [
          "#fbbf24", // Pending Pickup
          "#f59e42", // Picked Up
          "#60a5fa", // At Origin Hub
          "#818cf8", // In Transit
          "#34d399", // At Destination Hub
          "#f472b6", // Out for Delivery
          "#22d3ee", // Delivered
          "#ef4444", // Canceled
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const userRolePieData = {
    labels: userRoles.map(r => r.label),
    datasets: [
      {
        data: userRoleCounts,
        backgroundColor: ["#6366f1", "#0ea5e9", "#22c55e"],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const shipmentsLineData = {
    labels: shipmentDays,
    datasets: [
      {
        label: "Shipments",
        data: shipmentCounts,
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  // Recent Shipments Table Columns
  const recentShipmentColumns = [
    // { accessorKey: '_id', header: 'ID', cell: ({ row }) => row.original._id },
    { accessorKey: 'sender', header: 'Sender', cell: ({ row }) => row.original.sender?.name || 'N/A' },
    { accessorKey: 'receiver', header: 'Receiver', cell: ({ row }) => row.original.receiver?.name || 'N/A' },
    { accessorKey: 'originCity', header: 'Origin', cell: ({ row }) => row.original.originCity?.name || row.original.originCity || 'N/A' },
    { accessorKey: 'destinationCity', header: 'Destination', cell: ({ row }) => row.original.destinationCity?.name || row.original.destinationCity || 'N/A' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => row.original.status },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => row.original.createdAt ? format(new Date(row.original.createdAt), "PPP p") : 'N/A' },
  ];

  // Recent Users Table Columns
  const recentUserColumns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'role', header: 'Role', cell: ({ row }) => row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1) },
    { accessorKey: 'createdAt', header: 'Joined', cell: ({ row }) => row.original.createdAt ? format(new Date(row.original.createdAt), "PPP p") : 'N/A' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/admins")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Admins</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalAdmins}</div>
            <Badge variant="secondary" className="text-xs font-medium">Admins</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/couriers")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Couriers</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalCouriers}</div>
            <Badge variant="secondary" className="text-xs font-medium">Couriers</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/customers")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Customers</CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalCustomers}</div>
            <Badge variant="secondary" className="text-xs font-medium">Customers</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/cities")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Cities</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalCities}</div>
            <Badge variant="secondary" className="text-xs font-medium">Cities</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/hubs")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Hubs</CardTitle>
            <div className="p-2 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
              <Building className="h-5 w-5 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalHubs}</div>
            <Badge variant="secondary" className="text-xs font-medium">Hubs</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/shipments")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Shipments</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
              <Truck className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalShipments}</div>
            <Badge variant="secondary" className="text-xs font-medium">Shipments</Badge>
          </CardContent>
        </Card>
        <Card
          className="relative overflow-hidden border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => navigate("/admin/reports")}
          tabIndex={0}
          role="button"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-semibold text-foreground">Payments</CardTitle>
            <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
              <CreditCard className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground mb-1">{totalPayments}</div>
            <Badge variant="secondary" className="text-xs font-medium">Payments</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <PieChart className="h-5 w-5 text-blue-600" />
              Shipments by Status
            </CardTitle>
            <CardDescription className="text-slate-600">
              Distribution of shipments by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={shipmentStatusPieData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
              <BarChart2 className="h-5 w-5 text-green-600" />
              Users by Role
            </CardTitle>
            <CardDescription className="text-slate-600">
              Distribution of users by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={userRolePieData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            Shipments Timeline
          </CardTitle>
          <CardDescription className="text-slate-600">
            Daily shipment activity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={shipmentsLineData} options={{...chartOptions, maintainAspectRatio: false}} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
              <Truck className="h-5 w-5 text-indigo-600" />
              Recent Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={recentShipmentColumns} data={recentShipments} pageSize={5} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-card hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
              <Users className="h-5 w-5 text-green-600" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={recentUserColumns} data={recentUsers} pageSize={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};