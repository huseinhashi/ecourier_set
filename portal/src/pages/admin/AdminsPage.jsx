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
import { Eye, Shield, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ValidationError, FormError, ErrorInput } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";

export const AdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    role: "admin",
  });

  // Use our custom hooks for form validation and API requests
  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => row.original.name || "N/A" },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "N/A" },
    { 
      accessorKey: "role", 
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <div className="px-2 py-1 rounded text-xs font-medium inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Administrator
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
            <Shield className="h-4 w-4 text-muted-foreground" />
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
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [searchTerm, admins]);

  const fetchAdmins = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/users/admins'
      });
      setAdmins(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const filterAdmins = () => {
    const filtered = admins.filter((admin) =>
      (admin.name && admin.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.phone && admin.phone.includes(searchTerm))
    );
    setFilteredAdmins(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      password: "",
      role: "admin",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      ...admin,
      password: "" // Always reset password field when editing
    });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
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
          successMessage: 'Administrator added successfully',
          onSuccess: () => {
            fetchAdmins();
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
          url: `/users/${selectedAdmin._id}`,
          data: updatedData
        },
        {
          successMessage: 'Administrator updated successfully',
          onSuccess: () => {
            fetchAdmins();
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
          url: `/users/${selectedAdmin._id}`
        },
        {
          successMessage: 'Administrator deleted successfully',
          onSuccess: () => {
            fetchAdmins();
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
        <h2 className="text-3xl font-bold tracking-tight">Administrators</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Administrator
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search administrators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredAdmins} 
        isLoading={isLoading} 
        noResultsMessage="No administrators found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name", "text", "Enter administrator name")}
            {renderFormField("Phone", "phone", "tel", "Enter phone number")}
            {renderFormField("Password", "password", "password", "Enter password")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Administrator"}
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
            <DialogTitle>Edit Administrator</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Name", "name", "text", "Enter administrator name")}
            {renderFormField("Phone", "phone", "tel", "Enter phone number")}
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
            <DialogTitle>Delete Administrator</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedAdmin?.name}?</p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The administrator will be permanently removed from the system.
          </p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Administrator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 