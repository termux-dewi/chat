import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { networkApi } from '../services/api';

function NetworkStatus() {
  const { id } = useParams();
  const [network, setNetwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetwork();
  }, [id]);

  const loadNetwork = async () => {
    try {
      setLoading(true);
      const res = await networkApi.get(parseInt(id || '0'));
      setNetwork(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{network?.network_name}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>{network?.description}</p>
          <p className="mt-4">Total Devices: {network?.device_count}</p>
        </div>
      </div>
    </div>
  );
}

export default NetworkStatus;