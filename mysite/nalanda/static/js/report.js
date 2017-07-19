"use strict";

// globals
var table = null; // main data table
var aggregationTable = null; // aggregation rows table
var compareTable = null; // // datatables object
var performanceTable = null; // datatables object
var tableData; // see API specs
var tableMeta; // see API specs
var startTimestamp = 1496948693; // default: from server
var endTimestamp = 1596948693; // default: from server
var contentId = '-1'; // default: everything
var channelId = '-1'; // default: everything
var parentLevel = 0; // default: parent-of-root-level
var parentId = '-1'; // default: none (at root level already, no parent)
var compareMetricIndex = 0; // current metric index of the compare table
var performanceMetricIndex = 0; // current metric index of the performance table
var performanceCompareToValueName = 'average'; // name of the type of currently used compared values
var performanceCompareToValues = []; // compared values, for all types, of the performance table
var compareMaxValues = [];
var pendingRequests = 0; // number of requests that are sent but not received yet
var maxItemLevel = 3; // students (read-only)
var debug = true; // whether to print debug outputs to console
var selfServe = false;

/** Pragma Mark - Starting Points **/

// Update page (incl. new breadcrumb and all table/diagrams)
// Uses global variables `startTimestamp`, `endTimestamp`, `contentId`, `channelId`, `parentLevel`, and `parentId`
// Called every time the page needs update
var updatePageContent = function() {
    
    // Making sure `setTableData` happens AFTER `setTableMeta`
    
    sendPOSTRequest('./api/mastery/get-page-meta', {
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        contentId: contentId,
        channelId: channelId,
        parentLevel: parentLevel,
        parentId: parentId
    }, function(response) {
        setBreadcrumb(response.data);
        setTableMeta(response.data);
	    sendPOSTRequest('./api/mastery/get-page-data', {
	        startTimestamp: startTimestamp,
	        endTimestamp: endTimestamp,
	        contentId: contentId,
	        channelId: channelId,
	        parentLevel: parentLevel,
	        parentId: parentId
	    }, function(response) {
            setTableData(response.data);
	    });
    });
    
    dismissTrendChart();
};

// Fetch topics by calling API and update the dropdown menu
// Called only once upon page initialization
var refreshTopicsDropdown = function() {
    sendPOSTRequest('./api/mastery/topics', {
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        parentLevel: parentLevel,
        parentId: parentId
    }, function(response) {
        buildTopicsDropdown(response.data);
    });
};

// Get trend data with specific item id from server (via POST) and sanitize it 
// Used by `drawTrendChart`
var getTrendData = function(itemId, callback) {    
    sendPOSTRequest('./api/mastery/trend', {
        startTimestamp: startTimestamp,
        endTimestamp: endTimestamp,
        contentId: contentId,
        channelId: channelId,
        level: parentLevel + 1,
        itemId: itemId
    }, function(response) {
        callback(processTrendData(response.data));
    });            
};

// Instantiate date range picker
// Called only once upon page initialization
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

// Update loading info (on top of screen) according to current system status. Calling this method will either show it, change it, or hide it.
var updateLoadingInfo = function() {
    if (pendingRequests > 0) {
        setLoadingInfo('Crunching data, hang tight…');
        $('.prevents-interaction').removeClass('hidden');
    } else {
        setLoadingInfo(null);
        $('.prevents-interaction').addClass('hidden');
    }
};

/** Pragma Mark - Page Manipulation **/

// Set a specific loading message.
var setLoadingInfo = function(message) {
    if (message === null) {
        $('.loading-info-container').addClass('hidden');
        return;
    }  
    
    $('.loading-info').html(message);
    $('.loading-info-container').removeClass('hidden');
};

// Clears current breadcrumb and sets it to a new one according to given data.
// Uses `appendBreadcrumbItem`
// Called every time the page needs update
var setBreadcrumb = function(data) {
    $('.report-breadcrumb').html('');
    var len = data.breadcrumb.length;
    var idx;
    for (idx in data.breadcrumb) {
        var o = data.breadcrumb[idx];
        var lastItem = idx == len - 1;
        appendBreadcrumbItem(o.parentName, o.parentLevel, o.parentId, lastItem);
    }
};

// Initializes the topics dropdown according to given data
// Calls `_setTopics` recursively
// Called only once upon page initialization
var buildTopicsDropdown = function(data) {
    var content = [];
    _setTopics(content, data.topics);

    // wrap "everything"
    content = [{
        title: "Everything", 
        key: 1000, 
        folder: true, 
        children: content,
        expanded: true
    }];
    
    var opts = {
        autoApply: true,            // Re-apply last filter if lazy data is loaded
        autoExpand: true,           // Expand all branches that contain matches while filtered
        counter: false,             // Show a badge with number of matching child nodes near parent icons
        fuzzy: false,               // Match single characters in order, e.g. 'fb' will match 'FooBar'
        hideExpandedCounter: true,  // Hide counter badge if parent is expanded
        hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
        highlight: true,            // Highlight matches by wrapping inside <mark> tags
        leavesOnly: false,          // Match end nodes only
        nodata: false,              // Display a 'no data' status node if result is empty
        mode: 'hide'                // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
    };
    
    $('#topics-tree').html('');
    $('#topics-tree').fancytree({
        checkbox: false,
        selectMode: 1,
        extensions: ['filter'],
        quicksearch: true,
        source: content,
        filter: opts
    });
    
    // filter field
    $('#topic-filter-field').keyup(function(e) {
        var n; // number of results
        var tree = $.ui.fancytree.getTree();
        var filterFunc = tree.filterBranches;
        var match = $(this).val();

        if (e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ''){
            // reset search
            $('#topic-filter-field').val('');
            var tree = $.ui.fancytree.getTree();
            tree.clearFilter();
            return;
        }

        n = filterFunc.call(tree, match, opts);
    });
    
    // automatic reset
    $('#reset-search').click(function(e){
        $('#topic-filter-field').val('');
        var tree = $.ui.fancytree.getTree();
        tree.clearFilter();
    });
    
    // click background to dismiss
    $('html').click(function() {
        closeTopicDropdown();
    });
    
    $('#topic-dropdown-container').click(function(e) {
        e.stopPropagation();
    });
    
    $('.topic .toggle-button').click(function(e) {
        toggleTopicDropdown();
        e.stopPropagation();
    });
};

// Instantiate both tables, insert rows with data partially populated
// Called every time the page needs update
var metaSetOnce = false;
var setTableMeta = function(data) {
    tableMeta = data;
    
    // initialization run only once
    if (!metaSetOnce) {
        metaSetOnce = true;
        
        var sharedLengthMenu = [[10, 25, 50, 100], [10, 25, 50, 100]];

        // insert columns
        var idx;
        for (idx in data.metrics) {
            $('#data-table .trend-column').before('<th>' + data.metrics[idx].displayName + '</th>');
            $('#aggregation-table .trend-column').before('<th>' + data.metrics[idx].displayName + '</th>');
            $('#data-compare-table .dropdown-menu').append('<li><a href="#" onclick="setCompareMetricIndex(' + idx + ')">' + data.metrics[idx].displayName + '</a></li>');
            $('#data-performance-table .dropdown-menu-metric').append('<li><a href="#" onclick="setPerformanceMetricIndex(' + idx + ')">' + data.metrics[idx].displayName + '</a></li>');
        }
        
        // initialize tables
        
        table = $('#data-table').DataTable({
            columnDefs: [
                { orderable: false, targets: 5 }
            ],
            order: [[0, 'asc']],
            dom: 'Bfrtip',
            buttons: ['pageLength'/*, 'copy'*/, 'csv', 'excel', 'pdf'/*, 'print'*/],
            lengthMenu: sharedLengthMenu
        });
        
        aggregationTable = $('#aggregation-table').DataTable({
            paging: false,
            ordering: false,
            info: false,
            bFilter: false
        });
        
        compareTable = $('#data-compare-table').DataTable({
            columnDefs: [
                { orderable: false, targets: 2 }
            ],
            order: [[0, 'asc']],
            dom: 'Bfrtip',
            buttons: ['pageLength'],
            lengthMenu: sharedLengthMenu
        });
        
        performanceTable = $('#data-performance-table').DataTable({
            columnDefs: [
                { orderable: false, targets: 2 }
            ],
            order: [[0, 'asc']],
            dom: 'Bfrtip',
            buttons: ['pageLength'],
            lengthMenu: sharedLengthMenu
        });
    
        // manually toggle dropdown; stop event propagation to avoid unintentional table reorders
        $('thead .dropdown button').on('click', function(e){
            e.stopPropagation();  
            $('.dropdown-' + $(this).attr('id')).dropdown('toggle');
        });
    }
    
    // remove current rows
    
    table.clear();
    compareTable.clear();
    performanceTable.clear();
    aggregationTable.clear();
    
    // insert placeholder rows for data table
    var idx;
    for (idx in data.rows) {
        // data table
        var array = [drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id)];
        var nItems = data.metrics.length;
        while (nItems--) {
            array.push('');
        }
        array.push(drawTrendButtonHTML(data.rows[idx].id, data.rows[idx].name));
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
// Called every time the page needs update
var setTableData = function(data) {
    tableData = data;
    var idx;
    
    // update data rows
    for (idx in data.rows) {
        var array = JSON.parse(JSON.stringify(data.rows[idx].values)); // deep copy an array
        array.unshift(drilldownColumnHTML(data.rows[idx].name, data.rows[idx].id));
        array.push(drawTrendButtonHTML(data.rows[idx].id, data.rows[idx].name));
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
        aggregationTable.row.add(array).draw(false);
    }
    
    precalculate();
    setCompareMetricIndex(compareMetricIndex);
    setPerformanceMetricIndex(performanceMetricIndex);
};

// Calculate statistical values
var precalculate = function() {
	compareMaxValues = [];
	performanceCompareToValues = [];
	
	var metricIndex;
	for (metricIndex in tableMeta.metrics) {
		// find max value
	    var maxVal = 0;
	    if ((tableData.rows.length > 0) && (typeof tableData.rows[0].values[metricIndex] === 'string')) {
	        maxVal = 100; // value type is percentage
	    } else {
		    var idx;
	        for (idx in tableData.rows) {
	            var rowValue = parseFloat(tableData.rows[idx].values[metricIndex]);
	            if (rowValue > maxVal) {
	                maxVal = rowValue;
	            }
	        }
	    }
	    compareMaxValues[metricIndex] = maxVal;
	}
	
	for (metricIndex in tableMeta.metrics) {
		// update compared-to values
		var isPercentage = (tableData.rows.length > 0) && (typeof tableData.rows[0].values[metricIndex] === 'string');
	    var values = [];
	    var idx;
	    for (idx in tableData.rows) {
	        values.push(parseFloat(tableData.rows[idx].values[metricIndex]));
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
	    var suffix = isPercentage ? '%' : '';
	    
	    // set globals
	    
	    performanceCompareToValues[metricIndex] = {
	        min: min,
	        max: max,
	        average: average,
	        median: median,
	        suffix: suffix
	    };
	}
}

/** Pragma Mark - UIAction **/

// Set index of compare metric in the compare view
// UIAction
var setCompareMetricIndex = function(metricIndex) {
    compareMetricIndex = metricIndex;
    var metricName = tableMeta.metrics[metricIndex].displayName;
    $('#data-compare-table .current-metric').html(metricName);
    
    // find max value
    var maxValue = compareMaxValues[metricIndex];
    var idx;
    // update data rows
    for (idx in tableData.rows) {
        var rowValue = parseFloat(tableData.rows[idx].values[metricIndex]);
        var percentage = Math.round(maxValue == 0 ? 0 : (rowValue / maxValue * 100));
        var barHTML =   '<div class="progress">'+
                        '<div class="progress-bar" role="progressbar" aria-valuenow="' + percentage + 
                        '" aria-valuemin="0" aria-valuemax="100" style="width: ' + percentage + '%;">'+
                        '</div></div>';
        var compareArray = [
            drilldownColumnHTML(tableData.rows[idx].name, tableData.rows[idx].id), 
            tableData.rows[idx].values[metricIndex], 
            barHTML
        ];
        compareTable.row('#row-' + tableData.rows[idx].id).data(compareArray).draw(false);
    }
};

// Set index of compare metric in performance view
// UIAction
var setPerformanceMetricIndex = function(metricIndex) {
    performanceMetricIndex = metricIndex;
    var metricName = tableMeta.metrics[metricIndex].displayName;
    var isPercentage = (tableData.rows.length > 0) && (typeof tableData.rows[0].values[metricIndex] === 'string');
    $('#data-performance-table .current-metric').text(metricName);

	var vals = performanceCompareToValues[metricIndex];
    
    // update dropdown
    
    $('.compare-max a').text('Max: ' + vals.max + vals.suffix);
    $('.compare-min a').text('Min: ' + vals.min + vals.suffix);
    $('.compare-average a').text('Average: ' + (Math.round(vals.average * 10) / 10) + vals.suffix);
    $('.compare-median a').text('Median: ' + vals.median + vals.suffix);
    
    // update dropdown title and bars
    // updating compare metric will also affect the value of chosen compared values (different base values)
    updatePerformanceView();
};

// Set the compared value for performance view
// UIAction
var setPerformanceCompareToValue = function(valueName) {
    performanceCompareToValueName = valueName;
    updatePerformanceView();
};

// Get data remotely via `getTrendData` (async) and draw the chart (after removing previous chart -- if any)
// UIAction
var drawTrendChart = function(itemId, itemName) {
    dismissTrendChart();
    getTrendData(itemId, function(trendData) {
        var chartData = new google.visualization.DataTable();
        
        if (trendData.points.length == 0) {
            toastr.info('No trend data is available for the selected period.');
            return;
        }
        
        var earlyDate = trendData.points[0][0];
        var lateDate = trendData.points[trendData.points.length - 1][0];
        var options = {
            chart: {
                title: itemName + ' Mastery Trend',
                subtitle: 'Data from ' + moment(earlyDate).format('MM/DD/YYYY') + ' to ' + moment(lateDate).format('MM/DD/YYYY')
            },
            legend: { position: 'bottom' },
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
        var idx;
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
        setTrendChartVisible(true);
        
        // scroll to chart w/ animation
        $('html, body').animate({
            scrollTop: $('#chart-wrapper').offset().top
        }, 500);
    });
};

/** Pragma Mark - UIActions **/

// UIAction
var switchView = function(viewId) {
    $('.switch-view-button').removeClass('btn-primary current');
    $('.switch-view-button').addClass('btn-default');
    $('.switch-view-button-' + viewId).removeClass('btn-default');
    $('.switch-view-button-' + viewId).addClass('btn-primary current');
    
    $('.report-view').addClass('hidden');
    $('.report-view-' + viewId).removeClass('hidden');
};

// Toggle topics dropdown menu
// UIAction
var toggleTopicDropdown = function() {
    $('#topic-dropdown-container').toggleClass('shown');
};

// UIAction
var closeTopicDropdown = function() {
    $('#topic-dropdown-container').removeClass('shown');
};

// UIAction
var toggleTopicDropdownExpandAll = function() {
    var $button = $('#topic-dropdown-container .expand-button');
    if ($button.data('expand')) {
        $button.data('expand', false);
        $button.html('Collapse All');
        $('#topics-tree').fancytree('getTree').visit(function(node) {
            node.setExpanded();
        });
    } else {
        $button.data('expand', true);
        $button.html('Expand All');
        $('#topics-tree').fancytree('getTree').visit(function(node) {
            if (node.title !== 'Everything') {
                node.setExpanded(false); // collapse all except the root node (which there will be only 1)
            }
        });
    }
};

// Apply currently selected topic, dismiss the dropdown, and update the page (async)
// UIAction
var applyAndDismissTopicDropdown = function() {
    var node = $('#topics-tree').fancytree('getTree').getActiveNode();
    if (node !== null) {
        var topicIdentifiers = node.key.split(','); // update global state
        channelId = topicIdentifiers[0];
        contentId = topicIdentifiers[1];
        $('.topic-dropdown-text').html(node.title);
        updatePageContent();
    } else {
        // a node is not selected
        toastr.warning('You must select a topic to apply the filter.');
    }
    toggleTopicDropdown();
};

// Handle click event of a drilldown link
// UIAction
var performDrilldown = function(itemId) {
    parentId = itemId;
    parentLevel++;
    updatePageContent();
};

// Handle click event of a breadcrumb link
// UIAction
var clickBreadcrumbLink = function(level, id) {
    parentId = id;
    parentLevel = level;
    updatePageContent();  
};

// Dismiss trend diagram
// UIAction
var dismissTrendChart = function() {
    $('#chart-wrapper').html('');
    setTrendChartVisible(false);
};

/** Pragma Mark - Utilities **/

// Append a new breadcrumb item to the current list
var appendBreadcrumbItem = function(name, level, id, isLast) {
    var html;
    if (isLast) {
        html = '<span class="breadcrumb-text">' + name + '</span>';
    } else {
        html = '<a class="breadcrumb-link" href="#" onclick="clickBreadcrumbLink(' + level + ', \'' + id + '\')">' + name + '</a>';
        if (!isLast) {
            html += ' > ';
        }
    }
    
    $('.report-breadcrumb').append(html);
};

// Recursively build the topics structure. See `buildTopicsDropdown`.
var _setTopics = function(toArray, dataArray) {
    var idx;
    for (idx in dataArray) {
        var dict = dataArray[idx];
        var newDict = {
            title: dict.name,
            key: dict.channelId + ',' + dict.contentId,
            folder: dict.children !== null && dict.children.length > 0
        };
        if (dict.children !== null) {
            newDict['children'] = [];
            _setTopics(newDict['children'], dict.children);
        }
        toArray.push(newDict);
    }
};

// Returns the HTML code for draw trend button
var drawTrendButtonHTML = function(itemId, itemName) {
    return '<button class="btn btn-default draw-trend-button" onclick="drawTrendChart(' 
           + itemId + ', \'' + itemName + '\')"><i class="fa fa-line-chart" aria-hidden="true"></i> Show Trend</button>';
};
        
// HTML code of drilldown column in data table
var drilldownColumnHTML = function(name, id) {
    if (parentLevel + 1 === maxItemLevel) {
        return '<span>' + name + '</span>';
    } else {
        return '<a href="#" class="drilldown-link" onclick="performDrilldown(\'' + id + '\')">' + name + '</a>';
    }
};

// Trend data preprocessing. Converts timestamp to date object.
var processTrendData = function(data) {
    // API issue: data.points and data.data are both used historically. 
    // We use data.points as the official one but accept data.data also as a compatibility patch.
    if (data.data !== null && data.points === null) {
        data.points = data.data;
    }

    var idx;
    for (idx in data.points) {
        var timestamp = data.points[idx][0];
        var dateObject = new Date(timestamp * 1000);
        data.points[idx][0] = dateObject;
    }
    
    return data;
};

// Sets whether the trend chart is visible.
var setTrendChartVisible = function(visible) {
    if (visible) {
        $('.trend-chart').removeClass('hidden');
    } else {
        $('.trend-chart').addClass('hidden');
    }
};

// Update the title of compared value and all actual table rows in performance view
var updatePerformanceView = function() {
    var vals = performanceCompareToValues[performanceMetricIndex];
    
    // dropdown title and pivot value
    
    var pivot;
    
    if (performanceCompareToValueName === 'max') {
        $('.current-compared-value').text('Max: ' + (vals.max) + vals.suffix);
        pivot = vals.max;
    }
    if (performanceCompareToValueName === 'min') {
        $('.current-compared-value').text('Min: ' + (vals.min) + vals.suffix);
        pivot = vals.min;
    }
    if (performanceCompareToValueName === 'average') {
        $('.current-compared-value').text('Average: ' + (Math.round(vals.average * 10) / 10) + vals.suffix);
        pivot = vals.average;
    }
    if (performanceCompareToValueName === 'median') {
        $('.current-compared-value').text('Median: ' + (vals.median) + vals.suffix);
        pivot = vals.median;
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
    var idx;
    
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
            positiveLabel = '+' + (Math.round(compareValue * 10) / 10) + '%';
        } else if (compareValue < 0) {
            negativeValue = compareValue / min * 100; // the variable holds a positive number, but `represents` a negative value
            negativeLabel = (Math.round(compareValue * 10) / 10) + '%';
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

var sendPOSTRequest = function(url, dataObject, callback) {
    if (selfServe) {
        sendPOSTRequest_test(url, dataObject, callback);
    } else {
        sendPOSTRequest_real(url, dataObject, callback);  
    }
};

// Sends a POST request. Both request and return data are JSON object (non-stringified!!1!)
// `callback` called when a response is received, with the actual response as the parameter.
var sendPOSTRequest_real = function(url, dataObject, callback) {
    pendingRequests++;
    updateLoadingInfo();
    
    if (debug) {
        console.log('POST request sent to: ' + JSON.stringify(url) + '. POST data: ' + JSON.stringify(dataObject));
    }
    
    $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(dataObject),
        dataType: 'json',
        success: function(response, textStatus, jqXHR) {
            if (debug) {
                console.log('Response: ' + JSON.stringify(response));
            }
            if (response.code) {
                toastr.error(response.info.message, response.info.title);
            } else if (!response.data) {
                toastr.error('There is an error communicating with the server. Please try again later.');
                console.error('Invalid response: A valid `data` field is not found.');
            } else {
                callback(response);
            }
            pendingRequests--;
            updateLoadingInfo();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (!textStatus) {
                textStatus = 'error';
            }
            if (!errorThrown) {
                errorThrown = 'Unknown error';
            }
            if (debug) {
                console.log('Request failed with status: ' + textStatus + '. Error Thrown: ' + errorThrown);
            }
            toastr.error('Request failed: ' + textStatus + ': ' + errorThrown, 'Connection Error');
            pendingRequests--;
            updateLoadingInfo();
        }
    });
};

/** Testing **/

var getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

var trendData = function() {
    var i = 0, j = 0, k = 0;
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
            [1496941452, i=getRandomInt(0,20), j=getRandomInt(0,20), k=getRandomInt(0,50)],
            [1497042452, i=getRandomInt(i,40), j=getRandomInt(j,40), k=k+getRandomInt(0,50)],
            [1497143452, i=getRandomInt(i,40), j=getRandomInt(j,40), k=k+getRandomInt(0,50)],
            [1497344452, i=getRandomInt(i,60), j=getRandomInt(j,60), k=k+getRandomInt(0,50)],
            [1497945452, i=getRandomInt(i,60), j=getRandomInt(j,60), k=k+getRandomInt(0,50)],
            [1499246452, i=getRandomInt(i,80), j=getRandomInt(j,80), k=k+getRandomInt(0,50)],
            [1499347452, i=getRandomInt(i,80), j=getRandomInt(j,80), k=k+getRandomInt(0,50)],
            [1499448452, i=getRandomInt(i,100), j=getRandomInt(j,100), k=k+getRandomInt(0,50)],
            [1499949452, i=getRandomInt(i,100), j=getRandomInt(j,100), k=k+getRandomInt(0,50)]
        ]
    };            
    
    return data;
};

var tableMetaData = function() {
    return {
        breadcrumb: [{
            parentName: "All Regions",
            parentLevel: 0,
            parentId: '0'
        }, {
            parentName: "East Sector",
            parentLevel: 1,
            parentId: '10'
        }],
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
            id: "1",
            name: "Allegheny K-5"
        }, {
            id: "2",
            name: "Arsenal Elementary School"
        }, {
            id: "3",
            name: "Banksville Elementary School"
        }, {
            id: "4",
            name: "Beechwood Elementary School"
        }, {
            id: "5",
            name: "Concord Elementary School"
        }, {
            id: "6",
            name: "Dilworth Traditional Academy"
        }, {
            id: "7",
            name: "Grandview Elementary School"
        }, {
            id: "8",
            name: "Brookline School"
        }, {
            id: "9",
            name: "Manchester School"
        }, {
            id: "10",
            name: "Westwood School"
        }]
    };
};

var tableDataData = function() {
    return {
        rows: [{
            id: "1",
            name: "Allegheny K-5",
            values: [
                "30%",
                "25%",
                34,
                "9%"
            ]
        }, {
            id: "2",
            name: "Arsenal Elementary School",
            values: [
                "20%",
                "20%",
                14,
                "59%"
            ]
        }, {
            id: "3",
            name: "Banksville Elementary School",
            values: [
                "80%",
                "1%",
                88,
                "16%"
            ]
        }, {
            id: "4",
            name: "Beechwood Elementary School",
            values: [
                "15%",
                "32%",
                2,
                "44%"
            ]
        }, {
            id: "5",
            name: "Concord Elementary School",
            values: [
                "34%",
                "54%",
                123,
                "8%"
            ]
        }, {
            id: "6",
            name: "Dilworth Traditional Academy",
            values: [
                "21%",
                "37%",
                320,
                "25%"
            ]
        }, {
            id: "7",
            name: "Grandview Elementary School",
            values: [
                "58%",
                "52%",
                14,
                "33%"
            ]
        }, {
            id: "8",
            name: "Brookline School",
            values: [
                "98%",
                "100%",
                210,
                "88%"
            ]
        }, {
            id: "9",
            name: "Manchester School",
            values: [
                "14%",
                "2%",
                4,
                "3%"
            ]
        }, {
            id: "10",
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
    };
};

var topicsData = function() {
    return {
        "topics": [{"total":9901,"children":[{"total":1673,"children":[{"total":139,"children":[{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring quadratics using identities: Perfect squares","contentId":"e888a204beb7567aa9cadb213bef8944","id":"499f17a1f3134ea5b2a3ad08895378da"},{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring polynomials by taking common factors","contentId":"f19daaa34d6f5a20b6323c9113eb8ef5","id":"4e2a7b4eb81e4bbdb6b2fc2e28625adf"},{"total":33,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to factorization","contentId":"1804539518ea521a809ae2918e0309ae","id":"a3e0889f2bfd4f45a74f175a2a8abe04"},{"total":18,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring quadratics 1","contentId":"91093d4e9b57528e85ba6f9730f58546","id":"b8d171c0e6124f3481ab71310b02a49b"},{"total":10,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring quadratics by grouping","contentId":"c8fa93260a735b68af2a6050b190841d","id":"de81f72bc8174cd6abd3c84d872f5fd2"},{"total":16,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring quadratics using identities: Difference of squares","contentId":"42bdd13e3da35cc184bab269b4744d10","id":"e342162aed80490b8543df3fb15db893"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factorization","contentId":"efd437a192ed5c6f912d58b42f196c4e","id":"21e0a0f8cb284c2daabbd5af5e8703d6"},{"total":10,"children":[{"total":10,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Cube roots","contentId":"6c7d73157fb25b41b6a3f75790cad3c3","id":"0d88d7ac577140e5b3a29b2822d8abf7"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Cubes and cubes roots","contentId":"4562cee725075b989c9c7663b9b493df","id":"2650bf7444674a4d88756dac8ebb569e"},{"total":286,"children":[{"total":46,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Chance and Probability","contentId":"2b1c1bd575b25189b84c78ae7366fd07","id":"0b79e22cb4024a278408e539e92a09f2"},{"total":44,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Grouping Data","contentId":"adf2bc0dcd7751d7b90a91d7e6a480bc","id":"0be9a01ad8b34fc2bddedbe470a42dea"},{"total":196,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Organizing data","contentId":"397334aa5f425ca993d99c0c274e99ae","id":"ad3664a4b083458887ae1254625f43f0"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Circle Graphs or Pie Charts","contentId":"763a0254727f5e88ba647550d068626b","id":"d8345028488b4b7dbab1cb3c5e1f4758"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Data handling","contentId":"c1b79cd6bed65eee985b643eabe501b6","id":"336b210662d64e089ec496b648291172"},{"total":103,"children":[{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Numbers in general form","contentId":"7856f0fc7869538482e00e28d7207310","id":"3a7080998d3f4a47aa56f15deec61470"},{"total":43,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Tests of divisibility","contentId":"7418cf5894495101896ae44af260d2e5","id":"a544c5e266ad422a9c46bd0a1df3c4ca"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Playing with numbers","contentId":"94a6fd034b28516ca2cf6f4cbf2c1714","id":"428efae023df403c973ec0da8af4589d"},{"total":205,"children":[{"total":36,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Let us recall","contentId":"e59a68f51aea5fa98235f0f0a5ed211c","id":"757dda7e07bc4c2885a410af1a7eb641"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area of general quadrilaterals","contentId":"8be41cf2320450afa9b8bf930dfca706","id":"853e5e61a1654b2ca92809eee9d618fc"},{"total":37,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Surface area","contentId":"53fafc028fa05f31b68a3e8bf0618102","id":"a696d972d3a14d45a15db950c51980f4"},{"total":71,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Volume of cube, cuboid, and cylinder","contentId":"c94dac67d49e5af9bed5712362a8ddbb","id":"b4330909bef94d2280ec03488240146c"},{"total":34,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area of polygons","contentId":"6373058afb995a0f8c8c953a24e057cd","id":"eec93ffbd9a740a9ad9d1785da113dc7"},{"total":27,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area of a trapezium","contentId":"c6171103675359d0ab562b4f5588ea9b","id":"f855200e8fac40828281b7f398df7682"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Mensuration","contentId":"acb46ee4ce6a5a269b7f80d237a00ca5","id":"6787d206446e44bb8ffabdb4e5d3b950"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to rational numbers","contentId":"ef486396348e51259b84fbcee6f80559","id":"604a9aab231941378bd69ae38ba6c179"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rational numbers","contentId":"324ae2a0fb285e5d8ab957849d499ea3","id":"6a2d7d84f9924747b3fc732c7a0ec7cd"},{"total":49,"children":[{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Square roots","contentId":"3d4e067e1f7d51d784963747a616657c","id":"4e03606031864cca9347a6f37dce9ca6"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Estimating square roots","contentId":"6955ef61ae055439944a828851a3406f","id":"abbae6fce25547fab360601bd28f458a"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Squares and square roots","contentId":"3bd3551e416658d28c2f32eebc76362e","id":"a35a76e0915d41eab448199f7169a6ad"},{"total":216,"children":[{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Algebraic equations review","contentId":"9d9032a06c3c5709bf887fa13b86f196","id":"2fc6a17a8e094097bcfbafc94fc36c83"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Reducing equations to simpler form","contentId":"5ec6966e54f0500d8a0aaf9139641232","id":"307d20b9b3aa4dfbb4a373d65f01bf23"},{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some applications","contentId":"a9db9cfbfe3f51479ad99be4977d2374","id":"88ad65080062465aa6f27a9f51a03511"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Solving linear equations with variables on both sides","contentId":"9e848d7b78b9562b8236571ef9c8a8f5","id":"8b07ff8810434b0db2d85d15010c8954"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some more applications","contentId":"42c2cdec0b5d52f48c38bdc977a1397e","id":"92308c013e22481db971102a79912ed2"},{"total":54,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Solving equations with linear expressions on one side and numbers on the other","contentId":"ed39a15d93825162be0d04c2453597de","id":"ae466e80e5d74af69843b7c655353451"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Linear equations in one variable","contentId":"68c786fc3d9f5f2a8a428444a71be5b4","id":"a9c341047ee043f2ae95315e942eb02b"},{"total":238,"children":[{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some applications","contentId":"03a5f0fb416f56ff85b081624d54de8b","id":"4db7195643fd4c108d2ac8d7d1dc0a97"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Dependent & independent variables","contentId":"05ab5e35b4a15ce49000ce44251eea12","id":"6034f2e6330840ebabfbaf68ba2bd1cb"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Linear graphs","contentId":"7cd293cbdeb055fc8f819ade2772ecae","id":"697f00333a884ba0b1b3249b05173984"},{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Bar graphs and histograms review","contentId":"3b21d8873ca350c2a8ad984edad2c485","id":"b9fd978a74ad466b980a0f2df1f6e9e0"},{"total":51,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Coordinate plane word problems","contentId":"49b7a7c5fc3a5fab98214409a2a73748","id":"ec0c2ce55b1b4b958363d034439ef49c"},{"total":57,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Intro to the coordinate plane ","contentId":"d037c341812e513d962048fcbf268386","id":"f12b50f08b654b8586e904f3d449ab33"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to graphs","contentId":"5c79f46f21ce5bffb508c1d434f191e9","id":"c933dfe4e6a441aca584cdc8c9a516a5"},{"total":54,"children":[{"total":54,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Direct and inverse proportions","contentId":"adb1155066d658fa938f41dfbcf7b90b","id":"6c7e45ccb76f4c89903245f2b89bfab7"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Direct and inverse proportions","contentId":"9b9e6fe0b19f5973b07e30fea8189b07","id":"d8895b0a5206453cbd8dda4b36a08640"},{"total":185,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"What are expressions?","contentId":"cbeb69287e08570d95a84e3bdacba255","id":"4a5f8dbf78d643cb8c2d90a46c900d7e"},{"total":41,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplying a polynomial by a polynomial","contentId":"ed3599d383155145aa78b6e90dca945f","id":"55c82b2211b9431491377181b1448d88"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplying a monomial by a monomial","contentId":"ca3d53426eb75615acd4fa0d23375e5d","id":"7465f22d9ae74502821b24c887cec769"},{"total":36,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Standard identities","contentId":"c7264b9dd44f56598eb7920925302af1","id":"760ea83fe8bd439cb40d94534101b2bb"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplying a monomial by a polynomial","contentId":"aeb4ca0c2233512da4dbb15bc30c5604","id":"8f4159c14a204e65877b6bcf4062a365"},{"total":48,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Addition and subtraction of algebraic expressions","contentId":"0008885fa90d5c83b03f3357e4de69fb","id":"e2b6bc3d7a4044edb48bdfad3c43421e"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Algebraic expressions and identities","contentId":"fa56764f982a502997d7cea5127263cd","id":"e8ee6710434f4bcaaf17b7653f0f1c7d"},{"total":29,"children":[{"total":29,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Mapping space around us","contentId":"7137e3f3479a5d07a30cd45ee0b755bc","id":"c34d53c23d5a480bb6a4a0b7c9a6ea30"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Visualising solid shapes","contentId":"9a637d54496c5863b7ab2b6c07b0731a","id":"ed825831cc4d4779803c6ac62aefc42a"},{"total":91,"children":[{"total":39,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Kinds of quadrilaterals","contentId":"ab5bf6788d275c0aa776304a81ac092a","id":"7c4280e1ba9f4017bfc3d9a30e4b6305"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Sum of the measures of the exterior angles of a polygon","contentId":"a30186ed3c2158b0b8dd23ec93461250","id":"a803423ba2e84c6fa3d188f6955d0f5f"},{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Quadrilateral proofs & angles","contentId":"784206f1d81f5e518714447ab6198824","id":"acdb65e93acd42b297fc5d66dca62250"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Polygons","contentId":"d46ef9406ea15cc7bb6e1f9c63e6945d","id":"f7998f6a47684d03a65463310c80a9da"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Understanding quadrilaterals","contentId":"6e992c336b335d0c87dc648ffe59230e","id":"efb655da77164fffb38377f506163c38"},{"total":68,"children":[{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Use of Exponents to Express Small Numbers in Standard Form","contentId":"1ae75f1cb52151049760b1db52d67a15","id":"031c169e952e4ebe9db751ecfaf4be24"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Powers with negative exponents","contentId":"0f60ee539b02518c86e9d9008c6324fc","id":"3b713ee08d9246108d670b01e564b45e"},{"total":28,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Laws of exponents","contentId":"81751513e7ef5bd588e5275ac5f41055","id":"79871b62ca934c9bb340017aa6ce15ae"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Exponents and powers","contentId":"8d95416d29565196a9c71a3f7d7a0c78","id":"f645f69ede0343fe95a52df756b415ac"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 8 (India) ","contentId":"e63c69193e955363aa04a983eb98d791","id":"13decfaae14e47c5a6ddcc2da687c13d"},{"total":1111,"children":[{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Volume of a Combination of Solids","contentId":"a2b8a6b35a1859f6ac060bd1278babe0","id":"9c8616c45b3a4777b75f8358c160c67a"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Surface Areas and Volumes 2","contentId":"ec5e362d4fbc5e1cb9b34f4c00b3e584","id":"03485316317c4bdf9c5356140cdaf4b8"},{"total":22,"children":[{"total":22,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Tangent to a Circle","contentId":"620f071aaa6d55d092f5e3650ccdf805","id":"3fc1fcad5d9c4565a8d39e25e954e3d4"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Circles 2","contentId":"fb9e15598ce15debac8c59311f1ed461","id":"135d94885924498da8bd3ae9661477e5"},{"total":40,"children":[{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Graphical Method of solution of a pair of Linear Equation.","contentId":"ea0e3512a53f500c9137cece483aa9c5","id":"e5410361c83f4aed8cb92cb40133a3e6"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Pair of linear equations in two variables","contentId":"9efedeb4f63c5b9d870a386fb5c54a0f","id":"2b9fe2272f03442182c28d25714e4145"},{"total":139,"children":[{"total":27,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Areas of Sector and Segment of a Circle","contentId":"296710a79cbc54049500e6ceb7c984a3","id":"25091be85a5747c794f08bb6b17416f8"},{"total":44,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Areas of Combinations of Plane Figures","contentId":"01993972c18a5a4593fafe2ef1fe64ce","id":"64ac2b4759974552a8125ef67a5e2dcf"},{"total":68,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Perimeter and Area of a Circle — A Review","contentId":"a0e010b9f68b56e9b6fe5555764f54e6","id":"abaf8541083d4b29bc17383b8b8177a2"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area Related to Circles","contentId":"134ed5265d98525093058da4cd1df101","id":"2da4bd85d2364e8a80b891addc681170"},{"total":74,"children":[{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Arithmetic Progression","contentId":"e2fc7123cb9d5f3183fcd34fe846cd0f","id":"b137eb4a9fd641a2a7f08d810b6ce981"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Sum of First n Terms of an AP","contentId":"b2f4330e7c84547ea0b4e1f7ed0706ad","id":"d4ab1df3c80a426fa5abac11fbaf1000"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"nth term of an AP","contentId":"6c730502fdd55ba5a14980f7f64af993","id":"df44e8e0a30043f2b323f1d31d8a3f8e"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Arithmetic progressions","contentId":"22904939152853bf90f6da25ffd6868d","id":"3d1c24e098984acca44d5654d79fc72c"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Construction of Tangents to a Circle","contentId":"b2a7b02c943b58b8a0fab9d520cb8981","id":"5fd9883c25524bd8b82f930f27bed50f"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Constructions 2","contentId":"dda30c74cf0c5f85a18477d901876ce5","id":"41ac3353a0f2492ebe78254c32b0ffde"},{"total":108,"children":[{"total":99,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Distance Formulae","contentId":"b2310a9fdf705ab5a7d52c4df358be48","id":"a064ef819a914149b49044b1027ac9c1"},{"total":9,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Section Formulae ","contentId":"f3a7ffcdfe9b5090aa6631a3f14d0123","id":"c13b11a87e08485d86b14ca4589e8d3c"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Coordinate geometry","contentId":"85eee433bab2585aa2d92c6e07389f62","id":"5206bab05ee346b7bfb95ae0dfb4d63b"},{"total":18,"children":[{"total":18,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Heights and Distances","contentId":"b565d08cdf4f5bbaacfb944ff36daa48","id":"463e1c4093e84b7284fa2954bce19028"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some applications of trigonometry","contentId":"4630d0ad052f5cdeb05a573db17a0738","id":"60ce3382d0cd45caade9dc6a6ef108e4"},{"total":332,"children":[{"total":127,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Solution of a Quadratic Equation by Completing the Square","contentId":"3a5de13eda67525aa26e57ea644e2902","id":"191b971fe6cf4722809a86f5793aa33e"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Nature of Roots","contentId":"b6f9f96f8429541589304ce75962954c","id":"315eeb0d20cd468d9c6fe0cc57936a59"},{"total":185,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Solution of a Quadratic Equation by Factorisation","contentId":"9e179986dd45535ebecaaca7b4cd8eef","id":"c62d46984e0a4e5590403ac7322e31dd"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Quadratic equations","contentId":"c733208d33525f8d9bb6a96154682141","id":"a7cdb34cc7614f829e67b5bfe509fda1"},{"total":87,"children":[{"total":87,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Probability — A Theoretical Approach","contentId":"1c334831f71c5677a4527e6b9e8233b5","id":"190fccf999714b238d3a9c21ae75b938"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Probability 2","contentId":"769770850ffe50ea9d425455e17781e3","id":"aafc64becd3b43c0bff5be82fe5b64a0"},{"total":59,"children":[{"total":29,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Trigonometric Ratios","contentId":"f5e2c9c2739f5950a5b10a981536255d","id":"27352e51f061494c8cf61c0621b88b35"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Trigonometric Identities","contentId":"5b23adf98f79561c830c9235e960395c","id":"4bcd2542a492417ab772007c7fbcee4f"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Trigonometric Ratios of Complementary Angles","contentId":"b98b298f80035081bf322ed4df8d4866","id":"81048e212a6b4589ab59265dfd620b12"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Trigonometric Ratios of Some Specific Angles","contentId":"6e93d1f4fb96563bbbeb9c2c63294729","id":"c1b4d8962bf640748e90f2a6bf41fbcc"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to trigonometry","contentId":"efa23ea830a15ecd92c672c46598127e","id":"b0531e26e10a4bd0b7e9021a4fee6608"},{"total":12,"children":[{"total":12,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Geometrical Meaning of Zeroes of Polynomial","contentId":"a8fa7613a7395c60873fb968fc825063","id":"eea48730843345a39d5f811d3c42b530"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Polynomials 2","contentId":"a1b017f524655f56adb7c78525fb326c","id":"c811330d3fa7422cb0494e90e804f02b"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Revisiting Irrational Numbers","contentId":"3402eb46df1e547dbd35dbe8e0168601","id":"0a95e22a09b14fdb983b20faafa84ac3"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Real numbers","contentId":"5642b61a06e65f55ab30323d1788b19f","id":"c9b23a4276ed4a539ee50051d5d72d99"},{"total":158,"children":[{"total":35,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Similar Figures ","contentId":"0e46f44270735d8698a25e295ae04149","id":"5172e097e0f64ad28077ffd7c06e6fcb"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Pythagoras Theorem","contentId":"e114223ddd7c5f3fb59a889e897bb9d7","id":"565c95cc498f49268d69a8e99992fb54"},{"total":15,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Challenging Similarity problems","contentId":"08cb89764d9455a59141ac10293dd816","id":"a9575f1eb72b4bd1bfddca4720347fed"},{"total":108,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Similarity of triangles and its criteria","contentId":"e581cce1faa55b89991f1c832d53865b","id":"cec08f60e0fd48739d5377b5f8ecb766"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Triangles","contentId":"27a1a4ae526e5b81b0d17f79494ff24c","id":"f7c7b21441cb470d888a9f79a7d4394e"},{"total":62,"children":[{"total":62,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Mean, Median and Mode of Grouped Data","contentId":"9dc7bb4f10e45c2aacb464f3405755c0","id":"4159eab7d25a4913b76af504b379b576"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Statistics","contentId":"a8977b83331555dfa3342b94d5a94cac","id":"fb60b66a62704b93b1097ebe1e3965cd"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 10 (India)","contentId":"559c2439ba1c508ba6fa2560d324016a","id":"29c200bfdd58413b87923fbfd0698b86"},{"total":1183,"children":[{"total":277,"children":[{"total":26,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Operations on real numbers","contentId":"73842896075d5afeaabde16ce48ec2c8","id":"1e91fb99a3bb43aa97e688af07ab6f61"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rationalising the denominator","contentId":"27845f23e9df5bec87f4ee5b6f4a721d","id":"25a87bd099f94c19a2c8a5851520f5c9"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Advanced: exponent & radical evaluation","contentId":"859ab846e75a54c89b9428000417e8d9","id":"27e27d45a3e643f9bae99b8e61fe0adf"},{"total":74,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Repeating decimals","contentId":"d86a1f2bb301507c8c5ed3255afb22ae","id":"37984ed3665545e0b3b72bba9192330d"},{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Properties of exponents (rational exponents)","contentId":"b3a3f658716f585694b9fdfbcb97ab14","id":"479e58c8a7e44395b23f26b991668a8c"},{"total":64,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rational and irrational numbers","contentId":"c66d6c8a67c250419b036cdbd0d44f18","id":"4ed7506c601947829bca0d84c922756f"},{"total":48,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Exponent properties review","contentId":"22e2a57ae45e50c6b980947b65843de8","id":"74550d6a60154bbfb03b70c70ee35a1f"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Laws of exponents for real numbers","contentId":"40e17a9e98b25ea393884233b0cdf6e4","id":"e4d4a490854e46b6a8d3c9ffe2380d19"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Number systems","contentId":"11cb9eca056151eaad22efe22d90101b","id":"0412239e2fda45bca7fe719ab0260b0d"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Basic constructions","contentId":"a6084030f90153ce9c496ba3f4812c40","id":"1a8a21ce6de24653a6da27bd737af29d"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Constructions","contentId":"e4298a85405b51d994b1e909cbf0cf28","id":"295bdb0c09b44b74b30409daefa6f528"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to Euclidean geometry","contentId":"2aa7e4c2e5335587878e2627ede036d0","id":"9e0e35c6071443f2aa8079d175f0a71f"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to Euclid's geometry","contentId":"187f30611a985d3ab8a504e503c1565f","id":"30952898f975443fb92b92e37c2e5291"},{"total":208,"children":[{"total":98,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angle sum property of a triangle","contentId":"7dcc60658327520da9012516b6661fe3","id":"1d26d434be684d1fa706c497f806ceed"},{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angle relationships","contentId":"a7e8bd6bbc7951598163928d1356a9f4","id":"3df02272196f44daad6a42a3c05c3491"},{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angles between intersecting lines","contentId":"436378c3374451b49fffbab16c20dda8","id":"cf2aae35d1a945879bcefc729bc1ec2b"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Lines and angles","contentId":"e07b016ff38a578fb58467dc1f216ff9","id":"3be7c9ced4ee4528ac9753e336a5ca13"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Finding the area of a triangle using Heron's formula","contentId":"69421867010b5650a58b4bca41f04077","id":"485b6ac3884b4205bf6c167dafc39887"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Heron's Formula","contentId":"98ad3f1a2b3b543fb7dfd08a1240d853","id":"562dd8eeb5c443b5a43982d9046b9175"},{"total":22,"children":[{"total":22,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Probability – an experimental approach","contentId":"b8f1e08132b251258b38900335880c79","id":"dd1df3b779f24229a29d250c75305748"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Probability","contentId":"4ef10eabd55f5addb64acd272fa3685e","id":"6aa798c0da5f4ade84975ce1cef29539"},{"total":0,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Plotting points on the coordinate plane","contentId":"d4c3c2b5435c5c15b61e1d84950cd53b","id":"1240349e180e483196ff88f5481244a9"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to the Cartesian System","contentId":"bd70d513209d5bffa3221dcd1ae6d471","id":"e6b6695da3974c3cbbbb0b15540123fa"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Coordinate geometry","contentId":"286cd2ebee4e53c799740c064ba66a96","id":"888ade9f3f604468a27277a0ecab4484"},{"total":91,"children":[{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Properties of a parallelogram","contentId":"5905cbd3b1f257a381caa9e05193507d","id":"0b735ee0c27f42098a0e2a7379a25582"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction and angle Sum Property of a Quadrilateral","contentId":"b10a199ce5655a9e870eda74df953353","id":"2bc181498d294c71b7f998e4570d1287"},{"total":39,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Types of Quadrilaterals and their Properties","contentId":"833bc4d652b95219b72935ccfeb79dcd","id":"a22e16440ac04ebfac49838a4a6b5165"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Quadrilaterals","contentId":"74a0c8a1dba5552da09476e619f988a8","id":"8aa9e0a19beb478cba5f21a73df1f307"},{"total":35,"children":[{"total":5,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Cyclic Quadrilaterals","contentId":"99a3860778c1581a9f90707299884cb7","id":"3efc9342e8514ab7980d92de126ea643"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to circles and related terms","contentId":"9b0e74302dd55ff7a2aeaa0d5325ff3a","id":"91abde0c024043b5a28266135f35a9fb"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angle Subtended by an Arc of a Circle","contentId":"67186710b70758809d079bf48cfb20a1","id":"d311e50c1f5e44c4ae31da823afa033d"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Perpendicular from the centre of a circle to a chord","contentId":"9304f40e13965ef9aab53c16b96e7e6d","id":"daaef6bc1988487e9e8f82c37b9724bc"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Circles","contentId":"fe6ece2887215b2b8faa8d7f2c285fba","id":"a19b0385129b44bca15d6eb225ea829e"},{"total":24,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factoring a polynomial","contentId":"ddb3f64af16d5bb9b0900407b278249d","id":"1551880cd2c743578faa83bdf97507e1"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Polynomial remainder theorem","contentId":"bb57db90511d59479c07601f610c6c1a","id":"515b05190e7643f1a4ddbe41540aeeb3"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Long division of polynomials","contentId":"af90eeef79af51c68ce6f5903bd478b4","id":"87c799061d844f628ce729537c44b5fa"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Zeroes of a polynomial","contentId":"4d1b9ed48ae35d9fb26ac33481da3f17","id":"8e8d3a7f52704c2492d8bbf0622b9e2f"},{"total":4,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to polynomials","contentId":"eb96b9c6142f5d13b7887c83488564d4","id":"c29b3da1930249d9a8f881d374411c42"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Polynomials","contentId":"da09b81f028e57f69a1f617e98539e8b","id":"b2145e37ff3140a88ca893024a031798"},{"total":20,"children":[{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Finding areas by intuition","contentId":"f35bd6314b6a53249f8fd5653b1af0e1","id":"a3cc615ae3734b0a972589c9cee11533"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Areas of parallelograms and triangles","contentId":"861731bd2cc5566990de675f49512342","id":"b7b6080b5ca74252b28cb9f15bd18027"},{"total":277,"children":[{"total":99,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Measures of Central Tendency","contentId":"8c2d75b31dd45e19bc006c2176b65a62","id":"31eb3e202e534286a69d374f6b3c3435"},{"total":75,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Graphical Representation of Data using bar graphs","contentId":"457a04c62c545c789e004f948ae26e6c","id":"32d0194d62d04bd69df19d70072021bf"},{"total":44,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Graphical representation  of data using histograms","contentId":"373fc20085195b4abbb86c6f81154041","id":"9a26e7b0ff3244079197ef2197d302c6"},{"total":59,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Presentation of Data","contentId":"53d19b17d60156ffbf3b4fee9e2c6526","id":"ddf269fc1c2c4d389c351ee143cd1048"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Statistics","contentId":"c3dbde45185d5da4b95b269a4d9efede","id":"cd1a819f822a45f09c06bd786d9201f0"},{"total":45,"children":[{"total":45,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to linear equations in 2 variables","contentId":"b0e8b87948155743898c662b739ab809","id":"079a0d48dab54b158cc8d4a570434a18"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Graph of a Linear Equation in Two Variables","contentId":"037bed532c715dbca7440bc5ac2fcdaf","id":"da87f3ed14b449af89f293394115c6c0"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Linear equations in two variables","contentId":"03ebffcf608357c7bdb84a716d66b726","id":"dbb8fa29b1de405a879a376877a64b8f"},{"total":51,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Surface Area and volume of cubes and cuboids","contentId":"b0060c1f64fb5b8cbd2b19c9f7585331","id":"5c921afbbfff45ed8657b7447636aa84"},{"total":51,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Surface area and volume of cylinders, cones and spheres","contentId":"ccba64cd44bc5b9a8123cde43a1cc8d6","id":"ffa14435053043d4b61eedb1bc399efe"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Surface areas and volumes","contentId":"2e60ac24747252bb9ea8d8638af112c8","id":"e50c53c095c349e69e9c953699f8cd8c"},{"total":133,"children":[{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Congruence of triangles and the criteria for congruence","contentId":"7d686a5a671b544e9544e8ea2d5cd95b","id":"2fa41a6bc0934d68ade9275a50e26075"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to congruence","contentId":"e420e413aaf05ba89739da4e25b8f057","id":"4f35a4622a6247e99f5ff5c32ba6b254"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Corresponding angles in congruent triangles","contentId":"21fce1f7131e50e6ad35ebab9e374f35","id":"a01ad1a7a48341ce903828843423dfc2"},{"total":19,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Inequalities in a Triangle","contentId":"50a7bed3913b5da997810676822cd121","id":"a891075aaac84f398c4b59599f912d6a"},{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some Properties of a Triangle","contentId":"6796ef15a1df53539e33cfae23e76bd0","id":"f05c5cfa16d44062b8fb5110be4fd520"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Triangles","contentId":"3f62c0aaddea52c1bf45192fcbb9f960","id":"e9c555b39e604dc38408093776e858e9"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 9 (India)","contentId":"51c43b35ebd259aab348b07f712fb679","id":"35b80cecbcb04e3286183ff40e33405d"},{"total":2537,"children":[{"total":208,"children":[{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"How are expressions formed?","contentId":"8bbd3cf1db7b513a85dad44114552490","id":"1769c1dd8c6b44aeb4e10dcff58ca6e1"},{"total":108,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Like and unlike terms: adding and subtracting","contentId":"c7d7cd19ef59573f91513e3e8abc9b7c","id":"3ef3c8f22950486c9d4190ff59bf91d8"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Finding the value of an expression","contentId":"21bbc67028195f2e9268409be280bfbe","id":"ec6b643073684fdebce01e8ba38a5333"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Terms of an expression","contentId":"83290cd5dbbe53829b6e7830d5b3734a","id":"f69bc44925df461097c4a85eb271342e"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Algebraic expressions","contentId":"6b717ecbf77751d9bfb789135d9adc74","id":"171c09ee9a6f425897a89d2273593ec9"},{"total":29,"children":[{"total":29,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Lines of symmetry for regular polygons","contentId":"4a60792a11d35486ac444c1c09173ac6","id":"45b47477087244e8a867e8218760a3e6"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rotational symmetry","contentId":"6d3ec6fc1f585c8bbf9e23b1485e4aca","id":"7a42e71f71324020ad56c74163957f50"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Symmetry","contentId":"c832439cf97154cf86b4c242e21b2ef2","id":"18250df2af1c46cb86c508108ffeee6d"},{"total":120,"children":[{"total":56,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Circles","contentId":"5082442d736b5ad997ce06e92f38f946","id":"47068247e0a04d728ba9c55eaade0f53"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area of a parallelogram","contentId":"daa68520e75c5514b0fa1bd97036ae09","id":"52076f6395b34117b1f45641605c6f19"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Squares and rectangles","contentId":"e69b4dfd19b25f37a70d7b06a86e9871","id":"d9193205996a4d4a91627bf10ce2686d"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area of triangles","contentId":"fbf28889058154439938bd52363cc83b","id":"fdef162e39ff4653ad954881a1765d81"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Perimeter and area","contentId":"2fcd5d9e60125b01bcd375489db7fd40","id":"40adc2df33df426b82181f4d9e3592dd"},{"total":167,"children":[{"total":26,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Chance and probability","contentId":"dac424e14a6751fe96a2a403795c22ed","id":"86b9835d3d684820819ceef3840a69be"},{"total":141,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Arithmetic mean, mode, and median","contentId":"64fc42238b705f06945edc62596a48cb","id":"8e5a13adc77641a78225950747a9de87"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Data handling","contentId":"f71bbcd0b6b95e9e825c6d317ef8d04e","id":"48716660d0ca445ba4b483f155c9f20c"},{"total":562,"children":[{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Basics of decimals review","contentId":"80deb94ab895598a95f20303773dba1a","id":"0af123ab57a141569c03b808fa01acad"},{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Dividing fractions by fractions","contentId":"ec31eeaf768853b98318c13b1e42f643","id":"102633e66b5e45ea90873f1828bc53a6"},{"total":153,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Division of decimal numbers","contentId":"7ea34e0964ef57dfb9bdc955cadc94a3","id":"12b7cf8cedd34bdc84e545e366032e53"},{"total":71,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Division of whole numbers and fractions","contentId":"e1f3167626835d4ea4a9e3f5587a12a4","id":"21cf7dd3754e420fa8ff53b04d85dbb0"},{"total":208,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplication of fractions","contentId":"7aaaec999b155d689d8ac81d73a343b4","id":"a0ebf6efc99346dcaf14787575d93bab"},{"total":45,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplication of decimal numbers","contentId":"f5e124d1c4635beab952d962e498fd71","id":"ca8188b08ff641358bca17206d7e00ea"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Fractions and decimals","contentId":"31d7ecd607985aa89f4159426e459191","id":"559557176015424ca4241c8d7165108e"},{"total":141,"children":[{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Pairs of lines","contentId":"dc87f3237a845b06b8fdb9d6aa414f2b","id":"34ca9dde05414bd5849a5d137d23750c"},{"total":111,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Related angles","contentId":"a21e0929703e5efd9ded68020cf776f8","id":"35cab32bf43043a9b1acf0cf1e630b23"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Checking for parallel lines","contentId":"7776fde6938f5feb8ad06d6da73b25c2","id":"a064ddf73a514bc190d8e8ddf4eee249"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Lines and angles","contentId":"fccdd428e828598083b72a0495ea5b6d","id":"9a7d030e94d04d95b6e089c06a4043ae"},{"total":157,"children":[{"total":52,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Exponents","contentId":"a2e1eb6980e85da49724860d0004f32d","id":"0a1648e2ba4e4795b4a715329dc1bd12"},{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Laws of exponents with examples","contentId":"34531d9e3c7d50eab84a0868167cb6cb","id":"7ec93c8b14234a25ae2f8119fa933ce7"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Expressing large numbers in the standard form","contentId":"b9cea3442302594cb0589a9193cea1ab","id":"e304b6a9db5f4f7bb3faac3d995c3f14"},{"total":60,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Decimal number system","contentId":"68318d00f22858ad959928cb77a5b024","id":"ebce6c5180f7457e99766170b815dd6f"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Exponents and powers","contentId":"4893e33f131850ebb0504f6ac5dd790e","id":"a3391ad25dae4a63bdd15ae9365e5c3a"},{"total":16,"children":[{"total":16,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Construction of triangles when the lengths of its three sides are known (SSS Criterion)","contentId":"b1c3ba9042a95b35abc3a6965f5d3d99","id":"eb45ffafba7d413793803eed13a98f80"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Practical geometry","contentId":"b7ba24859b345c2ca7c2796393bac88a","id":"a5d0e8f41af94f96ad2f5635aadcb03b"},{"total":221,"children":[{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Algebraic equations basics","contentId":"32690267ba865d5c8ac6285b48cec9a9","id":"01d0a51862cf4d3699cf4ac637d68537"},{"total":115,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Application of Simple Equation to Practical Situations","contentId":"5ee8e11139ee5213807fdbb3e83f015a","id":"37a0e0514b14422eb7fa96747b1e25a3"},{"total":74,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"What an equation is","contentId":"8560b610ad435591944b6a3941143d5b","id":"a1cf0cc7f1c54940a64c8df1bb637b0c"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Simple equations","contentId":"266a14298b46505abe70f3547f8d87a1","id":"ba38e967c8d142eb94f19b16d8738d26"},{"total":121,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Two special triangles: equilateral and isosceles","contentId":"6a13fa3ec32358bf964d3396d131eeca","id":"19d2b262a824433686cefe63f6aec331"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Pythagorean theorem proofs","contentId":"894298c0cda25f1995569083863cd0f3","id":"4f12f59c583144999353fe04f360544f"},{"total":19,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Sum of lengths of two sides of a triangle","contentId":"c6ac60bcf0b05786b3d37ab93e53cd93","id":"6146bb8b85664b948fe245218cbf3a9a"},{"total":48,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angle sum property of a triangle","contentId":"50d2612fd1705f559d076cc39a2d6d70","id":"87d6fa59e9f2499f92d7317b46f0de30"},{"total":54,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Right angled triangles and Pythagoras property","contentId":"8a469e7989a55c95836c0922666815ec","id":"8be07d938e0144e1b1aa8285804cf490"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Types of triangles review","contentId":"e68aca6c583f50f5841cc2b4829888c5","id":"dbd40985aace46779f85c2ea4c5f82a0"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Triangle and its properties","contentId":"34e353690d615c25b8987008096a63e6","id":"bff12202de6a4b15aff79e09288b42f3"},{"total":66,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplication of integers","contentId":"7943b1f26a665f128124640123086671","id":"2cdcdb2e582e41f08cf1f6b9dc64b3ed"},{"total":26,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Basics of integers review","contentId":"a047e0a472da5073a59e0676e3d68b9d","id":"3f9c25697ef545d59dfcd62ae3318b52"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Properties of multiplication of integers","contentId":"a674c46d1521547da7848c59cfffc37f","id":"76ac1b5fed4d41d783c58129b13c9fe6"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Properties of addition and subtraction of integers","contentId":"0fa93355b90d5d20ad65d24b881764ac","id":"b375cfa58a654743b664a84f266d0a53"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Division of integers","contentId":"736a25e475e95fc78b4a6243d2824dc8","id":"ec60dc7eceae43d4ba66e2b162c1f4a3"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Integers","contentId":"c9b6daa839615e3f8150b3f4bfd4d81a","id":"c076f9a4e5894ef182a4b8f5ba68c305"},{"total":419,"children":[{"total":171,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Addition and subtraction of rational numbers","contentId":"7f10da3645e2596c8eb802a003e3ec71","id":"56f8a9eaf39146d0821fcce7d3a4755a"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rational numbers on a number line","contentId":"69299200bb7153f3a6dc37d00d62284c","id":"76c4552e13f54e05861a1b7734a3e9ee"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Comparison of rational numbers","contentId":"d442d2915ee95192a4210e5ea0b18a60","id":"934e5e7788fc4d8eada9c85fa0652a7c"},{"total":208,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Multiplication of rational numbers","contentId":"56c6678d9ba65812957be9c91004b797","id":"d26bded657cb48269583386e748521c7"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rational numbers","contentId":"a9319177c7d85a248a1c009c0588c2f1","id":"e2fbcd9e3e2647e8a69a31c8460e459c"},{"total":114,"children":[{"total":54,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Criteria for congruence of triangles","contentId":"2b05ccb0e28050098e807f35e2e01487","id":"bb3369cfa0044062a5685a1431120e38"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"What makes two shapes congruent?","contentId":"7f11d9d8a32a5d89917f84bfd7e4bacd","id":"e8b4ef67f01547ea8c19faf2acd0696a"},{"total":30,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Congruence among line segments","contentId":"d6cdcc720b8e53a6b2a41e0fe381a0d2","id":"fb62da0df09a428b8cb05b8234cd8bf9"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Congruence of triangles","contentId":"5c348e4bad4758a8b4b7b29a3820b102","id":"eed198c6a2f542a99444245e4a43f5f4"},{"total":148,"children":[{"total":42,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Percentage: another way of comparing quantities","contentId":"9ee2767cc397576bb8b9581b4d6ce14f","id":"70665f68e29c4a06a0c7f32e24a800f2"},{"total":36,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Equivalent ratios","contentId":"3d15a5f93f875b3999a7f9c17c47c1e8","id":"7a50c9b0d3a6449aa5d52463d917d88b"},{"total":70,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Use of percentages","contentId":"78d840fd091951d4990ec32a590b298f","id":"f1352204272a4075aea5dc70568c4ef7"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Comparing quantities","contentId":"cbac611b25e753d8ae97e9989719cff2","id":"f3c2bdf0afe248468454cef9976eac08"},{"total":48,"children":[{"total":37,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Nets for building 3D shapes","contentId":"4f0c1a4b8f9857ab876c408f3d9fdfbc","id":"83378f6024e74a72be5174052c48f326"},{"total":11,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Viewing different sections of a solid","contentId":"9b588c28a46054b5a6a771ff61c01a77","id":"aee1740fa381495eb073d27bff88daca"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Visualizing solid shapes","contentId":"4c922b4909ea5a7cbcd751ddd34d6d6c","id":"f6409421b2f9430ab4df84b6866dfdd4"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 7 (India)","contentId":"3129806fe51e5fb18db15754125aeef5","id":"4630819bc921494689e336defa2913f1"},{"total":2619,"children":[{"total":442,"children":[{"total":97,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Subtraction of decimals","contentId":"407e4d56cf995051a68f6f46d455626a","id":"0003799b71364f8384970e65887054fe"},{"total":83,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Comparing decimals","contentId":"4162237025ce56aaa6174bc27a15e262","id":"05653127b82844699fc1451598e8b9a3"},{"total":197,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Tenths and hundredths","contentId":"a3bc6aff032e5c2aacbade1a8dd53296","id":"406061387d9f43828e1fc14cb32d05c8"},{"total":65,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Addition of decimals","contentId":"7c3bee91e12a5c9d80dfbd73b5451bc0","id":"a2aba7968f7c4fc29bd13af1fc5c6df7"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Using decimals","contentId":"e6c7a17f9754540aa2fb033d8046b6aa","id":"e66ecd7879314e128b3bcf7469250f94"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction","contentId":"9c299cbf83a2566192cf5df5e1ad1ee6","id":"efc107722f89480aa2baffa390f48d1d"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Decimals","contentId":"2e3c8fa328f95537b628cd3205e7abfe","id":"03e5d384e2fd4fde99d92dd2633e4c8c"},{"total":308,"children":[{"total":116,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Bar graphs","contentId":"52a5778bd4d953da883d14575339390a","id":"1d40b095808c499fa844b2e0534f13b3"},{"total":142,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Recording and organising data","contentId":"a249a9e8cfc55953b15b0af67ff1d341","id":"c8923f6cf41e4ca3bb5e864594e2ba83"},{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Pictographs","contentId":"76a4aa176eda5dd4966158d13894f5df","id":"ff776239511c4572ad6fb20fe41f41f3"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Data handling","contentId":"04bb8c6ea0e15d1db741dca3b50a1e93","id":"127774244abe42bf9f4426922b2bb66c"},{"total":93,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Parallel lines, perpendicular lines and intersecting lines","contentId":"788aad121d9756f7a2e2a9bafa6908d9","id":"0ec68e88f90d4116b1e169fdbb7facb8"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Circles","contentId":"a5cbd8f810315e35a29d615a9add5850","id":"275279c1c9aa44b58a3f91025ddf5104"},{"total":58,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction to polygons","contentId":"d35607ac922956d5abba42e385ee4b71","id":"4328456636ee432896f78ca5ebedae4a"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction","contentId":"375448053203544c8543bd1d054c5bec","id":"4888bfe42a8a448bac1a18026e970381"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angles","contentId":"0900f4a9e7e85c26a24f539f4f4c7f0a","id":"772a388f3ed243778ad96b056fb1c207"},{"total":15,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Points, line segments, lines and rays","contentId":"ced194bf10495a299113ed312340afd6","id":"e3fd0c82279f4eb6ba5ba90439936984"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Basic geometrical ideas","contentId":"e995797782675a0eb98910e2843e0b89","id":"36400598db4c4cab882e562d81b327fe"},{"total":126,"children":[{"total":59,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Estimation of numbers","contentId":"470b1a2967475b418d581bc24eb7b849","id":"4753716c991a416cb0faa86c6749c326"},{"total":22,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Large numbers in practice","contentId":"09c9e0f1916152c487111d9fc9f651b1","id":"a2c4952bccd346338047790c60e3b587"},{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Comparing numbers","contentId":"9219417ae2bf5bac8cf9ad83e231e644","id":"cfff5b12b4e141b0bd800ecef28a1140"},{"total":13,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Using brackets","contentId":"9d38f46494cb5fa5b0cadc233c0dc11e","id":"d244d9c6d5204300bfedd3785e49a673"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Knowing our numbers","contentId":"f8fb672b38be5ad48535641354728689","id":"4dc75658d58243e1a164e10b3a245de0"},{"total":241,"children":[{"total":19,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"More divisibility rules","contentId":"7f8157f671635c76be7c67b9a680ba9e","id":"06383fa4b6fa4f0785917c0164d3cbeb"},{"total":43,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Prime and composite numbers","contentId":"d18a6ceabae55d6da04531c1a09c69ac","id":"309ee8742c084270a84c42cf2408d3fd"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Lowest common multiple","contentId":"928f986be3805849bc66aebb286917d3","id":"3140f46a53014778a3dd5d2a73459286"},{"total":33,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Highest common factor","contentId":"38b39ecb34765159a57076abac0b415f","id":"5fd63801f1e24bf69b8fd7591ec3c27b"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Some problems on HCF and LCM","contentId":"4eb12b3c68805341b788715078b7c9d4","id":"791991e1917b4803b18a65c694accf37"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Test for divisibility of numbers","contentId":"84a357c77c565d339b51ef4447baab15","id":"936228de439b4c1e8916af3403fec948"},{"total":32,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Prime factorization","contentId":"892346da0ef05fa487403744812ba9a7","id":"cba6c0b0620542eebb0873c6787dedd1"},{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factors and multiples","contentId":"b8f45e11cbce588988cba22e07057070","id":"f59597f9c75a4b6a9ce67d82f29db3fa"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Playing with numbers","contentId":"38a79ede1c4c58cc9d33f84583e79ddb","id":"6429082d067a417891001365ab59e048"},{"total":29,"children":[{"total":29,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Line of symmetry","contentId":"a022af9c15f85500921532abc0b3cb01","id":"a44a3969f0b748a1b09e9cdfdc45c20d"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Reflections","contentId":"a26bfa1d58b05d6f896cc577421feec3","id":"e2df1573861b4fdaa8dcdc22b93899b3"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Symmetry","contentId":"059c280d0f6e5469bbf19f1aecd243f2","id":"8f22952cb1f5450f918cbe0f45cd1842"},{"total":86,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angles: acute, obtuse, right and reflex","contentId":"38049153e79558348e798f80bffff671","id":"224786e4ecd646c4971be30ec29b46c0"},{"total":33,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Naming triangles","contentId":"097609013e00597bb4af935fa6530503","id":"80d28f4ebc08441184c02b06de89c2c6"},{"total":39,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Quadrilateral types","contentId":"f495c47ec35a5842808928ce93ee963f","id":"848716828c564103ac5cd1608d3b218f"},{"total":14,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Measuring angles","contentId":"4572fab63d375811b0d8f8a95acaa2c5","id":"e9a104f3c3964893a098049534c40cd7"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Understanding elementary shapes","contentId":"8a7281f2f215536d81a84a9ff898561f","id":"934ffceff430497680516a3e92b4bf6e"},{"total":633,"children":[{"total":59,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Comparing fractions","contentId":"981efeab76495687983a28b85564b9af","id":"330a4bb5eb9e428fbdf4f0873b2ce065"},{"total":72,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"A fraction","contentId":"5ec20aa267b4591cae9d65f551dd71a6","id":"46888912fb614a77b440fe7d8ce47af5"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Simplest form of a fraction","contentId":"13d97c61a8cc5d159b3f02b1cc93b073","id":"a7c620e4dc304282a4c8d277f8a4c635"},{"total":41,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Fraction on the number line","contentId":"d52c57fcffb858dfafe27f0e03bf25fc","id":"a8d2bfe91739425997ee1499f2500469"},{"total":190,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Addition and subtraction of fractions","contentId":"a25d07c022435f2fa07a1facf31256f7","id":"ca951a927eee4ffd89028cc046ec60b2"},{"total":77,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Equivalent fractions","contentId":"794fe217d7bf519ca9762d9de82bb350","id":"cd5237e5c4644be393207d34f109f42b"},{"total":24,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Like fractions","contentId":"45499023c36151b19ab0c8fe96f86acd","id":"d3e3cd16df634455ad377c7589840c23"},{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Improper and mixed fractions","contentId":"b78327bd876d535bbd82d1497471dc66","id":"d556670f601247b2af9666426ce3476c"},{"total":96,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction","contentId":"59c3448cb3465745bd9e047c59515d39","id":"f7e76a05dae94aef80656191010ccbdf"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Fractions","contentId":"1f3f45d2f6195523b401b5f0409c3a33","id":"a280650b428043128ba805cd78c28d61"},{"total":103,"children":[{"total":43,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Properties of whole numbers","contentId":"4aaef0051e7b57e0a8882a77abb267b3","id":"6fa30dc8036d4d97bada132c74b9a19e"},{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"The number line","contentId":"20c577a1c8a3560590e47c97a736f350","id":"af05335700e94c52968f58aa042a1f6c"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Distributive property for whole numbers","contentId":"9658d589b80051358f8a644e32e2f891","id":"b0f23ffb8e5c42668a07c379dd5e60ab"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Whole numbers","contentId":"1c74b21494fa5299835589c74bea5cc1","id":"a2b2b3a2b38a43228c356a9eae5be211"},{"total":159,"children":[{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Subtraction of integers with the help of the number line","contentId":"5dab8acb898456cb9dc0b47a65c177f0","id":"58e1bbf5f4124005b44c837e7bdd84de"},{"total":109,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Integers","contentId":"263a026345315852946be9db1c1b87db","id":"b127a4c3d23943d381389d1e095cd242"},{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Addition of integers","contentId":"92e4b1cdc10051dd9fbcec08332d5a61","id":"ea491c9398424a4eaf1593b3c5ec2d96"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Integers","contentId":"f8b9f7dbac7c567cb0a55fc2c006b106","id":"a7abf8f60eea461ab710f6566e2261be"},{"total":29,"children":[{"total":29,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Constructing angles","contentId":"d805697eff6351cfa7705ac1fd215794","id":"8abc440f4b234afe8ff1ca0f5338ccb0"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Constructing perpendiculars","contentId":"1b939e5d51025664909c4c6f3edb19c1","id":"ab132c941b7d45c7b289ff55615cf93d"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Practical Geometry","contentId":"c4c8d6c03de35eaa98293a95d99eb3b2","id":"b245949c00f54362ace80c329f792c31"},{"total":108,"children":[{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Idea of a variable","contentId":"e86dbb2e5fb256059384305528687caa","id":"50d3bad060794064ad8c50f0d26387ef"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Expressions with variables","contentId":"0d7d3644b7525b52b5a57b00b939e765","id":"5805fcb084ce4c0792e011e027eac97b"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Solution of an equation","contentId":"61369c97375f5b77a027a252deb11f7c","id":"6295d794449741c5ba64c2d4a7a4eb0a"},{"total":48,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Using expressions practically","contentId":"0a569486301251ea93ffc8ac3bbbe198","id":"a13af43f53b147cf8ea1f3c2db3f5320"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Overview and history of algebra","contentId":"83aab48607445bcdb092b7d534fa4286","id":"c1161390cab04aae868f82c0eec4d42f"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Algebra","contentId":"d3e1d0beeedb5637a2d52ed11ab32981","id":"bc067af3b6644dd78510dce3cad71730"},{"total":144,"children":[{"total":59,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Perimeter","contentId":"92d69c044af9562ba0386a5f2da1096f","id":"261c0c43cef141448fa8165f5414eb60"},{"total":85,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area","contentId":"4e4d062d15c75d5d88df921754b2dbb4","id":"6302d43eae8047c38944972878f4c383"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Mensuration","contentId":"185a85e7849e570593c96f35ef22f0c5","id":"e65ce6a014ab45d591e72e6655cf65ab"},{"total":118,"children":[{"total":20,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Ratio word problems","contentId":"fa2f111459f05cb6a49ec26fe63abf33","id":"0ddd948ea0c04312a0ef4ddd31150d3f"},{"total":36,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Unitary method","contentId":"0c5128cbf6ad590bb6b0667c977a8245","id":"4dd4e9feea0b4b5abe4345e673e658a6"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Introduction","contentId":"350e4b6049d6563395ffe324cec7963a","id":"60064bf46759463592f3fb132922f6db"},{"total":22,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Proportion","contentId":"a4a84a8314b958219acc7562d861b93d","id":"6c268284cd8d4b91b2c3edd83a3c972c"},{"total":40,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Ratio","contentId":"02cac33f412150a58aefa3a529fa402d","id":"9a9be2ff8d0f4d97b809e0df7b654f22"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Ratio and proportion","contentId":"ce26bca799455db98a7f8c535d8cccd2","id":"f652f9e080864e14b8ae6ca59663f041"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 6 (India)","contentId":"dd300adc818b53dfa868dccabd73fe17","id":"7326e0f4446c47309bfac5de52618778"},{"total":778,"children":[{"total":12,"children":[{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rotational symmetry","contentId":"db7cee3c3e115f87a72d3e469987c5b7","id":"5588ddaee673498b8bf714abce552989"},{"total":12,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Line of symmetry","contentId":"06fcc3b1351e56b9b066d489524fa93b","id":"7f08ea971d3a416dbf774c96882433fa"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Symmetry","contentId":"e86cbb7f27fc557d8a19b1b6bd9c395a","id":"3470b16e22e74fb39aad40b231649715"},{"total":50,"children":[{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factors and multiples","contentId":"f2e7cdb48f5956e0aedf68d1c47048ea","id":"e379f2941ad24c7ba881707317d4afcc"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Factors and multiples","contentId":"dbdf3859533c5cfe9f45e0faa0a77e2a","id":"39a3afd81d2c4e058f4f94a44e66fb99"},{"total":89,"children":[{"total":89,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Angles and unit of measurement for angles","contentId":"1721218db00e5a618a85b0ab1aca8df4","id":"f4dfda2431614796a2adb00ef01fb336"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Shapes and angles","contentId":"52ca1e38fbe3522f9c70b1fbd3d0682a","id":"3ddbbff9fa244f4891c0c81bf073fb86"},{"total":15,"children":[{"total":15,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Weight","contentId":"8b625cab5d0c58deb234ad3c30765693","id":"3a6863d6cbd6455297049a20143ebe89"},{"total":0,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Volume","contentId":"50f711b65e2c5ba4ae28a4cc99f2b623","id":"83f565d6aa214b55909cb2ee5ecaa839"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Volume and weight","contentId":"95a557bea4d3550daa38d019d917ae61","id":"41a5853742ca475190fd4cf8d8da248b"},{"total":25,"children":[{"total":25,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Areas and patterns","contentId":"015805b719da5537ba02c5c28efc89a0","id":"375dfb2ed75344dda4c2b80f88f20b59"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area and perimeter - Part 1","contentId":"af14b410a3925db98a80c9831fa3c2b5","id":"4d70821059f34f8aa1a3dbae661730e7"},{"total":44,"children":[{"total":44,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Patterns","contentId":"5e97ce6c57a1586ca39724dc51767011","id":"285c208b5ca1402d94b8cea0b60645b1"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Patterns","contentId":"1b599ee8ca6e5d4f952a20b138984423","id":"566c04528fc7459c814e133e582e04cf"},{"total":39,"children":[{"total":39,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Strategies for multiplication and division","contentId":"e6475afd7c605566808d6696405d8fe5","id":"48f89ad1ea1c4bbe914149bc04231609"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Ways to multiply and divide","contentId":"42ccc64e1aa452609cb0afb909dcff8c","id":"5a8e0e3f6fdb4adb89524b92920b144d"},{"total":238,"children":[{"total":238,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Fraction comparisons and equivalent fractions","contentId":"22c8e0e613115bca86a648f487abfc7f","id":"4b739fcdf5994b76b7fb11c00090d17d"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Parts and wholes","contentId":"369e5d13befa57b5a14d2ccedb2f7e0c","id":"8de4e0371e19426ab929461b80b7912e"},{"total":43,"children":[{"total":43,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Revision of shapes, estimation, simple operations, large numbers","contentId":"3265a29633e956fbad1b13ea45f52fdd","id":"af97e686bebc42b78a709cfbaddcda18"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Review of shapes, operations and large numbers","contentId":"6c991c6a225c51e9b37d63e65e13bdfd","id":"a9ab305d5c924063b398c87188716d40"},{"total":37,"children":[{"total":37,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Representing 3-D objects on paper in the form of nets","contentId":"e8dd8fc8d26454eb8dc80324859e9e01","id":"ebfe5f22054a48ea8eac6c2ade5c3378"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Visualizing 3-D objects","contentId":"63d4c95010d15ce4bc6d6a6ab42317dd","id":"a9eac39500654d1bbb0365a87d6bf64d"},{"total":136,"children":[{"total":136,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Decimals","contentId":"1faf174a510052518267bb0937af7471","id":"03b4a922e1fa47429803a1a7f6c358dd"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Decimals","contentId":"cc9b49f446de56dbac364da8068d5395","id":"c8feed1c8fba4804863ea0c1e1275c36"},{"total":50,"children":[{"total":50,"children":[],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area and perimeter","contentId":"96ae02f4690658c1950d90c869056155","id":"fd387d908f5043e8ba6cafa91dfe6227"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Area and perimeter - Part 2","contentId":"ff2aaec1467b5eb388310fa5128b2295","id":"e0d22ec967ed44feb5a03c2abc5ffafc"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Class 5 (India)","contentId":"d423fe596e475addb9af05484c2372c4","id":"8625465553614426844be5d071b531d6"}],"channelId":"eb99f209f9c34ba192f6e695aeb37e4f","name":"Rajasthan state English Medium","contentId":"eb99f209f9c34ba192f6e695aeb37e4f","id":"eb99f209f9c34ba192f6e695aeb37e4f"}]
    };
};

var sendPOSTRequest_test = function(url, dataObject, callback) {
    pendingRequests++;
    updateLoadingInfo();
    
    if (debug) {
        console.log('POST request sent to: ' + JSON.stringify(url) + '. POST data: ' + JSON.stringify(dataObject));
    }
    
    setTimeout(function() {
        var response;
        
        if (url === './api/mastery/get-page-meta') {
            response = ({
                code: 0,
                data: tableMetaData()
            });
        }
        
        if (url === './api/mastery/get-page-data') {
            response = ({
                code: 0,
                data: tableDataData()
            });
        }
        
        if (url === './api/mastery/topics') {
            response = ({
                code: 0,
                data: topicsData()
            });
        }
        
        if (url === './api/mastery/trend') {
            response = ({
                code: 0,
                data: trendData()
            });
        }
        
        if (response.code) {
            toastr.error(response.info.message, response.info.title);
        } else if (!response.data) {
            toastr.error('There is an error communicating with the server. Please try again later.');
            console.error('Invalid response: A valid `data` field is not found.');
        } else {
            callback(response);
        }
        
        pendingRequests--;
        updateLoadingInfo();
    }, getRandomInt(100, 2000));
};

$(function() {
    google.charts.load('current', {'packages':['line', 'corechart']});
    updateLoadingInfo();
    setupDateRangePicker();
    refreshTopicsDropdown();
    updatePageContent();
});
