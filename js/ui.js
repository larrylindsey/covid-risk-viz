/**
 * @return {Element} the state selection dropdown.
 */
function get_state_dropdown() {
  return document.getElementById('select_state_control');
}

/**
 * @return {Element} the county selection dropdown.
 */
function get_county_dropdown() {
  return document.getElementById('select_county_control');
}

/**
 * @return {string} the currently selected state.
 */
function selected_state() {
  const state_dropdown = get_state_dropdown();
  const idx = state_dropdown.selectedIndex;
  const selected_option = state_dropdown.options[idx];
  return selected_option.textContent;
}

/**
 * @return {string} the currently selected county.
 */
function selected_county() {
  const county_dropdown = get_county_dropdown();
  const idx = county_dropdown.selectedIndex;
  const selected_option = county_dropdown.options[idx];
  return selected_option.textContent;
}

/**
 * Sets the state dropdown text to the state name and initiates the action
 * to populate the county list.
 * @param {string} state the selected state.
 */
function state_selected(state) {
  const select_state = get_state_dropdown();
  populate_county_menu(state);
}

/**
 * Sets the county dropdown text to the county name and initiates the action
 * to create requisite plots.
 * @param {string} county the selected county.
 */
function county_selected(county) {
  let callback = (cases, fatalities) => {
    update_charts(cases, fatalities);
  };
  get_county_data_then(selected_state(), county, callback);
}

/**
 * Creates a dropdown item element with given text content, that calls the
 * action callback when selected.
 * @param {string} tag the tag associated with this item. This will be its
 *   text content and the parameter passed to the action callback.
 * @param action a callback function that takes a single string parameter.
 * @return {Element} a dropdown item element, ready to be added to a dropdown.
 */
function create_dropdown_item(tag) {
  const element = document.createElement('option');
  element.textContent = tag;
  return element;
}

/**
 * Populates the county dropdown menu.
 * @param {string} state the selected state. The county dropdown will contain
 *   a list of this state's counties (or equivalent).
 */
function populate_county_menu(state) {
  const select_county = get_county_dropdown();
  while (select_county.firstChild) {
    select_county.removeChild(select_county.lastChild);
  }

  const label_option = document.createElement('option');
  label_option.textContent = 'Select County';
  select_county.appendChild(label_option);

  select_county.onchange = () => {    
    county_selected(selected_county());
  }
  
  let callback = (states_and_counties) => {
    for (const county of states_and_counties[state]) {
      const county_element = create_dropdown_item(county);
      select_county.appendChild(county_element);
    }
  }

  get_state_county_dict_then(callback);
}

/**
 * Populates the state dropdown selection menu.
 */
function populate_state_menu() {
  let callback = (states_and_counties) => {
    const state_list = [];
    for (const state in states_and_counties) {
      state_list.push(state);
    }

    state_list.sort();

    const select_state = get_state_dropdown();

    select_state.onchange = () => {
      state_selected(selected_state());
    }

    while (select_state.firstChild) {
      select_state.removeChild(select_state.lastChild);
    }

    const label_option = document.createElement('option');
    label_option.textContent = 'Select State';
    select_state.appendChild(label_option);
    
    for (const state of state_list) {
      const state_element = create_dropdown_item(state);
      select_state.appendChild(state_element);
    }
  }
  
  get_state_county_dict_then(callback);
}

class DateInputAdapter{
  constructor(element) {
    this._element = element;
    this._callback_count = 0;
    this._last_valid = undefined;
  }

  set value(timestamp) {
    this._element.value = timestamp_to_string(timestamp);
    this._last_valid = timestamp;
  }

  get value() {
    const date = new Date(this._element.value);
    if (!isNaN(date.valueOf())) {
      this._last_valid = date.valueOf();
    }
    return this._last_valid;
  }

  set onchange(callback) {
    // We don't care about event parameters as of yet.
    const onchange = () => {
      const count = ++this.callback_count;
      setTimeout(() => {
        if (count != this.callback_count) {
          return;
        }
        callback();
      }, 250);
    }
    this._element.onchange = onchange;
  }
};

class ParameterManager {

  constructor() {
    this._fatality_delay_slider = document.getElementById(
      'infection_mortality_delay');
    this._fatality_delay_label = document.getElementById(
      'infection_mortality_delay_value');
    this._fatality_iqr_slider = document.getElementById(
      'infection_mortality_iqr');
    this._fatality_iqr_label = document.getElementById(
      'infection_mortality_iqr_value');
    this._rate_transition_slider = document.getElementById(
      'fatality_rate_transition_days');
    this._rate_transition_label = document.getElementById(
      'fatality_rate_transition_value');
    this._contagious_days_slider = document.getElementById(
      'contagious_days');
    this._contagious_days_label = document.getElementById(
      'contagious_days_value');
    this._fatality_rate_a_slider = document.getElementById(
      'early_fatality_rate');
    this._fatality_rate_a_label =  document.getElementById(
      'early_fatality_rate_value');
    this._fatality_rate_b_slider = document.getElementById(
      'late_fatality_rate');
    this._fatality_rate_b_label = document.getElementById(
      'late_fatality_rate_value');
    this._fatality_rate_date_input = document.getElementById(
      'transition_date');
    this._fatality_rate_date = null;

    this._transition_date_setter = new DateInputAdapter(
      this._fatality_rate_date_input);

    this._default_values = {
      'fatality_delay': 19,
      'fatality_delay_iqr': 7,
      'rate_transition_date': new Date('June 1 2020').valueOf,
      'rate_transition_days': 7,
      'fatality_rate_a': 0.01,
      'fatality_rate_b': 0.005,
      'contagious_days': 14
    };

    this._parameter_element_map = {
      'fatality_delay': this._fatality_delay_slider,
      'fatality_delay_iqr': this._fatality_iqr_slider,
      'rate_transition_date': this._transition_date_setter,
      'rate_transition_days': this._rate_transition_slider,
      'fatality_rate_a': this._fatality_rate_a_slider,
      'fatality_rate_b': this._fatality_rate_b_slider,
      'contagious_days': this._contagious_days_slider
    }

    this._initialize_parameter_values();
    this._initialize_slider_label_events();
    this._initialize_parameter_change_events();
  }

  _initialize_slider_label_events() {
    const slider_label_pairs = [
      [this._fatality_delay_slider, this._fatality_delay_label],
      [this._fatality_iqr_slider, this._fatality_iqr_label],
      [this._rate_transition_slider, this._rate_transition_label],
      [this._fatality_rate_a_slider, this._fatality_rate_a_label],
      [this._fatality_rate_b_slider, this._fatality_rate_b_label],
      [this._contagious_days_slider, this._contagious_days_label]
    ];

    for (let [slider, label] of slider_label_pairs) {
      label.innerText = slider.value;
      slider.oninput = () => {
        label.innerText = slider.value;
      }
    }
  }

  _initialize_parameter_values() {
    // copy defaults
    const parameter_values = {};
    for (let key in this._default_values) {
      parameter_values[key] = this._default_values[key];
    }

    // parse url query
    const url_param_tokens = location.search.substring(1).split('&');

    for (let param_token of url_param_tokens) {
      if (!param_token) continue;
      let [k, v] = param_token.split('=');
      if (!v) continue;
      parameter_values[k] = v;
    }

    for (let key in parameter_values) {
      const element = this._parameter_element_map[key];
      if (!element) {
        console.log(`Could not find element for key ${key}`);
        continue;
      }
      element.value = parameter_values[key];
    }
  }

  _initialize_parameter_change_events() {
    for (let key in this._parameter_element_map) {
      this._parameter_element_map[key].onchange = () => {
        this._on_parameter_change();
      }
    }
  }

  _on_parameter_change() {
    const parameter_values = {};
    for (let key in this._parameter_element_map) {
      parameter_values[key] = this._parameter_element_map[key].value;
    }

    const url = new URL(location.href);
    url.search = '';
    const params = url.searchParams;

    for (let key in this._parameter_element_map) {
      const value = this._parameter_element_map[key].value;
      if (this._default_values[key] != value) {
        params.append(key, value);
      }
    }

    window.history.replaceState('', '', url.toString());
  }
};

g_parameter_manager = undefined;

function get_contagious_days() {
  return parseInt(contagious_days_label().innerText);
}

function setup_parameters_ui() {
  g_parameter_manager = new ParameterManager();
}

/**
 * Main entry point for Javascript code.
 */
function main_entry() {
  populate_state_menu();
  init_charts();
  setup_parameters_ui();
}

/**
 * Simple dumb assert function.
 * @param {boolean} condition 
 */
function assert(condition) {
  if (condition) return;
  throw 'Failure condition!';
}