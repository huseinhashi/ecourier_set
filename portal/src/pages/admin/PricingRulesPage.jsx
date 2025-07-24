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
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ValidationError, FormError } from "@/components/ErrorComponents";
import { handleRequestError, useFormValidation, hasFieldError } from "@/utils/errorHandling";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const PricingRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    originCity: "",
    destinationCity: "",
    basePrice: "",
    pricePerKg: "",
  });

  const { validationErrors, setErrors, clearErrors, clearFieldError } = useFormValidation();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();

  const columns = [
    {
      accessorKey: "originCity",
      header: "Origin City",
      cell: ({ row }) => row.original.originCity?.name || row.original.originCity || "N/A"
    },
    {
      accessorKey: "destinationCity",
      header: "Destination City",
      cell: ({ row }) => row.original.destinationCity?.name || row.original.destinationCity || "N/A"
    },
    { accessorKey: "basePrice", header: "Base Price" },
    { accessorKey: "pricePerKg", header: "Price per Kg" },
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
    fetchRules();
    fetchCities();
  }, []);

  useEffect(() => {
    filterRules();
  }, [searchTerm, rules]);

  const fetchRules = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/pricing-rules'
      });
      setRules(data.data || []);
    } catch (error) {}
  };

  const fetchCities = async () => {
    try {
      const data = await request({
        method: 'GET',
        url: '/cities'
      });
      setCities(data.data || []);
    } catch (error) {}
  };

  const filterRules = () => {
    const filtered = rules.filter((rule) => {
      const originName = rule.originCity && typeof rule.originCity === "object" ? rule.originCity.name : rule.originCity;
      const destName = rule.destinationCity && typeof rule.destinationCity === "object" ? rule.destinationCity.name : rule.destinationCity;
      return (
        (originName && originName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (destName && destName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    setFilteredRules(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      originCity: "",
      destinationCity: "",
      basePrice: "",
      pricePerKg: "",
    });
    clearErrors();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (rule) => {
    setSelectedRule(rule);
    setFormData({ ...rule });
    clearErrors();
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (rule) => {
    setSelectedRule(rule);
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
    if (!formData.originCity) errors.originCity = "Origin city is required";
    if (!formData.destinationCity) errors.destinationCity = "Destination city is required";
    if (!formData.basePrice || isNaN(formData.basePrice) || Number(formData.basePrice) < 0) errors.basePrice = "Base price must be a positive number";
    if (!formData.pricePerKg || isNaN(formData.pricePerKg) || Number(formData.pricePerKg) < 0) errors.pricePerKg = "Price per Kg must be a positive number";
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
          url: '/pricing-rules',
          data: formData
        },
        {
          successMessage: 'Pricing rule added successfully',
          onSuccess: () => {
            fetchRules();
            setIsAddDialogOpen(false);
          },
          onError: (errors) => setErrors(errors)
        }
      );
    } catch (error) {}
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
          url: `/pricing-rules/${selectedRule._id}`,
          data: formData
        },
        {
          successMessage: 'Pricing rule updated successfully',
          onSuccess: () => {
            fetchRules();
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
          url: `/pricing-rules/${selectedRule._id}`
        },
        {
          successMessage: 'Pricing rule deleted successfully',
          onSuccess: () => {
            fetchRules();
            setIsDeleteDialogOpen(false);
          }
        }
      );
    } catch (error) {}
  };

  const renderFormField = (label, name, type = "text", placeholder = "", isSelect = false) => {
    const hasError = hasFieldError(validationErrors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    if (isSelect) {
      return (
        <div className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Select value={formData[name]} onValueChange={(value) => handleSelectChange(name, value)}>
            <SelectTrigger className={errorClass}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city._id} value={city._id}>{city.name}</SelectItem>
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
        <h2 className="text-3xl font-bold tracking-tight">Pricing Rules</h2>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pricing rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredRules} 
        isLoading={isLoading} 
        noResultsMessage="No pricing rules found"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) clearErrors();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pricing Rule</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Origin City", "originCity", "text", "", true)}
            {renderFormField("Destination City", "destinationCity", "text", "", true)}
            {renderFormField("Base Price", "basePrice", "number", "Enter base price")}
            {renderFormField("Price per Kg", "pricePerKg", "number", "Enter price per kg")}
          </form>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Pricing Rule"}
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
            <DialogTitle>Edit Pricing Rule</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <FormError error={validationErrors.general} />
            {renderFormField("Origin City", "originCity", "text", "", true)}
            {renderFormField("Destination City", "destinationCity", "text", "", true)}
            {renderFormField("Base Price", "basePrice", "number", "Enter base price")}
            {renderFormField("Price per Kg", "pricePerKg", "number", "Enter price per kg")}
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
            <DialogTitle>Delete Pricing Rule</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this pricing rule?</p>
          {validationErrors.general && (
            <FormError error={validationErrors.general} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Pricing Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 