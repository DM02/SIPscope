import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from fastapi.responses import JSONResponse, FileResponse
from scapy.all import rdpcap, IP, UDP, Raw
import json

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print("Received file upload request")  # Logowanie
        # Ensure the temp directory exists
        os.makedirs("temp", exist_ok=True)

        # Usuń istniejące pliki .pcap w folderze temp
        temp_folder = "temp"
        for f in os.listdir(temp_folder):
            if f.endswith(".pcap"):
                os.remove(os.path.join(temp_folder, f))

        # Save the uploaded file
        file_location = f"{temp_folder}/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())

        # Debug: Sprawdź, czy plik istnieje
        if not os.path.exists(file_location):
            print("File not found after upload")  # Logowanie
            return JSONResponse(content={"error": "File not found"}, status_code=500)

        print(f"File uploaded successfully: {file_location}")  # Logowanie
        return JSONResponse(content={"message": "File uploaded successfully", "file_path": file_location})

    except Exception as e:
        # Loguj szczegóły błędu
        print(f"Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/process")
def process_file(file_name: str):
    try:
        temp_folder = "temp"
        file_location = os.path.join(temp_folder, file_name)

        # Sprawdź, czy plik istnieje
        if not os.path.exists(file_location):
            print(f"File not found: {file_location}")  # Logowanie
            return JSONResponse(content={"error": "File not found"}, status_code=404)

        print(f"Processing file: {file_location}")  # Logowanie

        # Odczytaj plik .pcap za pomocą Scapy
        packets = rdpcap(file_location)

        # Typowe porty RTP
        rtp_ports = {6730, 33526}

        # Przetwórz dane pakietów
        packet_list = []
        for i, pkt in enumerate(packets):
            if IP in pkt and UDP in pkt:
                protocol_name = "UDP"
                if Raw in pkt:
                    payload = pkt[Raw].load
                    if b"SIP" in payload:
                        protocol_name = "SIP"
                    elif b"RTP" in payload or pkt[UDP].sport in rtp_ports or pkt[UDP].dport in rtp_ports:
                        protocol_name = "RTP"
                packet_info = {
                    "number": i + 1,
                    "src": pkt[IP].src,
                    "dst": pkt[IP].dst,
                    "protocol": protocol_name,
                    "length": len(pkt)
                }
                packet_list.append(packet_info)

        return JSONResponse(content={"message": "File processed successfully", "packets": packet_list})

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.get("/current-date")
def get_current_date():
    return {"current_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

@app.get("/favicon.ico")
def favicon():
    return FileResponse("path/to/your/favicon.ico")
