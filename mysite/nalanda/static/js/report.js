// globals
var table; // main data table
var aggregationTable; // aggregration rows table
var compareTable;
var tableData;
var tableMeta;
var performanceTable;
var startTimestamp = 1496948693; // default: from server
var endTimestamp = 1596948693; // default: from server
var topicId = -1; // default: everything
var parentLevel = 0; // default: parent-of-root-level
var parentId = -1; // default: none (at root level already, no parent)
var compareMetricIndex = 0;
var performanceMetricIndex = 0;
var performanceComparedValueName = 'average';
var performanceComparedValues = {};
var debug = true; // whether to print debug outputs to console

/** Pragma Mark - Starting Points **/

// Update page (incl. new breadcrumb and all table/diagrams)
// Uses global variables `startTimestamp`, `endTimestamp`, `topicId`, `parentLevel`, and `parentId`
var updatePageContent = function() {
    
    var tableData1;
    var tableData2;
    
    // Making sure `setTableData` happens AFTER `setTableMeta`
    
	sendPOSTRequest('/api/mastery/get-page-meta', {
		startTimestamp: startTimestamp,
		endTimestamp: endTimestamp,
		topicId: topicId,
		parentLevel: parentLevel,
		parentId: parentId
	}, function(data) {
		tableData1 = data;
		setBreadcrumb(data);
		setTableMeta(data);
		if (tableData2 !== null) {
			setTableData(tableData2);
		}
	});
	
	sendPOSTRequest('/api/mastery/get-page-data', {
		startTimestamp: startTimestamp,
		endTimestamp: endTimestamp,
		topicId: topicId,
		parentLevel: parentLevel,
		parentId: parentId
	}, function(data) {
		tableData2 = data;
		if (tableData1 !== null) {
			setTableData(data);
		}
	});
};

// Fetch topics by calling API and update the dropdown menu
var refreshTopicsDropdown = function() {
    sendPOSTRequest('/api/mastery/topics', {
        startTimestamp: startTimestamp,
		endTimestamp: endTimestamp,
		parentLevel: parentLevel,
		parentId: parentId
    }, function(data) {
        buildTopicsDropdown(data);
    });
};

// Instantiate date range picker
var setupDateRangePicker = function() {
	$('.daterangepicker').daterangepicker({
		startDate: new Date(startTimestamp * 1000),
		endDate: new Date(endTimestamp * 1000)
    }, function(start, end, label) {
        startTimestamp = new Date(start.format('YYYY-MM-DD')).getTime() / 1000;
        endTimestamp = new Date(start.format('YYYY-MM-DD')).getTime() / 1000;
        updatePageContent();
    });
};

/** Pragma Mark - Page Manipulation **/

// Clears current breadcrumb and sets it to a new one according to given data.
// Uses `appendBreadcrumbItem`
var setBreadcrumb = function(data, upToLevel) {
    $('.report-breadcrumb').html('');
    var len = data.breadcrumb.length;
    for (idx in data.breadcrumb) {
        var o = data.breadcrumb[idx];
        var lastItem = idx == len - 1 || o.parentLevel == upToLevel;
        appendBreadcrumbItem(o.parentName, o.parentLevel, o.parentId, lastItem);
        if (lastItem) {
            break;
        }
    }
};

// Initializes the topics dropdown according to given data
// Calls `_setTopics` recursively
var buildTopicsDropdown = function(data) {
	var content = [];
	_setTopics(content, data.topics);

    // wrap "everything"
    content = [{
        title: "Everything", 
        key: 1000, 
        folder: true, 
        children:content,
        expanded: true
    }];
	
	$('#topics-tree').html('');
	$('#topics-tree').fancytree({
        checkbox: false,
        selectMode: 1,
        extensions: ['filter'],
		quicksearch: true,
		filter: {
	        autoApply: true,            // Re-apply last filter if lazy data is loaded
	        autoExpand: false,          // Expand all branches that contain matches while filtered
	        counter: true,              // Show a badge with number of matching child nodes near parent icons
	        fuzzy: false,               // Match single characters in order, e.g. 'fb' will match 'FooBar'
	        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
	        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
	        highlight: true,            // Highlight matches by wrapping inside <mark> tags
	        leavesOnly: false,          // Match end nodes only
	        nodata: true,               // Display a 'no data' status node if result is empty
	        mode: 'dimm'                // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
			},
        source: content
    });
    
    $('#topic-filter-field').keyup(function(e) {
        var n;
		var tree = $.ui.fancytree.getTree();
		var args = 'autoApply autoExpand fuzzy hideExpanders highlight leavesOnly nodata'.split(' ');
		var opts = {};
		var filterFunc = tree.filterBranches;
		var match = $(this).val();

		$.each(args, function(i, o) {
			opts[o] = $('#' + o).is(':checked');
			});
			opts.mode = 'hide';

			if (e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ''){
				$('#reset-search').click();
				return;
			}

			n = filterFunc.call(tree, match, opts);
    });
    
    $('#reset-search').click(function(e){
		$('#topic-filter-field').val('');
		var tree = $.ui.fancytree.getTree();
		tree.clearFilter();
	});
};

// Instantiate both tables, insert rows with data partially populated
var setTableMeta = function(data) {
    tableMeta = data;

    // insert columns
    for (idx in data.metrics) {
        $('#data-table .trend-column').before('<th>' + data.metrics[idx].displayName + '</th>');
        $('#aggregation-table .trend-column').before('<th>' + data.metrics[idx].displayName + '</th>');
        $('#data-compare-table .dropdown-menu').append('<li><a href="#" onclick="compareViewSetCompareMetricIndex(' + idx + ')">' + data.metrics[idx].displayName + '</a></li>');
        $('#data-performance-table .dropdown-menu-metric').append('<li><a href="#" onclick="performanceViewSetCompareMetricIndex(' + idx + ')">' + data.metrics[idx].displayName + '</a></li>');
    }
    
    // initialize tables
    table = $('#data-table').DataTable({
        order: [[ 0, "asc" ]]
    });
    
    aggregationTable = $('#aggregation-table').DataTable({
        paging: false,
        ordering: false,
        info: false,
        bFilter: false,
        fnDrawCallback: function(oSettings) {
            //$(oSettings.nTHead).hide();
        }
    });
    
    compareTable = $('#data-compare-table').DataTable({
        columnDefs: [
            { orderable: false, targets: 2 }
        ],
        order: [[ 0, "asc" ]]
    });
    
    performanceTable = $('#data-performance-table').DataTable({
        columnDefs: [
            { orderable: false, targets: 2 }
        ],
        order: [[ 0, "asc" ]]
    });

    // manually toggle dropdown; stop event propagation to avoid unintentional table reorders
    $('.dropdown button').on('click', function(e){
        e.stopPropagation();  
        console.log('dropdown-' + $(this).attr('id'));
        $('.dropdown-' + $(this).attr('id')).dropdown('toggle');
    });
    
    // insert placeholder rows for data table
    for (idx in data.rows) {
        // data table
        var array = [drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id)];
        var nItems = data.metrics.length;
        while (nItems--) {
            array.push('');
        }
        array.push(drawTrendButtonHTML(data.rows[idx].id));
        var rowNode = table.row.add(array).draw(false).node();
        var rowId = 'row-' + data.rows[idx].id;
        $(rowNode).attr('id', rowId);
        
        // compare table
        var compareArray = [drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id)];
        compareArray.push('');
        compareArray.push('');
        var compareRowNode = compareTable.row.add(compareArray).draw(false).node();
        var compareRowId = 'row-' + data.rows[idx].id;
        $(compareRowNode).attr('id', rowId);
        
        // performance table
        var performanceArray = [drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id)];
        performanceArray.push('');
        performanceArray.push('');
        var performanceRowNode = performanceTable.row.add(performanceArray).draw(false).node();
        var performanceRowId = 'row-' + data.rows[idx].id;
        $(performanceRowNode).attr('id', rowId);
    }
};

// Replace dummy data inserted in `setTableMeta` with real data
var setTableData = function(data) {
    tableData = data;
    // update data rows
    for (idx in data.rows) {
        var array = JSON.parse(JSON.stringify(data.rows[idx].values)); // deep copy an array
        array.unshift(drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id));
        array.push(drawTrendButtonHTML(data.rows[idx].id));
        table.row('#row-' + data.rows[idx].id).data(array).draw(false);
        
        // compare table
        var compareArray = [drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id), '', ''];
        compareTable.row('#row-' + data.rows[idx].id).data(compareArray).draw(false);
    }
    // add aggregation rows
    for (idx in data.aggregation) {
        var array = data.aggregation[idx].values;
        array.unshift(data.aggregation[idx].name);
        array.push('');
        console.log(array);
        aggregationTable.row.add(array).draw(false);
    }
    
    compareViewSetCompareMetricIndex(compareMetricIndex);
    performanceViewSetCompareMetricIndex(performanceMetricIndex);
};

// IBAction
var compareViewSetCompareMetricIndex = function(metricIndex) {
    compareMetricIndex = metricIndex;
    var metricName = tableMeta.metrics[metricIndex].displayName;
    $('#data-compare-table .current-metric').html(metricName);
    
    // find max value
    var maxValue = 0;
    if (typeof tableData.rows[0].values[metricIndex] === 'string') {
        maxValue = 100; // value type is percentage
    } else {
        for (idx in tableData.rows) {
            var rowValue = parseInt(tableData.rows[idx].values[metricIndex]);
            if (rowValue > maxValue) {
                maxValue = rowValue;
            }
        }
    }
    
    // update data rows
    for (idx in tableData.rows) {
        var rowValue = parseInt(tableData.rows[idx].values[metricIndex]);
        var percentage = maxValue == 0 ? 0 : (rowValue / maxValue * 100);
        var barHTML =   '<div class="progress">'+
                        '<div class="progress-bar" role="progressbar" aria-valuenow="' + percentage + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percentage + '%;">'+
                        '</div></div>';
        var compareArray = [drilldownColumnHTML(tableData.rows[idx].name, tableData.rows[idx].id), tableData.rows[idx].values[metricIndex], barHTML];
        compareTable.row('#row-' + tableData.rows[idx].id).data(compareArray).draw(false);
    }
};

// IBAction
var performanceViewSetCompareMetricIndex = function(metricIndex) {
    performanceMetricIndex = metricIndex;
    var metricName = tableMeta.metrics[metricIndex].displayName;
    $('#data-performance-table .current-metric').text(metricName);
    
    // update compared-to values
    var values = [];
    for (idx in tableData.rows) {
        values.push(parseInt(tableData.rows[idx].values[metricIndex]));
    }
    
    values.sort(function(a, b) { 
        return a - b;
    });
    
    var min = values[0];
    var max = values[values.length - 1];
    var sum = values.reduce(function(a, b) {
        return a + b; 
    }, 0);
    var average = sum / values.length;
    var half = Math.floor(values.length / 2);
    var median = (values.length % 2) ? values[half] : ((values[half-1] + values[half]) / 2.0);
    
    // set globals
    
    performanceComparedValues = {
        min: min,
        max: max,
        average: average,
        median: median  
    };
    
    // update dropdown
    
    $('.compare-max a').text('Max: ' + max);
    $('.compare-min a').text('Min: ' + min);
    $('.compare-average a').text('Average: ' + Math.floor(average));
    $('.compare-median a').text('Median: ' + median);
    
    // update dropdown title and bars
    performanceViewUpdateComparedValueTitleAndTableRows();
};

// IBAction
var performanceViewSetComparedValue = function(valueName) {
    performanceComparedValueName = valueName;
    performanceViewUpdateComparedValueTitleAndTableRows();
};

var performanceViewUpdateComparedValueTitleAndTableRows = function() {
    
    // dropdown title and pivot value
    
    var pivot;
    
    if (performanceComparedValueName === 'max') {
        $('.current-compared-value').text('Max: ' + (performanceComparedValues.max));
        pivot = performanceComparedValues.max;
    }
    if (performanceComparedValueName === 'min') {
        $('.current-compared-value').text('Min: ' + (performanceComparedValues.min));
        pivot = performanceComparedValues.min;
    }
    if (performanceComparedValueName === 'average') {
        $('.current-compared-value').text('Average: ' + Math.floor(performanceComparedValues.average));
        pivot = performanceComparedValues.average;
    }
    if (performanceComparedValueName === 'median') {
        $('.current-compared-value').text('Median: ' + (performanceComparedValues.median));
        pivot = performanceComparedValues.median;
    }
    
    // table rows
    
    // some notes:
    // `raw value` is the original value of the data item; it can be any positive number
    // `pivot` is the value against which all `raw value`s are compared; it can be a max value, min value, average value or median value of all `raw value`s
    // `compare value` is the percentage of the `raw value` to the `pivot value`; it can be anything, positive or negative
    // `max` is the maximum `compare value`, but no less then 100
    // `min` is the minimum `compare value`, but no more then -100
    // `positive value` and `negative value` are `compare value`s scaled to a -100~100 range, when taking all `compare value`s into consideration. Only one will contain a non-zero number, dependending on the value's negativity.
    
    var max = 100;
    var min = -100;
    
    for (idx in tableData.rows) {
        var rawValue = parseFloat(tableData.rows[idx].values[performanceMetricIndex]);
        var compareValue = (rawValue - pivot) / pivot * 100;
        if (compareValue > max) {
            max = compareValue;
        }
        if (compareValue < min) {
            min = compareValue;
        }
    }
    
    for (idx in tableData.rows) {
        var rawValue = parseFloat(tableData.rows[idx].values[performanceMetricIndex]);
        var compareValue = (rawValue - pivot) / pivot * 100;
        var positiveValue = 0;
        var negativeValue = 0;
        
        var negativeLabel = '';
        var positiveLabel = '';
                
        if (compareValue > 0) {
            positiveValue = compareValue / max * 100;
            positiveLabel = '+' + Math.floor(compareValue) + '%';
        } else if (compareValue < 0) {
            negativeValue = compareValue / min * 100; // the variable holds a positive number, but `represents` a negative value
            negativeLabel = Math.floor(compareValue) + '%';
        }
        
        var barHTML =   '<div class="progress progress-negative">' +
                        '<div class="progress-bar progress-bar-danger" role="progressbar" aria-valuenow="' + negativeValue + 
                        '" aria-valuemin="0" aria-valuemax="100" style="width: ' + negativeValue + '%;">' + negativeLabel +
                        '</div></div>' +
                        '<div class="progress progress-positive">' +
                        '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + positiveValue + 
                        '" aria-valuemin="0" aria-valuemax="100" style="width: ' + positiveValue + '%;">' + positiveLabel +
                        '</div></div>';
                        
        var array = [drilldownColumnHTML(tableData.rows[idx].name, tableData.rows[idx].id), tableData.rows[idx].values[performanceMetricIndex], barHTML];
        
        performanceTable.row('#row-' + tableData.rows[idx].id).data(array).draw(false);
    }
};

// Get data remotely via `getTrendData` (async) and draw the chart (after removing previous chart -- if any)
// IBAction
var drawTrendChart = function(itemId) {
    dismissTrendChart();
    setTrendChartVisible(true);
    // TODO - chart loading screen
    getTrendData(itemId, function(trendData) {
        var chartData = new google.visualization.DataTable();
        
        var options = {
            chart: {
                title: 'Trend'
            },
            width: 900,
            height: 500,
            series: {
            },
            axes: {
                y: {
                    percentage: {label: 'Percentage'},
                    number: {label: 'Number'}
                }
            }
        };
        
        chartData.addColumn('date', 'Date');
        
        var seriesIndex = 0;
        for (idx in trendData.series) {
            var dict = trendData.series[idx];
            var type = dict.isPercentage ? 'percentage' : 'number';
            chartData.addColumn('number', dict.name);
            options.series[seriesIndex++] = {axis: type};
        }
        
        chartData.addRows(trendData.points);
        
        var chartContainer = document.getElementById('chart-wrapper');
        var chart = new google.charts.Line(chartContainer);
        chart.draw(chartData, options);
        
        $('html, body').animate({
            scrollTop: $('#chart-wrapper').offset().top
        }, 500);
    });
};

/** Pragma Mark - IBActions **/

// IBAction
var switchView = function(viewId) {
    $('.switch-view-button').removeClass('btn-primary');
    $('.switch-view-button').addClass('btn-default');
    $('.switch-view-button-' + viewId).addClass('btn-primary');
    
    $('.report-view').addClass('hidden');
    $('.report-view-' + viewId).removeClass('hidden');
};

// Toggle topics dropdown menu
// IBAction
var toggleTopicDropdown = function() {
    $('#topic-dropdown-container').toggleClass('shown');
};

// Apply currently selected topic, dismiss the dropdown, and update the page (async)
// IBAction
var applyAndDismissTopicDropdown = function() {
    var node = $('#topics-tree').fancytree('getTree').getActiveNode();
	if (node !== null) {
		topicId = node.key; // update global state
		updatePageContent();
	}
    toggleTopicDropdown();
};

// IBAction
var performDrilldown = function(id) {
  	  parentId = id;
  	  parentLevel++;
  	  updatePageContent();
};

// IBAction
var clickBreadcrumbLink = function(level, id) {
  	parentId = id;
  	parentLevel = level;
  	updatePageContent();  
};

// Dismiss trend diagram
// IBAction
var dismissTrendChart = function() {
    $('#chart-wrapper').html('');
    setTrendChartVisible(false);
};

/** Pragma Mark - Utilities **/

// Sends a POST request. Both request and return data are JSON object (non-stringified!!1!)
// `callback` called when a response is received, with the actual response as the parameter.
var sendPOSTRequest = function(url, dataObject, callback) {
    if (debug) {
        console.log('POST request sent to: ' + url);
        console.log('POST data: ');
        console.log(dataObject);
    }
    $.ajax({
		type: 'POST',
		url: url,
		data: JSON.stringify(dataObject),
		success: function(result) {
			if (debug) {
				console.log('Response:');
				console.log(result);
			}
			callback(result);
		},
		dataType: 'json'
	});
};

// Append a new breadcrumb item to the current list
var appendBreadcrumbItem = function(name, level, id, isLast) {
    var html;
    if (isLast) {
        html = '<span class="breadcrumb-text">' + name + '</span>';
    } else {
        html = '<a class="breadcrumb-link" href="#" onclick="clickBreadcrumbLink(' + level + ', ' + id + ')">' + name + '</a>';
        if (!isLast) {
            html += ' > ';
        }
    }
    
    $('.report-breadcrumb').append(html);
};

// See `buildTopicsDropdown`
var _setTopics = function(toArray, dataArray) {
    for (idx in dataArray) {
        var dict = dataArray[idx];
        var newDict = {
	        title: dict.name,
	        key: dict.id,
	        folder: dict.children !== null
        };
        if (dict.children !== null) {
	        newDict['children'] = [];
	        _setTopics(newDict['children'], dict.children);
        }
        toArray.push(newDict);
    }
};

// Returns the HTML code for draw trend button
var drawTrendButtonHTML = function(itemId) {
    return '<button class="btn btn-default draw-trend-button" onclick="drawTrendChart(' 
           + itemId + ')"><i class="fa fa-line-chart" aria-hidden="true"></i> Show Trend</button>';
};
        
// HTML code of drilldown column in data table
var drilldownColumnHTML = function(name, id) {
    if (parentLevel == 2) {
    	return '<span>' + name + '</span>';
    } else {
    	return '<a href="#" class="drilldown-link" onclick="performDrilldown(' + id + ')">' + name + '</a>';
    }
};

var processTrendData = function(data) {
    // API issue: data.points and data.data are both used historically. 
    // We use data.points as the official one but accept data.data also as a compatibility patch.
    if (data.data !== null && data.points === null) {
        data.points = data.data;
    }
                
    for (idx in data.points) {
        var timestamp = data.points[idx][0];
        var dateObject = new Date(timestamp * 1000);
        data.points[idx][0] = dateObject;
    }
    
    return data;
};

// Get trend data with specific item id from server (via POST) and sanitize it 
// Used by `drawTrendChart`
var getTrendData = function(itemId, callback) {
    // Test
    callback(processTrendData(fakeTrendData()));
    return;
    
    sendPOSTRequest('/api/mastery/trend', {
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        topicId: topicId,
        level: parentLevel + 1,
        itemId: itemId
    }, function(data) {
        callback(processTrendData(data));
    });            
};

var setTrendChartVisible = function(visible) {
    if (visible) {
        $('.trend-chart').removeClass('hidden');
    } else {
        $('.trend-chart').addClass('hidden');
    }
};

/** Testing **/

var fakeTrendData = function() {
    var data = {
        series: [
            {
                name: '% exercise completed',
                isPercentage: true
            },{
                name: '% exercise correct',
                isPercentage: true
            },{
                name: '# attempts',
                isPercentage: false
            }
        ],
        points: [
            [1496941452, 15, 15, 2],
            [1497042452, 32, 20, 5],
            [1497143452, 45, 30, 12],
            [1497344452, 52, 45, 14],
            [1497945452, 65, 64, 18],
            [1499246452, 77, 77, 21],
            [1499347452, 80, 78, 23],
            [1499448452, 99, 79, 25],
            [1499949452, 100, 95, 30]
        ]
    };            
    
    return data;
};

var runTest = function() {
    // Test
    setBreadcrumb({
        breadcrumb: [{
            parentName: "All Regions",
            parentLevel: 0,
            parentId: 0
        }, {
            parentName: "East Sector",
            parentLevel: 1,
            parentId: 10
        }]
    });
    
    // Test
    setTableMeta({
        metrics: [{
            displayName: "% exercise completed",
            toolTip: "help text goes here"
        }, {
            displayName: "% exercise correct",
            toolTip: "help text goes here"
        }, {
            displayName: "# attempts",
            toolTip: "help text goes here"
        }, {
            displayName: "% students completed the topic",
            toolTip: "help text goes here"
        }],
        rows: [{
            id: 1,
            name: "Allegheny K-5"
        }, {
            id: 2,
            name: "Arsenal Elementary School"
        }, {
            id: 3,
            name: "Banksville Elementary School"
        }, {
            id: 4,
            name: "Beechwood Elementary School"
        }, {
            id: 5,
            name: "Concord Elementary School"
        }, {
            id: 6,
            name: "Dilworth Traditional Academy"
        }, {
            id: 7,
            name: "Grandview Elementary School"
        }, {
            id: 8,
            name: "Brookline School"
        }, {
            id: 9,
            name: "Manchester School"
        }, {
            id: 10,
            name: "Westwood School"
        }]
    });
    
    // Test
    setTableData({
        rows: [{
            id: 1,
            name: "Allegheny K-5",
            values: [
                "30%",
                "25%",
                34,
                "9%"
            ]
        }, {
            id: 2,
            name: "Arsenal Elementary School",
            values: [
                "20%",
                "20%",
                14,
                "59%"
            ]
        }, {
            id: 3,
            name: "Banksville Elementary School",
            values: [
                "80%",
                "1%",
                88,
                "16%"
            ]
        }, {
            id: 4,
            name: "Beechwood Elementary School",
            values: [
                "15%",
                "32%",
                2,
                "44%"
            ]
        }, {
            id: 5,
            name: "Concord Elementary School",
            values: [
                "34%",
                "54%",
                123,
                "8%"
            ]
        }, {
            id: 6,
            name: "Dilworth Traditional Academy",
            values: [
                "21%",
                "37%",
                320,
                "25%"
            ]
        }, {
            id: 7,
            name: "Grandview Elementary School",
            values: [
                "58%",
                "52%",
                14,
                "33%"
            ]
        }, {
            id: 8,
            name: "Brookline School",
            values: [
                "98%",
                "100%",
                210,
                "88%"
            ]
        }, {
            id: 9,
            name: "Manchester School",
            values: [
                "14%",
                "2%",
                4,
                "3%"
            ]
        }, {
            id: 10,
            name: "Westwood School",
            values: [
                "45%",
                "56%",
                120,
                "20%"
            ]
        }],
        aggregation: [{
            name: "Average",
            values: [
                "30.75%",
                "28.75%",
                2.75,
                "10%"
            ]
        }]
    });

	// Test
    buildTopicsDropdown({
		"topics": [{
			"id": 1,
			"name": "Channel 1",
			"children": [{
				"id": 10,
				"name": "Physics",
				"children": null
			}]
		},{
			"id": 2,
			"name": "Channel 2",
			"children": [{
				"id": 24,
				"name": "Algorithms",
				"children": null
			}]
		}]
	});
};

$(function() {
    google.charts.load('current', {'packages':['line', 'corechart']});
    
    setupDateRangePicker();
    //refreshTopicsDropdown();
    //updatePageContent();
    
    // Test
    runTest();
});