from typing import Union
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import uvicorn

import pytesseract

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\tesseract\tesseract.exe'
# pytesseract.pytesseract.tesseract_cmd = '/app/.apt/usr/bin/tesseract'

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

@app.post("/imagetotext")
def imageToText(image: UploadFile = File(...)):
    print(image.filename)
    file_location = f"images/{image.filename}"
    with open(file_location, "wb") as file_object:
        file_object.write(image.file.read())

    image = cv2.imread(file_location)

    image_text = pytesseract.image_to_string(image)
    print(image_text)
    return {image_text}


if __name__ == "__main__":
    uvicorn.run("main:app",port=8082,host="localhost",reload=True)