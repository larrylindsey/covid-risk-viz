function get_state_dropdown() {
  return document.getElementById('select_state');
}

function get_county_dropdown() {
  return document.getElementById('select_county');
}

function get_state_dropdown_button() {
  return document.getElementById('select_state_button');
}

function get_county_dropdown_button() {
  return document.getElementById('select_county_button');
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
  let callback = (dates, cases, fatalities) => {
    new Chart(document.getElementById('raw_cases_canvas'), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{ 
            data: cases,
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
function create_dropdown_item(tag, action) {
  const element = document.createElement('a');
  element.className = 'dropdown-item';
  element.href = '#';
  element.textContent = tag;
  element.onclick = () => {
    action(tag);
  };

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
  get_county_dropdown_button().textContent = 'Select County';
  
  let callback = (states_and_counties) => {
    for (const county of states_and_counties[state]) {
      const county_element = create_dropdown_item(county, county_selected);
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
    while (select_state.firstChild) {
      select_state.removeChild(select_state.lastChild);
    }
    for (const state of state_list) {
      const state_element = create_dropdown_item(state, state_selected);
      select_state.appendChild(state_element);
    }
  }
  
  get_state_county_dict_then(callback);
}