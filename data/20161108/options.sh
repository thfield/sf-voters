#!/bin/bash

for file in `ls processed` ; do
  echo $file >> headers.txt
  head -n1 processed/$file >> headers.txt
done

