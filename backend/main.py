import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse

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
def upload_file(file: UploadFile = File(...)):
    # Ensure the temp directory exists
    os.makedirs("temp", exist_ok=True)

    file_location = f"temp/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    # Here you can add any processing logic if needed

    # os.remove(file_location)  # Comment out or remove this line to keep the file

    return JSONResponse(content={"message": "File uploaded successfully"})

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.get("/current-date")
def get_current_date():
    return {"current_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

@app.get("/favicon.ico")
def favicon():
    return FileResponse("path/to/your/favicon.ico")
