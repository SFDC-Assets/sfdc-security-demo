public class TestReportEvent {
    
    Public static ReportEvent testReportEvent(){

        ReportEvent re = new ReportEvent(EventDate = DateTime.ValueofGmt('2023-05-26 14:00:00.000Z') ,
                                         Description= null, EvaluationTime= 0.0, 
                                         NumberOfColumns= 6, DashboardId = null, 
                                         Operation='ReportRunFromLightning', 
                                         LoginHistoryId='0Ya4w0000C3Dnfo', 
                                         Name='my Contacts & Accounts Report', 
                                         IsScheduled = false, 
                                         ColumnHeaders='[OWNER_FULL_NAME, Account.Name,Custom_Email_Field, Account.Countact.Name SALUTATION, ADDRESS2_COUNTRY, PHONE1, LAST_NAME, FIRST_NAME, Annual_Revenue]', 
                                         Format='Summary', 
                                         OwnerId='00D4w000000P3uF', 
                                         SessionKey='OJ/I+kZQ/BKam/J4', 
                                         PolicyOutcome=null, 
                                         Records='{"totalSize":4,"rows":[{"datacells":["0014w00003d4Ec1AAE","0034w00004BeNxRAAV","0054w00000BxW2EAAV"]},{"datacells":["0014w00003d4Ec1AAE","0034w00004BeNxMAAV","0054w00000BxW2EAAV"]},{"datacells":["0014w00003d4Ec1AAE","0034w00004BeNZNAA3","0054w00000BxW2EAAV"]},{"datacells":["0014w00003d4Ec1AAE","0034w00004BeNZIAA3","0054w00000BxW2EAAV"]}]}', EventIdentifier = '2d871b71-8d9d-4d1e-a91c-bbf96ce909bb', 
                                         DisplayedFieldEntities = 'Account,User,Contact', 
                                         ExecutionIdentifier='c9e34be0-cbb7-474c-8f48-aff2b85a9a35', 
                                         RowsProcessed=4.0, 
                                         ReportId='00O4w000008AJHY', 
                                         Sequence=1, 
                                         DashboardName=null, 
                                         EventSource='Lightning', 
                                         SourceIp='Salesforce.com IP', 
                                         Scope='organization', 
                                         Username='david.vickers@finscabindemos.com', 
                                         UserId='0054w00000B1hlX', 
                                         CreatedDate=null, 
                                         ExportFileFormat=null, 
                                         LoginKey='WVpyN02fLNinGl0O', 
                                         GroupedColumnHeaders='[ACCOUNT.NAME]', 
                                         PolicyId=null, 
                                         SessionLevel='STANDARD', 
                                         QueriedEntities='Contact');
        Return re;
    }

}
// session key 'OJ/I+kZQ/BKam/J4'