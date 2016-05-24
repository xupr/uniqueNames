var fs = require('fs'),
	_ = require('lodash');

var nameToNicknamesMap;
var acceptedTypoRate = 0.2;

String.prototype.replaceAt = function(index, character) {
	/*
	replaces a char of a string at a given index
	*/
    return this.substr(0, index) + character + this.substr(index + character.length);
}

function populateNameToNicknameMap(){
	/*
	creates a map from name to nickname array
	*/
	nameToNicknamesMap = {};

	var data = fs.readFileSync('nicknames.csv');
	var lines = _.split(data, '\r\n');
	for(var line of lines){
		var names = _.uniq(_.split(line, ','));
		for(var name of names){
			if(!nameToNicknamesMap[name])
				nameToNicknamesMap[name] = names;
			else
				nameToNicknamesMap[name] = _.uniq(_.concat(nameToNicknamesMap[name], names));
		}
	}
}

function isTypo(str1, str2){
	/*
	checks if the difference between 2 strings is a typo (under the allowed typo rate)
	*/
	if(str1.length !== str2.length)
		return false;

	var allowedTypos = _.ceil(str1.length*acceptedTypoRate);
	for(var i = str1.length - 1; i >= 0; i--){
		if(str1[i] !== str2[i] && allowedTypos-- == 0)
			return false;
	}

	return true;
}

function areNamesMatching(name1, name2, firstName, basicCheck){
	/*
	checks if names match
	*/
	name1 = _.toLower(name1);
	name2 = _.toLower(name2);
	firstName = firstName || true;
	basicCheck = basicCheck || false;

	if(name1 === name2) //check if names are equal
		return true;

	if(isTypo(name1, name2)) //check for a typo
		return true;

	if(!firstName) //stop checking if it's for a last name
		return false;

	if(!nameToNicknamesMap) //create map if needed
		populateNameToNicknameMap();

	//check the map for a nickname
	if(nameToNicknamesMap[name1]){
		for(var nickname of nameToNicknamesMap[name1]){
			if(nickname === name2) //check if names are equal
				return true;

			if(isTypo(nickname, name2)) //check for a typo
				return true;
		}
	}

	if(nameToNicknamesMap[name2]){
		for(var nickname of nameToNicknamesMap[name2]){
			if(nickname === name1) //check if names are equal
				return true;

			if(isTypo(nickname, name1)) //check for a typo
				return true;
		}
	}

	if(basicCheck) //stop checking if only basic checking is needed
		return false;

	for(var i = name1.length - 1; i >= 0; i--){ //check for one typo in the first name
		for(var c of "abcdefghijklmnopqrstuvwxyz"){
			if(areNamesMatching(name1.replaceAt(i, c), name2, true, true))
				return true;
		}
	}

	for(var i = name2.length - 1; i >= 0; i--){ //check for one typo in the second name
		for(var c of "abcdefghijklmnopqrstuvwxyz"){
			if(areNamesMatching(name1, name2.replaceAt(i, c), true, true))
				return true;
		}
	}

	return false;
}

function countUniqueNames(billFirstName, billLastName, shipFirstName, shipLastName, billNameOnCard){
	/*
	counts the unique names in a transaction
	*/

	//remove middle names
	billFirstName = _.split(billFirstName, ' ')[0];
	billLastName = _.split(billLastName, ' ')[0];

	if(!nameToNicknamesMap) //create map if needed
		populateNameToNicknameMap();

	var uniqueNames = 1;
	var billAndShipMatch = true;
	if(!areNamesMatching(billFirstName, shipFirstName) || !areNamesMatching(billLastName, shipLastName, false)){ //check if the ship name and the bill name match
		billAndShipMatch = false;
		uniqueNames++;
	}

	//remove middle names
	var billNames = _.split(billNameOnCard, ' '),
		billName1 = billNames[0],
		billName2 = billNames[billNames.length - 1];

	//check if bill name matches the card name
	if((!areNamesMatching(billFirstName, billName1) || !areNamesMatching(billLastName, billName2, false)) &&
	   (!areNamesMatching(billFirstName, billName2) || !areNamesMatching(billLastName, billName1, false)))
		uniqueNames++;

	if(!billAndShipMatch && uniqueNames === 3){ //check if need to check for the ship name
		if((areNamesMatching(shipFirstName, billName1) && areNamesMatching(shipLastName, billName2, false)) ||  //check if ship name matches the card name
		   (areNamesMatching(shipFirstName, billName2) && areNamesMatching(shipLastName, billName1, false)))
			uniqueNames--;
	}

	return uniqueNames;
}

var params;
/*console.log('expected output - actual output - params');
console.log('----basic tests----');
params = ['Deborah', 'Egli', 'Deborah', 'Egli', 'Deborah Egli'];
console.log(1, countUniqueNames.apply(null, params), params);
params = ['Deborah', 'Egli', 'Debbie', 'Egli', 'Debbie Egli'];
console.log(1, countUniqueNames.apply(null, params), params);
params = ['Deborah', 'Egni', 'Deborah', 'Egli', 'Deborah Egli'];
console.log(1, countUniqueNames.apply(null, params), params);
params = ['Deborah S', 'Egli', 'Deborah', 'Egli', 'Egli Deborah'];
console.log(1, countUniqueNames.apply(null, params), params);
params = ['Michele', 'Egli', 'Deborah', 'Egli', 'Michele Egli'];
console.log(2, countUniqueNames.apply(null, params), params);
console.log('----my small addition----');*/
params = ['Deborah', 'Egli', 'asdasfaf', 'Egli', 'Deborah Egli'];
console.log(1, countUniqueNames.apply(null, params), params);
