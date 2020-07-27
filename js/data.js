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

       for (const date in county_data) {
         dates.push(date);
         cases.push(county_data[date][0]);
         fatalities.push(county_data[date][1])
       }

       callback(dates, cases, fatalities);
     }
   }

   const safe_state = state.replace(' ', '_');
   const safe_county = county.replace(' ', '_');
   const url = '/data/' + safe_state + '/' + safe_county + '.json';

   let xhr = new XMLHttpRequest();
   xhr.onreadystatechange = xhr_handler;
   xhr.open('GET', url);
   xhr.send();
}