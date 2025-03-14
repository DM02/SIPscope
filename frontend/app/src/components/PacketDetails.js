import React from 'react';

function PacketDetails({ packet }) {
  if (!packet) {
    return <div>Select a packet to see the details.</div>;
  }

  return (
    <div className="packet-details">
      <h2>Packet Details</h2>
      <p><strong>Source IP:</strong> {packet.source_ip}</p>
      <p><strong>Destination IP:</strong> {packet.destination_ip}</p>
      <p><strong>Protocol:</strong> {packet.protocol}</p>
      <p><strong>Length:</strong> {packet.length} bytes</p>
      <p><strong>Info:</strong> {packet.info}</p>
    </div>
  );
}

export default PacketDetails;