const DAYS_MS = 3600 * 24 * 1000;

/**
 * Converts a timestamp to a date string.
 * @param {number} timestamp unix epoch in milliseconds, or time since
 *   UTC 1 Jan 1970.
 * @return {string} representation of the corresponding date. For instance,
 *   given a timestamp of 0, this function returns '1970-1-1'.
 */
function timestamp_to_string(timestamp) {
  const date = new Date(timestamp);
  const year = 1900 + date.getYear();
  const month = 1 + date.getMonth();
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

/**
 * Converts a list of timestamps to date strings via timestamp_to_string.
 * @param {[number]} timestamps unix epochs in milliseconds.
 * @return {[string]} representations of the corresponding dates.
 */
function timestamp_array_to_string(timestamps) {
  const timestamp_strings = [];
  for (const ts of timestamps.tolist()) {
    timestamp_strings.push(timestamp_to_string(ts));
  }
  return timestamp_strings;
}

/**
 * Computes the "differential" of a TimeSeries, or more properly the
 * difference, since we're dealing with discrete data.
 * @param {TimeSeries} time_series the TimeSeries to differentiate.
 * @return {TimeSeries} the differential. The domain will remain unchanged,
 *   and the first value in the range will correspond to the first value in
 *   the original.
 */
function differentiate(time_series) {
  const padded_series = nj.concatenate(nj.array([0]), time_series.range());
  const differential_series =  nj.round(nj.convolve(padded_series, [1, -1]));
  return new TimeSeries(time_series.domain(), differential_series);
}

/**
 * Computes an estimate of the daily case rate and active case rate given the
 * daily fatality rate and some additional parameters.
 * @param {TimeSeries} daily_fatality_time_series 
 * @param {number} fatality_rate fraction of cases that become fatal.
 * @param {number} sigma the standard deviation of the distribution of delay
 *   from infection to mortality.
 * @param {number} delay_days mean time between infection and mortality.
 * @param {number} contagious_duration_days mean duration of contagiousness in
 *  days.
 * @return {[TimeSeries, TimeSeries]} an estimate of the new daily infections
 *   and the number of active infectious cases.
 */
function fatality_count_to_case_estimate(
    daily_fatality_time_series, fatality_rate = 0.01, sigma = 5.25,
    delay_days = 19, contagious_duration_days = 14) {
  let gaussian_sample_count = Math.floor(5.25 * sigma);
  if (gaussian_sample_count % 2 == 0) ++gaussian_sample_count;
  const case_backsolve_kernel = guassian_kernel(sigma, gaussian_sample_count);
  let case_estimate = new TimeSeries(
    daily_fatality_time_series.domain(),
    daily_fatality_time_series.range().divide(fatality_rate)).date_shift(-delay_days)
  case_estimate = case_estimate.cross_correlate(case_backsolve_kernel).slice(
    [-gaussian_sample_count + 1]);
  const active_case_kernel = nj.ones(contagious_duration_days);
  const active_case_estimate = case_estimate.cross_correlate(active_case_kernel);
  return [case_estimate, active_case_estimate];
}

/**
 * Computes an approximate guassian curve with the given standard deviation
 * and sample count. The result is normalized to sum to 1.0.
 * @param {number} sigma standard deviation.
 * @param {number} size number of samples in the returned kernel, must be odd.
 */
function guassian_kernel(sigma, size) {
  assert(size % 2 == 1);
  const half_size = Math.floor(size / 2);
  const gauss = nj.arange(-half_size, half_size + 1).pow(2).divide(
    -2 * sigma * sigma).exp();
  const norm = nj.sum(gauss);
  return gauss.divide(norm);
}

/**
 * Merges and sorts the domains of any number of TimeSeries
 * @param  {...TimeSeries} time_series
 * @return {nj.Array} the merged time stamps representing the union of domains.
 */
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

/**
 * Represents time series data, in which the domain is millisecond UTC
 * timestamps and the range is any numerical data. For our purposes here, the
 * domain is aligned to whole days and the range is some kind of actual or
 * estimated case count.
 */
class TimeSeries {
  
  /**
   * Instantiates a new TimeSeries.
   * @param {any} domain a list or nj.array of millisecond UTC timestamps.
   * @param {any} range a list or nj.array of the values corresponding to the
   *   given timestamps.
   */
  constructor(domain, range) {
    this._domain = nj.array(domain);
    this._range = nj.array(range);
    assert(this._domain.size == this._range.size);
  }

  /**
   * @return [{number}] the domain as a list.
   */
  domain_list() {
    return this._domain.tolist();
  }

  /**
   * @return [{number}] the range as a list.
   */
  range_list() {
    return this._range.tolist();
  }

  /**
   * @return {TimeSeries}
   */
  domain() {
    return this._domain;
  }

  /**
   * @return {TimeSeries}
   */
  range() {
    return this._range;
  }

  /**
   * Sets the range.
   * @param {any} new_range a list or nj.array to use as the new range for this
   *   TimeSeries. Must have the same number of elements as the domain.
   */
  set_range(new_range) {
    this._range = nj.array(new_range);
    assert(this._range.size == this._domain.size);
  }

  /**
   * Performs a slice operation on both the domain and range of this TimeSeries
   * as with nj.array.
   * @param {any} slice_argument slice parameter as used with nj.array.slice.
   * @return {TimeSeries} a sliced TimeSeries.
   */
  slice(slice_argument) {
    const sliced_domain = this._domain.slice(slice_argument);
    const sliced_range = this._range.slice(slice_argument);
    return new TimeSeries(sliced_domain, sliced_range);
  }

  /**
   * Shifts the domain of this TimeSeries by a number of days.
   * @param {number} days number of days to shift the domain.
   * @return {TimeSeries} a new TimeSeries with a shifted domain.
   */
  date_shift(days) {
    const shifted_domain = this._domain.add(days * DAYS_MS);
    return new TimeSeries(shifted_domain, this._range);
  }

  /**
   * Performs a zero-padded full cross correlation over the range of this
   * TimeSeries.
   * @param {nj.Array} kernel the cross-corr kernel.
   * @return {TimeSeries} a new TimeSeries representing the cross-correlation
   *   result. The domain is expanded to correspond to the data.
   */
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

  /**
   * return {[string]} this TimeSeries' domain as a list of strings.
   */
  domain_strings() {
    return timestamp_array_to_string(this._domain);
  }

  /**
   * @return {[{x: number, y: number}]} this TimeSeries' data in the format
   *   expected by the constructor for a Chart object.
   */
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