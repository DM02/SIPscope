import React from 'react';

const PacketList = ({ packets, onSelectPacket }) => {
  return (
    <div>
      <h2>Packet List</h2>
      <ul>
        {packets.map((packet, index) => (
          <li key={index} onClick={() => onSelectPacket(packet)}>
            {packet.summary}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PacketList;