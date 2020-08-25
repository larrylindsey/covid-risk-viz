#!/bin/bash

git submodule update --recursive --remote

./data_conversion/process_ny_c19.py

git add data covid-19-data

git commit -m "Data json update for $(date)"

git push origin HEAD
