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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Eye, User, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    address: "",
    role: "customer",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => row.original.name || "N/A" },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "N/A" },
    { accessorKey: "address", header: "Address", cell: ({ row }) => row.original.address || "N/A" },
    { 
      accessorKey: "role", 
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <div className="px-2 py-1 rounded text-xs font-medium inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Customer
          </div>
        );
      }
    },
    { 
      accessorKey: "avatar", 
      header: "Avatar",
      cell: ({ row }) => {
        const avatar = row.original.avatar;
        if (avatar) {
          return (
            <img 
              src={`${import.meta.env.VITE_API_URL}/uploads/${avatar}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          );
        }
        return (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        );
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
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users/customers'
      });
      setCustomers(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterCustomers = () => {
    const filtered = customers.filter((customer) =>
      (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      address: "",
      role: "customer",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      ...customer,
      password: "" // Always reset password field when editing
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone field - only allow digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear field-specific error when user starts typing
    clearFieldError(name);
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (/^\d/.test(name)) {
      return "Name cannot start with a number";
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return "Name can only contain letters and spaces";
    }
    if (name.length < 2) {
      return "Name must be at least 2 characters long";
    }
    return null;
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (cleanPhone.length > 15) {
      return "Phone number must be at most 15 digits";
    }
    if (!/^\d+$/.test(cleanPhone)) {
      return "Phone number can only contain digits";
    }
    return null;
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required for customers";
    }
    if (address.length < 10) {
      return "Address must be at least 10 characters long";
    }
    return null;
  };

  const validatePassword = (password, isEdit = false) => {
    if (!isEdit && !password.trim()) {
      return "Password is required";
    }
    if (password && password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (password && !/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (password && !/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (password && !/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    
    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;
    
    const passwordError = validatePassword(formData.password, isEditDialogOpen);
    if (passwordError) errors.password = passwordError;
    
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
          url: '/users',
          data: formData
        },
        {
          successMessage: 'Customer added successfully',
          onSuccess: () => {
            fetchCustomers();
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
      const updatedData = { ...formData };
      if (!updatedData.password) {
        delete updatedData.password; // Remove password if it's blank
      }

      await request(
        {
          method: 'PUT',
          url: `/users/${selectedCustomer._id}`,
          data: updatedData
        },
        {
          successMessage: 'Customer updated successfully',
          onSuccess: () => {
            fetchCustomers();
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
          url: `/users/${selectedCustomer._id}`
        },
        {
          successMessage: 'Customer deleted successfully',
          onSuccess: () => {
            fetchCustomers();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {
      // Errors are already handled by the request hook
    }
  };

  // Create a reusable function for form field rendering
  const renderFormField = (label, name, type = "text", placeholder = "", isTextarea = false) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        {isTextarea ? (
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
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredCustomers} 
        isLoading={isLoading} 
        noResultsMessage="No customers found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name", "text", "Enter customer name")}
            {renderFormField("Phone", "phone", "tel", "Enter phone number")}
            {renderFormField("Address", "address", "text", "Enter customer address", true)}
            {renderFormField("Password", "password", "password", "Enter password")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Customer"}
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
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name", "text", "Enter customer name")}
            {renderFormField("Phone", "phone", "tel", "Enter phone number")}
            {renderFormField("Address", "address", "text", "Enter customer address", true)}
            {renderFormField("New Password (leave blank to keep current)", "password", "password", "Enter new password")}
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
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedCustomer?.name}?</p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The customer will be permanently removed from the system.
          </p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 