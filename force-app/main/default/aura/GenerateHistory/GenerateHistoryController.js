({
    generateData : function(component, event, helper) {
        component.set("v.myInfo", "Success");  
        var action = component.get("c.generate");
        action.setParams({
            "givenId": component.get("v.givenId")
        }); 
        $A.enqueueAction(action);
        
    },
    
    deleteData : function(component, event, helper) {
        component.set("v.myInfoDelete", "Success");  
        var actionOne = component.get("c.removeHistory");
        $A.enqueueAction(actionOne);
        
    }
})