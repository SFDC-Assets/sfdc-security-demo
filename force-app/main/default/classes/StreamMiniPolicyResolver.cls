public with sharing class StreamMiniPolicyResolver {

    public class PolicyInfo {
        @AuraEnabled public String id;
        @AuraEnabled public String developerName;
        @AuraEnabled public String masterLabel;
    }

    @AuraEnabled(cacheable=true)
    public static List<PolicyInfo> getPolicies() {
        List<PolicyInfo> results = new List<PolicyInfo>();
        for (TransactionSecurityPolicy tsp : [
            SELECT Id, DeveloperName, MasterLabel
            FROM TransactionSecurityPolicy
            WHERE IsDeleted = false
        ]) {
            PolicyInfo info = new PolicyInfo();
            info.id = tsp.Id;
            info.developerName = tsp.DeveloperName;
            info.masterLabel = tsp.MasterLabel;
            results.add(info);
        }
        return results;
    }
}