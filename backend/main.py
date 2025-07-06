import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from fastapi.responses import JSONResponse, FileResponse
from scapy.all import *
from scapy.config import conf
conf.bufsize = 65535
import json

class RTP(Packet):
    name = "RTP"
    fields_desc = [
        BitField("version", 2, 2),
        BitField("padding", 0, 1),
        BitField("extension", 0, 1),
        BitField("csrc_count", 0, 4),
        BitField("marker", 0, 1),
        BitField("payload_type", 0, 7),
        ShortField("sequence_number", 0),
        IntField("timestamp", 0),
        IntField("ssrc", 0)
    ]

bind_layers(UDP, RTP)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        os.makedirs("temp", exist_ok=True)

        temp_folder = "temp"
        for f in os.listdir(temp_folder):
            if f.endswith(".pcap"):
                os.remove(os.path.join(temp_folder, f))

        file_location = f"{temp_folder}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())

        if not os.path.exists(file_location):
            return JSONResponse(content={"error": "File not found"}, status_code=500)

        return JSONResponse(content={"message": "File uploaded successfully", "file_path": file_location})

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

processed_packets = []

@app.post("/process")
def process_file():
    global processed_packets
    try:
        temp_folder = "temp"
        pcap_files = [f for f in os.listdir(temp_folder) if f.endswith(".pcap")]
        if not pcap_files:
            return JSONResponse(content={"error": "No PCAP file found in temp folder"}, status_code=404)

        file_location = os.path.join(temp_folder, pcap_files[0])
        print(f"Processing file: {file_location}")

        packets = rdpcap(file_location)

        processed_packets = []
        debug_logged = False  

        for i, pkt in enumerate(packets):
            if IP in pkt and UDP in pkt:
                protocol_name = None
                headers = None
                message = None
                request_line = None
                message_body = None
                rtp_data = {}

                if Raw in pkt:
                    payload = pkt[Raw].load
                    if b"SIP" in payload:
                        protocol_name = "SIP"
                        try:
                            sip_layer = pkt[Raw].load.decode("utf-8")
                        except UnicodeDecodeError:
                            payload = None

                        headers = {}
                        request_line = None

                        lines = sip_layer.split("\r\n")
                        if lines:  
                            first_line = lines[0].strip()

                            if not first_line.startswith(("REGISTER", "INVITE", "ACK", "BYE", "CANCEL", "OPTIONS", "SUBSCRIBE", "NOTIFY", "INFO", "PRACK", "UPDATE", "MESSAGE", "REFER")):
                                for method in ("REGISTER", "INVITE", "ACK", "BYE", "CANCEL", "OPTIONS", "SUBSCRIBE", "NOTIFY", "INFO", "PRACK", "UPDATE", "MESSAGE", "REFER"):
                                    if method in sip_layer:
                                        first_line = f"{method} {first_line}"
                                        break

                            if first_line.startswith(("REGISTER", "INVITE", "ACK", "BYE", "CANCEL", "OPTIONS", "SUBSCRIBE", "NOTIFY", "INFO", "PRACK", "UPDATE", "MESSAGE", "REFER")):
                                request_line = first_line

                        for line in lines[1:]:
                            line = line.strip()
                            if ": " in line: 
                                key, value = line.split(": ", 1)
                                headers[key] = value

                        if "\r\n\r\n" in sip_layer:
                            headers_part, message_body = sip_layer.split("\r\n\r\n", 1)  
                        else:
                            headers_part = sip_layer
                            message_body = None

                        if "Content-length" in headers:
                            content_length = int(headers["Content-Length"])
                            if len(message_body) != content_length:
                                print(f"Warning: Expected Content-Length {content_length}, but got {len(message_body)}")

                        if message_body:
                            message_body = message_body.strip()

                        message = sip_layer

                if pkt.haslayer(RTP):
                    rtp_layer = pkt[RTP]
                    if (
                        rtp_layer.version == 2 and
                        0 <= rtp_layer.payload_type <= 34 and
                        rtp_layer.sequence_number >= 0 and
                        rtp_layer.timestamp >= 0
                    ):
                        protocol_name = "RTP"
                        rtp_data = {
                            "version": rtp_layer.version,
                            "padding": rtp_layer.padding,
                            "extension": rtp_layer.extension,
                            "csrc_count": rtp_layer.csrc_count,
                            "marker": rtp_layer.marker,
                            "payload_type": rtp_layer.payload_type,
                            "sequence_number": rtp_layer.sequence_number,
                            "timestamp": rtp_layer.timestamp,
                            "ssrc": rtp_layer.ssrc,
                        }
                        if Raw in pkt:
                            rtp_data["payload"] = pkt[Raw].load.hex()

                if protocol_name in ["SIP", "RTP"]:
                    packet_info = {
                        "number": i + 1,
                        "src": pkt[IP].src,
                        "dst": pkt[IP].dst,
                        "protocol": protocol_name,
                        "length": len(pkt),
                        "headers": headers, 
                        "message": message, 
                        "request_line": request_line,  
                        "message_body": message_body, 
                        "rtp_data": rtp_data,
                    }
                    processed_packets.append(packet_info)

        return JSONResponse(content={"message": "File processed successfully", "packets": processed_packets})

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/packet/{id}")
def get_packet_details(id: int):
    global processed_packets
    try:
        if not processed_packets:
            raise HTTPException(status_code=400, detail="No packets processed. Process a file first.")

        packet = next((pkt for pkt in processed_packets if pkt["number"] == id), None)
        if not packet:
            raise HTTPException(status_code=404, detail="Packet not found")

        return packet

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving packet details.")

@app.put("/packet/{id}")
def update_packet_details(id: int, data: dict = Body(...)):
    global processed_packets
    try:
        if not processed_packets:
            raise HTTPException(status_code=400, detail="No packets processed. Process a file first.")

        packet = next((pkt for pkt in processed_packets if pkt["number"] == id), None)
        if not packet:
            raise HTTPException(status_code=404, detail="Packet not found")

        if packet["protocol"] == "SIP":
            if "headers" in data:
                for key, value in data["headers"].items():
                    if value is None:
                        packet["headers"].pop(key, None)
                    else:
                        packet["headers"][key] = value

            if "message" in data:
                packet["message"] = data["message"]

        elif packet["protocol"] == "RTP":
            if "timestamp" in data:
                packet["timestamp"] = data["timestamp"]
            if "sequence_number" in data:
                packet["sequence_number"] = data["sequence_number"]
            if "payload_type" in data:
                packet["payload_type"] = data["payload_type"]

        return {"message": "Packet updated successfully", "packet": packet}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while updating packet details.")

@app.put("/edit-packet/{id}")
def edit_packet(id: int, data: dict = Body(...)):
    try:
        temp_folder = "temp"
        pcap_files = [f for f in os.listdir(temp_folder) if f.endswith(".pcap")]
        if not pcap_files:
            raise HTTPException(status_code=404, detail="No PCAP file found in temp folder")

        file_location = os.path.join(temp_folder, pcap_files[0])
        print(f"Editing file: {file_location}")

        packets = rdpcap(file_location)

        if id < 1 or id > len(packets):
            raise HTTPException(status_code=404, detail="Packet not found")

        pkt = packets[id - 1]

        if IP in pkt and UDP in pkt and Raw in pkt and b"SIP" in pkt[Raw].load:
            sip_message = pkt[Raw].load.decode("utf-8", errors="ignore")

            if "headers" in data:
                headers = data["headers"]
                lines = sip_message.split("\r\n")
                for i, line in enumerate(lines):
                    if ": " in line:
                        key, _ = line.split(": ", 1)
                        if key in headers:
                            lines[i] = f"{key}: {headers[key]}"
                sip_message = "\r\n".join(lines)

            if "message_body" in data:
                if "\r\n\r\n" in sip_message:
                    headers_part, _ = sip_message.split("\r\n\r\n", 1)
                    sip_message = f"{headers_part}\r\n\r\n{data['message_body']}"

            pkt[Raw].load = sip_message.encode("utf-8")
            pkt[IP].len = len(pkt[IP])
            pkt[UDP].len = len(pkt[UDP])

        elif pkt.haslayer(RTP):
            rtp_layer = pkt[RTP]
            
            if "payload_type" in data:
                rtp_layer.payload_type = int(data["payload_type"])
            if "sequence_number" in data:
                rtp_layer.sequence_number = int(data["sequence_number"])
            if "timestamp" in data:
                rtp_layer.timestamp = int(data["timestamp"])

            if "payload" in data and Raw in pkt:
                pkt[Raw].load = bytes.fromhex(data["payload"])
                print(f"Updated payload: {pkt[Raw].load.hex()}")

            pkt[IP].len = len(pkt[IP])
            pkt[UDP].len = len(pkt[UDP])
            print(f"Updated IP length: {pkt[IP].len}, UDP length: {pkt[UDP].len}")
        wrpcap(file_location, packets)

        return {"message": "Packet edited successfully", "file_path": file_location}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while editing the packet.")

@app.delete("/packet/{id}")
def delete_packet(id: int):
    global processed_packets
    try:
        if not processed_packets:
            raise HTTPException(status_code=400, detail="No packets processed. Process a file first.")

        temp_folder = "temp"
        pcap_files = [f for f in os.listdir(temp_folder) if f.endswith(".pcap")]
        if not pcap_files:
            raise HTTPException(status_code=404, detail="No PCAP file found in temp folder")

        file_location = os.path.join(temp_folder, pcap_files[0])
        packets = rdpcap(file_location)

        if id < 1 or id > len(packets):
            raise HTTPException(status_code=404, detail="Packet not found")

        processed_packets = [pkt for pkt in processed_packets if pkt["number"] != id]

        new_packets = [pkt for i, pkt in enumerate(packets) if i != id - 1]

        wrpcap(file_location, new_packets)

        for i, pkt in enumerate(processed_packets):
            pkt["number"] = i + 1

        return {"message": "Packet deleted successfully", "file_path": file_location}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while deleting the packet.")
    
@app.get("/last-file")
def get_last_file():
    temp_folder = "temp"
    pcap_files = [f for f in os.listdir(temp_folder) if f.endswith(".pcap")]
    if not pcap_files:
        raise HTTPException(status_code=404, detail="No PCAP file found in temp folder")
    last_file = pcap_files[0]
    return {"file_name": last_file}

@app.get("/download/{file_name}")
def download_file(file_name: str):
    temp_folder = "temp"
    file_path = os.path.join(temp_folder, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/octet-stream", filename=file_name)

