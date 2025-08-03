import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from '@/components/LoaderCircle';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/api_calls';
import { shortenId } from '@/lib/utils';

const REPORT_TYPES = [
  { label: 'Shipments', value: 'shipments' },
  { label: 'Users', value: 'users' },
  { label: 'Payments', value: 'payments' },
];

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom Range', value: 'custom' },
];

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('shipments');
  const [dateFilter, setDateFilter] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [count, setCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [reportType, dateFilter]);

  const fetchReport = async () => {
    setLoading(true);
    let params = `filter=${dateFilter}`;
    if (dateFilter === 'custom' && from && to) {
      params += `&from=${from}&to=${to}`;
    }
    try {
      const res = await api.get(`/reports/${reportType}?${params}`);
      setReportData(res.data.data);
      setCount(res.data.count);
    } catch (err) {
      setReportData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Define columns for each report type
  const columns = useMemo(() => {
    if (reportType === 'shipments') {
      return [
        { accessorKey: '_id', header: 'ID', cell: ({ row }) => shortenId(row.original._id) },
        { accessorKey: 'sender', header: 'Sender', cell: ({ row }) => row.original.sender?.name || row.original.sender || 'N/A' },
        { accessorKey: 'receiver', header: 'Receiver', cell: ({ row }) => row.original.receiver?.name || (typeof row.original.receiver === 'string' ? row.original.receiver : 'N/A') },
        { accessorKey: 'originCity', header: 'Origin City', cell: ({ row }) => row.original.originCity?.name || row.original.originCity || 'N/A' },
        { accessorKey: 'destinationCity', header: 'Destination City', cell: ({ row }) => row.original.destinationCity?.name || row.original.destinationCity || 'N/A' },
        { accessorKey: 'weight', header: 'Weight', cell: ({ row }) => row.original.weight ?? 'N/A' },
        { accessorKey: 'price', header: 'Price', cell: ({ row }) => row.original.price ?? 'N/A' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => row.original.status || 'N/A' },
        { accessorKey: 'paymentStatus', header: 'Payment Status', cell: ({ row }) => row.original.paymentStatus || 'N/A' },
        { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : 'N/A' },
      ];
    } else if (reportType === 'users') {
      return [
        { accessorKey: '_id', header: 'ID', cell: ({ row }) => shortenId(row.original._id) },
        { accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name || 'N/A' },
        { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone || 'N/A' },
        { accessorKey: 'role', header: 'Role', cell: ({ row }) => row.original.role || 'N/A' },
        { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : 'N/A' },
      ];
    } else if (reportType === 'payments') {
      return [
        { accessorKey: '_id', header: 'ID', cell: ({ row }) => shortenId(row.original._id) },
        { accessorKey: 'user', header: 'User', cell: ({ row }) => row.original.user?.name || row.original.user || 'N/A' },
        { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => row.original.amount ?? 'N/A' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => row.original.status || 'N/A' },
        { accessorKey: 'method', header: 'Method', cell: ({ row }) => row.original.method || 'N/A' },
        { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : 'N/A' },
      ];
    }
    return [];
  }, [reportType]);

  // PDF Export logic
  const handleExportPDF = () => {
    if (!reportData.length) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${REPORT_TYPES.find(r => r.value === reportType).label} Report`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    // Prepare table data
    let head = [];
    let body = [];
    if (reportType === 'shipments') {
      head = [['ID', 'Sender', 'Receiver', 'Origin City', 'Destination City', 'Weight', 'Price', 'Status', 'Payment Status', 'Created At']];
      body = reportData.map(row => [
        row._id,
        row.sender?.name || row.sender || '',
        row.receiver?.name || (typeof row.receiver === 'string' ? row.receiver : ''),
        row.originCity?.name || row.originCity || '',
        row.destinationCity?.name || row.destinationCity || '',
        row.weight,
        row.price,
        row.status,
        row.paymentStatus,
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]);
    } else if (reportType === 'users') {
      head = [['ID', 'Name', 'Phone', 'Role', 'Created At']];
      body = reportData.map(row => [
        row._id,
        row.name,
        row.phone,
        row.role,
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]);
    } else if (reportType === 'payments') {
      head = [['ID', 'User', 'Amount', 'Status', 'Method', 'Created At']];
      body = reportData.map(row => [
        row._id,
        row.user?.name || row.user || '',
        row.amount,
        row.status,
        row.method,
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]);
    }
    try {
      autoTable(doc, {
        startY: 40,
        head,
        body,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 40 },
      });
      doc.save(`${reportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({
        title: 'Success',
        description: 'PDF generated successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map(rt => (
                <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map(df => (
                <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dateFilter === 'custom' && (
            <>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" placeholder="From" />
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" placeholder="To" />
              <Button onClick={fetchReport} disabled={!from || !to || loading}>Apply</Button>
            </>
          )}
          <Button onClick={handleExportPDF} disabled={loading || reportData.length === 0}>Export PDF</Button>
        </div>
      </div>
      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32"><LoaderCircle className="animate-spin h-8 w-8" /></div>
        ) : (
          <DataTable columns={columns} data={reportData} pageSize={15} />
        )}
      </Card>
    </div>
  );
};

export default ReportsPage; 