#! /usr/bin/env python3
"""
Image Converter

This script walks through a directory of image files, converts TIF images to JPEG format,
and resizes them to the specified dimensions. It demonstrates image processing using
the Python Imaging Library (PIL).

Usage:
  1. Ensure PIL/Pillow is installed: pip install pillow
  2. Run the script: python image_converter.py
"""

from PIL import Image
from pathlib import Path
import os

# Directory containing images to convert
path = "~/supplier-data/images"

# Target dimensions for output images
size = (600, 400)

def convertImage():
    """
    Processes all .tif images in the specified directory:
    1. Finds all .tif files
    2. Converts them to RGB mode (required for JPEG)
    3. Resizes them to the specified dimensions
    4. Saves them as JPEG files with the same base name
    """
    # Search the path for root, directories, and files
    for root, dirs, files in os.walk(path, topdown=True):
        # For each file found, check if it has the extension ".tif"
        for inFile in files:
            filePath = os.path.join(root, inFile)
            fileName, extension = os.path.splitext(inFile)
            
            if extension.lower() == ".tif":
                try:
                    # Open the image file
                    with Image.open(filePath) as newImage:
                        # Process the image: resize and convert to RGB mode
                        processedImage = newImage.resize(size).convert("RGB")
                        
                        # Create output path
                        outputPath = os.path.join(root, fileName + ".jpeg")
                        
                        # Save as JPEG
                        processedImage.save(outputPath, "JPEG")
                        print(f"Converted: {inFile} → {fileName}.jpeg")
                        
                except OSError as e:
                    print(f"Cannot convert {inFile}: {str(e)}")
                except Exception as e:
                    print(f"Unexpected error processing {inFile}: {str(e)}")

# Execute the conversion function when the script is run directly
if __name__ == "__main__":
    convertImage()