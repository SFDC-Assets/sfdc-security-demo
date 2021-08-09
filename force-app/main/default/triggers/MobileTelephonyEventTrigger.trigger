trigger MobileTelephonyEventTrigger on MobileTelephonyEvent (after insert) {

    List<MobileTelephonyObject__c> objects = new List<MobileTelephonyObject__c>();

    for (MobileTelephonyEvent event : Trigger.New) {

            MobileTelephonyObject__c obj = new MobileTelephonyObject__c();
            obj.PhoneNumber__c = event.PhoneNumber;
            obj.Operation__c = event.Operation;
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