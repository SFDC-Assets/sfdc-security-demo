trigger MobileScreenshotEventTrigger on MobileScreenshotEvent (after insert) {
    List<MobileScreenshotObject__c> objects = new List<MobileScreenshotObject__c>();

    string objectId;
    for (MobileScreenshotEvent event : Trigger.New) {
        MobileScreenshotObject__c obj = new MobileScreenshotObject__c();
        obj.ScreenDescription__c = event.ScreenDescription;
        obj.DeviceIdentifier__c = event.DeviceIdentifier;
        obj.AppPackageIdentifier__c = event.AppPackageIdentifier;
        obj.AppVersion__c = event.AppVersion;
        obj.OsName__c = event.OsName;
        obj.OsVersion__c = event.OsVersion;
        obj.DeviceModel__c = event.DeviceModel;
        obj.UserId__c = event.UserId;
        obj.EventIdentifier__c = event.EventIdentifier;
        insert obj;

        DateTime oneHourAgo = System.Now().addHours(-1);
        Map<String, Object> params = new Map<String, Object>();
        params.put('subject', 'Mobile Security Warning');
        params.put('body', 'A mobile screenshot event was detected.');
        params.put('notificationName', 'Security_Notification');
        params.put('targetId', obj.Id);
        params.put('userId', obj.UserId__c);
        Flow.Interview.Send_Notification sendNotification = new Flow.Interview.Send_Notification(params);
        sendNotification.start();
    }
}