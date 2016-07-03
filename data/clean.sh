#!/bin/bash

for file in `ls unprocessed` ; do
  # remove first 5 lines & remove last 5 lines
  # < unprocessed/$file tail -n +6 | tail -r | tail -n +6 | tail -r > $file
  # replace spaces with underscore, get rid of "_MB", get rid of "Pct_", lowercase what should be
  # sed -e 's/ /_/g' -e 's/Pct_//g' -e 's/_MB//g' -e s/Precinct/precinct/ -e s/Ballot_Type/ballot_type/ -e s/Registered/registered/ -e s/Ballots_Cast/ballots_cast/ -e s/Turnout_\(%\)/turnout/ -e s/Over_Votes/over_votes/ -e s/Under_Votes/under_votes/ unprocessed/$file > $file
  sed 's/registered/registered_voters/g' unprocessed/$file > all/$file
done


