function get_state_dropdown() {
  return document.getElementById('select_state_control');
}

function get_county_dropdown() {
  return document.getElementById('select_county_control');
}

function get_state_dropdown_button() {
  return document.getElementById('select_state_control');
}

function get_county_dropdown_button() {
  return document.getElementById('select_county_control');
}

/**
 * Sets the state dropdown text to the state name and initiates the action
 * to populate the county list.
 * @param {string} state the selected state.
 */
function state_selected(state) {
  const select_state_button = get_state_dropdown_button();
  select_state_button.textContent = state;
  populate_county_menu(state);
}

/**
 * Sets the county dropdown text to the county name and initiates the action
 * to create requisite plots.
 * @param {string} county the selected county.
 */
function county_selected(county) {
  const select_county_button = get_county_dropdown_button();
  select_county_button.textContent = county;
  // TODO: plots.
  let callback = (cases, fatalities) => {
    new Chart(document.getElementById('raw_cases_canvas'), {
      type: 'line',
      data: {
        labels: cases.domain_strings(),
        datasets: [{ 
            data: differentiate(cases).as_chart_data(),
            label: 'Confirmed Cases',
            borderColor: "#3e95cd",
            fill: false
          }
        ]
      }
    });
  };
  const state = get_state_dropdown_button().textContent;
  get_county_data_then(state, county, callback);
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
    const idx = select_county.selectedIndex;
    const selected_option = select_county.options[idx];
    const county_name = selected_option.textContent;
    county_selected(county_name);
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
      const idx = select_state.selectedIndex;
      const selected_option = select_state.options[idx];
      const state_name = selected_option.textContent;
      state_selected(state_name);
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