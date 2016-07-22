/**
 * Created by Minh on 4/12/2016.
 */
angular.module('UtilityService',[]).factory('utilityService', function($http){
  var utilityService = {};

  utilityService.createTableFromString = function(pasteText){

    var pasteData = [[]];
    var pointer = 0;
    for (var i in pasteText){
      i = Number(i);
      if (pasteText[i].charCodeAt() == 9){          // Reached a 'NewTab' char
        //Add new data to last row
        pasteData[pasteData.length-1].push( pasteText.substr(pointer,i-pointer) );
        pointer = i+1;
      } else if (pasteText[i].charCodeAt() == 10) { // Reached a 'NewLine' char
        //Add new data then add row
        pasteData[pasteData.length-1].push( pasteText.substr(pointer,i-pointer) );
        if (i != pasteText.length-1){pasteData.push([]);}
        pointer = i+1;
      } else if (i == pasteText.length - 1){
        //Reached last char of pasteText, push the rest of string to last cell
        pasteData[pasteData.length-1].push( pasteText.substr(pointer,i+1-pointer) );  // +1 because i value is 1 smaller than in other cases
      }
    }
    return pasteData;
  }

  utilityService.stringIsValidDate = function(string){
    return (!isNaN(new Date(string)) || string.match(/[a-z]/i) == null) ? true : false;
  }

  //No longer used sorting function
  /*$scope.setSortingOrder = function(property){
    var orderArr = mv.sortingOrder;

    if (orderArr[0] == "+" + property){
      //Reverse from ascending to descending
      orderArr.shift(0);
      orderArr.unshift("-" + property);
    } else if (orderArr[0] == "-" + property) {
      //Reverse from descending to ascending
      orderArr.shift(0);
      orderArr.unshift("+" + property);
    } else {
      //Remove existing sorting order if present
      if (orderArr.indexOf("+" + property) != -1){
        orderArr.splice(orderArr.indexOf("+" + property),1);
      } else if (orderArr.indexOf("-" + property) != -1){
        orderArr.splice(orderArr.indexOf("+" + property),1);
      }

      //Set ascending order for newly selected property
      orderArr.unshift("+" + property);
    }
  }*/

  return utilityService;
});
