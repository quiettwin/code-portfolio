/*
Script: Reservation Conflict Checker
Author: June Bethea

PURPOSE:
This script prevents double-booking of assets in a reservation system by checking for time conflicts.
It analyzes existing reservations in an Airtable base and identifies any overlapping bookings for the same asset.

FEATURES:
- Detects time-based conflicts for overlapping reservations
- Identifies specific assets that are double-booked
- Displays conflicts in a readable format
- Works with multiple assets per reservation
*/

// Configuration for base-specific table and field names
const BaseSpecificNames = {
    // Reservations Table
    reservationsTable: "Upcoming", // name of the [RESERVATIONS] table
    assetField: "Items", // name of the link-type field connecting to the [ASSETS] table
    startField: "Start Date/Time",
    endField: "End Date/Time",
    personField: "Member", // name of the link-type field connection to the [PEOPLE] table

    // Assets Table
    assetsTable: "Inventory", // name of the [ASSETS] table
    assetName: "Item", // name of the primary field in the [ASSETS] table

    // People Table
    peopleTable: "Members", // name of the [PEOPLE] table
    peopleName: "Name" // name of the primary field in the [PEOPLE] table
}

// Retrieve all upcoming reservations
const reservationsTable = base.getTable(BaseSpecificNames.reservationsTable).getView("Upcoming Reservations");
let result = await reservationsTable.selectRecordsAsync();
let allReservations = result.records;
let conflicts = [];

/**
 * Checks if a target array contains at least one item from a pattern array
 * 
 * @param {Array} target - The array to check (assets in one reservation)
 * @param {Array} pattern - The array to match against (assets in another reservation)
 * @returns {boolean} - True if at least one item from pattern exists in target
 */
const contains = (target, pattern) => {
    let value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1);
}

// Main conflict detection algorithm
for (var i = 0; i < allReservations.length; i++) {
    // Get details for the first reservation
    let startDate = new Date(allReservations[i].getCellValue(BaseSpecificNames.startField)).toISOString();
    let endDate = new Date(allReservations[i].getCellValue(BaseSpecificNames.endField)).toISOString();
    let item = allReservations[i].getCellValueAsString(BaseSpecificNames.assetField);
    let asset = item.split(', '); // Convert comma-separated string to array
    
    // Compare against all other reservations
    for (var j = 0; j < allReservations.length; j++) {
        // Skip comparing a reservation with itself
        if (allReservations[i].id !== allReservations[j].id) {
            // Get details for the second reservation
            let compareStart = new Date(allReservations[j].getCellValue(BaseSpecificNames.startField)).toISOString();
            let compareEnd = new Date(allReservations[j].getCellValue(BaseSpecificNames.endField)).toISOString();
            let compareItem = allReservations[j].getCellValueAsString(BaseSpecificNames.assetField);
            let compareItemList = compareItem.split(', ');
            
            // Check for time overlap AND asset conflict
            // Two conflict scenarios:
            // 1. First reservation starts during the second reservation
            // 2. First reservation completely contains the second reservation
            if ((startDate >= compareStart && startDate <= compareEnd && contains(asset, compareItemList)) || 
                (startDate <= compareStart && endDate >= compareEnd && contains(asset, compareItemList))) {
                
                // Only add unique conflicts to the array
                if (!conflicts.includes(allReservations[i]) && !conflicts.includes(allReservations[j])){
                    conflicts.push(allReservations[i], allReservations[j]);
                }
            }
        }
    }
}

// Display results
if (conflicts.length > 0) {
    output.markdown(`## Conflict(s) detected within the Reservations. Please see below.`);
} else {
    output.markdown(`#### There are no conflicts at this time.`);
}

// Format and display conflict details
for (var i = 0; i < conflicts.length; i++) {
    let reservation = result.getRecord(conflicts[i].id);
    let asset = reservation.getCellValueAsString(BaseSpecificNames.assetField);
    let conflictStartDate = reservation.getCellValueAsString(BaseSpecificNames.startField);
    let conflictEndDate = reservation.getCellValueAsString(BaseSpecificNames.endField);
    let person = reservation.getCellValueAsString(BaseSpecificNames.personField);
    
    if (conflicts.length > 0){
        output.table([{
            Reservation: asset, 
            StartDate: conflictStartDate, 
            EndDate: conflictEndDate, 
            Member: person
        }]);
    }
}

/* 
Potential future enhancements:
1. Display list of unavailable assets during conflict periods
2. Display list of available assets as alternatives
*/