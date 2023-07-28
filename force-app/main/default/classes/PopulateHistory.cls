public class PopulateHistory {
    
    @AuraEnabled
    public static void generate(String givenId){
        Id ourId = givenId;
        String givenObject = ourId.getsobjecttype().getDescribe().getName();
		
        // Aesthetics on line 10 - got too lazy to update my index as it was set to 20 characaters earlier
		// Anyway, this doesn't affect the ability to portray the architecture or the demo itself
		//givenObject = givenObject.substring(0, 18);
        
        List<FieldHistoryArchive__b> myArchive = new List<FieldHistoryArchive__b>();
        
        FieldHistoryArchive__b dataOne = new FieldHistoryArchive__b(FieldHistoryType__c = givenObject, 
                                                                    ParentId__c = givenId, 
                                                                    CreatedDate__c = System.now().addYears(-4), 
                                                                    Field__c = 'Service Model', 
                                                                    CreatedById__c = 'Jill Smith', 
                                                                    OldValue__c = 'Tier 2', 
                                                                    NewValue__c = 'Tier 1');
        myArchive.add(dataOne); 
        
        FieldHistoryArchive__b dataTwo = new FieldHistoryArchive__b(FieldHistoryType__c = givenObject, 
                                                                    ParentId__c = givenId, 
                                                                    CreatedDate__c = System.now().addYears(-4).addMonths(-1).addDays(-2), 
                                                                    Field__c = 'Status', 
                                                                    CreatedById__c = 'Joe Winters', 
                                                                    OldValue__c = 'Dormant', 
                                                                    NewValue__c = 'Active');
        myArchive.add(dataTwo);  
        
        FieldHistoryArchive__b dataThree = new FieldHistoryArchive__b(FieldHistoryType__c = givenObject, 
                                                                      ParentId__c = givenId, 
                                                                      CreatedDate__c = System.now().addYears(-4).addMonths(-1).addDays(-2).addSeconds(-5), 
                                                                      Field__c = 'Category', 
                                                                      CreatedById__c = 'Joe Winters', 
                                                                      OldValue__c = 'Bronze', 
                                                                      NewValue__c = 'Silver');                                                                    
        
        myArchive.add(dataThree);        
        
        FieldHistoryArchive__b dataFour = new FieldHistoryArchive__b(FieldHistoryType__c = givenObject, 
                                                                     ParentId__c = givenId, 
                                                                     CreatedDate__c = System.now().addYears(-6).addMonths(2).addDays(5), 
                                                                     Field__c = 'Risk Tolerance', 
                                                                     CreatedById__c = 'Mary Jackson', 
                                                                     OldValue__c = 'Moderate', 
                                                                     NewValue__c = 'Aggressive');
        myArchive.add(dataFour);   
        
        FieldHistoryArchive__b dataFive = new FieldHistoryArchive__b(FieldHistoryType__c = givenObject, 
                                                                     ParentId__c = givenId, 
                                                                     CreatedDate__c = System.now().addYears(-6).addMonths(-5), 
                                                                     Field__c = 'Name', 
                                                                     CreatedById__c = 'Jake Jones', 
                                                                     OldValue__c = 'Julie Thompson', 
                                                                     NewValue__c = 'Julie Morris');
        myArchive.add(dataFive);
        
        if(!Test.isRunningTest()){
            Database.insertImmediate(myArchive);                   
        }
        
    }
    
    @AuraEnabled
    public static void removeHistory(){
        List<FieldHistoryArchive__b> myArchive = [SELECT FieldHistoryType__c, ParentId__c, CreatedDate__c
                                                  FROM FieldHistoryArchive__b];
        
        if(!Test.isRunningTest()){
            Database.deleteImmediate(myArchive);
        }
        
    }
    
}