if (typeof toastr !== 'undefined') {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "positionClass": "toast-top-right",
        "onclick": null,
        "showDuration": "5000",
        "hideDuration": "5000",
        "timeOut": "7500",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
}

$(document).ready(function() {
    var maxVal = function(a, b) {
        return a > b ? a : b;
    };
    var resizeSiteContent = function() {
        $('.site-content')[0].style.minHeight = maxVal($('.site-sidebar').height(), $(window).height()) + 'px';
    };
    resizeSiteContent();
    $(window).on('resize', resizeSiteContent);
});