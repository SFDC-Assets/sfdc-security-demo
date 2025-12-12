public with sharing class StreamMiniTspController {
    public class TspInfo {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String eventType; // API | REPORT
        @AuraEnabled public Boolean isActive;
    }

    @AuraEnabled(cacheable=true)
    public static List<TspInfo> getPolicies() {
        List<TspInfo> result = new List<TspInfo>();

        for (TransactionSecurityPolicy tsp : [
            SELECT Id, MasterLabel, State, EventName, EventType
            FROM TransactionSecurityPolicy
            WHERE IsDeleted = false
        ]) {
            String evtName = String.valueOf(tsp.EventName);
            String streamType;
            if (evtName == 'ApiEvent') {
                streamType = 'API';
            } else if (evtName == 'ReportEvent') {
                streamType = 'REPORT';
            } else {
                continue;
            }
            TspInfo info = new TspInfo();
            info.id = tsp.Id;
            info.name = tsp.MasterLabel;
            info.isActive = (tsp.State == 'Enabled');
            info.eventType = streamType;
            result.add(info);
        }

        return result;
    }

    @AuraEnabled
    public static TspInfo togglePolicy(Id policyId, Boolean enable) {
        if (policyId == null) {
            throw new AuraHandledException('Policy Id is required.');
        }

        TransactionSecurityPolicy tsp = [
            SELECT Id, MasterLabel, State, EventName, EventType
            FROM TransactionSecurityPolicy
            WHERE Id = :policyId
            LIMIT 1
        ];

        String targetState = enable ? 'Enabled' : 'Disabled';
        tsp.State = targetState;

        // Use Tooling API callout because DML on TransactionSecurityPolicy is blocked in Apex.
        try {
            HttpRequest req = new HttpRequest();
            req.setMethod('PATCH');
            req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
            req.setHeader('Content-Type', 'application/json');
            req.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + '/services/data/v64.0/tooling/sobjects/TransactionSecurityPolicy/' + policyId);
            req.setBody('{"State":"' + targetState + '"}');
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() < 200 || resp.getStatusCode() >= 300) {
                System.debug('TSP toggle error: ' + resp.getStatus() + ' body: ' + resp.getBody());
                throw new AuraHandledException('Unable to update policy from Stream Mini. Use Setup to change this policy.');
            }
        } catch (Exception e) {
            System.debug('TSP toggle error: ' + e.getMessage());
            throw new AuraHandledException('Unable to update policy from Stream Mini. Use Setup to change this policy.');
        }

        String evtName = String.valueOf(tsp.EventName);
        String streamType;
        if (evtName == 'ApiEvent') {
            streamType = 'API';
        } else if (evtName == 'ReportEvent') {
            streamType = 'REPORT';
        } else {
            streamType = null;
        }

        TspInfo info = new TspInfo();
        info.id = tsp.Id;
        info.name = tsp.MasterLabel;
        info.eventType = streamType;
        info.isActive = (tsp.State == 'Enabled');
        return info;
    }
}