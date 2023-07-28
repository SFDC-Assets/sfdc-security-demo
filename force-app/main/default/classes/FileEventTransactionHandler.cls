global class FileEventTransactionHandler implements TxnSecurity.EventCondition {
    public boolean evaluate(SObject event){
        switch on event {
           when FileEventStore fileEventStore {
                return evaluateFileEvent(fileEventStore);
           }
           
           when else {
               System.debug(event);
               return false;
           }
        }
    }
    
    public boolean evaluateFileEvent(FileEventStore fileEventStore) {
        return checkFileBlock(fileEventStore.DocumentId);
    }
    
    
    
    public boolean checkFileBlock(String documentId){
        //get parents of the file
        List<ContentDocumentLink> fileParents = [SELECT LinkedEntityId FROM ContentDocumentLink WHERE ContentDocumentId=:documentId ];
        if(fileParents.size()==0) return false; //file is not related to an object
        List<Id> linkedEntities = new List<Id>();
        for(ContentDocumentLink cdl: fileParents){
            linkedEntities.add(cdl.linkedEntityId);
        }
        //query related objects for business conditions
        List<Case> closedCases = [SELECT id FROM Case WHERE Id in:linkedEntities AND Status='Closed'];//Add conditions here to narrow down conditions if needed.
        if(closedCases.size()==0) return false;
        return true;
    }

}