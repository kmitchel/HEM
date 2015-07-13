$(function () {

  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });

  var chart = new Highcharts.Chart({
    chart: {
      renderTo: 'container',
      type: 'column'
    },
    legend:{
        enabled: false
    },
    yAxis:{},
    xAxis:{
      type: 'datetime'
    },
    series: [{}]
  });

  function updateChart(chartType, chartTime, title, sub, unit){
    $.getJSON('chart/' + chartType + '/' + chartTime+'?callback=?', function(data){
      while( chart.series.length > 0 ) {
        chart.series[0].remove( false );
      }

      chart.setTitle({text:title},{text:sub});
      chart.yAxis[0].setTitle({text:unit});

      if (data[0].length === 5){

        // var min = [], avg = [], max = [];

        // data.forEach(function(e){
        //   min.push([e[0],e[1]]);
        //   avg.push([e[0],Number((e[3]/e[2]).toFixed(2))]);
        //   max.push([e[0],e[4]]);
        // });
        // chart.addSeries({data:min,color:chart.options.colors[9],type:'spline'});
        // chart.addSeries({data:avg,color:chart.options.colors[0],type:'spline'});
        // chart.addSeries({data:max,color:chart.options.colors[3],type:'spline'});
        // chart.series[0].name = 'Min ' + unit;
        // chart.series[1].name = 'Avg ' + unit;
        // chart.series[2].name = 'Max ' + unit;

        var range = [], avg = [];


        data.forEach(function(e){
          range.push([e[0],e[1],e[4]]);
          avg.push([e[0],Number((e[3]/e[2]).toFixed(2))]);
        });
        chart.addSeries({data:avg,color:chart.options.colors[0],type:'spline', zIndex:1});
        chart.addSeries({data:range,color:chart.options.colors[0],type:'arearange', fillOpacity: 0.3,lineWidth: 0,zIndex:0});
        chart.series[0].name = 'Avg ' + unit;
        chart.series[1].name = 'Range ' + unit;


      } else {
        chart.addSeries({data:data,color:chart.options.colors[0]});
        chart.series[0].name = unit;
      }
      chart.redraw();
    });
  }

  updateChart($('.type .selected').attr('id'),$('.time .selected').attr('id'),$('.type .selected').attr('data-title'), $('.time .selected').attr('data-sub'),$('.type .selected').attr('data-unit'));
  $('.btnGroup').removeClass('hide');

  $('.btnGroup > button').click(function(){
    $(this).addClass('selected').siblings().removeClass('selected');
  });

  $('.time > button').click(function(){
    updateChart($('.type .selected').attr('id'), this.id,$('.type .selected').attr('data-title'),$(this).attr('data-sub'),$('.type .selected').attr('data-unit'));
  });

  $('.type > button').click(function(){
    updateChart(this.id, $('.time .selected').attr('id'),$(this).attr('data-title'),$('.time .selected').attr('data-sub'),$(this).attr('data-unit'));
  });

});