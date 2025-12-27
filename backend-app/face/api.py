import os
import shutil
import numpy as np
import face_recognition
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict

app = FastAPI(title="Face Recognition Service", version="2.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://api.decointerior.in", "https://frontend.decointerior.in", "https://decointerior.in", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
FACES_DIR = os.getenv("FACES_DIR", "faces_index")
PHOTO_DIR = os.getenv("PHOTO_DIR", "/app/photo")

# Ensure index directory exists
if not os.path.exists(FACES_DIR):
    os.makedirs(FACES_DIR)

def load_image_into_numpy_array(data):
    import io
    from PIL import Image
    return np.array(Image.open(io.BytesIO(data)).convert("RGB"))

@app.get("/health")
def health():
    return {"status": "ok", "service": "face-api-v2"}

@app.post("/scan-folder")
async def scan_folder(
    folder_path: str = Form(PHOTO_DIR),
    file: UploadFile = File(...)
):
    """
    Direct port of find_my_face.py logic.
    Scans a specific folder for matches against the uploaded selfie.
    """
    try:
        if not os.path.exists(folder_path):
             return JSONResponse(status_code=400, content={"error": f"Folder not found: {folder_path}"})

        # 1. Load Reference Image
        content = await file.read()
        reference_image = load_image_into_numpy_array(content)
        
        # 2. Get Encoding
        try:
             ref_encodings = face_recognition.face_encodings(reference_image)
             if not ref_encodings:
                  # Try upsampling if fails
                  ref_encodings = face_recognition.face_encodings(reference_image, num_jitters=1)
                  if not ref_encodings:
                      return JSONResponse(status_code=400, content={"error": "No face detected in selfie"})
             
             my_face_encoding = ref_encodings[0]
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Error processing selfie: {str(e)}"})

        # 3. Scan Directory
        matches = []
        scanned_count = 0
        
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for filename in files:
            scanned_count += 1
            file_path = os.path.join(folder_path, filename)
            
            try:
                # Optimization: In a real app, we'd cache these encodings. 
                # Here we load on the fly as requested by "use find_my_face.py logic"
                unknown_image = face_recognition.load_image_file(file_path)
                unknown_encodings = face_recognition.face_encodings(unknown_image)
                
                for unknown_encoding in unknown_encodings:
                    results = face_recognition.compare_faces([my_face_encoding], unknown_encoding, tolerance=0.5)
                    if results[0]:
                        matches.append(filename)
                        break
            except Exception as e:
                print(f"Skipping {filename}: {e}")

        return {
            "folder": folder_path,
            "scanned": scanned_count,
            "matches_count": len(matches),
            "matches": matches
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- BACKEND COMPATIBILITY ENDPOINTS ---

@app.post("/index-face")
async def index_face(
    event_id: int = Form(...),
    photo_id: int = Form(...),
    image: UploadFile = File(...)
):
    """
    Saves face encodings for an event photo. 
    Used by Spring Boot when a photographer uploads a photo.
    """
    try:
        content = await image.read()
        img_array = load_image_into_numpy_array(content)
        encodings = face_recognition.face_encodings(img_array)

        if not encodings:
            return JSONResponse(status_code=400, content={"error": "No faces found"})

        # Save encodings
        save_dir = os.path.join(FACES_DIR, f"event_{event_id}")
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
            
        saved_paths = []
        for i, encoding in enumerate(encodings):
            filename = f"photo_{photo_id}_face_{i}.npy"
            path = os.path.join(save_dir, filename)
            np.save(path, encoding)
            saved_paths.append(path)

        return {"success": True, "faces_detected": len(encodings)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-face")
async def match_face(
    event_id: str = Form(...),
    image: UploadFile = File(...)
):
    """
    Matches a guest selfie against INDEXED faces for an event.
    Used by the Web App and Mobile App.
    """
    try:
        # 1. Load Guest Face
        content = await image.read()
        print(f"DEBUG: Received image of size {len(content)} bytes")
        img_array = load_image_into_numpy_array(content)
        
        # Additional safety check for image
        if img_array is None or img_array.size == 0:
             print("DEBUG: Image array is empty or None")
             return JSONResponse(status_code=400, content={"error": "Invalid image file"})

        guest_encodings = face_recognition.face_encodings(img_array)
        
        if not guest_encodings:
            print("DEBUG: No face found in initial scan. Retrying with upsampling (2x)...")
            # Try finding locations with upsampling first (helps with smaller faces)
            locations = face_recognition.face_locations(img_array, number_of_times_to_upsample=2)
            
            if locations:
                 print(f"DEBUG: Found {len(locations)} faces after upsampling.")
                 guest_encodings = face_recognition.face_encodings(img_array, locations, num_jitters=1)
            
        if not guest_encodings:
            print("DEBUG: Still no face detected.")
            # Return 200 with specific error flag instead of 400 to distinguish from bad request structure
            # But to keep protocol simple, we'll keep 400 but log it clearly.
            return JSONResponse(status_code=400, content={"error": "No face detected in selfie. Please ensure good lighting."})
        
        print(f"DEBUG: Face detected! Encoding found.")
        guest_encoding = guest_encodings[0]

        # 2. Load Event Encodings
        # event_id comes as string from Form data often
        event_dir = os.path.join(FACES_DIR, f"event_{event_id}")
        if not os.path.exists(event_dir):
             return {"matched_photo_ids": []} # No index found

        matched_ids = set()
        
        # 3. Compare
        for filename in os.listdir(event_dir):
            if filename.endswith(".npy"):
                try:
                    # filename format: photo_{id}_face_{i}.npy
                    parts = filename.split("_")
                    photo_id = int(parts[1])
                    
                    stored_encoding = np.load(os.path.join(event_dir, filename))
                    
                    match = face_recognition.compare_faces([stored_encoding], guest_encoding, tolerance=0.5)[0]
                    if match:
                        matched_ids.add(photo_id)
                except Exception as e:
                    continue

        return {"matched_photo_ids": list(matched_ids)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-event-faces/{event_id}")
def delete_event_faces(event_id: int):
    event_dir = os.path.join(FACES_DIR, f"event_{event_id}")
    if os.path.exists(event_dir):
        shutil.rmtree(event_dir)
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
