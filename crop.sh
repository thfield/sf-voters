#!/bin/bash
for file in `ls images`; do
  convert -crop 1250x1250+465+225 images/$file cropped/$file
done