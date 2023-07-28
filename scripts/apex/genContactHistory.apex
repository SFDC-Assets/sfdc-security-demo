List<Contact> contacts  = [SELECT Id FROM Contact];

for (Contact cntct : contacts) {
    PopulateHistory.generate(cntct.Id);
}