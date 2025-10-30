import { useCallback } from 'react';
import { Station } from "@/components/Station/Types/Stations";
import { createStation, deleteStation, lockStation, unlockStation } from '../../../services/apis/api';
import AdminWebSocketService from '../../../services/Websockets';

export const useStationActions = (
  stations: Station[],
  setStations: React.Dispatch<React.SetStateAction<Station[]>>,
  toast: any
) => {
  const handleAddStation = useCallback(async (
    stationData: Omit<Station, 'id' | 'isLocked' | 'currentSession'>
  ) => {
    try {
      const createdStation = await createStation({
        ...stationData,
        isLocked: false,
        status: 'AVAILABLE'
      });

      setStations(prev => [...prev, createdStation]);
      toast({
        title: "Station Added",
        description: `${stationData.name} has been successfully added to the network.`,
      });
    } catch (error) {
      console.error('Error creating station:', error);
      toast({
        title: "Error",
        description: "Failed to create station. Please try again.",
        variant: "destructive",
      });
    }
  }, [setStations, toast]);

  const handleDeleteStation = useCallback(async (stationId: string) => {
    try {
      await deleteStation(stationId);
      setStations(prev => prev.filter(s => s.id !== stationId));
      toast({
        title: "Station Removed",
        description: "Station has been permanently removed from the system.",
      });
    } catch (error) {
      console.error("Error deleting station:", error);
      toast({
        title: "Error",
        description: "Failed to remove the station. Please try again.",
        variant: "destructive",
      });
    }
  }, [setStations, toast]);

  const handleStationAction = useCallback(async (
    stationId: string,
    action: string,
    data?: any
  ) => {
    try {
      switch (action) {
        case "lock":
          await lockStation(stationId);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? {
                ...station,
                isLocked: true,
                lockedFor: data?.assignedUser || undefined
              } : station
            )
          );
          toast({
            title: "Station Locked",
            description: data?.assignedUser
              ? `Station assigned to ${data.assignedUser}`
              : "The station has been locked."
          });
          break;

        case "unlock":
          await unlockStation(stationId);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? {
                ...station,
                isLocked: false,
                lockedFor: undefined
              } : station
            )
          );
          toast({ title: "Station Unlocked", description: "The station is now available." });
          break;

        case "start-session":
          // Use WebSocket to start session
          const ws = AdminWebSocketService.getInstance();
          ws.startSession(
            stationId,
            data.userId || "guest",
            data.gameId || "general",
            data.durationMinutes
          );
          
          // Optimistically update UI
          setStations(prev =>
            prev.map(station =>
              station.id === stationId
                ? {
                  ...station,
                  status: "OCCUPIED",
                  currentSession: {
                    id: `temp-${Date.now()}`, // Temporary ID until WS confirms
                    customerName: data.customerName,
                    startTime: new Date().toISOString(),
                    timeRemaining: data.durationMinutes,
                  },
                }
                : station
            )
          );
          toast({ title: "Session Starting", description: `Starting session for ${data.customerName}...` });
          break;

        case "end-session":
          if (!data?.sessionId) throw new Error("Session ID required to end session");

          // Use WebSocket to end session
          const wsEnd = AdminWebSocketService.getInstance();
          wsEnd.endSession(data.sessionId);

          // Optimistically update UI
          setStations(prev =>
            prev.map(station => {
              if (String(station.currentSession?.id) === String(data.sessionId)) {
                const pastSession = {
                  id: data.sessionId,
                  customerName: station.currentSession.customerName,
                  startTime: station.currentSession.startTime,
                  endTime: new Date().toISOString(),
                };

                return {
                  ...station,
                  status: "AVAILABLE",
                  currentSession: undefined,
                  pastSessions: [...(station.pastSessions || []), pastSession],
                };
              }
              return station;
            })
          );

          toast({
            title: "Session Ending",
            description: `Ending session...`,
          });
          break;

        case "add-time":
          if (!data?.sessionId || !data?.minutes) throw new Error("Session ID and minutes required");
          
          // Use WebSocket to add time
          const wsTime = AdminWebSocketService.getInstance();
          const currentStation = stations.find(s => s.id === stationId);
          if (currentStation?.currentSession) {
            const newEndTime = Date.now() + (currentStation.currentSession.timeRemaining + data.minutes) * 60000;
            wsTime.updateSessionTime(
              stationId,
              data.userId || "guest",
              data.sessionId,
              newEndTime
            );
          }

          // Optimistically update UI
          setStations(prev =>
            prev.map(station =>
              station.id === stationId && station.currentSession
                ? {
                  ...station,
                  currentSession: {
                    ...station.currentSession,
                    timeRemaining: station.currentSession.timeRemaining + data.minutes,
                  },
                }
                : station
            )
          );
          toast({ title: "Time Adding", description: `Adding ${data.minutes} minutes...` });
          break;

        case "raise-hand":
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? { ...station, handRaised: !station.handRaised } : station
            )
          );
          const targetStation = stations.find(s => s.id === stationId);
          if (targetStation) {
            toast({
              title: targetStation.handRaised ? "Hand Lowered" : "Hand Raised",
              description: `${targetStation.name} ${targetStation.handRaised ? 'no longer needs' : 'needs'} assistance`,
              variant: targetStation.handRaised ? "default" : "destructive"
            });
          }
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to perform action: ${action}`,
        variant: "destructive",
      });
    }
  }, [stations, setStations, toast]);

  const showDeleteConfirmation = useCallback((station: Station) => {
    return station; // This will be handled by the parent component
  }, []);

  return {
    handleAddStation,
    handleDeleteStation,
    handleStationAction,
    showDeleteConfirmation
  };
};