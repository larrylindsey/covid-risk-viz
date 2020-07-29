
function timestamp_to_string(timestamp) {
  const date = new Date(timestamp);
  const year = 1900 + date.getYear();
  const month = 1 + date.getMonth();
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

function differentiate(time_series) {
  const padded_series = nj.concatenate(nj.array([0]), time_series.range());
  const differential_series =  nj.round(nj.convolve(padded_series, [1, -1]));
  return new TimeSeries(time_series.domain(), differential_series);
}

function fatality_count_to_case_estimate(
  dates, fatalities, fatality_rate = 0.01, delay_days = 19) {

}

class TimeSeries {
  constructor(domain, range) {
    this._domain = nj.array(domain);
    this._range = nj.array(range);
  }

  domain_list() {
    return this._domain.tolist();
  }

  range_list() {
    return this._range.tolist();
  }

  domain() {
    return this._domain;
  }

  range() {
    return this._range;
  }

  domain_strings() {
    const date_strings = [];
    for (const timestamp of this._domain.tolist()) {
      date_strings.push(timestamp_to_string(timestamp));
    }
    return date_strings;
  }

  as_chart_data() {
    const domain = this.domain_list();
    const range = this.range_list();
    const data_set = [];
    for (let idx = 0; idx < domain.length; ++idx) {
      data_set.push({
        x: timestamp_to_string(domain[idx]),
        y: range[idx]
      });
    }

    return data_set;
  }

};