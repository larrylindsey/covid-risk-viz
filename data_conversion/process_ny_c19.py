"""Methods to convert covid-19-date into a json file tree."""
import json
import os
from collections import defaultdict


def parse_counties(counties_csv):
  """Parses the US counties csv data into a dictionary tree.

  Args:
    counties_csv: the path to a csv file as defined in the ny times covid 
      dataset. This is expected to have a header beginning with the string
      'date', followed by a string with comma-separated tokens containing,
      in order, the date-string, county, state, fips-code, case count and
      death count.

  Returns:
    A dict tree, which can be accessed like:
      (cases, deaths) = scd[state][county][date_str]

  """
  state_county_covid = defaultdict(lambda: defaultdict(dict))

  with open(counties_csv) as f:
    for line in f:
      if line.startswith('date'):
        continue
      date_str, county, state, _, cases, deaths = line.strip().split(',')
      state_county_covid[state][county][date_str] = (int(cases), int(deaths))

  return state_county_covid


def write_json_tree(state_county_date_dict, base_dir):
  """Writes a dict tree as returned by parse_counties into a json file tree.

  The file tree will be like <base_dir>/<state>/<county>.csv. For instance,
  the data for King County, Washington will be written to
  <base_dir>/Washington/King.json

  This call will create all necessary directories, as needed, and will
  overwrite any existing data.

  Args:
    state_count_date_dict: a nested dictionary tree whose keys are successively
      the state, then county, then date string corresponding to a (case, death)
      datapoint. See parse_counties above.
    base_dir: the base directory for output.
  """
  if not os.path.isdir(base_dir):
    os.mkdir(base_dir)
  state_county = defaultdict(list)
  for state, county_date_dict in state_county_date_dict.items():
    safe_state = state.replace(' ', '_')
    path = os.path.join(base_dir, safe_state)
    if not os.path.isdir(path):
      os.mkdir(path)
    for county, date_dict in county_date_dict.items():
      state_county[state].append(county)
      safe_county = county.replace(' ', '_')
      json_path = os.path.join(path, '%s.json' % safe_county)
      with open(json_path, 'w') as f:
        json.dump(date_dict, f)
    
    for counties in state_county.values():
      counties.sort()

    with(open(os.path.join(base_dir, 'state_county.json'), 'w')) as f:
      json.dump(state_county, f)


def main():
  pass
