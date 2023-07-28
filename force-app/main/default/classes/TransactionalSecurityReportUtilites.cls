public virtual class TransactionalSecurityReportUtilites {
    public list<string> objsInReport;
    public list<string> listfeildsInReport;
    public set<string> setfeildsInReport = new set<string>();
    public set<string> setOrigin = new set<string>();
    public boolean sesKeyRequired = false;
    public boolean isActive = false;
   // public static set<string> dataSensitivityLevels = new Set<string>{'Confidential','Restricted'};
    public String MYCurrentClassName = String.valueOf(this).substring(0,String.valueOf(this).indexOf(':'));
    public id userId;
    //Public List<ReportEventConfig__mdt> listReportEventConfig ;
    public List<RepEventConfig__c> listReportEventConfig ;
    public set<string> excludedPermSets = new set<string>() ;
    public set<string> DataSensitivityLevelsRestricted = new set<string>();
    public boolean Check_for_Email_Fields = false;
    public boolean isUserExluded;
    public string CacheName = NULL;

    public TransactionalSecurityReportUtilites(){
        //listReportEventConfig = [SELECT Id,Check_for_Email_Fields__c,Data_Sensitivity_Levels_Restricted__c,Excluded_Permission_Set__c,Is_Active__c
         //                        FROM ReportEventConfig__mdt 
         // old Idea                WHERE Is_Active__c = True AND Applicable_Apex_Class_Name__c = :MYCurrentClassName];
        
        listReportEventConfig = [SELECT Id, Name,Is_Active__c, Check_for_Email_Fields__c, Data_Sensitivity_Levels_Restricted__c, Excluded_Permission_Set__c, 
             RepEvtTypesBlocked__c, ReqSessionKey__c, Applicable_Apex_Class_Name__c 
             FROM RepEventConfig__c
             WHERE Applicable_Apex_Class_Name__c = :MYCurrentClassName ];
       //For(ReportEventConfig__mdt rec  : listReportEventConfig){
       for(RepEventConfig__c rec  : listReportEventConfig){
            if(string.IsNotBlank(rec.Excluded_Permission_Set__c)){
                excludedPermSets.addAll(rec.Excluded_Permission_Set__c.split(','));  
            }
            if(string.IsNotBlank(rec.Data_Sensitivity_Levels_Restricted__c)){
                DataSensitivityLevelsRestricted.addall(rec.Data_Sensitivity_Levels_Restricted__c.split(';'));  
            }
           If(rec.RepEvtTypesBlocked__c <> 'All'){
               
               setOrigin.addAll(rec.RepEvtTypesBlocked__c.split(';'));
               setOrigin.remove('All');
           }
            If(!Check_for_Email_Fields){
                Check_for_Email_Fields = rec.Check_for_Email_Fields__c;
            }
           If(!sesKeyRequired){
               sesKeyRequired = rec.ReqSessionKey__c;
           }
           If(!isActive){
               isActive = rec.Is_Active__c;
           }
        }
        isUserExluded = isUserExluded();
    }
    
    // *************************************INITIALIZATION of key variables from event ************************************
    
        Public virtual void initialize (ReportEvent reportEvent){
        System.debug('virtual class class name ' + MYCurrentClassName );
        objsInReport = reportEvent.DisplayedFieldEntities.split(',');
        string fields = reportEvent.ColumnHeaders.remove('[');
        fields = fields.remove(']');
        userId = reportEvent.userId;
        listFeildsInReport = fields.split(',');
        //System.debug(listFeildsInReport);
        For(string s : listFeildsInReport){
            s = s.toUpperCase();
            s = s.trim();   
            While(s.contains('.')){
              s = s.substringAfter('.') ;
            }
            setfeildsInReport.add(s);
        }
        
        system.debug(userId);
        system.debug(listReportEventConfig) ;
        system.debug(excludedPermSets) ;
        system.debug(DataSensitivityLevelsRestricted);
        system.debug(Check_for_Email_Fields);
        system.debug(isUserExluded);
		system.debug(setOrigin);
        system.debug(sesKeyRequired);   
    }
    
    // ***************************Method to check for fields matching prescribed data sensativity (from config object) ************************************
    
        public boolean SenstativeDataPresent(List<string> objectsInReport, set<string> fieldSet){
            System.debug(objectsInReport);
             System.debug(fieldSet);
              
            boolean SenstativeData = False;
            
            for(FieldDefinition fd :[SELECT Id, DeveloperName, Label, Description, BusinessOwnerId, BusinessStatus, SecurityClassification 
                                     FROM FieldDefinition 
                                     WHERE EntityDefinitionId in : objectsInReport  ]){
                                         system.debug(fd.label);
                                         
                                         String myField = fd.label;
                                         myField = myField?.replaceAll('(\\s+)', '_');                                   
                                         //System.debug(fieldset + ' and ' + DataSensitivityLevelsRestricted);
                                         //System.debug(myField?.toUpperCase() + ' is classified as ' + fd.SecurityClassification);
                                         //system.debug(fieldSet.contains(myField?.toUpperCase()) +  'TEST 1');
                                         //system.debug(DataSensitivityLevelsRestricted.contains(fd.SecurityClassification) +  'TEST 2');
                          
                                         if(fieldSet.contains(myField?.toUpperCase()) && DataSensitivityLevelsRestricted.contains(fd.SecurityClassification)) {
                                             return true;
                                         }                                     
                                     }
            return SenstativeData;
        }
    
     // *********************Utitlity to concatenate a provided list of strings will be used in conjunction wuth Hash funtion****************************************************************//
    //NOT YET IMPLEMENTED
/*    public static String ListofStringsConcat(List<string> stringList){
        string output = '';
        For(string s : stringList){
            output += s;
        }
        return output;
        
    }
 */   
    // *********************************************************************************************************//
    // create a hash of the concatenated strings to be used in cache implemention
    // 
    // NOT YET IMPLEMENTED
    // 
/* public static string HashReturn(string stringToHash){        
        Blob targetBlob = Blob.valueOf(stringToHash);  
        Blob hashSHA1 = Crypto.generateDigest('SHA1', targetBlob);
        String hashBase64SHA1 = EncodingUtil.base64encode (hashSHA1);        
        return hashBase64SHA1;
    }
*/
    // *********************************************************************************************************//
    
    // *************************Method to check if any of the fields used on the objects used are of type Email*************************************************************************//
    
    public Static boolean  checkforEmailFields(list<string> objectList, set<string> fieldSet ){
        // Method takes in a list of objects and gets the schema for each object.
        // It then drills in the get the field map and field values and if any of the supplied field names
        // are of type Email field this class will return True....else false
       
        System.debug('checking these fields to see if the are email fields ' + fieldset);
        Schema.DescribeSobjectResult[] results = Schema.describeSObjects(objectList);
        Set<string> fieldTypes = new set<string>();
        Boolean emailFieldPresent = false;
        for(Schema.DescribeSobjectResult res : results) {   
            For(Schema.SObjectField field : res.fields.getMap().values()){
                //for each field we get the type and after converting it to a string value we add it to a set of strings
                try {
                    //
                    String myField = string.valueof(field.getDescribe().getLabel()).toUpperCase();
                    myField = myField.replaceAll('(\\s+)', '_');
                    If(fieldSet.contains(myField)){
                        fieldTypes.add(string.valueof(field.getDescribe().getType())); 
                    }   
                    //
                } catch(Exception e) {
                    System.debug('The following exception has occurred: ' + e.getMessage());
                }
                
                
            }
            // We now have a set of string representing all the field types
            // Now we just check to see if any of the types are an email field
        }
        system.debug(' field tpes in report = ' + fieldTypes);
        If(fieldTypes.contains('EMAIL')){
            emailFieldPresent = True;
        }
        //Finally return true or false;
        return emailFieldPresent; 
    }
    
    //***********************************************************************************************//
    
    public  Boolean IsUserExluded(){ 
        System.debug('Now check if we can exlude the user baed on perm set');
        System.debug('The given perm sets are ' + excludedPermSets);
        integer i = [SELECT count() FROM PermissionSetAssignment WHERE AssigneeId = :userId AND PermissionSet.label in :excludedPermSets];
        System.debug(i);
        return i>=1 ? true : False;    
    }
    
    public boolean isSessionKeyPresent(ReportEvent reportEvent){    
        return reportEvent.SessionKey == Null? true : false;
    }
    
    //*************************************
    public boolean isEventTypeblocked(ReportEvent reportEvent){
        return setorigin.contains(reportEvent.Operation);
    }
    
    //**************************************************************************
    
    Public boolean shouldReportBeBlocked(ReportEvent reportEvent){
        boolean eventState = False;
        if(!isActive){
                   Return eventState; 
                }
                System.debug('CHECK IF USER IS EXLUDED');
                if(isUserExluded()){                 
                    Return eventState;
                }
                System.debug('CHECK the evnt type needs consideration');
                If(setOrigin.size() <> 0 && !isEventTypeblocked(reportEvent)){
                    Return eventState; 
                }
                System.debug('look for sensative date');
                eventState = SenstativeDataPresent(objsInReport, setfeildsInReport);
                If(eventState){Return eventState;}
                System.debug('look for sensative email fields if required');
                If(Check_for_Email_Fields){
                    eventState = checkforEmailFields(objsInReport, setfeildsInReport); 
                    If(eventState){Return eventState;}
                }
                System.debug('look for session key');
                If(sesKeyRequired){
                    eventState = isSessionKeyPresent(reportEvent);
                     If(eventState){Return eventState;}    
                }
        return eventState;
    }
    
}