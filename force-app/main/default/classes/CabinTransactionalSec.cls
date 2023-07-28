global class CabinTransactionalSec implements TxnSecurity.EventCondition {
    public boolean evaluate(SObject event) {
        System.debug(event);
        // integer maxContactsPerAccount = 5;
        // map<string,list<string>> MapAcc2Contacts = new map<string,list<string>>();
        switch on event{
            when ApiEvent apiEvent {
                return evaluate(apiEvent.QueriedEntities, apiEvent.RowsProcessed);
            }
            when ReportEvent reportEvent {
                boolean outcome = false;
                Integer counter = 1;
                Do{
                    switch on counter{
                        when 1  {
                            outcome =  evaluate(reportEvent.QueriedEntities, reportEvent.RowsProcessed);
                            If(outcome){ return outcome;}
                        }
                        when 2 { 
                            outcome = contactsEval((string)reportEvent.Records);
                            If(outcome){ return outcome;}
                        }
                        when else{
                            return false;        
                        }
                    }
                    counter++;
                    System.debug('Counter = '+ counter + 'and outome = ' + outcome);
                    system.debug((outcome = false && 3 > counter)) ;   
                }while(outcome == false && 3 > counter);
                
                return outcome;
            }
            when ListViewEvent listViewEvent {
                return evaluate(listViewEvent.QueriedEntities, listViewEvent.RowsProcessed);
            }
            when null {
                return false;   
            }
            when else{
                return false;
            }
        }
    }
    
    private boolean evaluate(String queriedEntities, Decimal rowsProcessed){
        if(queriedEntities.contains('Lead') && rowsProcessed > 2000){
            return true;
        }
        return false;
    }
    
    Private boolean contactsEval(string records){
                integer maxContactsPerAccount = 4;
        		map<string,list<string>> MapAcc2Contacts = new map<string,list<string>>();
                 Map<String, Object> recordsObj = (Map<String, Object>)JSON.deserializeUntyped(records);
                List<object> rows = (List<Object>)recordsObj.get('rows');              
                For(Object o :rows){
                    Map<string,object> data = (Map<string,object>)o;
                    List<object> listdata = (List<object>)data.get('datacells');
                    string contactId;
                    string accountId;    
                    For(object oo : listdata){
                        String s = (string)oo;
                        If(s.left(3) == '005'){accountId = s;}  
                        If(s.left(3) == '003'){contactId = s;}  
                    }
                    if(MapAcc2Contacts.containskey(accountId)) {
                        List<string> listcontactIds = MapAcc2Contacts.get(accountid);
                        if (contactId <> Null){
                            listcontactIds.add(contactId);
                            MapAcc2Contacts.put(accountid,listcontactIds);
                            If(listcontactIds.size() > maxContactsPerAccount ) { 
                                return true;
                            }  
                        }
                    }
                    else
                    {
                        if (accountid <> Null && contactId <> Null){
                            MapAcc2Contacts.put(accountid, new List<string>{contactid}); 
                            If(maxContactsPerAccount < 1){
                                return true;}
                            system.debug('MAP = ' + MapAcc2Contacts);
                        }
                    }  
                }
        return false;
    }
}