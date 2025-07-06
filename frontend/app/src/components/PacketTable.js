import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PacketTable.css";

function PacketTable({ packets, setPackets }) {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, packet: null });
  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/last-file")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch the file name.");
        }
        return response.json();
      })
      .then((data) => {
        setFileName(data.file_name);
      })
      .catch((error) => {
        console.error("Error while fetching the file name:", error);
        toast.error("Failed to fetch the file name.", {
          position: "top-right",
          autoClose: 3000,
        });
      });
  }, []);

  const handleContextMenu = (event, packet) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      packet,
    });
  };

  const handleEdit = () => {
    navigate(`/packet/${contextMenu.packet.number}`);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDelete = async () => {
    const packetId = contextMenu.packet.number;
    try {
      const response = await fetch(`http://localhost:8000/packet/${packetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const processResponse = await fetch(`http://localhost:8000/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!processResponse.ok) {
          throw new Error("Failed to process data after deleting the packet.");
        }

        const processData = await processResponse.json();
        setPackets(processData.packets);

        toast.success("The packet has been deleted.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.detail}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("An error occurred while deleting the packet.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleDownload = async () => {
    try {
      if (!fileName) {
        throw new Error("No file name available for download.");
      }

      const response = await fetch(`http://127.0.0.1:8000/download/${fileName}`);
      if (!response.ok) {
        throw new Error("Failed to download the file.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success("The file has been saved.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error("An error occurred while saving the file.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleClickOutside = React.useCallback(() => {
    setContextMenu({ ...contextMenu, visible: false });
  }, [contextMenu]);

  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="packet-table-container">
      <button
        onClick={handleDownload}
        style={{
          backgroundColor: "green",
          color: "white",
          padding: "10px",
          border: "none",
          cursor: "pointer",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        Save file
      </button>
      <table className="packet-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Protocol</th>
            <th>Length</th>
            <th>Seq/info</th>
          </tr>
        </thead>
        <tbody>
          {packets.map((packet, index) => (
            <tr
              key={index}
              onContextMenu={(e) => handleContextMenu(e, packet)}
              style={{ cursor: "pointer" }}
            >
              <td>{packet.number}</td>
              <td>{packet.src}</td>
              <td>{packet.dst}</td>
              <td>{packet.protocol}</td>
              <td>{packet.length}</td>
              <td>{packet.protocol === "SIP" ? packet.headers?.["CSeq"] || "No data" : packet.rtp_data?.sequence_number || "No data"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "white",
            border: "1px solid #ccc",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li style={{ padding: "8px", cursor: "pointer" }} onClick={handleEdit}>
              Edit
            </li>
            <li style={{ padding: "8px", cursor: "pointer" }} onClick={handleDelete}>
              Delete
            </li>
          </ul>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default PacketTable;