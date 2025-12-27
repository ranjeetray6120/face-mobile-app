import face_recognition
import os
import shutil

# --- SETTINGS ---
reference_image_name = r"e:\mobgile_app\sinlgeimg\ranjeet.jpg"   # Aapki photo ka naam
source_folder = r"e:\mobgile_app\photo"           # Jahan saari photos rakhi hain
output_folder = r"e:\mobgile_app\face\found_photos"      # Jahan aapki photos save hongi

# 1. Output folder banao
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

print(f"System: '{reference_image_name}' ko read kar raha hai...")

try:
    # 2. Aapka chehra load aur encode karna
    my_image = face_recognition.load_image_file(reference_image_name)
    
    # Try detecting face with default settings
    face_locations = face_recognition.face_locations(my_image)
    
    # If no face found, try upsampling (helps with small faces)
    if not face_locations:
        print("System: Default detection failed, trying upsample=2...")
        face_locations = face_recognition.face_locations(my_image, number_of_times_to_upsample=2)
        
    try:
        # Use detected locations if available
        if face_locations:
            my_face_encoding = face_recognition.face_encodings(my_image, face_locations)[0]
            print("System: Aapka chehra pehchan liya! Ab scanning shuru...")
        else:
            raise IndexError
            
    except IndexError:
        print(f"Error: '{reference_image_name}' mein koi chehra nahi dikha. \nPossible reasons:\n1. Photo mein chehra clear nahi hai.\n2. Chehra bohot chhota hai.\n3. Lighting kharab hai.\nPlease use a clearer close-up photo.")
        exit()

    # 3. Folder scan karna
    total_files = os.listdir(source_folder)
    found_count = 0

    print(f"Total {len(total_files)} files check karni hain...")

    for filename in total_files:
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            file_path = os.path.join(source_folder, filename)
            
            try:
                # Check current photo
                unknown_image = face_recognition.load_image_file(file_path)
                unknown_encodings = face_recognition.face_encodings(unknown_image)

                match = False
                for unknown_encoding in unknown_encodings:
                    # Match check karein (Tolerance: 0.5 rakha hai accuracy ke liye)
                    results = face_recognition.compare_faces([my_face_encoding], unknown_encoding, tolerance=0.5)
                    if results[0]:
                        match = True
                        break
                
                if match:
                    print(f"[MATCH] Found in: {filename}")
                    shutil.copy(file_path, os.path.join(output_folder, filename))
                    found_count += 1
            
            except Exception as e:
                print(f"Skipping {filename}: {e}")

    print("------------------------------------------------")
    print(f"Process Complete! Total {found_count} photos mili.")

except FileNotFoundError:
    print(f"Error: '{reference_image_name}' file nahi mili. Please check karein.")