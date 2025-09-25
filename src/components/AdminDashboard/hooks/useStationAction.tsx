import { useCallback } from 'react';
import { Station } from "@/components/Station/Types/Stations";
import { createStation, deleteStation, lockStation, unlockStation, startSession, endSession, addTime } from '../../../services/apis/api';

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
          const session = await startSession(stationId, data);
          let tr = Number(session.timeRemaining) || 0;
          if (tr > 1000) tr = Math.ceil(tr / 60);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId
                ? {
                  ...station,
                  status: "OCCUPIED",
                  currentSession: {
                    id: session.id,
                    customerName: session.customerName,
                    startTime: session.startTime,
                    timeRemaining: tr,
                  },
                }
                : station
            )
          );
          toast({ title: "Session Started", description: `Session started for ${data.customerName}.` });
          break;

        case "end-session":
          if (!data?.sessionId) throw new Error("Session ID required to end session");

          const endedSession = await endSession(data.sessionId);

          setStations(prev =>
            prev.map(station => {
              if (String(station.currentSession?.id) === String(data.sessionId)) {
                const pastSession = {
                  id: endedSession.id,
                  customerName: endedSession.customerName,
                  startTime: endedSession.startTime,
                  endTime: endedSession.endTime,
                };

                return {
                  ...station,
                  status: "AVAILABLE",
                  currentSession: undefined,
                  pastSessions: [...(station.pastSessions || []), pastSession], // ✅ Add to pastSessions
                };
              }
              return station;
            })
          );

          toast({
            title: "Session Ended",
            description: `Session ${data.sessionId} has been ended.`,
          });
          break;

        case "add-time":
          if (!data?.sessionId || !data?.minutes) throw new Error("Session ID and minutes required");
          const updatedSession = await addTime(data.sessionId, data.minutes);
          setStations(prev =>
            prev.map(station =>
              station.id === stationId && station.currentSession
                ? {
                  ...station,
                  currentSession: {
                    ...station.currentSession,
                    timeRemaining: updatedSession.timeRemaining,
                  },
                }
                : station
            )
          );
          toast({ title: "Time Added", description: `${data.minutes} minutes added.` });
          break;

        case "raise-hand":
          setStations(prev =>
            prev.map(station =>
              station.id === stationId ? { ...station, handRaised: !station.handRaised } : station
            )
          );
          const station = stations.find(s => s.id === stationId);
          if (station) {
            toast({
              title: station.handRaised ? "Hand Lowered" : "Hand Raised",
              description: `${station.name} ${station.handRaised ? 'no longer needs' : 'needs'} assistance`,
              variant: station.handRaised ? "default" : "destructive"
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