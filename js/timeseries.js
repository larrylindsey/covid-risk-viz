const DAYS_MS = 3600 * 24 * 1000;

function timestamp_to_string(timestamp) {
  const date = new Date(timestamp);
  const year = 1900 + date.getYear();
  const month = 1 + date.getMonth();
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

function timestamp_array_to_string(timestamps) {
  const timestamp_strings = [];
  for (const ts of timestamps.tolist()) {
    timestamp_strings.push(timestamp_to_string(ts));
  }
  return timestamp_strings;
}

function differentiate(time_series) {
  const padded_series = nj.concatenate(nj.array([0]), time_series.range());
  const differential_series =  nj.round(nj.convolve(padded_series, [1, -1]));
  return new TimeSeries(time_series.domain(), differential_series);
}

function fatality_count_to_case_estimate(
    daily_fatality_time_series, fatality_rate = 0.01, delay_days = 19,
    survival_course_days = 14) {
  const case_estimate = new TimeSeries(
    daily_fatality_time_series.domain(),
    daily_fatality_time_series.range().divide(fatality_rate)).date_shift(-delay_days);
  const active_case_kernel = nj.ones(survival_course_days);
  const active_case_estimate = case_estimate.cross_correlate(active_case_kernel);
  return [case_estimate, active_case_estimate];
}

function merge_domains(...time_series) {
  const domain_set = new Set();
  for (const ts of time_series) {
    for (const domain_element of ts.domain_list()) {
      domain_set.add(domain_element);
    }
  }

  const sorted_domain = [];
  for (const element of domain_set) {
    sorted_domain.push(element);
  }

  sorted_domain.sort();

  return nj.array(sorted_domain);
}

class TimeSeries {
  constructor(domain, range) {
    this._domain = nj.array(domain);
    this._range = nj.array(range);
    assert(this._domain.size == this._range.size);
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

  set_range(new_range) {
    this._range = nj.array(new_range);
    assert(this._range.size == this._domain.size);
  }

  slice(slice_argument) {
    const sliced_domain = this._domain.slice(slice_argument);
    const sliced_range = this._range.slice(slice_argument);
    return new TimeSeries(sliced_domain, sliced_range);
  }

  date_shift(days) {
    const shifted_domain = this._domain.add(days * DAYS_MS);
    return new TimeSeries(shifted_domain, this._range);
  }

  cross_correlate(kernel) {
    const kernel_size = kernel.size;
    const this_size = this._range.size;
    const output = nj.zeros(kernel_size + this_size - 1, 'float32');
    for (let i = 0; i < kernel_size; ++i) {
      const k = kernel_size - i - 1;
      for (let j = 0; j < this_size; ++j) {
        const out_idx = i + j;
        const corr = kernel.get(k) * this._range.get(j);
        output.set(out_idx, output.get(out_idx) + corr);
      }
    }

    const kernel_days_offset = DAYS_MS * Math.floor(kernel_size / 2);
    const out_domain = nj.arange(output.size).multiply(DAYS_MS).add(
      this._domain.get(0)).subtract(kernel_days_offset);
 
    return new TimeSeries(out_domain, output);
  }

  domain_strings() {
    return timestamp_array_to_string(this._domain);
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