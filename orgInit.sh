# Create the demo org
sfdx shane:org:create -f config/project-scratch-def.json -d 5 -s --wait 60 --userprefix main -o security.demo
#sfdx force:org:create -f config/project-scratch-def.json -a transaction-security-demo

# From Mobile Security
sfdx force:package:install -p 04t3A000001AJf2QAG --wait 20

# Install streaming monitor
sfdx force:package:install -p 04t1t000003Po3QAAS -w 30

# Install data mask
sfdx force:package:install -w 30 -r -p 04t3k0000027CCn

# Install Einstein Data Detect
sfdx force:package:install -w 30 -r -p 04t5e000000zR3E

# Install Privacy Center
sfdx force:package:install -r --package=04t3t000002zQ6IAAU --wait 30 

# Updates the Transaction Security Policies to contain this scratch orgs username
sfdx shane:tsp:username:update

# Push the metadata into the new scratch org.
sfdx force:source:push

# Assign user the permset
sfdx force:user:permset:assign -n TransactionSecurity
sfdx force:user:permset:assign -n MobileSecurity
sfdx force:user:permset:assign -n Event_Monitoring_Access
sfdx shane:user:psl -l User -g User -n datamask_DataMaskUserPsl
sfdx shane:user:permset:assign -l User -g User -n datamask
sfdx shane:user:psl -n 'Privacy Center User' -g User -l User
sfdx force:user:permset:assign -n PrivacyCenter

# Set the default password.
sfdx shane:user:password:set -g User -l User -p salesforce1

# Create another user for LoginAs
sfdx force:user:create -a other-user

# Open the org.
sfdx force:org:open

sfdx shane:connectedapp:attributes -n "Salesforce for iOS" -a customAttributes.json

# Import the data required by the demo
sfdx automig:load --inputdir ./data

# Generate records for threat detection
sfdx force:apex:execute -f scripts/apex/genRecords.apex
