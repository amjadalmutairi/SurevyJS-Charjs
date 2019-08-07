const chartsContainerId = '#viewStatistics';
const primitiveQuestions = ['dropdown', 'radiogroup', 'checkbox', 'rating', 'boolean', 'imagepicker', 'expression']
/**
 * The class hold the data that can be passed to chart.
 */
class chartDataSet {
	/**
	 * @param {String} label Chart title
	 * @param {Object} data {columns titles : rows}
	 * @param {Number} noResponses Number of participants whom skipped the question.
	 * @param {String} questionPrimType Question type.
	 */
	constructor(label, data, noResponses, questionPrimType) {
		this.label = label;
		this.columns = Object.keys(data);
		this.rows = Object.keys(data)
			.map(function (key) {
				return data[key];
			});
		this.colors = Array.from({ length: this.columns.length }, () => {
			var r = Math.floor(Math.random() * 255);
			var g = Math.floor(Math.random() * 255);
			var b = Math.floor(Math.random() * 255);
			return "rgba(" + r + "," + g + "," + b + ", 0.4)";
		});
		this.noResponses = noResponses;
		if (this.noResponses > 0) {
			this.columns.push("No Responses");
			this.rows.push(this.noResponses)
		}
		this.questionPrimType = questionPrimType
		this.chartType = (() => {
			switch (this.questionPrimType) {
				//You can choose between (bar,pie,doughnut),I found the bar is the best.
				case 'dropdown': return 'bar'
				case 'radiogroup': return 'bar'
				case 'checkbox': return 'bar'
				case 'rating': return 'bar'
				case 'boolean': return 'bar'
				case 'imagepicker': return 'bar'
				case 'expression': return 'bar'
				default: return 'bar'
			}
		})();
	}
}
/**
 * Main function that prepare the charts data, plot it in canvas.
 * @param {Object} survey as json.
 * @param {Array} results responses array, [{R1},{R2},..and so on]
 * @returns {Object} tabs that can be plugged in jquery ui tab module.
 */
function createCharts(survey, results) {
	let tabs = {};
	let isFirst = true;
	if (survey.pages != undefined) {
		for (var i = 0; i < survey.pages.length; i++) {
			let chartsDataObj = prepareChartsData(survey.pages[i], results)
			let div = document.createElement('div') //For each page there is div.
			let tabTitle = survey.pages[i].name
			let key = tabTitle.replace(/\s+/, "")// For jquery ui tab.
			for (let j = 0; j < chartsDataObj.length; j++) {
				if (chartsDataObj[j] instanceof chartDataSet) {
					let canvas = document.createElement('canvas');
					getNewChart(canvas.getContext('2d'), chartsDataObj[j])
					div.appendChild(canvas);
				}
				else {
					let h3 = document.createElement('h3');//panel title or matrix title.
					h3.innerText = chartsDataObj[j]
					h3.style.padding = 5;
					h3.style.backgroundColor = "#ebebe0"
					h3.style.textAlign = "center"
					div.appendChild(h3);
				}
			} //end for charts per page.
			// Add the page
			if (isFirst) {
				tabs[key] = {
					label: tabTitle,
					active: true, //First one is selected.
					showTab: function () {
						$(chartsContainerId).tabModal('setTabContent', key, div);
					}
				}
				isFirst = false
			} else {
				tabs[key] = {
					label: tabTitle,
					showTab: function () {
						$(chartsContainerId).tabModal('setTabContent', key, div);
					}
				}
			}
		}

	} else {
		tabs = {
			"NoResults": {
				label: "No Pages",
				active: true,
				showTab: function () {
					$(chartsContainerId).tabModal('setTabContent', "NoResults", "<div class='default center'> <h3>No Responses</h3> </div>");
				}
			}
		};
	}

	return tabs;
}
/**
 * Parse the responses and create the charts data objects.
 * @param {Object} survey as json.
 * @param {Array} responses as array of objects.
 * @returns {Array} array of charts data objects separated by
 * panel/matrix title (as string).
 */
function prepareChartsData(page, responses) {
	let chartsDataObj = []
	let questions = page.elements
	if (questions !== undefined) {
		for (var j = 0; j < questions.length; j++) {

			//---------- Primitive Question -----------------
			if (primitiveQuestions.includes(questions[j].type)) {
				chartsDataObj.push(handlePrimitiveQuestion(responses, questions[j]))
			}
			//---------- matrix -----------------
			else if (questions[j].type === 'matrix') {
				let matrixName = (questions[j].title != undefined) ? questions[j].title : questions[j].name;
				chartsDataObj.push(matrixName);
				chartsDataObj.push.apply(chartsDataObj, handleSingleMatrix(responses, questions[j]))
			}
			//---------- matrixdropdown -----------------
			else if (questions[j].type === 'matrixdropdown') {
				let matrixName = (questions[j].title != undefined) ? questions[j].title : questions[j].name;
				chartsDataObj.push(matrixName);
				chartsDataObj.push.apply(chartsDataObj, handleMultipleMatrix(responses, questions[j]))
			}
			//---------- matrixdynamic -----------------
			else if (questions[j].type === 'matrixdynamic') {
				let matrixName = (questions[j].title != undefined) ? questions[j].title : questions[j].name;
				chartsDataObj.push(matrixName);
				chartsDataObj.push.apply(chartsDataObj, handleDynamicMatrix(responses, questions[j]))

			} //---------- panel -----------------
			else if (questions[j].type === 'panel') {
				let panelName = (questions[j].title != undefined) ? questions[j].title :
					(questions[j].name != undefined) ? questions[j].name : "panel";
				chartsDataObj.push(panelName)
				//module the panel as a survey with one page, and recursively get the charts data objects.
				let subSurvey = { "name": panelName, "elements": questions[j].elements }
				chartsDataObj.push.apply(chartsDataObj, prepareChartsData(subSurvey, responses))

			} //---------- paneldynamic -----------------
			else if (questions[j].type === 'paneldynamic') {
				let panelName = (questions[j].title != undefined) ? questions[j].title : questions[j].name;
				chartsDataObj.push(panelName)
				let subSurvey = { "name": panelName, "elements": questions[j].templateElements }
				let panelResults = []
				for (let n = 0; n < responses.length; n++) {
					if (responses[n][questions[j].name] != undefined)
						for (let c = 0; c < responses[n][questions[j].name].length; c++) {
							panelResults.push(responses[n][questions[j].name][c])
						}
				}
				//module the panel as a survey with one page, and recursively get the charts data objects.
				chartsDataObj.push.apply(chartsDataObj, prepareChartsData(subSurvey, panelResults))
			}
		}
	}
	return chartsDataObj;
}
/**
 * Get all the answers for a single question.
 * @param {Array} responses as array.
 * @param {String} questionName the question name in the survey (Level 0).
 * @param {String} level1 level of nested objects in the array.
 * @param {String} level2 level of nested objects in the array.
 * @returns {Array} array of all answers (contains duplicate) + number of participants whom skipping the question.
 */
function getResults(responses, questionName, level1 = null, level2 = null) {
	let result = []
	let noResponses = 0;
	for (var i = 0; i < responses.length; i++) {
		let answer;

		if (level2 != null && level1 != null)
			answer = getObjectIfExist(responses[i], (questionName + "." + level1 + "." + level2))

		else if (level2 === null && level1 != null)
			answer = getObjectIfExist(responses[i], (questionName + "." + level1))

		else if (level1 === null && level2 === null)
			answer = getObjectIfExist(responses[i], questionName)

		if (answer !== undefined) {
			//For Checkbox.
			if (Array.isArray(answer)) result.push.apply(result, answer);
			else result.push(answer);
		}
		else noResponses++;
	}
	return [result, noResponses];
}
/**
 * Get all the answers for a single dynamic matrix question.
 * @param {Array} responses as array.
 * @param {String} questionName the question name in the survey (Level 0).
 * @param {String} level1 level of nested objects in the array.
 * @returns {Array} array of all answers + number of participants whom skipping the question.
 */
function getDynamicResults(responses, questionName, level1) {
	let result = []
	let noResponses = 0;
	for (var i = 0; i < responses.length; i++) {
		let answer;
		if (responses[i][questionName] != undefined) { //A user may skip the whole matrix.
			if (Array.isArray(responses[i][questionName])) {
				for (var row = 0; row < responses[i][questionName].length; row++) {
					answer = responses[i][questionName][row][level1];
					if (answer !== undefined) { //A user may skip a single question in the matrix.
						//For Checkbox.
						if (Array.isArray(answer)) result.push.apply(result, answer);
						else result.push(answer);
					}
					else noResponses++;
				}
			} else noResponses++;
		} else noResponses++;
	}
	return [result, noResponses];
}
/**
 * Count number of a choice occurrence in the result array.
 * @param {Array} result array of all the answers for a single question.
 * @param {Array} columns labels alternative names if any.
 * @returns {Object} dictionary(object) of '{choice : count}'.
 */
function calcResults(result, columns = null) {
	var counts = {};
	for (var i = 0; i < result.length; i++) {
		var choice = result[i];
		counts[choice] = counts[choice] ? counts[choice] + 1 : 1;
	}
	if (columns !== null) {
		for (var i = 0; i < columns.length; i++) {
			if (columns[i].text === undefined) { //It is not object.
				if (counts[columns[i]] === undefined) //No one select this option.
					counts[columns[i]] = 0
			}
			if (columns[i].text !== undefined) { //It is an object.
				if (counts[columns[i].value] === undefined) //No one select this option.
					counts[columns[i].text] = 0
				else {
					counts[columns[i].text] = counts[columns[i].value] //replace the name.
					delete counts[columns[i].value];
				}
			}
		}
	}
	return counts
}
/**
 * Create chart using Chart.js lib.
 * @param {Object} ctx canvas context.
 * @param {String} label chart title.
 * @param {Array} data chart rows.
 * @param {Array} labels chart columns.
 * @param {Array} colors bars colors.
 * @param {String} type chart type.
 */
function getNewChart(ctx, dataObject) {
	return new Chart(ctx, {
		type: dataObject.chartType,
		data: {
			labels: dataObject.columns,
			datasets: [{
				label: dataObject.label,
				data: dataObject.rows,
				backgroundColor: dataObject.colors,
				borderColor: dataObject.colors,
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
		}
	});
}
/**
 * function that safely accessing nested object,
 * and return the value if is exist, and undefined otherwise.
 */
getObjectIfExist = function (obj, key) {
	return key.split(".").reduce(function (o, x) {
		return (typeof o == "undefined" || o === null) ? o : o[x];
	}, obj);
}
/**
 * @param {Object} matrix
 * @returns {Array} array of chart data objects for primitive questions.
 */
function handleSingleMatrix(responses, matrix) {
	let chartsDataObj = []
	//rows are charts.
	let rows = matrix.rows
	let columns = matrix.columns
	let completeResult;
	for (let k = 0; k < rows.length; k++) {
		let label = (rows[k].text != undefined) ? rows[k].text : rows[k];
		completeResult = (rows[k].value != undefined) ?
			getResults(responses, matrix.name, rows[k].value) :
			getResults(responses, matrix.name, rows[k]);
		let result = completeResult[0];
		let noResponses = completeResult[1];
		let chartData = new chartDataSet(label, calcResults(result, columns), noResponses, 'radiogroup')
		chartsDataObj.push(chartData)
	}
	return chartsDataObj;
}
/**
 * @param {Object} matrix
 * @returns {Array} array of chart data objects for primitive questions.
 */
function handleMultipleMatrix(responses, matrix) {
	// Max row * column charts (non-primitive questions are excluded).
	let chartsDataObj = []
	let rows = matrix.rows
	let columns = matrix.columns
	for (var k = 0; k < rows.length; k++) {
		for (var n = 0; n < columns.length; n++) {
			let type = (columns[n].cellType != undefined) ? columns[n].cellType :
				(matrix.cellType != undefined) ? matrix.cellType : 'dropdown';

			if (primitiveQuestions.includes(type)) {
				let label = (rows[k].text != undefined) ? rows[k].text : rows[k];
				label += ' - ' + ((columns[n].title != undefined) ? columns[n].title : columns[n].name).toString();

				let completeResult = (rows[k].value != undefined) ?
					getResults(responses, matrix.name, rows[k].value, columns[n].name) :
					getResults(responses, matrix.name, rows[k], columns[n].name);
				let result = completeResult[0];
				let noResponses = completeResult[1];

				let chartData;
				if (columns[n].choices === undefined)
					chartData = new chartDataSet(label, calcResults(result, matrix.choices), noResponses, type)
				else chartData = new chartDataSet(label, calcResults(result, columns[n].choices), noResponses, type)
				chartsDataObj.push(chartData)
			}
		}
	}
	return chartsDataObj;
}
/**
 * @param {Object} question
 * @returns {Object} chart Data object of the primitive question.
 */
function handlePrimitiveQuestion(responses, question) {
	let label;

	if (question.type == 'boolean')
		label = (question.label != undefined) ? question.label :
			(question.title != undefined) ? question.title : question.name;
	else
		label = (question.title != undefined) ? question.title : question.name;

	let completeResult = getResults(responses, question.name);
	let result = completeResult[0];
	let noResponses = completeResult[1];
	let columns = [];
	if (question.type == 'dropdown' || question.type == 'imagepicker'
		|| question.type == 'checkbox' || question.type == 'radiogroup')
		columns = question.choices
	else if (question.type == 'rating' && question.rateValues != undefined)
		columns = question.rateValues
	else if (question.type == 'rating' && question.rateValues == undefined)
		columns = [1, 2, 3, 4, 5]
	else if (question.type == 'boolean')
		columns = [true, false]
	else columns = null //expression

	return new chartDataSet(label, calcResults(result, columns), noResponses, question.type)
}
/**
 * @param {Object} matrix
 * @returns {Array} array of chart data objects for primitive questions.
 */
function handleDynamicMatrix(responses, matrix) {
	//Max of columns charts.
	let chartsDataObj = []
	let columns = matrix.columns
	for (var n = 0; n < columns.length; n++) {
		let type = (columns[n].cellType != undefined) ? columns[n].cellType :
			(matrix.cellType != undefined) ? matrix.cellType : 'dropdown';
		if (primitiveQuestions.includes(type)) {

			let label = ((columns[n].title != undefined) ? columns[n].title : columns[n].name);
			let completeResult = getDynamicResults(responses, matrix.name, columns[n].name);
			let result = completeResult[0];
			let noResponses = completeResult[1];

			let chartData;
			if (columns[n].choices === undefined)
				chartData = new chartDataSet(label, calcResults(result, matrix.choices), noResponses, type)
			else chartData = new chartDataSet(label, calcResults(result, columns[n].choices), noResponses, type)
			chartsDataObj.push(chartData)
		}
	}
	return chartsDataObj;
}
/**
 * The function recursively iterate a panel elements,
 * which may includes sup-panels and extract all the questions.
 * @param {Array} panelElements elements object of a panel.
 * @returns {Array} all the questions as array.
 */
function extractSubPanelElements(panelElements) {
	let e = []
	for (var i = 0; i < panelElements.length; i++) {
		if (panelElements[i].type === 'panel') {
			e.push.apply(e, extractSubPanelElements(panelElements[i].elements))
		} else if (panelElements[i].type === 'paneldynamic') {
			e.push.apply(e, extractSubPanelElements(panelElements[i].templateElements))
		} else {
			e.push(panelElements[i])
		}
	}
	return e
}