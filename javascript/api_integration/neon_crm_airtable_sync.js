/*
Script: NeonCRM Membership --> Airtable Integration
Author: June Bethea

PURPOSE:
This script synchronizes membership data between NeonCRM (source) and Airtable (destination).
It retrieves current members from NeonCRM via API and either adds new records or updates existing ones in Airtable.

FEATURES:
- API authentication with session management
- Multi-page data retrieval (pagination)
- Custom fields handling
- Complex data transformations
- Conditional record creation/updating
- Progress reporting
*/

// ====== AUTHENTICATION SECTION ======
// API v1 authentication
let apiKey = 'API-key'  // Replace with actual API key in production
let orgid = 'ID'        // Replace with actual org ID in production

// Authenticate and get session ID
let response = await remoteFetchAsync(`https://api.neoncrm.com/neonws/services/api/common/login?login.apiKey=${apiKey}&login.orgid=${orgid}`);
var responseJSON = await response.json();
var session = await responseJSON.loginResponse;
var sessionID = session.userSessionId;

// ====== CONFIGURATION SECTION ======
// Prompt user to select the target table for membership data
let settings = input.config({
    title: "Update Memberships from NeonCRM",
    items: [
        input.config.table('table', {label: "Membership Table"}),
    ]
});

let {table} = settings;

// ====== DATE FORMATTING SECTION ======
// Create properly formatted date string for API query (MM/DD/YYYY)
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
var yyyy = today.getFullYear();
let date = mm + '/' + dd + '/' + yyyy;

// ====== INITIAL API QUERY SECTION ======
// Construct API URL with all required fields and filter for current members only
var url = await remoteFetchAsync(`https://api.neoncrm.com/neonws/services/api/account/listAccounts?&userSessionId=${sessionID}&outputfields.idnamepair.id=&outputfields.idnamepair.name=Account%20ID&outputfields.idnamepair.id=&outputfields.idnamepair.name=Full%20Name%20(F)&outputfields.idnamepair.id=&outputfields.idnamepair.name=Email%201&outputfields.idnamepair.id=&outputfields.idnamepair.name=Phone%201%20Full%20Number%20(F)&outputfields.idnamepair.id=81&outputfields.idnamepair.name=Certifications&outputfields.idnamepair.id=&outputfields.idnamepair.name=Membership%20Name&outputfields.idnamepair.id=&outputfields.idnamepair.name=Membership%20Expiration%20Date&outputfields.idnamepair.id=&outputfields.idnamepair.name=Company%20Name&searches.search.key=Membership%20Expiration%20Date&searches.search.searchOperator=GREATER_AND_EQUAL&searches.search.value=${date}&page.currentPage=1&page.pageSize=200`);

output.markdown("# Checking NeonCRM for Current Members....");

// ====== DATA PROCESSING SECTION ======
// Parse results
let json = await url.json();
let data = json.listAccountsResponse;
let results = data.searchResults;
let totalResults = data.page.totalResults;

// ====== AIRTABLE RECORD COLLECTION ======
// Query existing records in the specified table to avoid duplicates
let tableQuery = await table.selectRecordsAsync();
let recordList = tableQuery.records;
let recordCollection = [];

// Display summary information
output.markdown("");
output.markdown("### **Total results: **" + totalResults);
output.markdown("### **Total pages: **" + data.page.totalPage + "\n");
output.markdown("");

// Build collection of existing Account IDs for comparison
for (let record of recordList){
    let recordName = record.getCellValueAsString("Account ID");
    recordCollection.push(recordName);
}

// ====== PAGINATION AND RECORD PROCESSING ======
// Loop through all pages of results
for (page=1; page <= data.page.totalPage; page++) {
    output.markdown("## Scanning " + " Page " + page + " .....");
    let pageSize = 200;
    
    // Request data for current page
    let url = await remoteFetchAsync(`https://api.neoncrm.com/neonws/services/api/account/listAccounts?&userSessionId=${sessionID}&outputfields.idnamepair.id=&outputfields.idnamepair.name=Account%20ID&outputfields.idnamepair.id=&outputfields.idnamepair.name=Full%20Name%20(F)&outputfields.idnamepair.id=&outputfields.idnamepair.name=Email%201&outputfields.idnamepair.id=&outputfields.idnamepair.name=Phone%201%20Full%20Number%20(F)&outputfields.idnamepair.id=81&outputfields.idnamepair.name=Certifications&outputfields.idnamepair.id=&outputfields.idnamepair.name=Membership%20Name&outputfields.idnamepair.id=&outputfields.idnamepair.name=Membership%20Expiration%20Date&outputfields.idnamepair.id=&outputfields.idnamepair.name=Company%20Name&searches.search.key=Membership%20Expiration%20Date&searches.search.searchOperator=GREATER_AND_EQUAL&searches.search.value=${date}&page.currentPage=${page}&page.pageSize=${pageSize}`);
    let json = await url.json();
    
    // Process current page data
    let data = json.listAccountsResponse;
    let results = data.searchResults;
    
    // Loop through each record on the current page
    for (i=0; i < pageSize; i++) {
        // Skip if we've reached the end of results for this page
        if (results.nameValuePairs[i] === undefined){
            continue;
        }
        
        // Normalize data - handle missing values
        for (k=0; k < results.nameValuePairs[i].nameValuePair.length; k++){
            if (!results.nameValuePairs[i].nameValuePair[k].value){
                results.nameValuePairs[i].nameValuePair[k].value = "NONE";
            }
        }
        
        // ====== CREATE OR UPDATE RECORDS ======
        // Check if record exists based on Account ID
        if (!recordCollection.includes(results.nameValuePairs[i].nameValuePair[7].value) && 
            results.nameValuePairs[i].nameValuePair[2].value != "NONE") {
            
            // New record found - create in Airtable
            output.markdown("### Adding new record " + [i + 1] + " for " + results.nameValuePairs[i].nameValuePair[5].value);
            
            // Process certifications (multi-select field)
            var certifications = [];
            let certList = results.nameValuePairs[i].nameValuePair[0].value.split('|');
            for (p=0; p < certList.length; p++){
                let element = {};
                element.name = certList[p];
                certifications.push(element);
            }
            
            // Process membership type (single-select field)
            var membershipType = {};
            membershipType.name = results.nameValuePairs[i].nameValuePair[1].value;
            
            // Create the new record
            let createRecord = await table.createRecordAsync({
                "Certifications": certifications,
                "Membership Type": membershipType,
                "Membership End Date": results.nameValuePairs[i].nameValuePair[2].value,
                "Phone": results.nameValuePairs[i].nameValuePair[3].value,
                "Organization Name": results.nameValuePairs[i].nameValuePair[4].value,
                "Full Name": results.nameValuePairs[i].nameValuePair[5].value,
                "Email": results.nameValuePairs[i].nameValuePair[6].value,
                "Account ID": results.nameValuePairs[i].nameValuePair[7].value,
            });
        } else {
            // Record exists - check if update needed
            output.markdown("Record " + [i + 1] + " (" + results.nameValuePairs[i].nameValuePair[5].value + ")" + " already exists....");
            
            // Get Account ID for comparison
            let accountID = results.nameValuePairs[i].nameValuePair[7].value;
            
            // Check each existing record for potential updates
            for (let record of recordList){
                let recordID = record.id;
                let recordName = record.getCellValueAsString("Account ID");
                let expirationDate = record.getCellValue("Membership End Date");
                
                // If Account ID matches and new expiration date is later, update the record
                if (accountID == recordName && expirationDate < results.nameValuePairs[i].nameValuePair[2].value){
                    output.markdown("### Updating *Membership Expiration Date* for: " + "**" + results.nameValuePairs[i].nameValuePair[5].value + "** ....");
                    
                    // Process certifications for update
                    var certifications = [];
                    let certList = results.nameValuePairs[i].nameValuePair[0].value.split('|');
                    for (p=0; p < certList.length; p++){
                        let element = {};
                        element.name = certList[p];
                        certifications.push(element);
                    }
                    
                    // Process membership type for update
                    var membershipType = {};
                    membershipType.name = results.nameValuePairs[i].nameValuePair[1].value;
                    
                    // Update the record
                    let recordUpdate = await table.updateRecordAsync(recordID, {
                        "Certifications": certifications,
                        "Membership Type": membershipType,
                        "Membership End Date": results.nameValuePairs[i].nameValuePair[2].value,
                        "Phone": results.nameValuePairs[i].nameValuePair[3].value,
                        "Organization Name": results.nameValuePairs[i].nameValuePair[4].value,
                        "Full Name": results.nameValuePairs[i].nameValuePair[5].value,
                        "Email": results.nameValuePairs[i].nameValuePair[6].value,
                        "Account ID": results.nameValuePairs[i].nameValuePair[7].value,
                    });
                }
            }
        }
    }
}

// ====== CLEANUP & COMPLETION ======
// Logout to properly close the API session
await remoteFetchAsync(`https://api.neoncrm.com/neonws/services/api/common/logout?userSessionId=${sessionID}`);
output.markdown("# Done!");