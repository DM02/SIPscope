import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./PacketDetails.css";
import MessageBody from "./MessageBody";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PacketDetails() {
  const { id } = useParams();
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // on/off
  const [editedPacket, setEditedPacket] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/packet/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setPacket(data);
        setEditedPacket(data);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  function handleSaveChanges() {

    const payload = {};

    if (packet.protocol === "SIP") {
      payload.headers = editedPacket.headers;
      payload.message_body = editedPacket.message_body;
    } else if (packet.protocol === "RTP") {
      payload.rtp_data = editedPacket.rtp_data;
    }

    fetch(`http://127.0.0.1:8000/edit-packet/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        return fetch(`http://127.0.0.1:8000/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        return fetch(`http://127.0.0.1:8000/packet/${id}`);
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setPacket(data); 
        setEditedPacket(data);
        setIsEditing(false);

        toast.success("Changes saved.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      })
      .catch((err) => {
        setError(err.message);

        toast.error("An error occurred while applying changes.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
  }

  function handleInputChange(event, key) {
    const { value } = event.target;
    setEditedPacket((prev) => ({
      ...prev,
      headers: {
        ...prev.headers,
        [key]: value,
      },
    }));
  }

  function renderHeaders(headers) {
    return (
      <>
        {Object.entries(headers).map(([key, value], index) => (
          <tr key={index}>
            <td><strong>{key}</strong></td>
            <td>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPacket.headers[key] || ""}
                  onChange={(e) => handleInputChange(e, key)}
                />
              ) : (
                value
              )}
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!packet) {
    return <div>Loading package details...</div>;
  }

  return (
    <div className="packet-details">
      <h1>Packet details #{packet.number}</h1>
      <p><strong>Source:</strong> {packet.src}</p>
      <p><strong>Destination:</strong> {packet.dst}</p>
      <p><strong>Protocol:</strong> {packet.protocol}</p>
      <p><strong>Length:</strong> {packet.length}</p>

      {packet.protocol === "SIP" && (
        <>
          <h2>SIP details</h2>

          {packet.request_line && (
            <div className="sip-headers-container">
              <table className="sip-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Request-Line</strong></td>
                    <td>{packet.request_line}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <h3>SIP Headlines</h3>
          <div className="sip-headers-container">
            <table className="sip-table">
              <thead>
                <tr>
                  <th>Headline</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {renderHeaders(packet.headers || {})}
              </tbody>
            </table>
          </div>

          <h3>Message conent</h3>
          {isEditing ? (
            <textarea
              value={editedPacket.message_body || ""}
              onChange={(e) =>
                setEditedPacket((prev) => ({
                  ...prev,
                  message_body: e.target.value,
                }))
              }
            />
          ) : (
            <MessageBody messageBody={packet.message_body} />
          )}
        </>
      )}

      {packet.protocol === "RTP" && (
        <>
          <h2>RTP data</h2>
          <div className="rtp-table-container">
            <table className="rtp-table">
              <tbody>
                {Object.entries(packet.rtp_data || {}).map(([key, value], index) => (
                  <tr key={index}>
                    <td><strong>{key}</strong></td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPacket.rtp_data[key] || ""}
                          onChange={(e) =>
                            setEditedPacket((prev) => ({
                              ...prev,
                              rtp_data: {
                                ...prev.rtp_data,
                                [key]: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="actions">
        {isEditing ? (
          <>
            <button onClick={handleSaveChanges}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit</button>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default PacketDetails;