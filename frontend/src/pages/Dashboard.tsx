import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/auth';
import { deviceApi, networkApi } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesRes, networksRes] = await Promise.all([
        deviceApi.list(),
        networkApi.list(),
      ]);
      setDevices(devicesRes.data);
      setNetworks(networksRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.username}!</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Devices ({devices.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div key={device.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg">{device.device_name}</h3>
                <p className="text-gray-600">Type: {device.device_type}</p>
                <p className="text-gray-600">Status: {device.is_online ? '🟢 Online' : '🔴 Offline'}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Networks ({networks.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {networks.map((network) => (
              <div key={network.id} className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg" onClick={() => navigate(`/network/${network.id}`)}>
                <h3 className="font-bold text-lg">{network.network_name}</h3>
                <p className="text-gray-600">{network.description}</p>
                <p className="text-gray-600 mt-2">Devices: {network.device_count}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;