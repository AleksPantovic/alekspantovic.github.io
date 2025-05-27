import React, { useEffect, useState } from 'react';
import { createPluginAdapter } from './pluginAdapter.mjs';

const PluginApp = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePlugin = async () => {
      try {
        console.log('[PluginApp] Initializing plugin...');
        const { getSessionToken, getUsers } = await createPluginAdapter();

        console.log('[PluginApp] Fetching session token...');
        const sessionToken = await getSessionToken();

        console.log('[PluginApp] Fetching users...');
        const fetchedUsers = await getUsers(sessionToken);
        setUsers(fetchedUsers);
      } catch (err) {
        console.error('[PluginApp] Error:', err);
        setError(err.message);
      }
    };

    initializePlugin();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Haiilo User List</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.firstName} {user.lastName} ({user.id})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PluginApp;
