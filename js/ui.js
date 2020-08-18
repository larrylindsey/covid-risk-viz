class CountySelectionManager {
  
  /**
   * Initializes this CountySelectionManager.
   * @param {string} selected_state the optional state to select, once the
   *   menu is populated.
   * @param {string} selected_county the optional county to select, once the
   *  county menu is populated.
   */
  constructor(selected_state, selected_county) {
    this._state_to_select = selected_state;
    this._county_to_select = selected_county;
    this._state_dropdown = document.getElementById('select_state_control');
    this._county_dropdown = document.getElementById('select_county_control');
    this._populate_state_menu();
  }

  /**
   * @return {string} the currently selected state.
   */
  selected_state() {
    const idx = this._state_dropdown.selectedIndex;
    const selected_option = this._state_dropdown.options[idx];
    return selected_option.textContent;
  }

  /**
   * @return {string} the currently selected county.
   */
  selected_county() {
    const idx = this._county_dropdown.selectedIndex;
    const selected_option = this._county_dropdown.options[idx];
    if (selected_option) return selected_option.textContent;
    return null;
  }

  /**
   * Initiates the action to populate the county list for the given state.
   * @param {string} state the selected state.
   */
  _state_selected(state) {
    const url = new URL(window.location.href);
    url.searchParams.set('state', to_safe_name(state));
    url.searchParams.delete('county');
    window.history.replaceState('', '', url.toString());
    const county_dropdown_jq = $(`#${this._county_dropdown.id}`);
    county_dropdown_jq.val('Select County');
    county_dropdown_jq.trigger('change');
    this._populate_county_menu(state);
  }

  /**
   * Initiates the action to create requisite plots for a given county.
   * @param {string} county the selected county.
   */
  _county_selected(county) {
    const url = new URL(window.location.href);
    url.searchParams.set('county', to_safe_name(county));
    window.history.replaceState('', '', url.toString());
    this.refresh_charts();
  }

  refresh_charts() {
    let callback = (cases, fatalities) => {
      update_charts(cases, fatalities);
    };
    get_county_data_then(
      this.selected_state(), this.selected_county(), callback);
  }

  /**
   * Creates a dropdown item element with given text content.
   * @param {string} tag the tag associated with this item. This will be its
   *   text content and the parameter passed to the action callback.
   */
  _create_dropdown_item(tag) {
    const element = document.createElement('option');
    element.textContent = tag;
    return element;
  }

  /**
   * Populates the county dropdown menu.
   * @param {string} state the selected state. The county dropdown will contain
   *   a list of this state's counties (or equivalent).
   */
  _populate_county_menu(state) {
    const select_county = this._county_dropdown;
    while (select_county.firstChild) {
      select_county.removeChild(select_county.lastChild);
    }

    const label_option = document.createElement('option');
    label_option.textContent = 'Select County';
    select_county.appendChild(label_option);

    select_county.onchange = () => {
      const county = this.selected_county();
      if (!county) return; 
      if (county == 'Select County') return;
      this._county_selected(county);
    }
    
    let callback = (states_and_counties) => {
      for (const county of states_and_counties[state]) {
        const county_element = this._create_dropdown_item(county);
        select_county.appendChild(county_element);
      }
      if (this._county_to_select) {
        const county_dropdown_jq = $(`#${this._county_dropdown.id}`);
        county_dropdown_jq.val(from_safe_name(this._county_to_select));
        county_dropdown_jq.trigger('change');
        this._county_to_select = null;
      }
    }

    get_state_county_dict_then(callback);
  }

  /**
   * Populates the state dropdown selection menu.
   */
  _populate_state_menu() {
    let callback = (states_and_counties) => {
      const state_list = [];
      for (const state in states_and_counties) {
        state_list.push(state);
      }

      state_list.sort();

      const select_state = this._state_dropdown;

      select_state.onchange = () => {
        this._state_selected(this.selected_state());
      }

      while (select_state.firstChild) {
        select_state.removeChild(select_state.lastChild);
      }

      const label_option = document.createElement('option');
      label_option.textContent = 'Select State';
      select_state.appendChild(label_option);
      
      for (const state of state_list) {
        const state_element = this._create_dropdown_item(state);
        select_state.appendChild(state_element);
      }

      if (this._state_to_select) {
        const state_menu_jq = $(`#${this._state_dropdown.id}`);
        state_menu_jq.val(from_safe_name(this._state_to_select));
        state_menu_jq.trigger('change');
        this._state_to_select = null;
      }
    }
    
    get_state_county_dict_then(callback);
  }
};

class DateInputAdapter{
  constructor(element) {
    this._element = element;
    this._callback_count = 0;
    this._last_valid = undefined;
  }

  set value(timestamp) {
    this._element.value = timestamp_to_string(
      parseInt(timestamp));
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
    const oninput = () => {
      const count = ++this._callback_count;
      setTimeout(() => {
        if (count != this._callback_count) {
          return;
        }
        callback();
      }, 250);
    }    
    this._element.oninput = oninput;
    this._element.onchange = () => {
      const test_date = new Date(this._element.value);
      if (isNaN(test_date.valueOf())) {
        this._element.style.borderColor = '#ff0000';
      } else {
        this._element.style.borderColor = '';
      }
    }
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
      'rate_transition_date': new Date('1 June 2020').valueOf(),
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
    const url = new URL(location.href);
    const params = url.searchParams;

    for (let key in this._parameter_element_map) {
      params.delete(key);
      const value = this._parameter_element_map[key].value;
      if (this._default_values[key] != value) {
        params.set(key, value);
      }
    }

    window.history.replaceState('', '', url.toString());
    g_selection_manager.refresh_charts();
  }

  get_parameters() {
    const parameter_values = {};
    for (let key in this._parameter_element_map) {
      parameter_values[key] = parseFloat(this._parameter_element_map[key].value);
    }
    return parameter_values;
  }
};

function get_chart_parameters() {
  return g_parameter_manager.get_parameters();
}

g_selection_manager = undefined;
g_parameter_manager = undefined;

function get_contagious_days() {
  return parseInt(contagious_days_label().innerText);
}

/**
 * Main entry point for Javascript code.
 */
function main_entry() {
  const url = new URL(window.location.href);
  const state = url.searchParams.get('state');
  const county = url.searchParams.get('county');
  g_selection_manager = new CountySelectionManager(state, county);
  init_charts();
  g_parameter_manager = new ParameterManager();
}

/**
 * Simple dumb assert function.
 * @param {boolean} condition 
 */
function assert(condition) {
  if (condition) return;
  throw 'Failure condition!';
}