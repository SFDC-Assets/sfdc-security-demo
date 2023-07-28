public without sharing class DefaultPreferenceCenterApexClass implements pref_center.PreferenceCenterApexHandler {
    public void submit(pref_center.SubmitParameters submitParams, pref_center.SubmitFormData formData, pref_center.ValidationResult validationResult){
        // Find Contact Point Email from email text input, since its auto filled use the default if theres been no change
        String email = formData.getStringValue('emailTextInput');
        if (email == null) {
            email = formData.getOldStringValue('emailTextInput');
        }

        ContactPointEmail contactPointEmail = loadContactPointEmail(email);
        if (contactPointEmail != null) {
            String buttonClicked = formData.getButtonClicked();
            if (buttonClicked != null) {
                List<DataUsePurpose> dataUsePurposes = getAvailableDataUsePurposes();
                // For unsubscribe, find the data uses that were chosen to create ContactPointConsents
                if (buttonClicked == 'unsubscribeButton') {
                    List<DataUsePurpose> filteredList = new List<DataUsePurpose>();
                    List<String> checkboxValues = formData.getSelectedValues('dataUseCheckboxGroup');
                    if (checkboxValues != null) {
                        for(DataUsePurpose purpose: dataUsePurposes) {
                            if (checkboxValues.contains(purpose.Id)) {
                                filteredList.add(purpose);
                            }
                        }
                        dataUsePurposes = filteredList;
                    }
               }

               // Create or update the Contact Point Consent objects for each Data Use Purpose
               for(DataUsePurpose purpose: dataUsePurposes) {
                  createOrUpdateContactPointConsent(contactPointEmail, purpose);
              }
            }
        }
    }

    public pref_center.LoadFormData load(pref_center.LoadParameters loadParams, pref_center.LoadFormData loadFormData, pref_center.ValidationResult validationResult) {
        // add a pre-fill condition for email address
        loadFormData.setTextValue('emailTextInput', getDefaultEmail(loadParams.getRecordId()));

        // use a data driven source for checkbox group
        for(DataUsePurpose purpose: getAvailableDataUsePurposes()) {
            loadFormData.addOption('dataUseCheckboxGroup', purpose.Id, purpose.Name);
        }

        // load Individual
        return loadFormData;
    }

    private void createOrUpdateContactPointConsent(ContactPointEmail contactPointEmail, DataUsePurpose dataUsePurpose) {
       ContactPointConsent contactPointConsent;
       boolean isInsert = false;
       try {
          String dataUsePurposeId = dataUsePurpose.Id;
          contactPointConsent = [ Select DataUsePurposeId, Name, ContactPointId, PrivacyConsentStatus from ContactPointConsent where DataUsePurposeId =:dataUsePurposeId AND ContactPointId =: contactPointEmail.Id LIMIT 1];
       } catch (Exception e) {
          // An exception here means it doesnt exist
          ContactPointConsent = new ContactPointConsent();
          isInsert = true;
       }

       contactPointConsent.DataUsePurposeId = dataUsePurpose.Id;
       contactPointConsent.Name = contactPointEmail.EmailAddress;
       contactPointConsent.ContactPointId = contactPointEmail.Id;
       contactPointConsent.PrivacyConsentStatus = 'OptOut';

       if (isInsert) {
          insert contactPointConsent;
       } else {
          update contactPointConsent;
       }
    }

    private ContactPointEmail loadContactPointEmail(String email) {
        ContactPointEmail cpe;
        try {
            cpe = [ Select Id, EmailAddress from ContactPointEmail where EmailAddress =:email LIMIT 1];
        } catch (Exception e) {
            //ignore and return null
            cpe = null;
        }
        return cpe;
    }

    private List<DataUsePurpose> getAvailableDataUsePurposes() {
        List<DataUsePurpose> dataUsePurposes;
        try {
            // get the data use purposes that start with 'PrefCenter'
            dataUsePurposes = [ Select Id, Name from DataUsePurpose where Name like 'PrefCenter%' ORDER BY Name];
        } catch (Exception e) {
            dataUsePurposes = new List<DataUsePurpose>();
        }
        return dataUsePurposes;
    }

    private String getDefaultEmail(String individualId) {
       Individual individual = loadIndividual(individualId);
       return individual != null ? individual.LastName + '@salesforce.com' : null;
    }

    private Individual loadIndividual(String individualId) {
       try {
          Individual individualRecord = [ Select Id, LastName, ShouldForget, HasOptedOutTracking from Individual where Id =:individualId ];
          return individualRecord;
       } catch(Exception e) {
          // ignore and return null
       }
       return null;
    }
}