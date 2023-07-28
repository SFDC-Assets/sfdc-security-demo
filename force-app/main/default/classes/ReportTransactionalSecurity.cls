Global class ReportTransactionalSecurity extends TransactionalSecurityReportUtilites implements TxnSecurity.EventCondition {
    
    public boolean evaluate(SObject event) {
        boolean eventState = False;
        // Use switch statment  to look for what event type in thia case we only want to act on a report event
        switch on event{
            
            when ReportEvent reportEvent {
                initialize(reportEvent);
                eventState = shouldReportBeBlocked(reportEvent);
 
                return eventState;
            }
            
            
            when else{
                return false;
            }
        }
    }
    
}