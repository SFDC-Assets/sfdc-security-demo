trigger MobileEnforcedPolicyEventTrigger on MobileEnforcedPolicyEvent (after insert) {
   List<MobileEnforcedPolicyObject__c> objects = new List<MobileEnforcedPolicyObject__c>();

    for (MobileEnforcedPolicyEvent event : Trigger.New) {

            MobileEnforcedPolicyObject__c obj = new MobileEnforcedPolicyObject__c();
            obj.DeviceIdentifier__c = event.DeviceIdentifier;
            obj.AppPackageIdentifier__c = event.AppPackageIdentifier;
            obj.AppVersion__c = event.AppVersion;
            obj.OsName__c = event.OsName;
            obj.OsVersion__c = event.OsVersion;
            obj.DeviceModel__c = event.DeviceModel;
            obj.EnforcedAction__c = event.EnforcedAction;
            obj.UserId__c = event.UserId;
            obj.EventIdentifier__c = event.EventIdentifier;
            obj.PolicyResultsText__c = event.PolicyResults;
            objects.add(obj);
    }
 
    if(objects.size() > 0) {
        insert objects;
    }
}