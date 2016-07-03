#!/bin/bash
offices=offices.txt
for file in `ls local` ; do
  echo $file >> $offices
  head -n1 local/$file | sed -e s/precinct,// -e s/ballot_type,// -e s/registered,// -e s/ballots_cast,// -e s/turnout,// -e s/over_votes,// -e s/under_votes// >> $offices
done


