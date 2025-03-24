#! usr/bin/env python3
"""
Fruit Description Processor

This script processes text files containing fruit information and uploads the 
data to a Django web server as JSON. It demonstrates file I/O operations,
data structure creation, and HTTP requests.

Each text file is expected to contain information about a fruit with:
- Name (line 1)
- Weight in lbs (line 2)
- Description (line 3)
- Image filename (line 4)
"""

import os
import requests

# Web server endpoint for fruit data
url = "http://[linux-instance-external-IP]/fruits"

# Directory containing fruit description files
path = "~/supplier-data/descriptions/"

# List to store all fruit dictionaries
allFruit = []

def processText():
    """
    Main function to process text files and upload data.
    
    This function:
    1. Searches the specified directory for .txt files
    2. Reads each file to extract fruit information
    3. Creates a dictionary for each fruit
    4. Uploads all fruit data to the web server as JSON
    """
    # Search the path for root, directories, and files
    for root, dirs, files in os.walk(path, topdown=True):
        # For every file found, check for ".txt" extension
        for inFile in files:
            # Initialize empty dictionary for current fruit
            fruitInfo = {
                "name": "", 
                "weight": 0, 
                "description": "", 
                "image-name": ""
            }
            
            # Get filename and extension
            fileName, extension = os.path.splitext(inFile)
            
            # Process only text files
            if extension == ".txt":
                try:
                    # Open the file and read line by line
                    with open(inFile, "r") as opened:
                        lines = opened.readlines()
                        
                        # Populate dictionary from file content
                        # Note: This assumes lines are in the expected order
                        fruitInfo["name"] = lines[0].strip()
                        fruitInfo["weight"] = int(lines[1].split()[0])  # Extract numeric value
                        fruitInfo["description"] = lines[2].strip()
                        fruitInfo["image-name"] = f"{fileName}.jpeg"
                        
                    # Add the completed fruit dictionary to our list
                    allFruit.append(fruitInfo)
                    
                except OSError:
                    print("Cannot convert: " + inFile)
                except (IndexError, ValueError) as e:
                    print(f"Error processing {inFile}: {str(e)}")
    
    # Upload the complete list of fruit dictionaries to the web server
    try:
        r = requests.post(url, json=allFruit)
        r.raise_for_status()  # Raise an exception for HTTP errors
        print(f"Upload successful! Status code: {r.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error uploading data: {str(e)}")

# Execute the function when the script is run directly
if __name__ == "__main__":
    processText()