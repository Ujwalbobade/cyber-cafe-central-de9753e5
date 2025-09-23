// src/components/Profile/ProfileInfo.tsx
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface ProfileInfoProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  loggedInUser: {
    id: string;
    role: string;
  };
  onSave: (updatedUser: any) => void;
  onClose: () => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ currentUser, loggedInUser, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole: string) => {
    setFormData({ ...formData, role: newRole });
  };

 const handleSubmit = () => {
  onSave({ ...currentUser, ...formData });  // keep the ID
  onClose();
};

  const isAdmin = loggedInUser.role === "admin";
  const isOwnProfile = loggedInUser.id === currentUser.id;

  return (
    <Card className="card-gaming p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-gaming font-semibold mb-4">
        {isOwnProfile ? "Edit My Profile" : `Edit User: ${currentUser.username}`}
      </h2>

      <div className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!isOwnProfile && !isAdmin}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isOwnProfile && !isAdmin}
          />
        </div>
        <div>
          <Label>Role</Label>
          {isAdmin ? (
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input value={formData.role} disabled />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="btn-gaming" onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileInfo;