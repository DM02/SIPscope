import React from 'react';

const PacketTable = ({ packets }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Time</th>
          <th>Source</th>
          <th>Destination</th>
          <th>Protocol</th>
          <th>Length</th>
        </tr>
      </thead>
      <tbody>
        {packets.map((packet, index) => (
          <tr key={index}>
            <td>{packet.number}</td>
            <td>{packet.time}</td>
            <td>{packet.src}</td>
            <td>{packet.dst}</td>
            <td>{packet.protocol}</td>
            <td>{packet.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PacketTable;