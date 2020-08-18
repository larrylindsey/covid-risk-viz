/**
 * Manages the Chart objects used for visualization.
 */
class ChartManager {

  constructor() {
    this._raw_cases_canvas = document.getElementById('raw_cases_canvas');
    this._charts = [];
  }

  _remove_charts() {
    for (const chart of this._charts) {
      chart.destroy();
    }
  }

  _chart_options(title) {
    return {
      title: {
        display: true,
        text: title,
        fontSize: 16
      }
    };
  }

  /**
   * Removes existing charts, performs computations, then updates the
   * visualizations.
   * 
   * @param cases {TimeSeries} the cumulative confirmed case count.
   * @param fatalities {TimeSeries} the cumulative fatality count.
   */
  update_charts(cases, fatalities) {
    this._remove_charts();

    const estimate_kernel_size = 14;
    const crop_size = estimate_kernel_size - 1;

    const daily_fatalities = differentiate(fatalities);
    const daily_cases = differentiate(cases);
    const [daily_case_estimate, active_case_estimate] =
      fatality_count_to_case_estimate(daily_fatalities, get_chart_parameters());
    const active_case_estimate_valid = active_case_estimate.slice(
      [crop_size, -crop_size]);
    const active_case_estimate_projection = active_case_estimate.slice(
      [-crop_size, -4])

    let norm_factor = nj.arange(1 + 4, estimate_kernel_size).slice([null, null, -1]);
    norm_factor = norm_factor.divide(estimate_kernel_size);
    let projected_case_estimate = active_case_estimate_projection.range();
    projected_case_estimate = projected_case_estimate.divide(norm_factor);
    active_case_estimate_projection.set_range(projected_case_estimate);


    const case_estimate_labels = timestamp_array_to_string(merge_domains(
      active_case_estimate_projection, active_case_estimate_valid
    ));
    const active_cases_chart = new Chart(
      document.getElementById('active_cases_canvas'),
      {
        type: 'line',
        data: {
          labels: case_estimate_labels,
          datasets: [{
            data: active_case_estimate_valid.as_chart_data(),
            label: 'Estimated Cases',
            borderColor: '#3e95cd',
            fill: false
          }, {
            data: active_case_estimate_projection.as_chart_data(),
            label: 'Extrapolated Cases',
            borderColor: '#cd953e',
            fill: false
          }]
        },
        options: this._chart_options('Active Contagious Cases Estimate'),
      }
    );

    const daily_fatality_chart = new Chart(
      document.getElementById('daily_fatalities_canvas'),
      {
        type: 'line',
        data: {
          labels: daily_fatalities.domain_strings(),
          datasets: [{
            data: daily_fatalities.as_chart_data(),
            label: 'Confirmed Cases',
            borderColor: '#3e95cd',
            fill: false
          },]
        },
        options: this._chart_options('Daily Fatalities')
      }
    );

    const daily_cases_labels = timestamp_array_to_string(merge_domains(
      daily_cases, daily_case_estimate
    ));
    const daily_cases_chart = new Chart(
      document.getElementById('daily_cases_canvas'),
      {
        type: 'line',
        data: {
          labels: daily_cases_labels,
          datasets: [{
            data: daily_cases.as_chart_data(),
            label: 'Confirmed Cases',
            borderColor: '#3e95cd',
            fill: false
          }, {
            data: daily_case_estimate.as_chart_data(),
            label: 'Estimated From Fatality Rate',
            borderColor: '#cd953e',
            fill:false
          }]
        },
        options: this._chart_options('Daily Infections')
      }
    )
    
    this._charts = [
      active_cases_chart,
      daily_fatality_chart,
      daily_cases_chart
    ];
  }
}

g_chart_manager = undefined;

/**
 * Initializes charts. Should be called only once at load time.
 */
function init_charts() {
  g_chart_manager = new ChartManager();
}

/**
 * Updates charts to new case and fatality data.
 * @param {TimeSeries} cases cumulative confirmed cases.
 * @param {TimeSeries} fatalities cumulative confirmed fatalities.
 */
function update_charts(cases, fatalities) {
  g_chart_manager.update_charts(cases, fatalities);
}
