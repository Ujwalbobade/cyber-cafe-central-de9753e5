import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, X, Edit } from "lucide-react";
import { Station } from "@/components/Types/Stations";



interface EditStationDialogProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stationId: string, updated: Partial<Station>) => void;
}

const EditStationDialog: React.FC<EditStationDialogProps> = ({
  station,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editData, setEditData] = useState<Partial<Station>>({});

  useEffect(() => {
    if (station) {
      setEditData({ ...station });
    }
  }, [station]);

  if (!station) return null;

  const handleSave = () => {
    onSave(station.id, editData);
    onClose();
  };

  return (
    <DialogContent className="w-full max-w-md rounded-xl shadow-2xl bg-gray-900 text-gray-100 p-6 border border-gray-700">
  <DialogHeader className="mb-4">
    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
      <Edit className="w-5 h-5" /> Edit Station
    </DialogTitle>
  </DialogHeader>

  {/* Form */}
  <div className="space-y-3">
    <Input
      placeholder="Name"
      value={editData.name || ""}
      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
      className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
    />

    <select
      value={editData.type || "PC"}
      onChange={(e) =>
        setEditData({ ...editData, type: e.target.value as Station["type"] })
      }
      className="w-full h-9 border rounded-md px-2 bg-gray-800 border-gray-600 text-gray-100"
    >
      <option value="PC">PC</option>
      <option value="PS5">PS5</option>
      <option value="PS4">PS4</option>
    </select>

    <Input
      type="number"
      placeholder="Hourly Rate"
      value={editData.hourlyRate ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        setEditData({
          ...editData,
          hourlyRate: val ? parseFloat(val) : 0,
        });
      }}
      className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
    />

    <Input
      placeholder="Specifications"
      value={editData.specifications || ""}
      onChange={(e) =>
        setEditData({ ...editData, specifications: e.target.value })
      }
      className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
    />

    <select
      value={editData.status || "AVAILABLE"}
      onChange={(e) =>
        setEditData({
          ...editData,
          status: e.target.value as Station["status"],
        })
      }
      className="w-full h-9 border rounded-md px-2 bg-gray-800 border-gray-600 text-gray-100"
    >
      <option value="AVAILABLE">Available</option>
      <option value="OCCUPIED">Occupied</option>
      <option value="MAINTENANCE">Maintenance</option>
    </select>

    {/* Buttons */}
    <div className="flex gap-2 justify-end pt-4">
      <Button onClick={handleSave}>
        <Save className="w-4 h-4 mr-2" /> Save
      </Button>
      <Button variant="secondary" onClick={onClose}>
        <X className="w-4 h-4 mr-2" /> Cancel
      </Button>
    </div>
  </div>
</DialogContent>
  );
};

export default EditStationDialog;