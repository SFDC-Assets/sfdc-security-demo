DataDetectPolicy plcy = new DataDetectPolicy(
    Description = 'This is a representative, typical data detect policy',
    Name = 'Sample Data Detect Policy',
    ScanType = 'PatternMatch',
    StartTime = Datetime.newInstance(2024, 11, 18, 1, 0, 0),
    EndTime = Datetime.newInstance(2025, 11, 18, 1, 0, 0)
);

insert plcy;

DataDetectPolicyObject plcyObjct1 = new DataDetectPolicyObject(DataDetectPolicyId = plcy.Id,ObjectReference = 'Account');
DataDetectPolicyObject plcyObjct2 = new DataDetectPolicyObject(DataDetectPolicyId = plcy.Id,ObjectReference = 'Case');
DataDetectPolicyObject plcyObjct3 = new DataDetectPolicyObject(DataDetectPolicyId = plcy.Id,ObjectReference = 'Contact');
DataDetectPolicyObject plcyObjct4 = new DataDetectPolicyObject(DataDetectPolicyId = plcy.Id,ObjectReference = 'Opportunity');

insert plcyObjct1;
insert plcyObjct2;
insert plcyObjct3;
insert plcyObjct4;

DataDetectPolicyObjField plcyObjField1 = new DataDetectPolicyObjField(fieldName = 'AccountNumber',DataDetectPolicyObjectId = plcyObjct1.Id);
DataDetectPolicyObjField plcyObjField2 = new DataDetectPolicyObjField(fieldName = 'Site',DataDetectPolicyObjectId = plcyObjct1.Id);
DataDetectPolicyObjField plcyObjField3 = new DataDetectPolicyObjField(fieldName = 'Description',DataDetectPolicyObjectId = plcyObjct1.Id);
DataDetectPolicyObjField plcyObjField4 = new DataDetectPolicyObjField(fieldName = 'Description',DataDetectPolicyObjectId = plcyObjct2.Id);
DataDetectPolicyObjField plcyObjField5 = new DataDetectPolicyObjField(fieldName = 'Comments',DataDetectPolicyObjectId = plcyObjct2.Id);
DataDetectPolicyObjField plcyObjField6 = new DataDetectPolicyObjField(fieldName = 'Description',DataDetectPolicyObjectId = plcyObjct3.Id);
DataDetectPolicyObjField plcyObjField7 = new DataDetectPolicyObjField(fieldName = 'Description',DataDetectPolicyObjectId = plcyObjct4.Id);
DataDetectPolicyObjField plcyObjField8 = new DataDetectPolicyObjField(fieldName = 'NextStep',DataDetectPolicyObjectId = plcyObjct4.Id);

insert plcyObjField1;
insert plcyObjField2;
insert plcyObjField3;
insert plcyObjField4;
insert plcyObjField5;
insert plcyObjField6;
insert plcyObjField7;
insert plcyObjField8;

// DataDetectPolicySnapshot plcySnpsht = new DataDetectPolicySnapshot(DataDetectPolicyId = plcy.Id, Name='PV-0000000001',RevisionNumber=0);

DataDetPlcyDataSrchExps plcyDataScrchExp = new DataDetPlcyDataSrchExps(DataDetectPolicyId = plcy.Id, Expression='^[0-9]{9}$', IsCaseSensitive=true, IsKeywordSearch=false, Name='Secret Key');

insert plcyDataScrchExp;

// DataDetPlcyMdatScanCrit scanCrit1 = new DataDetPlcyMdatScanCrit(Criteria = 'ComplianceCategory', DataDetectPolicyId = plcy.Id, Type = 'Exclusion', Value = 'None');
// DataDetPlcyMdatScanCrit scanCrit2 = new DataDetPlcyMdatScanCrit(Criteria = 'DataSensitivity', DataDetectPolicyId = plcy.Id, Type = 'Exclusion', Value = 'FieldUsage');
// DataDetPlcyMdatScanCrit scanCrit3 = new DataDetPlcyMdatScanCrit(Criteria = 'FieldUsage', DataDetectPolicyId = plcy.Id, Type = 'Exclusion', Value = 'None');

// insert scanCrit1;
// insert scanCrit2;
// insert scanCrit3;

DataDetPlcySstvDataCatg SstvDataCatg1 = new DataDetPlcySstvDataCatg(DataCategory = 'Credit Card', DataDetectPolicyId = plcy.Id);
DataDetPlcySstvDataCatg SstvDataCatg2 = new DataDetPlcySstvDataCatg(DataCategory = 'Email Address', DataDetectPolicyId = plcy.Id);
DataDetPlcySstvDataCatg SstvDataCatg3 = new DataDetPlcySstvDataCatg(DataCategory = 'IBAN Number', DataDetectPolicyId = plcy.Id);
DataDetPlcySstvDataCatg SstvDataCatg4 = new DataDetPlcySstvDataCatg(DataCategory = 'Phone Number', DataDetectPolicyId = plcy.Id);
DataDetPlcySstvDataCatg SstvDataCatg5 = new DataDetPlcySstvDataCatg(DataCategory = 'Social Security Number', DataDetectPolicyId = plcy.Id);

insert SstvDataCatg1;
insert SstvDataCatg2;
insert SstvDataCatg3;
insert SstvDataCatg4;
insert SstvDataCatg5;