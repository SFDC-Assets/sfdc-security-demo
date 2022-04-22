@isTest
public class TestFieldAudit {

    @isTest static void testSample(){
        Id sampleId = 'a4l0b000000UPeQAAW';
        List<FieldHistoryArchive__b> myArchive = GetFieldAudit.retriveFieldAudit(sampleId);
        System.assertEquals(myArchive.size(), 0);
        
        PopulateHistory.generate(sampleId);
        PopulateHistory.removeHistory();
        
    }
    
}