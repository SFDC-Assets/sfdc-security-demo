# Create the demo org
sf demoutil org create scratch -f config/project-scratch-def.json -d 5 -s -p main -e security.demo

# From Mobile Security
sf package install -p 04t3A000001AJf2 --wait 20

# Install streaming monitor
sf package install -p 04t1t000003Po3Q -w 30

# Install data mask
sf package install -w 30 -r -p 04t3k0000027CCn

# Install Einstein Data Detect
sf package install -w 30 -r -p 04t5e000000zR3E

# Install Privacy Center
sf package install -r --package=04t3t000002lfh2 --wait 30 

# Updates the Transaction Security Policies to contain this scratch orgs username
sfdx shane:tsp:username:update

# Push the metadata into the new scratch org.
sf project deploy start

# Assign user the permset
sf org assign permset -n PlatformEncryption
sf org assign permset -n TransactionSecurity
sf org assign permset -n MobileSecurity
sf org assign permset -n Event_Monitoring_Access
sf org assign permset -n fat_simulator
sf shane user psl -l User -g User -n datamask_DataMaskUserPsl
sf org assign permset -n datamask
sf shane user psl -n 'Privacy Center User' -g User -l User
sf org assign permset -n PrivacyCenter

# Set the default password.
sf demoutil user password set -p salesforce1 -g User -l User

# Create Tenant Secrets
sf data record create -s TenantSecret -v "Description=ProbabilisticKey"
# sf data record create -s TenantSecret -v "Description=SearchKey Type=SearchIndex"
sf data record create -s TenantSecret -v "Description=EventBusKey Type=EventBus"

# Deploy platform encryption settings
sf project deploy start -d ./src -w 5

sf data record create -s TenantSecret -v "Description=DeterministicKey Type=DeterministicData"

# Create another user for LoginAs
# sf org create user -f config/other-user.json

# Open the org.
sf org open

sfdx shane:connectedapp:attributes -n "Salesforce for iOS" -a customAttributes.json

# Import the data required by the demo
sf automig load --inputdir ./data
sf automig load --inputdir ./encryption-data
# sfdx automig:load --inputdir ./cmdt

sfdx shane:data:file:upload -f ./attachment/wp-platform-encryption-architecture.pdf -p `sfdx shane:data:id:query -o Case -w "Subject='Does not align with specs'"`

# Generate records for threat detection
sf apex run -f scripts/apex/genRecords.apex
# sfdx force:apex:execute -f scripts/apex/genContactHistory.apex

