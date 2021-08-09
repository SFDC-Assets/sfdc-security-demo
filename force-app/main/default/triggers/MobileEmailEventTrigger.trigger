trigger MobileEmailEventTrigger on MobileEmailEvent (after insert) {
	List<MobileEmailObject__c> objects = new List<MobileEmailObject__c>();

    for (MobileEmailEvent event : Trigger.New) {

            MobileEmailObject__c obj = new MobileEmailObject__c();
            obj.EmailAddress__c = event.EmailAddress;
            obj.DeviceIdentifier__c = event.DeviceIdentifier;
            obj.AppPackageIdentifier__c = event.AppPackageIdentifier;
            obj.AppVersion__c = event.AppVersion;
            obj.OsName__c = event.OsName;
            obj.OsVersion__c = event.OsVersion;
            obj.DeviceModel__c = event.DeviceModel;
            obj.UserId__c = event.UserId;
            obj.EventIdentifier__c = event.EventIdentifier;
            objects.add(obj);
    }
 
    if(objects.size() > 0) {
        insert objects;
    }
}