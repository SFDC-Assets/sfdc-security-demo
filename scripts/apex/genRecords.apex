String userId = [Select name From User where name='User User'].Id;

List<Report_Anomaly_Event_Store__c> lstReportImport = new List<Report_Anomaly_Event_Store__c>();
Report_Anomaly_Event_Store__c objReport;
for(Integer i=1;i<=15;i++)
{
objReport=new Report_Anomaly_Event_Store__c
                        (Name='RAE-000000000'+string.valueof(i),
                         Event_Name__c='RAE-000000000'+string.valueof(i),
                         EventIdentifier__c='7b79355d-316f-43d1-b8d1-a699b511037x'+string.valueof(i),
                         Report__c='00Of4000007F2Y'+string.valueof(i),
                         Score__c='1.000000',
                         Event_Date__c=System.now(),
                         Event_Data__c='[{“featureContribution”:90.31 %”,featureName”:”avgRowCount”,featureValue”:”522”},{“featureContribution”:2.00 %”,”featureName”:”autonomousSystem”,featureValue”:”53813”},{“featureContribution”:1.42 %”,”featureName”:”dayOfWeek”,featureValue”:”Sunday”},{“featureContribution”:1.20 %”,”featureName”:”browserUserAgent”,featureValue”:”Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36”}{“featureContribution”:0.001 %”,”featureName”:”numColumns”,featureValue”:” 2”}]',
                         User__c=userId 
                        );
lstReportImport.add(objReport);
}
insert lstReportImport;

List<Credential_Stuffing_Event_Store__c> lstCredentialStuffingImport = new List<Credential_Stuffing_Event_Store__c>();
Credential_Stuffing_Event_Store__c objcredStuffing;
for(Integer i=1;i<=15;i++)
{
objcredStuffing=new Credential_Stuffing_Event_Store__c
                        (Name='CSE-000000000'+string.valueof(i),
                         Event_Name__c='CSE-000000000'+string.valueof(i),
                         Event_ID__c='9b793255d-316f-13x1-b8d1-a699b5231037z'+string.valueof(i),
                         Score__c='5.000000',
                         Event_Date__c=System.now(),
                         Summary__c='Successful login from Credential Stuffing attack from IP address 70.102.218.' +string.valueof(i),
                         Accept_Language__c='us',
                         Login_url__c='test.salesforce.com',
                         User_Agent__c=' Jakarta HTTP Server',
                         Login_Type__c='Partner Product',
                         Source_IP__c = '70.102.218.' +string.valueof(i),
                         User__c=userId 
                        );
lstCredentialStuffingImport.add(objcredStuffing);
}
insert lstCredentialStuffingImport;

List<Session_HIjacking_Event__c> lstSessionHijackingImport = new List<Session_HIjacking_Event__c>();
Session_HIjacking_Event__c objsessionHijacking;
for(Integer i=1;i<=15;i++)
{
objsessionHijacking=new Session_HIjacking_Event__c
                        (Name='SHE-000000000'+string.valueof(i),
                         Event_Name__c='SHE-000000000'+string.valueof(i),
                         Event_ID__c='9c79311d-316f-43d1-b8r1-t699b5113467a'+string.valueof(i),
                         Score__c='7.000000',
                         Event_Date__c=System.now(),
                         Summary__c='Changes to (userAgent, platform, ipAddress) were not expected based on this user\'s profile. These top 3 deviations contributed (1, 1, 0.922) to the total score, respectively',
                         Current_Platform__c='Unknown',
                         Previous_Platform__c='Mac OSX',
                         Current_IP__c='18.232.130.16'+string.valueof(i),
                         Previous_IP__c='74.210.130.13' +string.valueof(i),
                         Current_User_Agent__c='Jakarta HTTP Commons',
                         Previous_User_Agent__c='Firefox 76',
                         Source_IP__c = '18.232.130.16'+string.valueof(i),
                         User__c=userId 
                        );
lstSessionHijackingImport.add(objsessionHijacking);
}
insert lstSessionHijackingImport;



List<Api_Anomaly_Event_Store__c> lstAPIAnomalyEventImport = new List<Api_Anomaly_Event_Store__c>();
Api_Anomaly_Event_Store__c objApiAnomalyEvent;
for(Integer i=2;i<=15;i++)
{
objApiAnomalyEvent=new Api_Anomaly_Event_Store__c
                        (Name='AAE-000000000'+string.valueof(i),
                         EventIdentifier__c='AAE-000000000'+string.valueof(i),
                         Request_Identifier__c='6bc79311d-316f-63x1-b8r1-t699b5113467w'+string.valueof(i),
                         Score__c='7.000000',
                         Event_Date__c=System.now(),
                         Summary__c='API was generated with an unusually high number of rows (111141)',
                         User_Agent__c='Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                         Source_IP_Address__c = '18.232.130.16'+string.valueof(i),
                         User__c=userId,
                         Operation__c='Query',
                         Rows_Processed__c='4267'+string.valueof(i),
                         SecurityEventData__c='[{"featureName": "rowCount","featureValue": "1937568","featureContribution": “95.00 %"},{"featureName": "autonomousSystem","featureValue": "Bigleaf Networks, Inc.","featureContribution": “1.62 %"},{"featureName": "dayOfWeek","featureValue": "Sunday","featureContribution": “1.42 %"},{"featureName": "userAgent","featureValue": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari 537.36}","featureContribution": “1.21 %"},{"featureName": "periodOfDay","featureValue": “Evening”,"featureContribution": “.09 %"},{"featureName": "averageRowSize","featureValue": "744","featureContribution": “0.08 %"},{"featureName": "screenResolution","featureValue": "900x1440","featureContribution": “0.07"}]'
                        );
lstAPIAnomalyEventImport.add(objApiAnomalyEvent);
}
insert lstAPIAnomalyEventImport;

