import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { ValidationError, FormError } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";

export const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cities, setCities] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sender: "",
    receiverType: "dropdown", // 'dropdown' or 'manual'
    receiverUserId: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    originCity: "",
    destinationCity: "",
    weight: "",
    note: "",
  });
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const [sameCity, setSameCity] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [editStep, setEditStep] = useState(1);
  const [editSameCity, setEditSameCity] = useState(false);

  const columns = [
    { accessorKey: "_id", header: "ID", cell: ({ row }) => row.original._id || "N/A" },
    { accessorKey: "sender", header: "Sender", cell: ({ row }) => row.original.sender?.name || "N/A" },
    { accessorKey: "receiver", header: "Receiver", cell: ({ row }) => row.original.receiver?.name || "N/A" },
    { accessorKey: "originCity", header: "Origin City", cell: ({ row }) => row.original.originCity?.name || "N/A" },
    { accessorKey: "destinationCity", header: "Destination City", cell: ({ row }) => row.original.destinationCity?.name || "N/A" },
    { accessorKey: "originHub", header: "Origin Hub", cell: ({ row }) => row.original.originHub?.name || "N/A" },
    { accessorKey: "destinationHub", header: "Destination Hub", cell: ({ row }) => row.original.destinationHub?.name || "N/A" },
    { accessorKey: "weight", header: "Weight", cell: ({ row }) => row.original.weight ?? "N/A" },
    { accessorKey: "price", header: "Price", cell: ({ row }) => row.original.price ?? "N/A" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => row.original.status || "N/A" },
    { accessorKey: "paymentStatus", header: "Payment Status", cell: ({ row }) => row.original.paymentStatus || "N/A" },
    { accessorKey: "createdAt", header: "Created At", cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "N/A" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/admin/shipments/${row.original._id}`)}>
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row.original)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row.original)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchShipments();
    fetchCustomers();
    fetchCities();
    fetchHubs();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [searchTerm, shipments]);

  const fetchShipments = async () => {
    try {
      const data = await request({ method: 'GET', url: '/shipments' });
      setShipments(data.data || []);
    } catch (error) {}
  };

  const fetchCustomers = async () => {
    try {
      const data = await request({ method: 'GET', url: '/users/customers' });
      setCustomers(data.data || []);
    } catch (error) {}
  };

  const fetchCities = async () => {
    try {
      const data = await request({ method: 'GET', url: '/cities' });
      setCities(data.data || []);
    } catch (error) {}
  };

  const fetchHubs = async () => {
    try {
      const data = await request({ method: 'GET', url: '/hubs' });
      setHubs(data.data || []);
    } catch (error) {}
  };

  const filterShipments = () => {
    const filtered = shipments.filter((shipment) => {
      const senderName = shipment.sender?.name || "";
      const receiverName = shipment.receiver?.name || "";
      const originCity = shipment.originCity?.name || "";
      const destinationCity = shipment.destinationCity?.name || "";
      return (
        senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        originCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destinationCity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredShipments(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      sender: "",
      receiverType: "dropdown",
      receiverUserId: "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      originCity: "",
      destinationCity: "",
      weight: "",
    });
    setSameCity(false);
    setAddStep(1);
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleAddNext = () => {
    // Validate step 1
    const errors = {};
    if (!formData.sender) errors.sender = "Sender is required";
    if (formData.receiverType === "dropdown" && !formData.receiverUserId && !formData.receiverName) {
      errors.receiverUserId = "Select a customer or enter manual info";
    }
    if (formData.receiverType === "manual") {
      if (!formData.receiverName) errors.receiverName = "Receiver name is required";
      if (!formData.receiverPhone) errors.receiverPhone = "Receiver phone is required";
      if (!formData.receiverAddress) errors.receiverAddress = "Receiver address is required";
    }
    setErrors(errors);
    if (Object.keys(errors).length === 0) setAddStep(2);
  };

  const handleAddBack = () => setAddStep(1);

  const handleEditClick = (shipment) => {
    setSelectedShipment(shipment);
    setFormData({
      sender: shipment.sender?._id || "",
      receiverType: shipment.receiver?.userId ? "dropdown" : "manual",
      receiverUserId: shipment.receiver?.userId || "",
      receiverName: shipment.receiver?.name || "",
      receiverPhone: shipment.receiver?.phone || "",
      receiverAddress: shipment.receiver?.address || "",
      originCity: shipment.originCity?._id || "",
      destinationCity: shipment.destinationCity?._id || "",
      originHub: shipment.originHub?._id || "",
      destinationHub: shipment.destinationHub?._id || "",
      weight: shipment.weight?.toString() || "",
    });
    setEditSameCity(shipment.originCity?._id === shipment.destinationCity?._id);
    setEditStep(1);
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleEditNext = () => {
    // Validate step 1
    const errors = {};
    if (!formData.sender) errors.sender = "Sender is required";
    if (formData.receiverType === "dropdown" && !formData.receiverUserId && !formData.receiverName) {
      errors.receiverUserId = "Select a customer or enter manual info";
    }
    if (formData.receiverType === "manual") {
      if (!formData.receiverName) errors.receiverName = "Receiver name is required";
      if (!formData.receiverPhone) errors.receiverPhone = "Receiver phone is required";
      if (!formData.receiverAddress) errors.receiverAddress = "Receiver address is required";
    }
    setErrors(errors);
    if (Object.keys(errors).length === 0) setEditStep(2);
  };

  const handleEditBack = () => setEditStep(1);

  const handleDeleteClick = (shipment) => {
    setSelectedShipment(shipment);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sender) errors.sender = "Sender is required";
    if (formData.receiverType === "dropdown" && !formData.receiverUserId && !formData.receiverName) {
      errors.receiverUserId = "Select a customer or enter manual info";
    }
    if (formData.receiverType === "manual") {
      if (!formData.receiverName) errors.receiverName = "Receiver name is required";
      if (!formData.receiverPhone) errors.receiverPhone = "Receiver phone is required";
      if (!formData.receiverAddress) errors.receiverAddress = "Receiver address is required";
    }
    if (!formData.originCity) errors.originCity = "Origin city is required";
    if (!formData.destinationCity) errors.destinationCity = "Destination city is required";
    if (!formData.weight || isNaN(formData.weight) || Number(formData.weight) <= 0) errors.weight = "Weight must be a positive number";
    return errors;
  };

  const validateEditForm = () => {
    const errors = {};
    if (!formData.sender) errors.sender = "Sender is required";
    if (formData.receiverType === "dropdown" && !formData.receiverUserId && !formData.receiverName) {
      errors.receiverUserId = "Select a customer or enter manual info";
    }
    if (formData.receiverType === "manual") {
      if (!formData.receiverName) errors.receiverName = "Receiver name is required";
      if (!formData.receiverPhone) errors.receiverPhone = "Receiver phone is required";
      if (!formData.receiverAddress) errors.receiverAddress = "Receiver address is required";
    }
    if (!formData.originCity) errors.originCity = "Origin city is required";
    if (!formData.destinationCity) errors.destinationCity = "Destination city is required";
    if (!formData.weight || isNaN(formData.weight) || Number(formData.weight) <= 0) errors.weight = "Weight must be a positive number";
    // Remove required validation for originHub and destinationHub
    return errors;
  };

  const handleAdd = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    try {
      const receiver = formData.receiverType === "dropdown" && formData.receiverUserId
        ? { userId: formData.receiverUserId }
        : { name: formData.receiverName, phone: formData.receiverPhone, address: formData.receiverAddress };
      await request(
        {
          method: 'POST',
          url: '/shipments',
          data: {
            sender: formData.sender,
            receiver,
            originCity: formData.originCity,
            destinationCity: formData.destinationCity,
            weight: formData.weight,
          }
        },
        {
          successMessage: 'Shipment created successfully',
          onSuccess: () => {
            fetchShipments();
            setIsAddDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {}
  };

  const handleEdit = async () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    try {
      const receiver = formData.receiverType === "dropdown"
        ? { userId: formData.receiverUserId }
        : { name: formData.receiverName, phone: formData.receiverPhone, address: formData.receiverAddress };
      const updatePayload = {
        sender: formData.sender,
        receiver,
        originCity: formData.originCity,
        destinationCity: formData.destinationCity,
        weight: formData.weight,
      };
      if (!editSameCity && formData.originHub) updatePayload.originHub = formData.originHub;
      if (!editSameCity && formData.destinationHub) updatePayload.destinationHub = formData.destinationHub;
      await request(
        {
          method: 'PUT',
          url: `/shipments/${selectedShipment._id}`,
          data: updatePayload,
        },
        {
          successMessage: 'Shipment updated successfully',
          onSuccess: () => {
            fetchShipments();
            setIsEditDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {}
  };

  const handleDelete = async () => {
    try {
      await request(
        {
          method: 'DELETE',
          url: `/shipments/${selectedShipment._id}`
        },
        {
          successMessage: 'Shipment deleted successfully',
          onSuccess: () => {
            fetchShipments();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {}
  };

  const renderFormField = (label, name, type = "text", placeholder = "", options = null) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    if (options) {
      return (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Select value={formData[name]} onValueChange={(value) => handleSelectChange(name, value)}>
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ValidationError message={validationErrors[name]} />
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          type={type}
          value={formData[name] || ""}
          onChange={handleInputChange}
          className={errorClass}
          placeholder={placeholder}
        />
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shipment
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredShipments} 
        isLoading={isLoading} 
        noResultsMessage="No shipments found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shipment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); addStep === 2 ? handleAdd() : handleAddNext(); }}>
            <FormError error={validationErrors.general} />
            {addStep === 1 && (
              <>
                {renderFormField("Sender", "sender", null, null, customers.map(c => ({ value: c._id, label: c.name })))}
                <div className="space-y-2">
                  <Label>Receiver</Label>
                  <Select value={formData.receiverType} onValueChange={v => handleSelectChange("receiverType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select receiver type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropdown">Registered Customer</SelectItem>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.receiverType === "dropdown"
                  ? renderFormField("Receiver", "receiverUserId", null, null, customers.map(c => ({ value: c._id, label: c.name })) )
                  : <>
                      {renderFormField("Receiver Name", "receiverName")}
                      {renderFormField("Receiver Phone", "receiverPhone")}
                      {renderFormField("Receiver Address", "receiverAddress")}
                    </>
                }
                <div className="flex justify-end">
                  <Button type="button" onClick={handleAddNext}>Next</Button>
                </div>
              </>
            )}
            {addStep === 2 && (
              <>
                {renderFormField("Origin City", "originCity", null, null, cities.map(c => ({ value: c._id, label: c.name })))}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sameCity" checked={sameCity} onChange={e => {
                    setSameCity(e.target.checked);
                    if (e.target.checked) setFormData(f => ({ ...f, destinationCity: f.originCity }));
                  }} />
                  <Label htmlFor="sameCity">Same city for origin and destination</Label>
                </div>
                {!sameCity && renderFormField("Destination City", "destinationCity", null, null, cities.map(c => ({ value: c._id, label: c.name })))}
                {renderFormField("Weight", "weight", "number", "Enter weight in kg")}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleAddBack}>Back</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading ? "Adding..." : "Add Shipment"}</Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); editStep === 2 ? handleEdit() : handleEditNext(); }}>
            <FormError error={validationErrors.general} />
            {editStep === 1 && (
              <>
                {renderFormField("Sender", "sender", null, null, customers.map(c => ({ value: c._id, label: c.name })))}
                <div className="space-y-2">
                  <Label>Receiver</Label>
                  <Select value={formData.receiverType} onValueChange={v => handleSelectChange("receiverType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select receiver type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropdown">Registered Customer</SelectItem>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.receiverType === "dropdown"
                  ? renderFormField("Receiver", "receiverUserId", null, null, customers.map(c => ({ value: c._id, label: c.name })) )
                  : <>
                      {renderFormField("Receiver Name", "receiverName")}
                      {renderFormField("Receiver Phone", "receiverPhone")}
                      {renderFormField("Receiver Address", "receiverAddress")}
                    </>
                }
                <div className="flex justify-end">
                  <Button type="button" onClick={handleEditNext}>Next</Button>
                </div>
              </>
            )}
            {editStep === 2 && (
              <>
                {renderFormField("Origin City", "originCity", null, null, cities.map(c => ({ value: c._id, label: c.name })))}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="editSameCity" checked={editSameCity} onChange={e => {
                    setEditSameCity(e.target.checked);
                    if (e.target.checked) setFormData(f => ({ ...f, destinationCity: f.originCity }));
                  }} />
                  <Label htmlFor="editSameCity">Same city for origin and destination</Label>
                </div>
                {!editSameCity && renderFormField("Destination City", "destinationCity", null, null, cities.map(c => ({ value: c._id, label: c.name })))}
                {renderFormField("Weight", "weight", "number", "Enter weight in kg")}
                {!editSameCity && renderFormField("Origin Hub", "originHub", null, null, hubs.map(h => ({ value: h._id, label: h.name })))}
                {!editSameCity && renderFormField("Destination Hub", "destinationHub", null, null, hubs.map(h => ({ value: h._id, label: h.name })))}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleEditBack}>Back</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this shipment?</p>
          <FormError error={validationErrors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 