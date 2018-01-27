$(function() {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            type: 'line'
        },
        title: {
            text: 'Test'
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
//            type: 'logarithmic'
        },
        plotOptions: {
            series: {
                lineWidth: 1
            }
        },
        //yAxis: {min:65, max:85},
        series: {}
    });


    updateChart($('.type .selected').attr('id'), $('.time .selected').attr('id'),$('.type .selected').attr('data-title'), $('.time .selected').attr('data-sub'),$('.type .selected').attr('data-unit'));

    $('.btnGroup > button').click(function() {
        $(this).addClass('selected').siblings().removeClass('selected');
        updateChart($('.type .selected').attr('id'), $('.time .selected').attr('id'),$('.type .selected').attr('data-title'), $('.time .selected').attr('data-sub'),$('.type .selected').attr('data-unit'));
    });

    function updateChart(collection, time, title, sub, unit) {
        var url;
        if (time == '0'){
          url = '/data/' + collection;
        }else{
          url = '/data/' + collection + '/' + time;
        }

        $.getJSON(url, function(data) {
            $('.btnGroup').addClass('hide');

            while (chart.series.length > 0) {
                chart.series[0].remove(false);
            }

            chart.setTitle({text:title},{text:sub});
            chart.yAxis[0].setTitle({text:unit});

            data.forEach(function(element) {
                chart.addSeries(element);
            });
            $('.btnGroup').removeClass('hide');

        });
    }
});
