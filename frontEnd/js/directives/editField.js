/**
 * Created by Minh on 4/9/2016.
 */
angular.module('operationApp').directive('editField', ['utilityService','$timeout',function(utilityService,$timeout){
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelCtrl){

      scope.fieldType = attrs.fieldType;
      var lastValid;

      // push() if faster than unshift(), and avail. in IE8 and earlier (unshift isn't)
      ngModelCtrl.$parsers.push(fromUser);
      ngModelCtrl.$formatters.push(toUser);

      // Apply any changes on blur
      element.bind('blur', function(event) {
        element.val(toUser(scope.$eval(attrs.ngModel)));

        var currentRowId = Number(element.closest("[rowId]")[0].getAttribute("rowId"));
        var newElem = event.relatedTarget;
        var newRowId;
        if (newElem){    // Related Target can be anything so...
          try {
            newRowId = Number($(newElem).closest("[rowId]")[0].getAttribute("rowId"));
          } catch (e){
            console.log(e);
          }
        }
        if(!scope.$parent.mv.pastingData && currentRowId !== newRowId){
          // A different row is focused on, outside of pasting data process
          scope.$parent.mv.updateChangedData();
        }
      });

      element.bind("keydown keypress", function (event) {
        function focusCell(rowId,colId){
          var nextCell = $("[colId='"+ nextColId +"'][rowId='"+ nextRowId +"']").find("input");
          if(nextCell.length !== 0){
            nextCell.trigger("focus");
            return true;
          } else {
            return false;
          }
        }
        if(event.which === 13) {                              // Bind Enter key
          var nextColId = scope.$parent.mv.initColId;
          var nextRowId = Number(element.closest("[rowId]")[0].getAttribute("rowId")) + 1;

          if( !focusCell(nextRowId,nextColId) ){
            scope.$parent.mv.data.push({});
            scope.$apply();
            $timeout(function() {   // Has to recall jquery instead, using nextCell wouldn't work
              $("[colId='"+ nextColId +"'][rowId='"+ nextRowId +"']").find("input").focus();
            });
          }

          event.preventDefault();
        } else if(event.which === 9 && !event.shiftKey) {    // Bind Tab key
          var nextColId = Number(element.closest("[colId]")[0].getAttribute("colId")) + 1;
          if( $("[colId='"+ nextColId +"']").length === 0 ){
            event.preventDefault();       // Prevent default if pointer already reaches last column
          }
        } else if(event.which === 9 && event.shiftKey) {    // Bind Shift+Tab key
          var nextColId = Number(element.closest("[colId]")[0].getAttribute("colId")) - 1;
          if( nextColId === 0 ){
            event.preventDefault();       // Prevent default if pointer already reaches last column
          }
        } else if(event.which === 38){                      // Bind Up key
          var nextRowId = Number(element.closest("[rowId]")[0].getAttribute("rowId")) - 1;
          var nextColId = Number(element.closest("[colId]")[0].getAttribute("colId"));
          focusCell(nextRowId,nextColId);
        } else if(event.which === 40){                      // Bind Down key
          var nextRowId = Number(element.closest("[rowId]")[0].getAttribute("rowId")) + 1;
          var nextColId = Number(element.closest("[colId]")[0].getAttribute("colId"));
          focusCell(nextRowId,nextColId);
        }
      });

      // $watch(attrs.ngModel) wouldn't work if this directive created a new scope;
      // see http://stackoverflow.com/questions/14693052/watch-ngmodel-from-inside-directive-using-isolate-scope how to do it then
      scope.$watch(attrs.ngModel, function(newValue, oldValue) {
        lastValid = lastValid || newValue;

        if (newValue != oldValue) {
          ngModelCtrl.$setViewValue(toUser(newValue));
        }
      }, true); // MUST use objectEquality (true) here, for some reason..

      var format = {
        "date":"DD/MM/YYYY",
        "datetime":"DD/MM/YYYY"
      };

      function fromUser(value) {

        switch (scope.fieldType){
          case "number":
            ngModelCtrl.$setValidity('valueType', !isNaN(value));
            lastValid = isNaN(value) ? value : Number(value);
            break;

          case "date":
          case "time":
          case "datetime":
            ngModelCtrl.$setValidity('valueType', utilityService.stringIsValidDate(value));
          case "date":
            lastValid = utilityService.stringIsValidDate(value) ?
              moment(value,"DD/MM/YYYY").toISOString() : value;
          case "time":
            lastValid = utilityService.stringIsValidDate(value) ?
              moment(value,"hh:mm:ss").toISOString() : value;
          case "datetime":
            lastValid = utilityService.stringIsValidDate(value) ?
              moment(value,"DD/MM/YYYY hh:mm:ss").toISOString() : value;
            break;

          case "object":
          case "array":
            try {
              lastValid = angular.fromJson(value);
            } catch (e) {
              lastValid = value;
            }
          case "object":
            ngModelCtrl.$setValidity('valueType', typeof lastValid == "object");
          case "array":
            ngModelCtrl.$setValidity('valueType', Array.isArray(lastValid) );
            break;

          default :
            lastValid = value;
        }

        return lastValid;
      }

      function toUser(value) {
        switch (scope.fieldType){
          case "object":
          case "array":
            return (typeof value == "object") ? angular.toJson(value) : value;

          case "date":
            return ( value && value != "" && utilityService.stringIsValidDate(value) ) ?
              moment(value).format("DD/MM/YYYY") : value;

          case "time":
            return ( value && value != "" && utilityService.stringIsValidDate(value) ) ?
              moment(value).format("hh:mm:ss") : value;

          case "datetime":
            return ( value && value != "" && utilityService.stringIsValidDate(value) ) ?
              moment(value).format("DD/MM/YYYY hh:mm:ss") : value;

          default:
            return value;
        }
      }

    }
  }
}])
