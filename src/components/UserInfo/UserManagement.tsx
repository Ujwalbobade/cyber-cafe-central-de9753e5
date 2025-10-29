import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProfileInfo from "@/components/UserInfo/ProfileInfo";
import { getAllUsers, updateUser } from "@/services/apis/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

const UserManagement: React.FC<{ loggedInUser: any }> = ({ loggedInUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedInUser) return;

    const fetchUsers = async () => {
      try {
        const data: User[] = await getAllUsers();
        console.log("Fetched users:", data);

        // Filter out the logged-in user
        const otherUsers = data.filter(u => u.id !== loggedInUser.id);
        setUsers(otherUsers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [loggedInUser]);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <Card className="card-gaming p-6">
      <h2 className="text-xl font-gaming font-semibold mb-4">User Management</h2>

      {/* Logged-in user section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Account</h3>
        <div className="flex justify-between items-center border border-accent bg-accent/10 p-2 rounded-md">
          <span>
            {loggedInUser.username} ({loggedInUser.role})
            <span className="ml-2 text-xs text-accent font-semibold">(You)</span>
          </span>
          <Button
            className="btn-gaming"
            size="sm"
            onClick={() => setSelectedUser(loggedInUser)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Other users - only for admins */}
      {loggedInUser.role === "admin" && users.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Other Users</h3>
          <ul className="space-y-2">
            {users.map(user => (
              <li
                key={user.id}
                className="flex justify-between items-center border border-primary bg-card/80 p-2 rounded-md"
              >
                <span>{user.username} ({user.role})</span>
                <Button
                  className="btn-gaming"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal for editing user */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <ProfileInfo
            currentUser={selectedUser}
            loggedInUser={loggedInUser}
            onSave={async (updated) => {
              try {
                const saved = await updateUser(updated.id, updated);
                alert("User updated successfully!");
                if (saved.id !== loggedInUser.id) {
                  setUsers(users.map(u => u.id === saved.id ? saved : u));
                } else {
                  setSelectedUser(saved);
                }
              } catch (err: any) {
                alert("Failed to update user: " + err.message);
              }
            }}
            onClose={() => setSelectedUser(null)}
          />
        </div>
      )}
    </Card>
  );
};

export default UserManagement;