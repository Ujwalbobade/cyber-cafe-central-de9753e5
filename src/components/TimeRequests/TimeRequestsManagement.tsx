import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getTimeRequests, markTimeRequestsCollectedByUser } from "@/services/apis/api";
import AdminWebSocketService from "@/services/Websockets";
import { Clock, Check, X, Zap, User, Search, Filter } from "lucide-react";

interface TimeRequest {
  id: number;
  userId: number;
  sessionId: number;
  additionalMinutes: number;
  amount?: number;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  approvedAt?: string;
  username?: string;
  stationId?: number;
  stationName?: string;
  requestId?: number;
}

const TimeRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernameFilter, setUsernameFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "PAID">("ALL");
  const { toast } = useToast();

  const fetchRequests = React.useCallback(async () => {
    try {
      const data = await getTimeRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch time requests:", error);
      toast({
        title: "Error",
        description: "Failed to load time requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (id: number, approved: boolean) => {
    try {
      const ws = AdminWebSocketService.getInstance();
      ws.approveTimeRequest(id, approved);
      toast({
        title: approved ? "Request Approved" : "Request Rejected",
        description: approved
          ? "Time has been added to the session"
          : "Request has been rejected",
      });
      fetchRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case "PAID":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Paid</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  
  // Apply filters to processed requests
  const processedRequests = requests
    .filter((r) => r.status !== "PENDING")
    .filter((r) => {
      // Username filter
      if (usernameFilter && !r.username?.toLowerCase().includes(usernameFilter.toLowerCase())) {
        return false;
      }
      
      // Date range filter
      if (startDateFilter) {
        const requestDate = new Date(r.createdAt);
        const startDate = new Date(startDateFilter);
        if (requestDate < startDate) return false;
      }
      
      if (endDateFilter) {
        const requestDate = new Date(r.createdAt);
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999); // Include entire end day
        if (requestDate > endDate) return false;
      }
      
      // Status filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) {
        return false;
      }
      
      return true;
    });

  // Aggregate by user for easy payment collection (only show unpaid requests - exclude PAID status)
  const unpaidRequests = requests.filter((r) => r.status !== "PAID" && r.status !== "REJECTED");
  const userSummary = unpaidRequests.reduce((acc, request) => {
    const key = request.userId;
    if (!acc[key]) {
      acc[key] = {
        userId: request.userId,
        username: request.username || "Unknown User",
        totalMinutes: 0,
        totalAmount: 0,
        requestCount: 0,
      };
    }
    acc[key].totalMinutes += request.additionalMinutes;
    acc[key].totalAmount += request.amount || 0;
    acc[key].requestCount += 1;
    return acc;
  }, {} as Record<number, { userId: number; username: string; totalMinutes: number; totalAmount: number; requestCount: number }>);

  const userSummaryList = Object.values(userSummary);

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* User Payment Summary */}
      {userSummaryList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Payment Collection Summary</h3>
            <Badge variant="secondary">{userSummaryList.length} users</Badge>
          </div>
          <div className="grid gap-3">
            {userSummaryList.map((summary) => (
              <Card key={summary.userId} className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-bold text-lg text-foreground">{summary.username}</h4>
                      <Badge variant="outline" className="text-xs">{summary.requestCount} requests</Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Time:</span>
                        <span className="font-bold text-primary text-lg">{summary.totalMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Amount to Collect:</span>
                        <span className="font-bold text-accent text-xl">₹{summary.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        try {
                          // Get all unpaid requests for this user
                          const userRequests = unpaidRequests.filter(r => r.userId === summary.userId);
                          
                          // Prepare data in backend format
                          await markTimeRequestsCollectedByUser({
                            timeRequestIds: userRequests.map(r => r.requestId),
                            totalAmount: summary.totalAmount,
                            totalminutes: summary.totalMinutes,
                            userId: summary.userId
                          });
                          
                          toast({
                            title: "Payment Collected",
                            description: `Collected ₹${summary.totalAmount.toFixed(2)} from ${summary.username}`,
                          });
                          fetchRequests();
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to mark payment as collected",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark as Collected
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-xl font-bold text-foreground">Pending Requests</h3>
            <Badge variant="secondary">{pendingRequests.length}</Badge>
          </div>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-4 bg-card/50 backdrop-blur border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-foreground">
                        {request.stationName}
                      </h4>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Requested: {new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Additional Time: </span>
                        <span className="font-bold text-primary text-base">
                          +{request.additionalMinutes} minutes
                        </span>
                      </div>
                      {request.amount && (
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-bold text-accent">
                            ₹{request.amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      User : {request.username}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request.id, true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApprove(request.id, false)}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && (
        <Card className="p-8 text-center bg-card/30 backdrop-blur">
          <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No pending time requests</p>
        </Card>
      )}

      {/* Processed Requests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Request History</h3>
          <Badge variant="secondary">{processedRequests.length}</Badge>
        </div>
        
        {/* Filter Controls */}
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | "APPROVED" | "REJECTED" | "PAID")}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
          
          {(usernameFilter || startDateFilter || endDateFilter || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setUsernameFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
                setStatusFilter("ALL");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </Card>

        {processedRequests.length > 0 ? (
          <div className="grid gap-3">
            {processedRequests.map((request) => (
              <Card key={request.id} className="p-3 bg-card/30 backdrop-blur">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {request.stationName}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Requested By : {request.username} <br />
                      Time : +{request.additionalMinutes} min • <br/>
                      Date : {new Date(request.createdAt).toLocaleString()} <br />
                      Amount : {request.amount && ` • ₹${request.amount.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-card/30 backdrop-blur">
            <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No requests match the current filters</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TimeRequestsManagement;
