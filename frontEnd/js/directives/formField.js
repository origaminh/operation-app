angular.module('operationApp').directive('formField', function(){
  return {
    restrict: 'A',
    replace: true,
    scope: { fieldProperties: '=' },
    templateUrl: "/frontEnd/html/directives/formField.html",
    link: function(scope, element, attrs, ctrl){
        // This is important -- bind the isolated scope to its parent scope
        scope.fieldObj = scope.$parent.fieldObj;
        
        
        scope.fieldChanged = function(fieldType){
            //new value: console.log(this.fieldObj.Value)
            if(!fieldType){
            	var staticName = this.$parent.fieldObj.StaticName;
	            var form = angular.element( $("#home-app") ).scope().Form;
	            form[staticName] = this.fieldObj.Value;
            } else if(fieldType == "DateTime"){
            
            }
            
        }
    }
  }
})
