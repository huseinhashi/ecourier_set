import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api_calls";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Building, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const HubsPage = () => {
  const [hubs, setHubs] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredHubs, setFilteredHubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Hub Name" },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => row.original.city?.name || row.original.city || "N/A"
    },
    { accessorKey: "address", header: "Address" },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        return row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "N/A";
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditClick(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteClick(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  useEffect(() => {
    fetchHubs();
    fetchCities();
  }, []);

  useEffect(() => {
    filterHubs();
  }, [searchTerm, hubs]);

  const fetchHubs = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/hubs'
      });
      setHubs(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const fetchCities = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/cities'
      });
      setCities(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterHubs = () => {
    const filtered = hubs.filter((hub) => {
      const cityName = hub.city && typeof hub.city === "object" ? hub.city.name : hub.city;
      return (
        (hub.name && hub.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cityName && cityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (hub.address && hub.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    setFilteredHubs(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      city: "",
      address: "",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (hub) => {
    setSelectedHub(hub);
    setFormData({
      name: hub.name,
      city: hub.city?._id || hub.city,
      address: hub.address || "",
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (hub) => {
    setSelectedHub(hub);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    clearFieldError(name);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return "Hub name is required";
    }
    if (/^\d/.test(name)) {
      return "Hub name cannot start with a number";
    }
    if (name.length < 2) {
      return "Hub name must be at least 2 characters long";
    }
    if (name.length > 100) {
      return "Hub name must be less than 100 characters";
    }
    return null;
  };

  const validateCity = (city) => {
    if (!city) {
      return "City is required";
    }
    return null;
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required";
    }
    if (address.length < 10) {
      return "Address must be at least 10 characters long";
    }
    if (address.length > 200) {
      return "Address must be less than 200 characters";
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};

    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;

    const cityError = validateCity(formData.city);
    if (cityError) errors.city = cityError;

    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;

    return errors;
  };

  const handleAdd = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      await request(
        {
          method: 'POST',
          url: '/hubs',
          data: formData
        },
        {
          successMessage: 'Hub added successfully',
          onSuccess: () => {
            fetchHubs();
            setIsAddDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleEdit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      await request(
        {
          method: 'PUT',
          url: `/hubs/${selectedHub._id}`,
          data: formData
        },
        {
          successMessage: 'Hub updated successfully',
          onSuccess: () => {
            fetchHubs();
            setIsEditDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  const handleDelete = async () => {
    try {
      await request(
        {
          method: 'DELETE',
          url: `/hubs/${selectedHub._id}`
        },
        {
          successMessage: 'Hub deleted successfully',
          onSuccess: () => {
            fetchHubs();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  // Create a reusable function for form field rendering
  const renderFormField = (label, name, type = "text", placeholder = "", isTextarea = false, options = null) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        {options ? (
          <Select
            value={formData[name]}
            onValueChange={(value) => handleSelectChange(name, value)}
          >
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : isTextarea ? (
          <Textarea
            id={name}
            name={name}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className={errorClass}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className={errorClass}
            placeholder={placeholder}
          />
        )}
        <ValidationError message={validationErrors[name]} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Hubs</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hub
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredHubs}
        isLoading={isLoading}
        noResultsMessage="No hubs found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hub</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Hub Name", "name", "text", "Enter hub name")}
            {renderFormField("City", "city", null, null, false, cities.map(city => ({ value: city._id, label: city.name })))}
            {renderFormField("Address", "address", "text", "Enter hub address", true)}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hub</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Hub Name", "name", "text", "Enter hub name")}
            {renderFormField("City", "city", null, null, false, cities.map(city => ({ value: city._id, label: city.name })))}
            {renderFormField("Address", "address", "text", "Enter hub address", true)}
          </form>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hub</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedHub?.name}?</p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The hub will be permanently removed from the system.
          </p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Hub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 