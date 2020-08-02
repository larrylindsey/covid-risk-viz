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

       callback(states_and_counties);
     }
   }
  
   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', '/data/state_county.json', true);
   xhr.send();    
}

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

   const safe_state = state.replace(/ /g, '_');
   const safe_county = county.replace(/ /g, '_');
   const url = '/data/' + safe_state + '/' + safe_county + '.json';

   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', url);
   xhr.send();
}

function dates_to_strings(dates) {
  const date_strings = [];
  for (const date of dates) {
    const year = 1900 + date.getYear();
    const month = 1 + date.getMonth();
    const day = date.getDate();
    date_strings.push(`${year}-${month}-${day}`);
  }
  return date_strings;
}

function add_days_to_date(date, days) {
  const days_ms = days * 3600 * 24 * 1000;
  return new Date(date.valueOf() + days_ms);
}

