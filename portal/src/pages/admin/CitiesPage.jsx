import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/api_calls";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MapPin, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const CitiesPage = () => {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "City Name", cell: ({ row }) => row.original.name || "N/A" },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "N/A"
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
    fetchCities();
  }, []);

  useEffect(() => {
    filterCities();
  }, [searchTerm, cities]);

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

  const filterCities = () => {
    const filtered = cities.filter((city) =>
      (city.name && city.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCities(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (city) => {
    setSelectedCity(city);
    setFormData({
      ...city,
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (city) => {
    setSelectedCity(city);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    clearFieldError(name);
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return "City name is required";
    }
    if (/^\d/.test(name)) {
      return "City name cannot start with a number";
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return "City name can only contain letters and spaces";
    }
    if (name.length < 2) {
      return "City name must be at least 2 characters long";
    }
    if (name.length > 50) {
      return "City name must be less than 50 characters";
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};

    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;

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
          url: '/cities',
          data: formData
        },
        {
          successMessage: 'City added successfully',
          onSuccess: () => {
            fetchCities();
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
          url: `/cities/${selectedCity._id}`,
          data: formData
        },
        {
          successMessage: 'City updated successfully',
          onSuccess: () => {
            fetchCities();
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
          url: `/cities/${selectedCity._id}`
        },
        {
          successMessage: 'City deleted successfully',
          onSuccess: () => {
            fetchCities();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  // Create a reusable function for form field rendering
  const renderFormField = (label, name, type = "text", placeholder = "") => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';

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
        <h2 className="text-3xl font-bold tracking-tight">Cities</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add City
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCities}
        isLoading={isLoading}
        noResultsMessage="No cities found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("City Name", "name", "text", "Enter city name")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add City"}
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
            <DialogTitle>Edit City</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("City Name", "name", "text", "Enter city name")}
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
            <DialogTitle>Delete City</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedCity?.name}?</p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The city will be permanently removed from the system.
          </p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete City"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 