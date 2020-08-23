function _get_state_county_pop_then(states_and_counties, callback) {
  const xhr_handler = () => {
    if(xhr.readyState == 4) {
       if (!xhr.status == 200) {
         console.log('Error!', xhr);
         return;
       }
  
       const states_and_counties_pop = JSON.parse(
         new String(xhr.responseText)
       );

       callback(states_and_counties, states_and_counties_pop);
     }
   }
  
   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', 'data/state_county_pop.json', true);
   xhr.send();   
}

/**
 * Fetches and parses json containing state and county information - one set
 * contains states and counties for which covid data is available, and another
 * contains population information.
 * @param {function(*, *): undefined} callback a function that takes one
 *   argument containing the state and county information, and a second
 *   containing the available populations for states and counties. These two
 *   differ in that it may be possible to have a county listed with covid
 *   statistics, but no known associated population, for instance in the case
 *   of unknown counties.
 */
function get_state_county_dict_then(callback) {
  const xhr_handler = () => {
    if(xhr.readyState == 4) {
       if (!xhr.status == 200) {
         console.log('Error!', xhr);
         return;
       }
  
       const states_and_counties = JSON.parse(
         new String(xhr.responseText)
       );

       _get_state_county_pop_then(states_and_counties, callback);
     }
   }
  
   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', 'data/state_county.json', true);
   xhr.send();    
}

function to_safe_name(name) {
  return name.replace(/ /g, '_');
}

function from_safe_name(name) {
  return name.replace(/_/g, ' ');
}

/**
 * Fetches and parses county-wise confirmed case and fatality data, then passes
 * it to the given callback.
 * @param {string} state
 * @param {string} county 
 * @param {function(TimeSeries, TimeSeries): undefined} callback a function
 *  that accepts cumulative confirmed case and fatality time series objects.
 */
function get_county_data_then(state, county, callback) {
  const xhr_handler = () => {
    if(xhr.readyState == 4) {
       if (!xhr.status == 200) {
         console.log('Error!', xhr);
         return;
       }
  
       const county_data = JSON.parse(
         new String(xhr.responseText)
       );

       const dates = [];
       const cases = [];
       const fatalities = [];

       for (const date_str in county_data) {
         const date = new Date(date_str);
         dates.push(date.valueOf());
         cases.push(county_data[date_str][0]);
         fatalities.push(county_data[date_str][1])
       }

       const case_time_series = new TimeSeries(dates, cases);
       const fatality_time_series = new TimeSeries(dates, fatalities);

       callback(case_time_series, fatality_time_series);
     }
   }

   // Resource paths are the same as capitalized states and counties with any
   // spaces replaced by underscores.
   const safe_state = to_safe_name(state);
   const safe_county = to_safe_name(county);
   const url = `data/${safe_state}/${safe_county}.json`;

   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', url);
   xhr.send();
}
