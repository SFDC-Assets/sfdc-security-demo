global class ApexBlockReportExportEventCondition implements TxnSecurity.EventCondition {

    public boolean evaluate(SObject event) {
        switch on event{
            when ReportEvent reportEvent {
                return evaluate(reportEvent);
            }
            when null {
                // Don't take policy action when event is null
                return false;
            }
            when else{
                // Don't take policy action when event is not handled
                return false;
            }
        }
    }
    /**
     * Handle evaluating ReportEvent
     */
    private boolean evaluate(ReportEvent reportEvent){
        Profile profile = [SELECT Name FROM Profile WHERE Id IN
                            (SELECT profileId FROM User WHERE Id = :reportEvent.UserId)];
        // Take policy action only if the user profile is not 'Data Steward' and
        // RowsProcessed greater than 10.
        if (!profile.Name.contains('Data Steward')
            && reportEvent.RowsProcessed > 20) {
            return true;
        }
        return false;
    }
}