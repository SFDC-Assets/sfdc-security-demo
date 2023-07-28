public class GetFieldAudit {

        @AuraEnabled(cacheable=true)
        public static List<FieldHistoryArchive__b> retriveFieldAudit(Id recordId) {
            Id ourId = recordId;
            String givenObject = ourId.getsobjecttype().getDescribe().getName();
            
            // Aesthetics on line 10 - got too lazy to update my index as it was set to 20 characaters earlier
            // Anyway, this doesn't affect the ability to portray the architecture or the demo itself
            //givenObject = givenObject.substring(0, 18);
            
            return [SELECT FieldHistoryType__c, ParentId__c, CreatedDate__c, Field__c, CreatedById__c, OldValue__c, NewValue__c 
                    FROM FieldHistoryArchive__b
                    WHERE FieldHistoryType__c = :givenObject AND
                    ParentId__c = :recordId];
        }
    }