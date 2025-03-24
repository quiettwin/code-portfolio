#! usr/bin/env python3
"""
Image Uploader

This script walks through a directory of image files and uploads all JPEG images
to a specified web server endpoint. It demonstrates file handling and
HTTP requests with binary data.

Usage:
  1. Ensure the requests library is installed: pip install requests
  2. Run the script: python image_uploader.py
"""

import requests
import os
from pathlib import Path

# Web server endpoint for image uploads
url = "http://xxx.xxx.xxx.xxx/upload/"  # Replace with actual server URL

# Directory containing images to upload
path = "~/supplier-data/images"

def uploadImage():
    """
    Traverses the image directory and uploads all JPEG files to the server.
    
    For each JPEG file found:
    1. Opens the file in binary mode
    2. POSTs the file to the server endpoint
    3. Handles any errors that occur during the process
    """
    # Count for tracking uploads
    successful_uploads = 0
    failed_uploads = 0
    
    # Search the path for root, directories, and files
    for root, dirs, files in os.walk(path, topdown=True):
        # Process each file in the directory
        for inFile in files:
            # Create full file path
            filePath = os.path.join(root, inFile)
            
            # Verify it's a file (not a directory)
            if os.path.isfile(filePath):
                # Get filename and extension
                fileName, extension = os.path.splitext(inFile)
                
                # Process only JPEG files
                if extension.lower() == ".jpeg":
                    try:
                        # Open the file in binary read mode
                        with open(filePath, 'rb') as opened:
                            # Create the files dictionary with file data
                            files = {'file': opened}
                            
                            # Send POST request to the server
                            response = requests.post(url, files=files)
                            
                            # Check if upload was successful
                            if response.status_code == 201 or response.status_code == 200:
                                print(f"Successfully uploaded: {inFile}")
                                successful_uploads += 1
                            else:
                                print(f"Failed to upload {inFile}: Server returned status code {response.status_code}")
                                failed_uploads += 1
                                
                    except OSError as e:
                        print(f"Error accessing file {inFile}: {str(e)}")
                        failed_uploads += 1
                    except requests.exceptions.RequestException as e:
                        print(f"Error uploading {inFile}: {str(e)}")
                        failed_uploads += 1
    
    # Print summary
    print(f"\nUpload complete! {successful_uploads} successful, {failed_uploads} failed.")

# Execute the upload function when the script is run directly
if __name__ == "__main__":
    uploadImage()