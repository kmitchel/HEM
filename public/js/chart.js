$(function () {
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    })

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
        plotOptions: {
            series: {
                lineWidth: 1
            }
        }
    })

    var client = mqtt.connect("ws://kmitchel.ddns.net:9001")

    function receiveMessage(topic, message) {
        chart.series[0].addPoint([Date.now(), Number(message.toString())], true, true)
    }

    updateChart(
        $('.type .selected').attr('data-type'),
        $('.time .selected').attr('data-time'),
        $('.past .selected').attr('data-past'),
        $('.type .selected').attr('data-title'),
        $('.time .selected').attr('data-sub'),
        $('.type .selected').attr('data-unit')
    )

    $('.btnGroup > button').click(function () {
        $(this).addClass('selected').siblings().removeClass('selected')
        updateChart(
            $('.type .selected').attr('data-type'),
            $('.time .selected').attr('data-time'),
            $('.past .selected').attr('data-past'),
            $('.type .selected').attr('data-title'),
            $('.time .selected').attr('data-sub'),
            $('.type .selected').attr('data-unit')
        )
    })

    function updateChart(collection, time, past, title, sub, unit) {
        var url

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

        if (time == '00') {
            url = '/data/' + collection + "/" + past
        } else {
            url = '/data/' + collection + '/' + time + "/" + past
        }

        $.getJSON(url, function (data) {
            $('.btnGroup').addClass('hide')

            while (chart.series.length > 0) {
                chart.series[0].remove(false)
            }

            chart.setTitle({ text: title }, { text: sub })
            chart.yAxis[0].setTitle({ text: unit })

            data.forEach(function (element) {
                chart.addSeries(element)
            })

            $('.btnGroup').removeClass('hide')

        })
    }
})
