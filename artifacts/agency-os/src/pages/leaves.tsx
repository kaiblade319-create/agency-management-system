import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { Plus, Umbrella, Sun, Palmtree, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface LeaveRequest {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedOn: string;
}

const MOCK_REQUESTS: LeaveRequest[] = [
  { id: "1", type: "Annual Leave", from: "2026-06-15", to: "2026-06-17", days: 3, reason: "Family vacation", status: "APPROVED", appliedOn: "2026-06-05" },
  { id: "2", type: "Sick Leave", from: "2026-06-10", to: "2026-06-10", days: 1, reason: "Fever", status: "APPROVED", appliedOn: "2026-06-09" },
  { id: "3", type: "Annual Leave", from: "2026-07-01", to: "2026-07-03", days: 3, reason: "Trip to Coorg", status: "PENDING", appliedOn: "2026-06-08" },
];

const STATUS_MAP = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
};

const LEAVE_BALANCE = [
  { type: "Annual Leave", icon: <Palmtree className="h-4 w-4 text-emerald-500" />, used: 6, total: 21 },
  { type: "Sick Leave", icon: <AlertCircle className="h-4 w-4 text-rose-500" />, used: 1, total: 10 },
  { type: "Casual Leave", icon: <Sun className="h-4 w-4 text-amber-500" />, used: 2, total: 7 },
];

interface LeaveFormData {
  type: string;
  from: string;
  to: string;
  reason: string;
}

export default function LeavesPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<LeaveFormData>({
    defaultValues: { type: "Annual Leave" },
  });

  const onSubmit = (data: LeaveFormData) => {
    const from = new Date(data.from);
    const to = new Date(data.to);
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;
    const newReq: LeaveRequest = {
      id: String(Date.now()),
      type: data.type,
      from: data.from,
      to: data.to,
      days,
      reason: data.reason,
      status: "PENDING",
      appliedOn: format(new Date(), "yyyy-MM-dd"),
    };
    setRequests((prev) => [newReq, ...prev]);
    toast.success("Leave request submitted successfully");
    setDialogOpen(false);
    reset();
  };

  return (
    <div className="p-6 space-y-6 animated-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Apply for leave and track approvals</p>
        </div>
        <Button onClick={() => { reset({ type: "Annual Leave" }); setDialogOpen(true); }} className="gap-2 btn-micro-anim" data-testid="apply-leave-btn">
          <Plus className="h-4 w-4" /> Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LEAVE_BALANCE.map((lb) => (
          <Card key={lb.type}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                {lb.icon}
                <p className="font-semibold text-sm">{lb.type}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold font-heading">{lb.total - lb.used}</p>
                  <p className="text-xs text-muted-foreground">remaining of {lb.total}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{lb.used} used</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(lb.used / lb.total) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Umbrella className="h-4 w-4 text-primary" /> My Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Umbrella className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No leave requests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const sc = STATUS_MAP[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.type}</TableCell>
                      <TableCell>{format(new Date(r.from), "dd MMM yyyy")}</TableCell>
                      <TableCell>{format(new Date(r.to), "dd MMM yyyy")}</TableCell>
                      <TableCell>{r.days}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason}</TableCell>
                      <TableCell><Badge variant="secondary" className={sc.className}>{sc.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Controller control={control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>From Date</Label><Input {...register("from", { required: true })} type="date" data-testid="leave-from" /></div>
              <div className="space-y-1.5"><Label>To Date</Label><Input {...register("to", { required: true })} type="date" data-testid="leave-to" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea {...register("reason", { required: true })} rows={3} placeholder="Brief reason for leave..." data-testid="leave-reason" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="submit-leave-btn">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
