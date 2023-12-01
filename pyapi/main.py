from typing import Union
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2

import pytesseract

pytesseract.pytesseract.tesseract_cmd = 'tesseract/tesseract.exe'

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
def imageToText(file: UploadFile = UploadFile(...)):
    # img = cv2.imread('test.png')
    # print(pytesseract.image_to_string(img))
    print(file.filename)
    print(pytesseract.image_to_string(file))
    return {"filename": file.filename}