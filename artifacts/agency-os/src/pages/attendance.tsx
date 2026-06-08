import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, startOfDay, differenceInMinutes } from "date-fns";
import { Clock, LogIn, LogOut, CheckCircle, Users } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string | null;
  status: "present" | "wfh" | "half-day";
}

const MOCK_HISTORY: AttendanceRecord[] = [
  { id: "1", date: "2026-06-07", checkIn: "09:02 AM", checkOut: "06:15 PM", duration: "9h 13m", status: "present" },
  { id: "2", date: "2026-06-06", checkIn: "09:18 AM", checkOut: "06:00 PM", duration: "8h 42m", status: "present" },
  { id: "3", date: "2026-06-05", checkIn: "09:45 AM", checkOut: "02:30 PM", duration: "4h 45m", status: "half-day" },
  { id: "4", date: "2026-06-04", checkIn: "09:00 AM", checkOut: "06:05 PM", duration: "9h 5m", status: "wfh" },
  { id: "5", date: "2026-06-03", checkIn: "09:10 AM", checkOut: "06:20 PM", duration: "9h 10m", status: "present" },
];

const MOCK_LIVE: { name: string; dept: string; checkIn: string }[] = [
  { name: "Priya Menon", dept: "Design", checkIn: "09:05 AM" },
  { name: "Arjun Bose", dept: "Marketing", checkIn: "09:22 AM" },
  { name: "Kavitha Reddy", dept: "Accounts", checkIn: "09:45 AM" },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  present: { label: "Present", className: "bg-emerald-100 text-emerald-700" },
  wfh: { label: "WFH", className: "bg-blue-100 text-blue-700" },
  "half-day": { label: "Half Day", className: "bg-amber-100 text-amber-700" },
};

export default function AttendancePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState("0h 0m");

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now);
    setIsCheckedIn(true);
    toast.success(`Checked in at ${format(now, "hh:mm a")}`);
    const interval = setInterval(() => {
      const mins = differenceInMinutes(new Date(), now);
      setElapsed(`${Math.floor(mins / 60)}h ${mins % 60}m`);
    }, 30000);
    return () => clearInterval(interval);
  };

  const handleCheckOut = () => {
    if (!checkInTime) return;
    const now = new Date();
    const mins = differenceInMinutes(now, checkInTime);
    toast.success(`Checked out. Duration: ${Math.floor(mins / 60)}h ${mins % 60}m`);
    setIsCheckedIn(false);
    setCheckInTime(null);
  };

  return (
    <div className="p-6 space-y-6 animated-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Daily check-in, live board & history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Today — {format(new Date(), "EEEE, dd MMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">
                Check-in: <span className="font-medium text-foreground">{checkInTime ? format(checkInTime, "hh:mm a") : "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{isCheckedIn ? elapsed : "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{isCheckedIn ? "Clocked In" : "Not checked in"}</span>
              </p>
            </div>
            {!isCheckedIn ? (
              <Button onClick={handleCheckIn} className="gap-2 btn-micro-anim" data-testid="check-in-btn">
                <LogIn className="h-4 w-4" /> Check In
              </Button>
            ) : (
              <Button onClick={handleCheckOut} variant="outline" className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50" data-testid="check-out-btn">
                <LogOut className="h-4 w-4" /> Check Out
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Present</span><span className="font-semibold">18</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">WFH</span><span className="font-semibold">4</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Half Days</span><span className="font-semibold">2</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Absent</span><span className="font-semibold text-rose-600">0</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Live Board — Currently In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {MOCK_LIVE.map((e) => (
              <div key={e.name} className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.dept} · In since {e.checkIn}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My History (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_HISTORY.map((r) => {
                const sc = STATUS_MAP[r.status];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{format(new Date(r.date), "dd MMM, EEE")}</TableCell>
                    <TableCell>{r.checkIn}</TableCell>
                    <TableCell>{r.checkOut ?? "—"}</TableCell>
                    <TableCell>{r.duration ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className={sc.className}>{sc.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
