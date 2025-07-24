import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { FormError } from "@/components/ErrorComponents";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, User, MapPin, Truck, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LoaderCircle } from "@/components/LoaderCircle";
import api from "@/lib/api_calls";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const ShipmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const [shipment, setShipment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [payment, setPayment] = useState(null);
  const [tab, setTab] = useState("logs");
  const [couriers, setCouriers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedCourierA, setSelectedCourierA] = useState("");
  const [selectedCourierB, setSelectedCourierB] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedHub, setSelectedHub] = useState("");
  const [hubs, setHubs] = useState([]);

  useEffect(() => {
    fetchShipment();
    fetchLogs();
    fetchCouriers();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const data = await request({ method: 'GET', url: `/shipments/${id}` });
      setShipment(data.data || null);
      // Optionally fetch payment info if not included
      if (data.data && data.data.payment) setPayment(data.data.payment);
    } catch (error) {}
  };

  const fetchLogs = async () => {
    try {
      const data = await request({ method: 'GET', url: `/shipments/${id}/logs` });
      // Sort logs by createdAt descending (most recent first)
      setLogs((data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {}
  };

  const fetchCouriers = async () => {
    try {
      const data = await request({ method: 'GET', url: '/users/couriers' });
      setCouriers(data.data || []);
    } catch (error) {}
  };

  const handleAssignCourier = async (type) => {
    setAssigning(true);
    try {
      await request({
        method: 'POST',
        url: '/shipments/assign-courier',
        data: { shipmentId: shipment._id, courierId: selectedCourier, type },
      }, {
        successMessage: `Courier ${type} assigned successfully`,
        onSuccess: () => {
          fetchShipment();
          fetchLogs();
          setSelectedCourier("");
        },
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateCourier = async (type) => {
    const courierId = type === "A" ? selectedCourierA : selectedCourierB;
    if (!courierId) return;
    setAssigning(true);
    try {
      await request({
        method: 'POST',
        url: '/shipments/update-courier',
        data: { shipmentId: shipment._id, courierId, type },
      }, {
        successMessage: `Courier ${type} updated successfully`,
        onSuccess: () => {
          fetchShipment();
          fetchLogs();
          if (type === "A") setSelectedCourierA("");
          if (type === "B") setSelectedCourierB("");
        },
      });
    } finally {
      setAssigning(false);
    }
  };

  const isSameCity = shipment?.originCity?._id === shipment?.destinationCity?._id;
  const currentStatus = shipment?.status;
  let allowedStatuses = [];
  let requiredHubStatus = null;
  let hubCityId = null;
  if (isSameCity) {
    if (currentStatus === "Pending Pickup") allowedStatuses = ["Picked Up"];
    if (currentStatus === "Picked Up") allowedStatuses = ["In Transit"];
    if (currentStatus === "In Transit") allowedStatuses = ["Delivered"];
  } else {
    if (currentStatus === "Pending Pickup") allowedStatuses = ["Picked Up"];
    if (currentStatus === "Picked Up") {
      allowedStatuses = ["At Origin Hub"];
      requiredHubStatus = "At Origin Hub";
      hubCityId = shipment.originCity?._id;
    }
    if (currentStatus === "At Origin Hub") allowedStatuses = ["In Transit"];
    if (currentStatus === "In Transit") {
      allowedStatuses = ["At Destination Hub"];
      requiredHubStatus = "At Destination Hub";
      hubCityId = shipment.destinationCity?._id;
    }
    if (currentStatus === "At Destination Hub") allowedStatuses = ["Out for Delivery"];
    if (currentStatus === "Out for Delivery") allowedStatuses = ["Delivered"];
  }

  useEffect(() => {
    if (showStatusDialog && requiredHubStatus && hubCityId) {
      api.get(`/hubs/city/${hubCityId}`).then(res => setHubs(res.data.data || []));
    }
  }, [showStatusDialog, shipment?._id, requiredHubStatus, hubCityId]);

  const handleStatusUpdate = async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      await api.post("/shipments/update-status", {
        shipmentId: shipment?._id,
        status: selectedStatus,
        ...(selectedStatus === requiredHubStatus && selectedHub ? { hubId: selectedHub } : {}),
      });
      toast({ title: "Success", description: "Status updated successfully" });
      setShowStatusDialog(false);
      setSelectedStatus("");
      setSelectedHub("");
      fetchShipment();
    } catch (e) {
      setStatusError(e?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  if (isLoading && !shipment) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <LoaderCircle size={48} />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-10 w-10 text-destructive mb-4 mx-auto" />
          <h3 className="text-lg font-medium">Shipment not found</h3>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/admin/shipments')}>Back to Shipments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/shipments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Shipment #{shipment._id}</h2>
        </div>
        {allowedStatuses.length > 0 && (
          <Button onClick={() => setShowStatusDialog(true)}>
            Update Status
          </Button>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Shipment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
            <CardDescription>Created on {shipment.createdAt ? format(new Date(shipment.createdAt), "PPP p") : "N/A"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Status:</Label> {shipment.status || "N/A"}</div>
            <div><Label>Payment Status:</Label> {shipment.paymentStatus || "N/A"}</div>
            <div><Label>Sender:</Label> {shipment.sender?.name || "N/A"}</div>
            <div><Label>Receiver:</Label> {shipment.receiver?.name || "N/A"} ({shipment.receiver?.phone || "N/A"})</div>
            <div><Label>Origin City:</Label> {shipment.originCity?.name || "N/A"}</div>
            <div><Label>Destination City:</Label> {shipment.destinationCity?.name || "N/A"}</div>
            <div><Label>Origin Hub:</Label> {shipment.originHub?.name || "N/A"}</div>
            <div><Label>Destination Hub:</Label> {shipment.destinationHub?.name || "N/A"}</div>
            <div><Label>Weight:</Label> {shipment.weight ?? "N/A"} kg</div>
            <div><Label>Price:</Label> {shipment.price ?? "N/A"}</div>
            <div><Label>QR Code ID:</Label> {shipment.qrCodeId || "N/A"}</div>
          </CardContent>
        </Card>
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Status:</Label> {payment?.status || shipment.paymentStatus || "N/A"}</div>
            <div><Label>Amount:</Label> {payment?.amount ?? shipment.price ?? "N/A"}</div>
            <div><Label>Method:</Label> {payment?.method || "N/A"}</div>
            <div><Label>Recorded:</Label> {payment?.updatedAt ? format(new Date(payment.updatedAt), "PPP p") : "N/A"}</div>
            {/* Add actions to update payment status if needed */}
          </CardContent>
        </Card>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="couriers">Couriers</TabsTrigger>
        </TabsList>
        <TabsContent value="logs">
          {/* Assign Courier 1 */}
          {!shipment.courierA && (
            <div className="mb-4 flex gap-2 items-center">
              <Select value={selectedCourierA} onValueChange={setSelectedCourierA}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign Courier 1" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleAssignCourier("A")} disabled={!selectedCourierA || assigning}>
                Assign Courier 1
              </Button>
            </div>
          )}
          {/* Assign Courier 2 if picked up and at destination hub */}
          {shipment.courierA && shipment.status === "At Destination Hub" && !shipment.courierB && (
            <div className="mb-4 flex gap-2 items-center">
              <Select value={selectedCourierB} onValueChange={setSelectedCourierB}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign Courier 2" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleAssignCourier("B")} disabled={!selectedCourierB || assigning}>
                Assign Courier 2
              </Button>
            </div>
          )}
          {/* Logs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log, idx) => (
                    <div key={idx} className="border rounded p-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.userRole || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">{log.userId?.name || log.userId || "N/A"}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{log.createdAt ? format(new Date(log.createdAt), "PPP p") : "N/A"}</span>
                      </div>
                      <div className="mt-1"><strong>{log.action}</strong>: {log.description}</div>
                      <div className="text-xs text-muted-foreground">Status: {log.status || "N/A"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No logs available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Status:</Label> {payment?.status || shipment.paymentStatus || "N/A"}</div>
              <div><Label>Amount:</Label> {payment?.amount ?? shipment.price ?? "N/A"}</div>
              <div><Label>Method:</Label> {payment?.method || "N/A"}</div>
              <div><Label>Paid At:</Label> {payment?.updatedAt ? format(new Date(payment.updatedAt), "PPP p") : "N/A"}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="couriers">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Couriers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Courier A Assignment */}
              <div>
                <div className="font-semibold mb-1">Courier 1 (A):</div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedCourierA} onValueChange={setSelectedCourierA}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={shipment.courierA?.name || "Assign Courier 1"} />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers.map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleUpdateCourier("A")} disabled={!selectedCourierA || assigning}>
                    {shipment.courierA ? "Update" : "Assign"} Courier 1
                  </Button>
                  {shipment.courierA && <span className="ml-2 text-muted-foreground">Current: {shipment.courierA.name}</span>}
                </div>
              </div>
              {/* Courier B Assignment (only if not same city and at Destination Hub) */}
              {shipment.originCity?._id !== shipment.destinationCity?._id && (
                <div>
                  <div className="font-semibold mb-1">Courier 2 (B):</div>
                  {shipment.status === "At Destination Hub" ? (
                    <div className="flex gap-2 items-center">
                      <Select value={selectedCourierB} onValueChange={setSelectedCourierB}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={shipment.courierB?.name || "Assign Courier 2"} />
                        </SelectTrigger>
                        <SelectContent>
                          {couriers.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleUpdateCourier("B")} disabled={!selectedCourierB || assigning}>
                        {shipment.courierB ? "Update" : "Assign"} Courier 2
                      </Button>
                      {shipment.courierB && <span className="ml-2 text-muted-foreground">Current: {shipment.courierB.name}</span>}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Courier 2 can only be assigned when shipment is at Destination Hub.</div>
                  )}
                </div>
              )}
              {/* If same city, show info */}
              {shipment.originCity?._id === shipment.destinationCity?._id && (
                <div className="text-muted-foreground">This is a same-city shipment. Only one courier is needed.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <select
              className="border rounded px-3 py-2 w-full"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="">Select status</option>
              {allowedStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {selectedStatus === requiredHubStatus && (
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedHub}
                onChange={e => setSelectedHub(e.target.value)}
              >
                <option value="">Select {requiredHubStatus === "At Origin Hub" ? "Origin Hub" : "Destination Hub"}</option>
                {hubs.map(hub => (
                  <option key={hub._id} value={hub._id}>{hub.name}</option>
                ))}
              </select>
            )}
            {statusError && <div className="text-red-600">{statusError}</div>}
          </div>
          <DialogFooter>
            <Button
              onClick={handleStatusUpdate}
              disabled={statusLoading || !selectedStatus || (selectedStatus === requiredHubStatus && !selectedHub)}
            >
              {statusLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 