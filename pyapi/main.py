from typing import Union
from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2

import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\tesseract\tesseract.exe'

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/text")
def imageToText(my_file: UploadFile = File(...)):
    print(my_file.filename)
    file_location = f"images/{my_file.filename}"
    with open(file_location, "wb") as file_object:
        file_object.write(my_file.file.read())

    image = cv2.imread(file_location)

    image_text = pytesseract.image_to_string(image)
    print(image_text)
    return {image_text}