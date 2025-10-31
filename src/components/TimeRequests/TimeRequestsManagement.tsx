import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTimeRequests } from "@/services/apis/api";
import AdminWebSocketService from "@/services/Websockets";
import { Clock, Check, X, Zap } from "lucide-react";

interface TimeRequest {
  id: number;
  userId: number;
  sessionId: number;
  additionalMinutes: number;
  amount?: number;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt?: string;
  username?: string;
  stationId?: number;
  stationName?: string;
}

const TimeRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
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
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">Recent History</h3>
          <div className="grid gap-3">
            {processedRequests.slice(0, 10).map((request) => (
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
        </div>
      )}
    </div>
  );
};

export default TimeRequestsManagement;
