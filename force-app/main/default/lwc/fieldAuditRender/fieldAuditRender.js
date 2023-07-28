import {LightningElement, track, wire, api} from 'lwc';

// importing Apex Class
import getOppdata from '@salesforce/apex/GetFieldAudit.retriveFieldAudit';

// Datatable Columns
const columns = [
    {
        label: 'Date',
        fieldName: 'CreatedDate__c',
        type: 'date'
    }, {
        label: 'Field',
        fieldName: 'Field__c',
        type: 'text'
    }, {
        label: 'User',
        fieldName: 'CreatedById__c',
        type: 'text'
    }, {
        label: 'Old Value',
        fieldName: 'OldValue__c',
        type: 'text'
    },
    {
        label: 'New Value',
        fieldName: 'NewValue__c',
        type: 'text'
    }
];

export default class ReferenceDataInLwcDatatable extends LightningElement {

    @api recordId;    

    @track data = [];
    @track columns = columns;

    @wire(getOppdata, {recordId: '$recordId'})
    opp({error, data}) {
        if(data) {

            let currentData = [];

            data.forEach((row) => {

                let rowData = {};

                rowData.CreatedDate__c = row.CreatedDate__c;
                //rowData.CreatedDate__c = rowData.CreatedDate__c;
                rowData.Field__c = row.Field__c;
                rowData.CreatedById__c = row.CreatedById__c;
                rowData.OldValue__c = row.OldValue__c;
                rowData.NewValue__c = row.NewValue__c;


                currentData.push(rowData);
            });

            this.data = currentData;
        }
        else if(error) {
            window.console.log(error);
        }
    }
}