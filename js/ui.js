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

/**
 * Main entry point for Javascript code.
 */
function main_entry() {
  populate_state_menu();
  init_charts();
}

/**
 * Simple dumb assert function.
 * @param {boolean} condition 
 */
function assert(condition) {
  if (condition) return;
  throw 'Failure condition!';
}