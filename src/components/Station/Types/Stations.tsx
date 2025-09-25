export interface Station {
  id: string;
  name: string;
  type: "PC" | "PS5" | "PS4";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OFFLINE";
  hourlyRate: number;
  specifications: string;
  ipAddress?: string;
  macAddress?: string;   
  isLocked: boolean;
  lockedFor?: string;
  handRaised?: boolean;

  currentSession?: {
    id: string;
    customerName: string;
    startTime: string;
    timeRemaining: number;
  };
    pastSessions?: {
    id: string;
    customerName: string;
    startTime: string;
    endTime: string;
  }[];

}