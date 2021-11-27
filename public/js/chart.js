$(function () {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            type: 'line',
            zoomType: "x"
        },
        title: {
            text: 'Loading...'
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

    var client = mqtt.connect("ws://kmitchel.ddns.net:9001")

    function receiveMessage(topic, message) {
        chart.series[0].addPoint([Date.now(), Number(message.toString())], true, true)
    }

    updateChart($('.type .selected').attr('id'), $('.time .selected').attr('id'), $('.past .selected').attr('id'), $('.type .selected').attr('data-title'), $('.time .selected').attr('data-sub'), $('.type .selected').attr('data-unit'));

    $('.btnGroup > button').click(function () {
        $(this).addClass('selected').siblings().removeClass('selected');
        updateChart($('.type .selected').attr('id'), $('.time .selected').attr('id'), $('.past .selected').attr('id'), $('.type .selected').attr('data-title'), $('.time .selected').attr('data-sub'), $('.type .selected').attr('data-unit'));
    });

    function updateChart(collection, time, past, title, sub, unit) {
        var url;

        if (collection == "power-W" && time == "00") {
            client.subscribe("power/W")
            client.on("message", receiveMessage)
            chart.yAxis[0].update({
                type: 'logarithmic'
              })
        } else {
            client.removeListener("message", receiveMessage)
            client.unsubscribe("power/W")
            chart.yAxis[0].update({
                type: 'linear'
              })

        }

        if (collection == "wh") {
            if (time == "00") {
                urlUpper = "/data/temp-2809853f030000a7/" + past
                urlLower = "/data/temp-2813513f03000072/" + past
            } else {
                urlUpper = "/data/temp-2809853f030000a7/" + time + "/" + past
                urlLower = "/data/temp-2813513f03000072/" + time + "/" + past
            }

            while (chart.series.length > 0) {
                chart.series[0].remove(false);
            }

            chart.setTitle({ text: title }, { text: sub });
            chart.yAxis[0].setTitle({ text: unit });

            $.getJSON(urlUpper, function (data) {
                data.forEach(function (element) {
                    chart.addSeries(element);
                });

            })
            $.getJSON(urlLower, function (data) {
                data.forEach(function (element) {
                    chart.addSeries(element);
                });

            })


        } else {

            if (time == '00') {
                url = '/data/' + collection + "/" + past;
            } else {
                url = '/data/' + collection + '/' + time + "/" + past;
            }

            $.getJSON(url, function (data) {
                $('.btnGroup').addClass('hide');

                while (chart.series.length > 0) {
                    chart.series[0].remove(false);
                }

                chart.setTitle({ text: title }, { text: sub });
                chart.yAxis[0].setTitle({ text: unit });

                data.forEach(function (element) {
                    chart.addSeries(element);
                });
                $('.btnGroup').removeClass('hide');

            });
        }
    }


});
