import React, { useState, useEffect } from 'react';
import {
  idleRevenueService,
  IdleNetwork,
  ComputeResource,
  EarningsHistory,
} from '../../services/idle-computing/idleRevenueService';

export const IdleRevenueDashboard: React.FC = () => {
  const [resources, setResources] = useState<ComputeResource[]>([]);
  const [networks, setNetworks] = useState<IdleNetwork[]>([]);
  const [availableNetworks, setAvailableNetworks] = useState<IdleNetwork[]>([]);
  const [earnings, setEarnings] = useState<EarningsHistory[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<IdleNetwork | null>(null);
  const [powerCostKWh, setPowerCostKWh] = useState(0.12);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = () => {
    idleRevenueService.initializeNetworks();
    const detectedResources = idleRevenueService.detectResources();
    const available = idleRevenueService.getAvailableNetworks();

    setResources(detectedResources);
    setAvailableNetworks(available);
    loadData();
  };

  const loadData = () => {
    idleRevenueService.simulateEarnings(1); // Simulate 1 hour of earnings
    setEarnings(idleRevenueService.getEarningsHistory(undefined, 50));
  };

  const handleJoinNetwork = (networkId: string) => {
    idleRevenueService.joinNetwork(networkId);
    setAvailableNetworks(idleRevenueService.getAvailableNetworks());
    setSelectedNetwork(null);
  };

  const handleLeaveNetwork = (networkId: string) => {
    idleRevenueService.leaveNetwork(networkId);
    setAvailableNetworks(idleRevenueService.getAvailableNetworks());
  };

  const potential = idleRevenueService.calculatePotentialEarnings();
  const totalEarnings = idleRevenueService.getTotalEarnings();
  const powerCost = idleRevenueService.calculatePowerCost(powerCostKWh);
  const netProfit = idleRevenueService.getNetProfit();
  const topNetwork = idleRevenueService.getTopNetwork();

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'cpu':
        return '🖥️';
      case 'gpu':
        return '🎮';
      case 'storage':
        return '💾';
      case 'bandwidth':
        return '📡';
      default:
        return '⚙️';
    }
  };

  const getNetworkIcon = (type: string) => {
    switch (type) {
      case 'storage':
        return '💾';
      case 'compute':
        return '⚡';
      case 'scientific':
        return '🔬';
      default:
        return '🌐';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
          💻 Idle Computing Revenue
        </h1>
        <p style={{ margin: '0', color: '#6b7280' }}>
          Earn passive income by renting your unused computing resources
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Monthly Potential</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${potential.monthly.toFixed(2)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            ${potential.daily.toFixed(2)}/day
          </div>
        </div>

        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Total Earned</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${totalEarnings.allTime.toFixed(2)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            ${totalEarnings.today.toFixed(2)} today
          </div>
        </div>

        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Net Profit</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${netProfit.netProfit.toFixed(2)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            ROI: {netProfit.roi.toFixed(1)}%
          </div>
        </div>

        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Power Cost</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${powerCost.estimatedMonthlyCost.toFixed(2)}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
            ${powerCostKWh}/kWh
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🔧 Your System Resources</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {resources.map(resource => (
            <div
              key={resource.type}
              style={{
                padding: '20px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getResourceIcon(resource.type)}</span>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
                    {resource.type}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {resource.available.toFixed(0)} {resource.unit}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span>Utilization</span>
                  <span style={{ fontWeight: 'bold' }}>{resource.utilizationPercent.toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${resource.utilizationPercent}%`,
                      background: resource.utilizationPercent > 80 ? '#ef4444' : resource.utilizationPercent > 50 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Network Recommendation */}
      {topNetwork && (
        <div style={{ padding: '20px', background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '12px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '48px' }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                Recommended: {topNetwork.name}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                {topNetwork.description}
              </div>
              <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>
                Earn up to ${topNetwork.estimatedEarnings.monthly.toFixed(2)}/month
              </div>
            </div>
            <button
              onClick={() => topNetwork.status === 'available' ? handleJoinNetwork(topNetwork.id) : handleLeaveNetwork(topNetwork.id)}
              style={{
                padding: '12px 24px',
                background: topNetwork.status === 'active' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              {topNetwork.status === 'active' ? 'Leave Network' : 'Join Now'}
            </button>
          </div>
        </div>
      )}

      {/* Available Networks */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>🌐 Available Networks</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {availableNetworks.map(network => (
            <div
              key={network.id}
              style={{
                padding: '20px',
                background: 'white',
                border: `2px solid ${network.status === 'active' ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedNetwork(network)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{getNetworkIcon(network.type)}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{network.name}</h3>
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginTop: '2px' }}>
                      {network.type}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 10px',
                    background: network.status === 'active' ? '#10b981' : '#6b7280',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  {network.status.toUpperCase()}
                </div>
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 15px 0' }}>
                {network.description}
              </p>

              <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Estimated Monthly Earnings</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  ${network.estimatedEarnings.monthly.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                  ${network.estimatedEarnings.daily.toFixed(2)}/day · ${network.estimatedEarnings.hourly.toFixed(2)}/hr
                </div>
              </div>

              {network.reputation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px' }}>⭐</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{network.reputation.toFixed(1)}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>/10 reputation</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  network.status === 'active' ? handleLeaveNetwork(network.id) : handleJoinNetwork(network.id);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: network.status === 'active' ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {network.status === 'active' ? '🔴 Leave Network' : '🟢 Join Network'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings History */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>💰 Recent Earnings</h2>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    TIME
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    NETWORK
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    TASK
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    AMOUNT
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    USD VALUE
                  </th>
                </tr>
              </thead>
              <tbody>
                {earnings.slice(0, 20).map((earning, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(earning.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {earning.networkId}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {earning.taskType}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {earning.amount.toFixed(4)} {earning.token}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', textAlign: 'right', color: '#10b981' }}>
                      ${earning.usdValue.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {earnings.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
              <div>No earnings yet. Join a network to start earning!</div>
            </div>
          )}
        </div>
      </div>

      {/* Network Details Modal */}
      {selectedNetwork && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedNetwork(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>{getNetworkIcon(selectedNetwork.type)}</span>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{selectedNetwork.name}</h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{selectedNetwork.type.toUpperCase()}</div>
              </div>
            </div>

            <p style={{ fontSize: '16px', color: '#374151', marginBottom: '20px' }}>
              {selectedNetwork.description}
            </p>

            <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Requirements</h3>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {selectedNetwork.requirements.minCPU && <div>• Minimum {selectedNetwork.requirements.minCPU} CPU cores</div>}
                {selectedNetwork.requirements.minGPU && <div>• GPU required</div>}
                {selectedNetwork.requirements.minStorage && <div>• Minimum {selectedNetwork.requirements.minStorage}GB storage</div>}
                {selectedNetwork.requirements.minBandwidth && <div>• Minimum {selectedNetwork.requirements.minBandwidth} Mbps bandwidth</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  selectedNetwork.status === 'active' ? handleLeaveNetwork(selectedNetwork.id) : handleJoinNetwork(selectedNetwork.id);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: selectedNetwork.status === 'active' ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {selectedNetwork.status === 'active' ? 'Leave Network' : 'Join Network'}
              </button>
              <button
                onClick={() => setSelectedNetwork(null)}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
