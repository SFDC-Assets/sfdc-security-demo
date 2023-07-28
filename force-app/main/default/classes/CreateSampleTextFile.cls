public class CreateSampleTextFile {
    
    public static void insertSampleFile(){
        String yourFilesContent = 'Sample Secret File';

        ContentVersion conVer = new ContentVersion();
        conVer.ContentLocation = 'S'; // to use S specify this document is in Salesforce, to use E for external files
        String theName = 'Sample Secret File';
        conVer.PathOnClient = theName+'.txt'; // The files name, extension is very important here which will help the file in preview.
        conVer.Title = 't_'+theName; // Display name of the files
        conVer.VersionData = Blob.valueof(yourFilesContent); // converting your binary string to Blog
        insert conVer;    //Insert ContentVersion
        
        
        // First get the Content Document Id from ContentVersion Object
        Id conDoc = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :conVer.Id].ContentDocumentId;
        
        List<Case> closedCases = [SELECT Id FROM Case WHERE Status='Closed'];
        List<ContentDocumentLink> docLinksToInsert = new List<ContentDocumentLink>();
        
        for(Case cs: closedCases){
            //create ContentDocumentLink  record
            ContentDocumentLink conDocLink = New ContentDocumentLink();
            conDocLink.LinkedEntityId = cs.Id; // Specify RECORD ID here i.e Any Object ID (Standard Object/Custom Object), it can be your user, for example
            conDocLink.ContentDocumentId = conDoc;  //ContentDocumentId Id from ContentVersion
            conDocLink.shareType = 'I';
            conDocLink.Visibility = 'AllUsers';
            docLinksToInsert.add(conDocLink);
        }
        
        insert docLinksToInsert;
    }
    

}